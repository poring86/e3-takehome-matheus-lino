import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { db } from "@/lib/db";
import { files, orgMembers } from "@/drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

// POST /api/files - Upload a file
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const orgId = formData.get("orgId") as string;

    if (!file || !orgId) {
      return NextResponse.json(
        { error: "File and orgId required" },
        { status: 400 },
      );
    }

    // Check if user is member of the org
    const [orgMember] = await db
      .select()
      .from(orgMembers)
      .where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, user.id)))
      .limit(1);

    if (!orgMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Upload to Supabase Storage
    const fileName = `${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("files")
      .upload(`${orgId}/${fileName}`, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("files")
      .getPublicUrl(`${orgId}/${fileName}`);

    // Save to database
    const [newFile] = await db
      .insert(files)
      .values({
        orgId,
        name: file.name,
        url: urlData.publicUrl,
        uploadedBy: user.id,
      })
      .returning();

    return NextResponse.json(newFile, { status: 201 });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET /api/files - List files for the current org
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json({ error: "orgId required" }, { status: 400 });
    }

    const [orgMember] = await db
      .select()
      .from(orgMembers)
      .where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, user.id)))
      .limit(1);

    if (!orgMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const orgFiles = await db
      .select()
      .from(files)
      .where(eq(files.orgId, orgId))
      .orderBy(desc(files.createdAt));

    return NextResponse.json(orgFiles);
  } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

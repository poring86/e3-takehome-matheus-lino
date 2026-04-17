import { NextRequest, NextResponse } from "next/server";
import { createNoteSchema } from "@/lib/types/notes";
import { getAuthenticatedUser } from "@/modules/shared/auth";
import { createNoteForOrg, listNotesForOrg } from "@/modules/notes";

// GET /api/notes - List notes for the current org
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");
    const query = searchParams.get("q")?.trim();
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!orgId) {
      return NextResponse.json({ error: "orgId required" }, { status: 400 });
    }

    const result = await listNotesForOrg(user.id, {
      orgId,
      query,
      limit,
      offset,
    });

    if (!result.ok) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/notes - Create a new note
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createNoteSchema.parse(body);

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json({ error: "orgId required" }, { status: 400 });
    }

    const result = await createNoteForOrg(user.id, {
      orgId,
      title: validatedData.title,
      content: validatedData.content,
      visibility: validatedData.visibility,
      tags: validatedData.tags,
      sharedWith: validatedData.sharedWith,
    });

    if (!result.ok) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

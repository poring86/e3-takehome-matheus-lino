import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { db } from "@/lib/db";
import { notes, noteVersions, orgMembers } from "@/drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

// GET /api/notes/[id]/versions - Get all versions of a note
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const noteId = params.id;

    // Get note to check access
    const [note] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, noteId))
      .limit(1);

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Check if user can access this note
    const [orgMember] = await db
      .select()
      .from(orgMembers)
      .where(
        and(eq(orgMembers.orgId, note.orgId), eq(orgMembers.userId, user.id)),
      )
      .limit(1);

    if (!orgMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if user can access private notes
    if (note.visibility === "private" && note.createdBy !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get all versions of the note
    const versions = await db
      .select()
      .from(noteVersions)
      .where(eq(noteVersions.noteId, noteId))
      .orderBy(desc(noteVersions.version));

    return NextResponse.json(versions);
  } catch (error) {
    console.error("Error fetching note versions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

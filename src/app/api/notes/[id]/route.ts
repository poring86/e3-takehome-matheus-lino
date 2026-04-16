import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { db } from "@/lib/db";
import { notes, users, orgMembers, noteVersions } from "@/drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { updateNoteSchema } from "@/lib/types/notes";

// GET /api/notes/[id] - Get a specific note
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

    // Get note with author info
    const [noteData] = await db
      .select({
        id: notes.id,
        orgId: notes.orgId,
        title: notes.title,
        content: notes.content,
        visibility: notes.visibility,
        createdBy: notes.createdBy,
        createdAt: notes.createdAt,
        updatedAt: notes.updatedAt,
        author: {
          id: users.id,
          email: users.email,
          fullName: users.fullName,
        },
      })
      .from(notes)
      .leftJoin(users, eq(notes.createdBy, users.id))
      .where(eq(notes.id, noteId))
      .limit(1);

    if (!noteData) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Check permissions
    const [orgMember] = await db
      .select()
      .from(orgMembers)
      .where(
        and(
          eq(orgMembers.orgId, noteData.orgId),
          eq(orgMembers.userId, user.id),
        ),
      )
      .limit(1);

    if (!orgMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if user can access private notes
    if (noteData.visibility === "private" && noteData.createdBy !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(noteData);
  } catch (error) {
    console.error("Error fetching note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT /api/notes/[id] - Update a note
export async function PUT(
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
    const body = await request.json();
    const validatedData = updateNoteSchema.parse(body);

    // Get current note
    const [currentNote] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, noteId))
      .limit(1);

    if (!currentNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Check permissions: author OR admin/owner in the org
    const [orgMember] = await db
      .select()
      .from(orgMembers)
      .where(
        and(
          eq(orgMembers.orgId, currentNote.orgId),
          eq(orgMembers.userId, user.id),
        ),
      )
      .limit(1);

    if (!orgMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const isAuthor = currentNote.createdBy === user.id;
    const canEdit =
      isAuthor || orgMember.role === "admin" || orgMember.role === "owner";

    if (!canEdit) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get latest version number
    const [latestVersion] = await db
      .select({ version: noteVersions.version })
      .from(noteVersions)
      .where(eq(noteVersions.noteId, noteId))
      .orderBy(desc(noteVersions.version))
      .limit(1);

    const newVersion = (latestVersion?.version || 0) + 1;

    // Save current content as new version
    await db.insert(noteVersions).values({
      noteId,
      version: newVersion,
      content: currentNote.content || "",
    });

    // Update the note
    const updateData: Partial<typeof notes.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (validatedData.title !== undefined)
      updateData.title = validatedData.title;
    if (validatedData.content !== undefined)
      updateData.content = validatedData.content;
    if (validatedData.visibility !== undefined)
      updateData.visibility = validatedData.visibility;

    const [updatedNote] = await db
      .update(notes)
      .set(updateData)
      .where(eq(notes.id, noteId))
      .returning();

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/notes/[id] - Delete a note
export async function DELETE(
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

    // Get note to check ownership
    const [note] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, noteId))
      .limit(1);

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Check permissions: author OR admin/owner in the org
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

    const isAuthor = note.createdBy === user.id;
    const canDelete =
      isAuthor || orgMember.role === "admin" || orgMember.role === "owner";

    if (!canDelete) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Delete note (cascade will handle versions and tags)
    await db.delete(notes).where(eq(notes.id, noteId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

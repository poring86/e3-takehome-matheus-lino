import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { db } from "@/lib/db";
import { notes, users, orgMembers, noteVersions } from "@/drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { updateNoteSchema } from "@/lib/types/notes";
import { logMutation, logPermissionDenied, logError } from "@/lib/logger";

// GET /api/notes/[id] - Get a specific note
export async function GET(request: NextRequest, context: any) {
  // Next.js 15+ may pass params as a Promise
  const params =
    typeof context.params?.then === "function"
      ? await context.params
      : context.params;
  const { id } = params;
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logPermissionDenied("get_note", undefined, undefined, id, {
        reason: "unauthorized",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check org membership before leaking note existence
    // First, get orgId for this note id (minimal query)
    const noteOrg = await db
      .select({
        orgId: notes.orgId,
        createdBy: notes.createdBy,
        visibility: notes.visibility,
      })
      .from(notes)
      .where(eq(notes.id, id))
      .limit(1);

    if (!noteOrg || noteOrg.length === 0) {
      // Still return 404, but only after auth check
      logPermissionDenied("get_note", user.id, undefined, id, {
        reason: "not_found",
      });
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const { orgId, createdBy, visibility } = noteOrg[0];

    // Check org membership
    const [orgMember] = await db
      .select()
      .from(orgMembers)
      .where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, user.id)))
      .limit(1);

    if (!orgMember) {
      logPermissionDenied("get_note", user.id, orgId, id, {
        reason: "not_org_member",
      });
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if user can access private notes
    if (visibility === "private" && createdBy !== user.id) {
      logPermissionDenied("get_note", user.id, orgId, id, {
        reason: "private_note",
      });
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get note with author info (full data)
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
      .where(eq(notes.id, id))
      .limit(1);

    if (!noteData) {
      // Defensive: should not happen, as already checked above
      logPermissionDenied("get_note", user.id, orgId, id, {
        reason: "not_found_after_auth",
      });
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    logMutation("read", "note", user.id, orgId, id);
    return NextResponse.json(noteData);
  } catch (error) {
    logError(error as Error, "GET /api/notes/[id]", undefined, { id });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT /api/notes/[id] - Update a note
export async function PUT(request: NextRequest, context: any) {
  const params =
    typeof context.params?.then === "function"
      ? await context.params
      : context.params;
  const { id } = params;
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logPermissionDenied("update_note", undefined, undefined, id, {
        reason: "unauthorized",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateNoteSchema.parse(body);

    // Get current note
    const [currentNote] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, id))
      .limit(1);

    if (!currentNote) {
      logPermissionDenied("update_note", user?.id, undefined, id, {
        reason: "not_found",
      });
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
      logPermissionDenied("update_note", user.id, currentNote.orgId, id, {
        reason: "not_org_member",
      });
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const isAuthor = currentNote.createdBy === user.id;
    const canEdit =
      isAuthor || orgMember.role === "admin" || orgMember.role === "owner";

    if (!canEdit) {
      logPermissionDenied("update_note", user.id, currentNote.orgId, id, {
        reason: "not_author_or_admin",
      });
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get latest version number
    const [latestVersion] = await db
      .select({ version: noteVersions.version })
      .from(noteVersions)
      .where(eq(noteVersions.noteId, id))
      .orderBy(desc(noteVersions.version))
      .limit(1);

    const newVersion = (latestVersion?.version || 0) + 1;

    // Save current content as new version
    await db.insert(noteVersions).values({
      noteId: id,
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
      .where(eq(notes.id, id))
      .returning();

    logMutation("update", "note", user.id, currentNote.orgId, id);
    return NextResponse.json(updatedNote);
  } catch (error) {
    logError(error as Error, "PUT /api/notes/[id]", undefined, { id });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/notes/[id] - Delete a note
export async function DELETE(request: NextRequest, context: any) {
  const params =
    typeof context.params?.then === "function"
      ? await context.params
      : context.params;
  const { id } = params;
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logPermissionDenied("delete_note", undefined, undefined, id, {
        reason: "unauthorized",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get note to check ownership
    const [note] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, id))
      .limit(1);

    if (!note) {
      logPermissionDenied("delete_note", user?.id, undefined, id, {
        reason: "not_found",
      });
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
      logPermissionDenied("delete_note", user.id, note.orgId, id, {
        reason: "not_org_member",
      });
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const isAuthor = note.createdBy === user.id;
    const canDelete =
      isAuthor || orgMember.role === "admin" || orgMember.role === "owner";

    if (!canDelete) {
      logPermissionDenied("delete_note", user.id, note.orgId, id, {
        reason: "not_author_or_admin",
      });
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Delete note (cascade will handle versions and tags)
    await db.delete(notes).where(eq(notes.id, id));
    logMutation("delete", "note", user.id, note.orgId, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    logError(error as Error, "DELETE /api/notes/[id]", undefined, { id });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

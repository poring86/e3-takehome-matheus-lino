import { db } from "@/lib/db";
import {
  notes,
  users,
  orgMembers,
  noteVersions,
  noteTags,
  noteShares,
} from "@/drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { logMutation, logPermissionDenied } from "@/lib/logger";

type AccessError = "NOT_FOUND" | "ACCESS_DENIED";

type AccessResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AccessError };

type UpdateNoteInput = {
  title?: string;
  content?: string;
  visibility?: "public" | "private" | "shared";
};

async function resolveAccessibleNote(userId: string, noteId: string) {
  const [note] = await db
    .select()
    .from(notes)
    .where(eq(notes.id, noteId))
    .limit(1);

  if (!note) {
    logPermissionDenied("note_access", userId, undefined, noteId, {
      reason: "not_found",
    });
    return { ok: false, error: "NOT_FOUND" } as const;
  }

  const [orgMember] = await db
    .select()
    .from(orgMembers)
    .where(and(eq(orgMembers.orgId, note.orgId), eq(orgMembers.userId, userId)))
    .limit(1);

  if (!orgMember) {
    logPermissionDenied("note_access", userId, note.orgId, noteId, {
      reason: "not_org_member",
    });
    return { ok: false, error: "ACCESS_DENIED" } as const;
  }

  if (note.visibility === "private" && note.createdBy !== userId) {
    logPermissionDenied("note_access", userId, note.orgId, noteId, {
      reason: "private_note",
    });
    return { ok: false, error: "ACCESS_DENIED" } as const;
  }

  return { ok: true, data: { note, orgMember } } as const;
}

export async function getNoteByIdForUser(
  userId: string,
  noteId: string,
): Promise<
  AccessResult<{
    id: string;
    orgId: string;
    title: string;
    content: string | null;
    visibility: "public" | "private" | "shared";
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    author: {
      id: string;
      email: string;
      fullName: string | null;
    } | null;
  }>
> {
  const access = await resolveAccessibleNote(userId, noteId);
  if (!access.ok) {
    return access;
  }

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
    return { ok: false, error: "NOT_FOUND" };
  }

  logMutation("read", "note", userId, access.data.note.orgId, noteId);
  return { ok: true, data: noteData };
}

export async function listNoteVersionsForUser(
  userId: string,
  noteId: string,
): Promise<AccessResult<Array<typeof noteVersions.$inferSelect>>> {
  const access = await resolveAccessibleNote(userId, noteId);
  if (!access.ok) {
    return access;
  }

  const versions = await db
    .select()
    .from(noteVersions)
    .where(eq(noteVersions.noteId, noteId))
    .orderBy(desc(noteVersions.version));

  logMutation("read", "note_versions", userId, access.data.note.orgId, noteId, {
    count: versions.length,
  });

  return { ok: true, data: versions };
}

export async function updateNoteByIdForUser(
  userId: string,
  noteId: string,
  input: UpdateNoteInput,
): Promise<AccessResult<typeof notes.$inferSelect>> {
  const access = await resolveAccessibleNote(userId, noteId);
  if (!access.ok) {
    return access;
  }

  const { note, orgMember } = access.data;
  const isAuthor = note.createdBy === userId;
  const canEdit =
    isAuthor || orgMember.role === "admin" || orgMember.role === "owner";

  if (!canEdit) {
    logPermissionDenied("update_note", userId, note.orgId, noteId, {
      reason: "not_author_or_admin",
    });
    return { ok: false, error: "ACCESS_DENIED" };
  }

  // Só cria nova versão se o conteúdo realmente mudou
  let shouldCreateVersion = false;
  let newContent = note.content || "";
  if (input.content !== undefined && input.content !== note.content) {
    shouldCreateVersion = true;
    newContent = input.content;
  }

  if (shouldCreateVersion) {
    const [latestVersion] = await db
      .select({ version: noteVersions.version })
      .from(noteVersions)
      .where(eq(noteVersions.noteId, noteId))
      .orderBy(desc(noteVersions.version))
      .limit(1);

    const newVersion = (latestVersion?.version || 0) + 1;
    await db.insert(noteVersions).values({
      noteId,
      version: newVersion,
      content: newContent,
    });
  }

  const updateData: Partial<typeof notes.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.title !== undefined) {
    updateData.title = input.title;
  }
  if (input.content !== undefined) {
    updateData.content = input.content;
  }
  if (input.visibility !== undefined) {
    updateData.visibility = input.visibility;
  }

  const [updatedNote] = await db
    .update(notes)
    .set(updateData)
    .where(eq(notes.id, noteId))
    .returning();

  logMutation("update", "note", userId, note.orgId, noteId);
  return { ok: true, data: updatedNote };
}

export async function deleteNoteByIdForUser(
  userId: string,
  noteId: string,
): Promise<AccessResult<{ success: true }>> {
  const access = await resolveAccessibleNote(userId, noteId);
  if (!access.ok) {
    return access;
  }

  const { note, orgMember } = access.data;
  const isAuthor = note.createdBy === userId;
  const canDelete =
    isAuthor || orgMember.role === "admin" || orgMember.role === "owner";

  if (!canDelete) {
    logPermissionDenied("delete_note", userId, note.orgId, noteId, {
      reason: "not_author_or_admin",
    });
    return { ok: false, error: "ACCESS_DENIED" };
  }

  await db.delete(noteVersions).where(eq(noteVersions.noteId, noteId));
  await db.delete(noteTags).where(eq(noteTags.noteId, noteId));
  await db.delete(noteShares).where(eq(noteShares.noteId, noteId));
  await db.delete(notes).where(eq(notes.id, noteId));

  logMutation("delete", "note", userId, note.orgId, noteId);
  return { ok: true, data: { success: true } };
}

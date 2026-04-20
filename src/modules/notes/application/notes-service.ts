import { db } from "@/lib/db";
import {
  notes,
  users,
  orgMembers,
  noteVersions,
  noteTags,
  tags as tagSchema,
  noteShares,
} from "@/drizzle/schema";
import { eq, and, or, like, desc, inArray } from "drizzle-orm";
import { logMutation, logPermissionDenied } from "@/lib/logger";

type NoteVisibility = "public" | "private" | "shared";

type ListNotesInput = {
  orgId: string;
  query?: string;
  limit: number;
  offset: number;
};

type CreateNoteInput = {
  orgId: string;
  title: string;
  content?: string;
  visibility: NoteVisibility;
  tags?: string[];
  sharedWith?: string[];
};

type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: "ACCESS_DENIED" };

export async function listNotesForOrg(userId: string, input: ListNotesInput) {
  const [orgMember] = await db
    .select()
    .from(orgMembers)
    .where(
      and(eq(orgMembers.orgId, input.orgId), eq(orgMembers.userId, userId)),
    )
    .limit(1);

  if (!orgMember) {
    return { ok: false, error: "ACCESS_DENIED" } as const;
  }

  const isOrgAdmin = orgMember.role === "admin" || orgMember.role === "owner";
  const searchText = input.query ? `%${input.query.toLowerCase()}%` : undefined;

  const filters = [eq(notes.orgId, input.orgId)];

  if (!isOrgAdmin) {
    filters.push(
      or(
        eq(notes.visibility, "public"),
        and(eq(notes.visibility, "private"), eq(notes.createdBy, userId)),
        and(
          eq(notes.visibility, "shared"),
          or(eq(notes.createdBy, userId), eq(noteShares.userId, userId)),
        ),
      )!,
    );
  }

  if (searchText) {
    filters.push(
      or(
        like(notes.title, searchText),
        like(notes.content, searchText),
        like(notes.visibility, searchText),
        like(tagSchema.name, searchText),
      )!,
    );
  }

  // Busca todas as notas que batem com o filtro, remove duplicatas, e só então pagina
  const notesQuery = db
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
    .leftJoin(noteTags, eq(noteTags.noteId, notes.id))
    .leftJoin(tagSchema, eq(noteTags.tagId, tagSchema.id))
    .leftJoin(noteShares, eq(noteShares.noteId, notes.id))
    .where(and(...filters))
    .orderBy(desc(notes.updatedAt));

  // Busca todas as notas (pode ser otimizado para grandes bases)
  const allNotes = await notesQuery;
  // Remove duplicatas
  const uniqueNotes = Array.from(new Map(allNotes.map(n => [n.id, n])).values());
  const totalCount = uniqueNotes.length;
  // Pagina após remover duplicatas
  const paginatedNotes = uniqueNotes.slice(input.offset, input.offset + input.limit);

  return {
    ok: true,
    data: {
      notes: paginatedNotes,
      total: totalCount,
      limit: input.limit,
      offset: input.offset,
    },
  } as const;
}

export async function createNoteForOrg(
  userId: string,
  input: CreateNoteInput,
): Promise<ServiceResult<typeof notes.$inferSelect>> {
  const [orgMember] = await db
    .select()
    .from(orgMembers)
    .where(
      and(eq(orgMembers.orgId, input.orgId), eq(orgMembers.userId, userId)),
    )
    .limit(1);

  if (!orgMember) {
    logPermissionDenied("create_note", userId, input.orgId);
    return { ok: false, error: "ACCESS_DENIED" };
  }

  const [newNote] = await db
    .insert(notes)
    .values({
      orgId: input.orgId,
      title: input.title,
      content: input.content || "",
      visibility: input.visibility,
      createdBy: userId,
    })
    .returning();

  logMutation("create", "note", userId, input.orgId, newNote.id, {
    title: input.title,
    visibility: input.visibility,
  });

  await db.insert(noteVersions).values({
    noteId: newNote.id,
    version: 1,
    content: input.content || "",
  });

  if (input.tags?.length) {
    for (const tagName of input.tags
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean)) {
      const [existingTag] = await db
        .select()
        .from(tagSchema)
        .where(
          and(eq(tagSchema.orgId, input.orgId), eq(tagSchema.name, tagName)),
        )
        .limit(1);

      const tagId = existingTag
        ? existingTag.id
        : (
            await db
              .insert(tagSchema)
              .values({ orgId: input.orgId, name: tagName })
              .returning()
          )[0].id;

      await db.insert(noteTags).values({ noteId: newNote.id, tagId });
    }
  }

  if (input.sharedWith?.length) {
    const validUserIds = await db
      .select({ userId: orgMembers.userId })
      .from(orgMembers)
      .where(
        and(
          eq(orgMembers.orgId, input.orgId),
          inArray(orgMembers.userId, input.sharedWith),
        ),
      );

    for (const row of validUserIds) {
      await db
        .insert(noteShares)
        .values({ noteId: newNote.id, userId: row.userId });
    }
  }

  return { ok: true, data: newNote };
}

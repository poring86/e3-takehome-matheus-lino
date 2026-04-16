import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
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
import { eq, and, or, like, desc, inArray, count } from "drizzle-orm";
import { createNoteSchema, updateNoteSchema } from "@/lib/types/notes";
import { logMutation, logPermissionDenied, logError } from "@/lib/logger";

// GET /api/notes - List notes for the current org
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
    const query = searchParams.get("q")?.trim();
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

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

    const isOrgAdmin = orgMember.role === "admin" || orgMember.role === "owner";
    const searchText = query ? `%${query.toLowerCase()}%` : undefined;

    const filters = [eq(notes.orgId, orgId)];

    if (!isOrgAdmin) {
      filters.push(
        or(
          eq(notes.visibility, "public"),
          and(eq(notes.visibility, "private"), eq(notes.createdBy, user.id)),
          and(
            eq(notes.visibility, "shared"),
            or(eq(notes.createdBy, user.id), eq(noteShares.userId, user.id)),
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
      .where(and(...filters));

    // Get total count for pagination (before applying limit/offset)
    const countQuery = db.$with("notes_query").as(notesQuery);
    const [{ count: totalCount }] = await db
      .with(countQuery)
      .select({ count: count() })
      .from(countQuery);

    const userNotes = await notesQuery
      .orderBy(desc(notes.updatedAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      notes: userNotes,
      total: totalCount,
      limit,
      offset,
    });
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
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createNoteSchema.parse(body);

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json({ error: "orgId required" }, { status: 400 });
    }

    // Check if user is member of the org
    const [orgMember] = await db
      .select()
      .from(orgMembers)
      .where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, user.id)))
      .limit(1);

    if (!orgMember) {
      logPermissionDenied("create_note", user.id, orgId);
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const [newNote] = await db
      .insert(notes)
      .values({
        orgId,
        title: validatedData.title,
        content: validatedData.content || "",
        visibility: validatedData.visibility,
        createdBy: user.id,
      })
      .returning();

    logMutation("create", "note", user.id, orgId, newNote.id, {
      title: validatedData.title,
      visibility: validatedData.visibility,
    });

    await db.insert(noteVersions).values({
      noteId: newNote.id,
      version: 1,
      content: validatedData.content || "",
    });

    if (validatedData.tags?.length) {
      for (const tagName of validatedData.tags
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)) {
        const [existingTag] = await db
          .select()
          .from(tagSchema)
          .where(and(eq(tagSchema.orgId, orgId), eq(tagSchema.name, tagName)))
          .limit(1);

        const tagId = existingTag
          ? existingTag.id
          : (
              await db
                .insert(tagSchema)
                .values({ orgId, name: tagName })
                .returning()
            )[0].id;

        await db.insert(noteTags).values({ noteId: newNote.id, tagId });
      }
    }

    if (validatedData.sharedWith?.length) {
      const validUserIds = await db
        .select({ userId: orgMembers.userId })
        .from(orgMembers)
        .where(
          and(
            eq(orgMembers.orgId, orgId),
            inArray(orgMembers.userId, validatedData.sharedWith),
          ),
        );

      for (const row of validUserIds) {
        await db
          .insert(noteShares)
          .values({ noteId: newNote.id, userId: row.userId });
      }
    }

    return NextResponse.json(newNote, { status: 201 });
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

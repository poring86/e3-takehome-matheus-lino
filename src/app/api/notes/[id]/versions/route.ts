import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { notes, noteVersions, orgMembers } from "@/drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { logMutation, logPermissionDenied, logError } from "@/lib/logger";

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>;
};

async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (bearerToken) {
    const tokenClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const {
      data: { user },
      error,
    } = await tokenClient.auth.getUser(bearerToken);

    if (!error && user) {
      return user;
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

// GET /api/notes/[id]/versions - Get all versions of a note
export async function GET(request: NextRequest, context: RouteContext) {
  const { id: noteId } = await Promise.resolve(context.params);

  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      logPermissionDenied("get_note_versions", undefined, undefined, noteId, {
        reason: "unauthorized",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get note to check access
    const [note] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, noteId))
      .limit(1);

    if (!note) {
      logPermissionDenied("get_note_versions", user?.id, undefined, noteId, {
        reason: "not_found",
      });
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
      logPermissionDenied("get_note_versions", user.id, note.orgId, noteId, {
        reason: "not_org_member",
      });
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if user can access private notes
    if (note.visibility === "private" && note.createdBy !== user.id) {
      logPermissionDenied("get_note_versions", user.id, note.orgId, noteId, {
        reason: "private_note",
      });
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get all versions of the note
    const versions = await db
      .select()
      .from(noteVersions)
      .where(eq(noteVersions.noteId, noteId))
      .orderBy(desc(noteVersions.version));
    logMutation("read", "note_versions", user.id, note.orgId, noteId, {
      count: versions.length,
    });
    return NextResponse.json(versions);
  } catch (error) {
    logError(error as Error, "GET /api/notes/[id]/versions", undefined, {
      noteId,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

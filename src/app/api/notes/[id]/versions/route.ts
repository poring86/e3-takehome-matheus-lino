import { NextRequest, NextResponse } from "next/server";
import { logPermissionDenied, logError } from "@/lib/logger";
import { getAuthenticatedUser } from "@/modules/shared/auth";
import { listNoteVersionsForUser } from "@/modules/notes";

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>;
};

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

    const result = await listNoteVersionsForUser(user.id, noteId);

    if (!result.ok && result.error === "NOT_FOUND") {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (!result.ok) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(result.data);
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

import { NextRequest, NextResponse } from "next/server";
import { logPermissionDenied, logError } from "@/lib/logger";
import { getAuthenticatedUser } from "@/modules/shared/auth";
import {
  generateNoteSummaryForUser,
  updateNoteSummaryStatusForAuthor,
} from "@/modules/notes";

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>;
};

// POST /api/notes/[id]/summarize - Generate AI summary for a note
export async function POST(request: NextRequest, context: RouteContext) {
  const { id: noteId } = await Promise.resolve(context.params);
  // --- Patch: sanitiza o noteId para remover query string (_rsc ou outros)
  const cleanNoteId = typeof noteId === 'string' ? noteId.split('?')[0] : noteId;
  // --- Fim do patch

  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      logPermissionDenied("summarize_note", undefined, undefined, cleanNoteId, {
        reason: "unauthorized",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await generateNoteSummaryForUser(user.id, cleanNoteId);

    if (!result.ok && result.error === "NOT_FOUND") {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (!result.ok && result.error === "ACCESS_DENIED") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (!result.ok && result.error === "CONTENT_TOO_SHORT") {
      return NextResponse.json(
        { error: "Note content too short for summary" },
        { status: 400 },
      );
    }

    if (!result.ok && result.error === "AI_QUOTA") {
      return NextResponse.json(
        {
          error:
            "AI provider quota exceeded. Configure a new key or add credits.",
        },
        { status: 429 },
      );
    }

    if (!result.ok) {
      return NextResponse.json(
        { error: result.message || "Failed to generate summary" },
        { status: 500 },
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    logError(error as Error, "POST /api/notes/[id]/summarize", undefined, {
      noteId,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT /api/notes/[id]/summarize - Accept or reject summary
export async function PUT(request: NextRequest, context: RouteContext) {
  const { id: noteId } = await Promise.resolve(context.params);
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      logPermissionDenied(
        "accept_reject_summary",
        undefined,
        undefined,
        noteId,
        { reason: "unauthorized" },
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await request.json();
    const result = await updateNoteSummaryStatusForAuthor(
      user.id,
      noteId,
      action,
    );

    if (!result.ok && result.error === "INVALID_ACTION") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (!result.ok && result.error === "NOT_FOUND") {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (!result.ok && result.error === "ACCESS_DENIED") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (!result.ok) {
      return NextResponse.json(
        { error: "Failed to update summary status" },
        { status: 500 },
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    logError(error as Error, "PUT /api/notes/[id]/summarize", undefined, {
      noteId,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

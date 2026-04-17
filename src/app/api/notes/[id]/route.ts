import { NextRequest, NextResponse } from "next/server";
import { updateNoteSchema } from "@/lib/types/notes";
import { logPermissionDenied, logError } from "@/lib/logger";
import { getAuthenticatedUser } from "@/modules/shared/auth";
import {
  deleteNoteByIdForUser,
  getNoteByIdForUser,
  updateNoteByIdForUser,
} from "@/modules/notes";

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>;
};

// GET /api/notes/[id] - Get a specific note
export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await Promise.resolve(context.params);
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      logPermissionDenied("get_note", undefined, undefined, id, {
        reason: "unauthorized",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await getNoteByIdForUser(user.id, id);

    if (!result.ok && result.error === "NOT_FOUND") {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (!result.ok) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    logError(error as Error, "GET /api/notes/[id]", undefined, { id });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT /api/notes/[id] - Update a note
export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await Promise.resolve(context.params);
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      logPermissionDenied("update_note", undefined, undefined, id, {
        reason: "unauthorized",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateNoteSchema.parse(body);

    const result = await updateNoteByIdForUser(user.id, id, {
      title: validatedData.title,
      content: validatedData.content,
      visibility: validatedData.visibility,
    });

    if (!result.ok && result.error === "NOT_FOUND") {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (!result.ok) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    logError(error as Error, "PUT /api/notes/[id]", undefined, { id });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/notes/[id] - Delete a note
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await Promise.resolve(context.params);
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      logPermissionDenied("delete_note", undefined, undefined, id, {
        reason: "unauthorized",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await deleteNoteByIdForUser(user.id, id);

    if (!result.ok && result.error === "NOT_FOUND") {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (!result.ok) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    logError(error as Error, "DELETE /api/notes/[id]", undefined, { id });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

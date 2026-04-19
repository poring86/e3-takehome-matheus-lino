import { NextRequest, NextResponse } from "next/server";
import { createNoteSchema } from "@/lib/types/notes";
import { getAuthenticatedUser } from "@/modules/shared/auth";
import { createNoteForOrg, listNotesForOrg } from "@/modules/notes";

// GET /api/notes - List notes for the current org
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      console.error("[GET /api/notes] Unauthorized user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");
    const query = searchParams.get("q")?.trim();
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    console.log("[GET /api/notes] user:", user.id, "orgId:", orgId, "query:", query, "limit:", limit, "offset:", offset);

    if (!orgId) {
      console.error("[GET /api/notes] orgId missing");
      return NextResponse.json({ error: "orgId required" }, { status: 400 });
    }

    const result = await listNotesForOrg(user.id, {
      orgId,
      query,
      limit,
      offset,
    });

    if (!result.ok) {
      console.error("[GET /api/notes] Access denied", result);
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    console.log("[GET /api/notes] result:", JSON.stringify(result.data));
    return NextResponse.json(result.data);
  } catch (error) {
    console.error("[GET /api/notes] Unhandled error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

// POST /api/notes - Create a new note
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      console.error("[POST /api/notes] Unauthorized user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body = null;
    try {
      body = await request.json();
    } catch (err) {
      console.error("[POST /api/notes] Failed to parse JSON body", err);
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    console.log("[POST /api/notes] Received body:", JSON.stringify(body));

    let validatedData = null;
    try {
      validatedData = createNoteSchema.parse(body);
    } catch (err) {
      console.error("[POST /api/notes] Zod validation error:", err);
      return NextResponse.json({ error: "Validation error", details: err instanceof Error ? err.message : String(err) }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");
    console.log("[POST /api/notes] orgId:", orgId);

    if (!orgId) {
      console.error("[POST /api/notes] orgId missing");
      return NextResponse.json({ error: "orgId required" }, { status: 400 });
    }

    const result = await createNoteForOrg(user.id, {
      orgId,
      title: validatedData.title,
      content: validatedData.content,
      visibility: validatedData.visibility,
      tags: validatedData.tags,
      sharedWith: validatedData.sharedWith,
    });

    if (!result.ok) {
      console.error("[POST /api/notes] Access denied or failed to create note", result);
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    console.log("[POST /api/notes] Note created successfully", result.data);
    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error("[POST /api/notes] Unhandled error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

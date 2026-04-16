import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { db } from "@/lib/db";
import { notes, orgMembers } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import OpenAI from "openai";
import { logAIRequest, logMutation, logPermissionDenied, logError } from "@/lib/logger";

// POST /api/notes/[id]/summarize - Generate AI summary for a note
export async function POST(request: NextRequest, context: any) {
  // Next.js 15+ may pass params as a Promise
  const params =
    typeof context.params?.then === "function"
      ? await context.params
      : context.params;
  const noteId = params.id;

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logPermissionDenied("summarize_note", undefined, undefined, noteId, { reason: "unauthorized" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get note
    const [note] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, noteId))
      .limit(1);

    if (!note) {
      logPermissionDenied("summarize_note", user?.id, undefined, noteId, { reason: "not_found" });
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Check permissions
    const [orgMember] = await db
      .select()
      .from(orgMembers)
      .where(
        and(eq(orgMembers.orgId, note.orgId), eq(orgMembers.userId, user.id)),
      )
      .limit(1);

    if (!orgMember) {
      logPermissionDenied("summarize_note", user.id, note.orgId, noteId, { reason: "not_org_member" });
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if user can access private notes
    if (note.visibility === "private" && note.createdBy !== user.id) {
      logPermissionDenied("summarize_note", user.id, note.orgId, noteId, { reason: "private_note" });
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (!note.content || note.content.trim().length < 50) {
      logPermissionDenied("summarize_note", user.id, note.orgId, noteId, { reason: "content_too_short" });
      return NextResponse.json(
        { error: "Note content too short for summary" },
        { status: 400 },
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      logError(new Error("OPENAI_API_KEY is not configured"), "POST /api/notes/[id]/summarize", user.id, { noteId });
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 500 },
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    logAIRequest("summarize_request", user.id, note.orgId, noteId, { title: note.title });
    // Generate summary with OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that creates concise, structured summaries of notes. Keep summaries under 200 words and focus on key points, action items, and insights.",
        },
        {
          role: "user",
          content: `Please summarize this note titled \"${note.title}\":\n\n${note.content}`,
        },
      ],
      max_tokens: 300,
      temperature: 0.3,
    });

    const summary = completion.choices[0]?.message?.content?.trim();

    if (!summary) {
      logAIRequest("summarize_failed", user.id, note.orgId, noteId, { reason: "no_summary" });
      return NextResponse.json(
        { error: "Failed to generate summary" },
        { status: 500 },
      );
    }

    // Update note with summary (pending status)
    await db
      .update(notes)
      .set({
        summary,
        summaryStatus: "pending",
        updatedAt: new Date(),
      })
      .where(eq(notes.id, noteId));

    logAIRequest("summarize_success", user.id, note.orgId, noteId);
    logMutation("update", "note_summary", user.id, note.orgId, noteId);
    return NextResponse.json({ summary });
  } catch (error) {
    logError(error as Error, "POST /api/notes/[id]/summarize", undefined, { noteId });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT /api/notes/[id]/summarize - Accept or reject summary
export async function PUT(request: NextRequest, context: any) {
  // Next.js 15+ may pass params as a Promise
  const params =
    typeof context.params?.then === "function"
      ? await context.params
      : context.params;
  const noteId = params.id;
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logPermissionDenied("accept_reject_summary", undefined, undefined, noteId, { reason: "unauthorized" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // noteId already set above
    const { action } = await request.json(); // "accept" or "reject"

    if (!["accept", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Get note
    const [note] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, noteId))
      .limit(1);

    if (!note) {
      logPermissionDenied("accept_reject_summary", user?.id, undefined, noteId, { reason: "not_found" });
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Check permissions (only author can accept/reject)
    if (note.createdBy !== user.id) {
      logPermissionDenied("accept_reject_summary", user.id, note.orgId, noteId, { reason: "not_author" });
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const newStatus = action === "accept" ? "accepted" : "rejected";
    await db
      .update(notes)
      .set({
        summaryStatus: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(notes.id, noteId));
    logMutation("update", "note_summary_status", user.id, note.orgId, noteId, { status: newStatus });
    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    logError(error as Error, "PUT /api/notes/[id]/summarize", undefined, { noteId });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

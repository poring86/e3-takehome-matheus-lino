import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { db } from "@/lib/db";
import { notes, orgMembers } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /api/notes/[id]/summarize - Generate AI summary for a note
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const noteId = params.id;

    // Get note
    const [note] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, noteId))
      .limit(1);

    if (!note) {
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
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if user can access private notes
    if (note.visibility === "private" && note.createdBy !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (!note.content || note.content.trim().length < 50) {
      return NextResponse.json(
        { error: "Note content too short for summary" },
        { status: 400 },
      );
    }

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
          content: `Please summarize this note titled "${note.title}":\n\n${note.content}`,
        },
      ],
      max_tokens: 300,
      temperature: 0.3,
    });

    const summary = completion.choices[0]?.message?.content?.trim();

    if (!summary) {
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

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Error generating summary:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT /api/notes/[id]/summarize - Accept or reject summary
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const noteId = params.id;
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
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Check permissions (only author can accept/reject)
    if (note.createdBy !== user.id) {
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

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    console.error("Error updating summary status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

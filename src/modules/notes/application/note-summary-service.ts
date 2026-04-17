import { db } from "@/lib/db";
import { notes, orgMembers } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import {
  logAIRequest,
  logMutation,
  logPermissionDenied,
} from "@/lib/logger";
import { generateSummary } from "@/lib/ai-summary";

type SummaryAccessError =
  | "NOT_FOUND"
  | "ACCESS_DENIED"
  | "CONTENT_TOO_SHORT"
  | "INVALID_ACTION"
  | "AI_ERROR"
  | "AI_QUOTA";

type SummaryResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: SummaryAccessError; message?: string };

async function resolveAccessibleNoteForSummary(userId: string, noteId: string) {
  const [note] = await db.select().from(notes).where(eq(notes.id, noteId)).limit(1);

  if (!note) {
    logPermissionDenied("summarize_note", userId, undefined, noteId, {
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
    logPermissionDenied("summarize_note", userId, note.orgId, noteId, {
      reason: "not_org_member",
    });
    return { ok: false, error: "ACCESS_DENIED" } as const;
  }

  if (note.visibility === "private" && note.createdBy !== userId) {
    logPermissionDenied("summarize_note", userId, note.orgId, noteId, {
      reason: "private_note",
    });
    return { ok: false, error: "ACCESS_DENIED" } as const;
  }

  return { ok: true, data: note } as const;
}

export async function generateNoteSummaryForUser(
  userId: string,
  noteId: string,
): Promise<SummaryResult<{ summary: string }>> {
  const access = await resolveAccessibleNoteForSummary(userId, noteId);
  if (!access.ok) {
    return access;
  }

  const note = access.data;

  if (!note.content || note.content.trim().length < 50) {
    logPermissionDenied("summarize_note", userId, note.orgId, noteId, {
      reason: "content_too_short",
    });
    return { ok: false, error: "CONTENT_TOO_SHORT" };
  }

  logAIRequest("summarize_request", userId, note.orgId, noteId, {
    title: note.title,
    aiProvider: process.env.AI_PROVIDER || "openai",
  });

  let summary = "";
  try {
    summary = await generateSummary({
      title: note.title,
      content: note.content,
    });
  } catch (err: unknown) {
    let reason = "ai_error";
    let details = String(err);
    let isQuota = false;
    if (typeof err === "object" && err !== null) {
      const maybeMsg = (err as { message?: string }).message;
      if (maybeMsg?.includes("quota")) {
        reason = "quota_exceeded";
        isQuota = true;
      }
      details = maybeMsg || details;
      if ((err as { status?: number }).status === 429) {
        isQuota = true;
      }
    }

    logAIRequest("summarize_failed", userId, note.orgId, noteId, {
      reason,
      details,
    });

    return {
      ok: false,
      error: isQuota ? "AI_QUOTA" : "AI_ERROR",
      message: isQuota
        ? "AI quota exceeded. Configure a new key or add credits."
        : "Failed to generate AI summary",
    };
  }

  if (!summary) {
    logAIRequest("summarize_failed", userId, note.orgId, noteId, {
      reason: "no_summary",
    });
    return { ok: false, error: "AI_ERROR", message: "No summary generated" };
  }

  await db
    .update(notes)
    .set({
      summary,
      summaryStatus: "pending",
      updatedAt: new Date(),
    })
    .where(eq(notes.id, noteId));

  logAIRequest("summarize_success", userId, note.orgId, noteId);
  logMutation("update", "note_summary", userId, note.orgId, noteId);
  return { ok: true, data: { summary } };
}

export async function updateNoteSummaryStatusForAuthor(
  userId: string,
  noteId: string,
  action: string,
): Promise<SummaryResult<{ success: true; status: "accepted" | "rejected" }>> {
  if (!["accept", "reject"].includes(action)) {
    return { ok: false, error: "INVALID_ACTION" };
  }

  const [note] = await db.select().from(notes).where(eq(notes.id, noteId)).limit(1);

  if (!note) {
    logPermissionDenied("accept_reject_summary", userId, undefined, noteId, {
      reason: "not_found",
    });
    return { ok: false, error: "NOT_FOUND" };
  }

  if (note.createdBy !== userId) {
    logPermissionDenied("accept_reject_summary", userId, note.orgId, noteId, {
      reason: "not_author",
    });
    return { ok: false, error: "ACCESS_DENIED" };
  }

  const newStatus = action === "accept" ? "accepted" : "rejected";

  await db
    .update(notes)
    .set({
      summaryStatus: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(notes.id, noteId));

  logMutation("update", "note_summary_status", userId, note.orgId, noteId, {
    status: newStatus,
  });

  return { ok: true, data: { success: true, status: newStatus } };
}

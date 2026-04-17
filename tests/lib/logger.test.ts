import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  logAIRequest,
  logAuthEvent,
  logError,
  logMutation,
  logPermissionDenied,
  logger,
} from "../../src/lib/logger";

describe("logger helpers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("logs auth events with expected metadata", () => {
    const infoSpy = vi.spyOn(logger, "info").mockImplementation(() => logger);

    logAuthEvent("sign_in", "user-1", "org-1", { ip: "127.0.0.1" });

    expect(infoSpy).toHaveBeenCalledTimes(1);
    const [payload, message] = infoSpy.mock.calls[0];
    expect(payload).toMatchObject({
      event: "auth",
      action: "sign_in",
      userId: "user-1",
      orgId: "org-1",
      ip: "127.0.0.1",
    });
    expect(message).toBe("Auth event: sign_in");
  });

  it("logs mutations and permission denials", () => {
    const infoSpy = vi.spyOn(logger, "info").mockImplementation(() => logger);
    const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => logger);

    logMutation("update", "note", "user-1", "org-1", "note-1");
    logPermissionDenied("delete_note", "user-2", "org-2", "note");

    expect(infoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "mutation",
        operation: "update",
        resource: "note",
        resourceId: "note-1",
      }),
      "Mutation: update note",
    );

    expect(warnSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "permission_denied",
        action: "delete_note",
      }),
      "Permission denied: delete_note",
    );
  });

  it("logs AI requests and errors", () => {
    const infoSpy = vi.spyOn(logger, "info").mockImplementation(() => logger);
    const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => logger);
    const err = new Error("boom");

    logAIRequest("summarize", "user-1", "org-1", "note-1", { provider: "openai" });
    logError(err, "summarize_note", "user-1", { noteId: "note-1" });

    expect(infoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "ai",
        action: "summarize",
        provider: "openai",
      }),
      "AI request: summarize",
    );

    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "error",
        context: "summarize_note",
        error: "boom",
      }),
      "Error in summarize_note: boom",
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

describe("integration-auth helper", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();

    process.env.TEST_APP_BASE_URL = "http://localhost:3000";
    process.env.APP_PORT = "3000";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    process.env.TEST_EMAIL = "test@example.com";
    process.env.TEST_PASSWORD = "secret";
    process.env.TEST_ORG_ID = "org-1";
  });

  it("returns access token when auth succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ access_token: "token-123" }),
      }),
    );

    const { getAccessToken } = await import("../helpers/integration-auth");
    const token = await getAccessToken();

    expect(token).toBe("token-123");
  });

  it("throws when auth endpoint returns non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({ message: "invalid credentials" }),
      }),
    );

    const { getAccessToken } = await import("../helpers/integration-auth");

    await expect(getAccessToken()).rejects.toThrow(
      "Could not obtain test access token (status 401).",
    );
  });

  it("throws when response body is not valid JSON/token is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockRejectedValue(new Error("invalid json")),
      }),
    );

    const { getAccessToken } = await import("../helpers/integration-auth");

    await expect(getAccessToken()).rejects.toThrow(
      "Could not obtain test access token (status 200).",
    );
  });
});

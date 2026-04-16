import { describe, it, expect, beforeAll } from "vitest";
import supertest from "supertest";

const api = supertest("http://localhost:3000");

const TEST_EMAIL = process.env.TEST_EMAIL || "";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "";

let accessToken = "";
let noteId = "";

beforeAll(async () => {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    console.warn(
      "Skipping summarize tests: TEST_EMAIL or TEST_PASSWORD not set",
    );
    return;
  }
  const res = await api
    .post("/api/auth/signin")
    .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
  if (res.status === 200 && res.body?.access_token) {
    accessToken = res.body.access_token;
  }
  // Cria nota longa para testar summary
  if (accessToken) {
    const content = "Lorem ipsum dolor sit amet, ".repeat(10);
    const noteRes = await api
      .post("/api/notes")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Para resumo", content });
    if ([200, 201].includes(noteRes.status)) noteId = noteRes.body.id;
  }
});

describe("API Summarize: fluxo de resumo", () => {
  it("should reject summarize for short note", async () => {
    if (!accessToken) return;
    // Cria nota curta
    const noteRes = await api
      .post("/api/notes")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Curta", content: "Pouco texto" });
    if (![200, 201].includes(noteRes.status)) return;
    const shortId = noteRes.body.id;
    const res = await api
      .post(`/api/notes/${shortId}/summarize`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect([400, 422]).toContain(res.status);
  });

  it("should generate summary for valid note", async () => {
    if (!accessToken || !noteId) return;
    const res = await api
      .post(`/api/notes/${noteId}/summarize`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("summary");
  });
});

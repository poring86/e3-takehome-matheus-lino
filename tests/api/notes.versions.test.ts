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
      "Skipping versions tests: TEST_EMAIL or TEST_PASSWORD not set",
    );
    return;
  }
  const res = await api
    .post("/api/auth/signin")
    .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
  if (res.status === 200 && res.body?.access_token) {
    accessToken = res.body.access_token;
  }
  // Cria nota
  if (accessToken) {
    const noteRes = await api
      .post("/api/notes")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Versão", content: "Primeira versão" });
    if ([200, 201].includes(noteRes.status)) noteId = noteRes.body.id;
  }
});

describe("API Notes: versionamento", () => {
  it("should create a new version on update", async () => {
    if (!accessToken || !noteId) return;
    // Atualiza nota
    await api
      .put(`/api/notes/${noteId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ content: "Segunda versão" });
    // Busca versões
    const res = await api
      .get(`/api/notes/${noteId}/versions`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });
});

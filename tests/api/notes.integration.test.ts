import { describe, it, expect, beforeAll } from "vitest";
import supertest from "supertest";

const api = supertest("http://localhost:3000");

// Configure estas variáveis com um usuário de teste válido
const TEST_EMAIL = process.env.TEST_EMAIL || "";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "";

let accessToken = "";
let createdNoteId = "";

beforeAll(async () => {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    console.warn(
      "Skipping authenticated tests: TEST_EMAIL or TEST_PASSWORD not set",
    );
    return;
  }
  // Realiza login para obter token
  const res = await api
    .post("/api/auth/signin")
    .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
  if (res.status === 200 && res.body?.access_token) {
    accessToken = res.body.access_token;
  } else {
    console.warn("Login failed, skipping authenticated tests");
  }
});

describe("API Integration: /api/notes/[id] (autenticado)", () => {
  it("should create a note", async () => {
    if (!accessToken) return;
    const res = await api
      .post("/api/notes")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Note de teste", content: "Conteúdo" });
    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty("id");
    createdNoteId = res.body.id;
  });

  it("should read the created note", async () => {
    if (!accessToken || !createdNoteId) return;
    const res = await api
      .get(`/api/notes/${createdNoteId}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", createdNoteId);
  });

  it("should update the note", async () => {
    if (!accessToken || !createdNoteId) return;
    const res = await api
      .put(`/api/notes/${createdNoteId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Atualizado" });
    expect(res.status).toBe(200);
    expect(res.body[0]).toHaveProperty("title", "Atualizado");
  });

  it("should delete the note", async () => {
    if (!accessToken || !createdNoteId) return;
    const res = await api
      .delete(`/api/notes/${createdNoteId}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
  });
});

// Este teste depende de um note real criado previamente no banco.
// Para rodar localmente, crie um note e substitua o ID abaixo por um válido.
const EXISTING_NOTE_ID = process.env.TEST_NOTE_ID || "";

describe("API Integration: /api/notes/[id]", () => {
  it("should reject unauthenticated note read", async () => {
    if (!EXISTING_NOTE_ID) {
      console.warn("Skipping test: TEST_NOTE_ID not set");
      return;
    }
    const res = await api.get(`/api/notes/${EXISTING_NOTE_ID}`);
    expect([401, 403]).toContain(res.status);
  });

  it("should reject unauthenticated note update", async () => {
    if (!EXISTING_NOTE_ID) {
      console.warn("Skipping test: TEST_NOTE_ID not set");
      return;
    }
    const res = await api
      .put(`/api/notes/${EXISTING_NOTE_ID}`)
      .send({ title: "Updated" });
    expect([401, 403]).toContain(res.status);
  });

  it("should reject unauthenticated note delete", async () => {
    if (!EXISTING_NOTE_ID) {
      console.warn("Skipping test: TEST_NOTE_ID not set");
      return;
    }
    const res = await api.delete(`/api/notes/${EXISTING_NOTE_ID}`);
    expect([401, 403]).toContain(res.status);
  });
});

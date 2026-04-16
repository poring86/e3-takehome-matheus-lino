import { describe, it, expect, beforeAll } from "vitest";
import supertest from "supertest";

const api = supertest("http://localhost:3000");

const TEST_EMAIL = process.env.TEST_EMAIL || "";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "";

let accessToken = "";

beforeAll(async () => {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    console.warn(
      "Skipping invalid payload tests: TEST_EMAIL or TEST_PASSWORD not set",
    );
    return;
  }
  const res = await api
    .post("/api/auth/signin")
    .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
  if (res.status === 200 && res.body?.access_token) {
    accessToken = res.body.access_token;
  }
});

describe("API Notes: invalid payload", () => {
  it("should reject note creation with missing title", async () => {
    if (!accessToken) return;
    const res = await api
      .post("/api/notes")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ content: "No title" });
    expect([400, 422]).toContain(res.status);
  });

  it("should reject note creation with wrong type", async () => {
    if (!accessToken) return;
    const res = await api
      .post("/api/notes")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: 123, content: true });
    expect([400, 422]).toContain(res.status);
  });

  it("should reject update with invalid visibility", async () => {
    if (!accessToken) return;
    // Cria nota válida
    const create = await api
      .post("/api/notes")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Teste", content: "Teste" });
    if (![200, 201].includes(create.status)) return;
    const noteId = create.body.id;
    // Tenta atualizar com visibility inválido
    const res = await api
      .put(`/api/notes/${noteId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ visibility: "invalid" });
    expect([400, 422]).toContain(res.status);
  });
});

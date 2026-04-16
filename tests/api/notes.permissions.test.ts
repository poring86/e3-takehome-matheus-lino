import { describe, it, expect, beforeAll } from "vitest";
import supertest from "supertest";

const api = supertest("http://localhost:3000");

// Configure com dois usuários de orgs diferentes
const USER1_EMAIL = process.env.TEST_USER1_EMAIL || "";
const USER1_PASSWORD = process.env.TEST_USER1_PASSWORD || "";
const USER2_EMAIL = process.env.TEST_USER2_EMAIL || "";
const USER2_PASSWORD = process.env.TEST_USER2_PASSWORD || "";

let user1Token = "";
let user2Token = "";
let user1NoteId = "";

beforeAll(async () => {
  if (!USER1_EMAIL || !USER1_PASSWORD || !USER2_EMAIL || !USER2_PASSWORD) {
    console.warn("Skipping permission tests: user credentials not set");
    return;
  }
  // Login user1
  const res1 = await api
    .post("/api/auth/signin")
    .send({ email: USER1_EMAIL, password: USER1_PASSWORD });
  if (res1.status === 200 && res1.body?.access_token)
    user1Token = res1.body.access_token;
  // Login user2
  const res2 = await api
    .post("/api/auth/signin")
    .send({ email: USER2_EMAIL, password: USER2_PASSWORD });
  if (res2.status === 200 && res2.body?.access_token)
    user2Token = res2.body.access_token;
  // User1 cria uma nota privada
  if (user1Token) {
    const noteRes = await api
      .post("/api/notes")
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ title: "Privada", content: "Só user1", visibility: "private" });
    if (noteRes.status === 201 || noteRes.status === 200)
      user1NoteId = noteRes.body.id;
  }
});

describe("API Permissions: acesso negado entre orgs/usuários", () => {
  it("should deny user2 from reading user1 private note", async () => {
    if (!user2Token || !user1NoteId) return;
    const res = await api
      .get(`/api/notes/${user1NoteId}`)
      .set("Authorization", `Bearer ${user2Token}`);
    expect([403, 404]).toContain(res.status);
  });

  it("should deny user2 from updating user1 private note", async () => {
    if (!user2Token || !user1NoteId) return;
    const res = await api
      .put(`/api/notes/${user1NoteId}`)
      .set("Authorization", `Bearer ${user2Token}`)
      .send({ title: "Hack" });
    expect([403, 404]).toContain(res.status);
  });

  it("should deny user2 from deleting user1 private note", async () => {
    if (!user2Token || !user1NoteId) return;
    const res = await api
      .delete(`/api/notes/${user1NoteId}`)
      .set("Authorization", `Bearer ${user2Token}`);
    expect([403, 404]).toContain(res.status);
  });
});

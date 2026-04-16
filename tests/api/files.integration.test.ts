import { describe, it, expect, beforeAll } from "vitest";
import supertest from "supertest";
import fs from "fs";
import path from "path";

const api = supertest("http://localhost:3000");

const TEST_EMAIL = process.env.TEST_EMAIL || "";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "";
const TEST_ORG_ID = process.env.TEST_ORG_ID || "";

let accessToken = "";

beforeAll(async () => {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    console.warn("Skipping files tests: TEST_EMAIL or TEST_PASSWORD not set");
    return;
  }
  const res = await api
    .post("/api/auth/signin")
    .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
  if (res.status === 200 && res.body?.access_token) {
    accessToken = res.body.access_token;
  }
});

describe("API Files: upload e listagem", () => {
  it("should reject upload without orgId", async () => {
    if (!accessToken) return;
    const res = await api
      .post("/api/files")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", Buffer.from("conteudo"), "test.txt");
    expect([400, 422]).toContain(res.status);
  });

  it("should upload a file", async () => {
    if (!accessToken || !TEST_ORG_ID) return;
    const res = await api
      .post("/api/files")
      .set("Authorization", `Bearer ${accessToken}`)
      .field("orgId", TEST_ORG_ID)
      .attach("file", Buffer.from("conteudo"), "test.txt");
    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty("url");
  });

  it("should list files for org", async () => {
    if (!accessToken || !TEST_ORG_ID) return;
    const res = await api
      .get(`/api/files?orgId=${TEST_ORG_ID}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

import { describe, it, expect, beforeAll } from "vitest";
import supertest from "supertest";
import {
  getAccessToken,
  integrationEnv,
  missingIntegrationEnv,
} from "../helpers/integration-auth";

const api = supertest(integrationEnv.appBaseUrl);

let accessToken = "";
let createdNoteId = "";
let canRunIntegration = true;
let skipReason = "";

beforeAll(async () => {
  if (missingIntegrationEnv.length > 0) {
    canRunIntegration = false;
    skipReason = `Missing integration env vars: ${missingIntegrationEnv.join(", ")}`;
    console.warn(`Skipping notes integration tests: ${skipReason}`);
    return;
  }

  try {
    accessToken = await getAccessToken();
  } catch (error) {
    canRunIntegration = false;
    skipReason =
      error instanceof Error
        ? error.message
        : "Could not obtain integration auth token";
    console.warn(`Skipping notes integration tests: ${skipReason}`);
  }
});

describe("API Integration: /api/notes/[id] (authenticated)", () => {
  it("should create a note", async () => {
    if (!canRunIntegration) return;
    if (!accessToken)
      throw new Error("Missing access token for integration test");

    const res = await api
      .post(`/api/notes?orgId=${integrationEnv.testOrgId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Integration note", content: "Integration content" });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    createdNoteId = res.body.id;
  }, 20000);

  it("should read the created note", async () => {
    if (!canRunIntegration) return;
    if (!accessToken || !createdNoteId) {
      throw new Error("Missing state for note read test");
    }

    const res = await api
      .get(`/api/notes/${createdNoteId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", createdNoteId);
  }, 20000);

  it("should update the note", async () => {
    if (!canRunIntegration) return;
    if (!accessToken || !createdNoteId) {
      throw new Error("Missing state for note update test");
    }

    const res = await api
      .put(`/api/notes/${createdNoteId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Updated title" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("title", "Updated title");
  }, 20000);

  it("should delete the note", async () => {
    if (!canRunIntegration) return;
    if (!accessToken || !createdNoteId) {
      throw new Error("Missing state for note delete test");
    }

    const res = await api
      .delete(`/api/notes/${createdNoteId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
  }, 20000);

  it("[regression][B-029] should allow GET, PUT, DELETE on /api/notes/[id] with bearer token and handle children cleanup", async () => {
    if (!canRunIntegration) return;
    // Cria nota
    const createRes = await api
      .post(`/api/notes?orgId=${integrationEnv.testOrgId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "B-029 regression", content: "v1" });
    expect(createRes.status).toBe(201);
    const noteId = createRes.body.id;

    // Atualiza nota (cria versão)
    const updateRes = await api
      .put(`/api/notes/${noteId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "B-029 regression updated", content: "v2" });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body).toHaveProperty("title", "B-029 regression updated");

    // GET deve funcionar
    const getRes = await api
      .get(`/api/notes/${noteId}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body).toHaveProperty("id", noteId);

    // DELETE deve funcionar e limpar filhos (não deve retornar 500)
    const delRes = await api
      .delete(`/api/notes/${noteId}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(delRes.status).toBe(200);
    expect(delRes.body).toHaveProperty("success", true);

    // GET após delete deve retornar 404
    const getAfterDel = await api
      .get(`/api/notes/${noteId}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(getAfterDel.status).toBe(404);
  }, 20000);
});

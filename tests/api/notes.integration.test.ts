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

beforeAll(async () => {
  if (missingIntegrationEnv.length > 0) {
    throw new Error(
      `Missing integration env vars: ${missingIntegrationEnv.join(", ")}`,
    );
  }

  accessToken = await getAccessToken();
});

describe("API Integration: /api/notes/[id] (authenticated)", () => {
  it("should create a note", async () => {
    if (!accessToken) throw new Error("Missing access token for integration test");

    const res = await api
      .post(`/api/notes?orgId=${integrationEnv.testOrgId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Integration note", content: "Integration content" });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    createdNoteId = res.body.id;
  });

  it("should read the created note", async () => {
    if (!accessToken || !createdNoteId) {
      throw new Error("Missing state for note read test");
    }

    const res = await api
      .get(`/api/notes/${createdNoteId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", createdNoteId);
  });

  it("should update the note", async () => {
    if (!accessToken || !createdNoteId) {
      throw new Error("Missing state for note update test");
    }

    const res = await api
      .put(`/api/notes/${createdNoteId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Updated title" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("title", "Updated title");
  });

  it("should delete the note", async () => {
    if (!accessToken || !createdNoteId) {
      throw new Error("Missing state for note delete test");
    }

    const res = await api
      .delete(`/api/notes/${createdNoteId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
  });
});

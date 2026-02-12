import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "./app";

describe("app basics", () => {
  it("GET /health -> { ok: true }", async () => {
    const app = createApp();

    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("GET /docs.json returns openapi document", async () => {
    const app = createApp();

    const res = await request(app).get("/docs.json");

    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe("3.0.3");
    expect(res.body.info?.title).toBeTruthy();
  });
});

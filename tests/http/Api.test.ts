import { describe, it, expect, beforeAll } from "vitest";
import { buildServer } from "../../src/server";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;

beforeAll(async () => {
  app = buildServer();
  await app.ready();
});

describe("HTTP API", () => {
  it("GET /health -> 200", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("application/json");
    expect(res.json()).toEqual({ status: "ok" });
  });

  it("POST /users válido -> 201 con id", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/users",
      payload: { name: "Alice", email: "alice@example.com" },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(typeof body.id).toBe("string");
    expect(body.id.length).toBeGreaterThan(0);
  });

  it("POST /users nombre inválido -> 400", async () => {
    const res = await app.inject({ method: "POST", url: "/users", payload: { name: 123, email: "bob@example.com" } });
    expect(res.statusCode).toBe(400);
  });

  it("POST /users email inválido -> 400", async () => {
    const res = await app.inject({ method: "POST", url: "/users", payload: { name: "Bob", email: "invalid" } });
    expect(res.statusCode).toBe(400);
  });
});
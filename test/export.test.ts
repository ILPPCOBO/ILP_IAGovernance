/**
 * Export center tests (#17) via supertest.
 *
 *   format=json  -> application/json package
 *   format=docx  -> non-empty buffer with the docx content-type
 *   format=pdf   -> text/html containing the disclaimer (documented fallback)
 *
 * The package is created through the real flow (accept disclaimer -> generate)
 * so we export a genuine stored package by id.
 */

import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { freshApp } from "./http";
import { richQuestionnaire } from "./helpers";

describe("Export center (#17)", () => {
  let app: Express;
  let sessionId: string;
  let packageId: string;

  beforeAll(async () => {
    const h = await freshApp("export-session");
    app = h.app;
    sessionId = h.sessionId;

    await request(app)
      .post("/api/disclaimer/accept")
      .set("x-session-id", sessionId)
      .send({ accepted: true, lang: "en" });

    const gen = await request(app)
      .post("/api/generate")
      .set("x-session-id", sessionId)
      .send({ questionnaire: richQuestionnaire() });
    expect(gen.status).toBe(200);
    packageId = gen.body.id;
    expect(packageId).toBeTruthy();
  });

  it("returns the package JSON for format=json", async () => {
    const res = await request(app)
      .get(`/api/export/${packageId}`)
      .query({ format: "json" })
      .set("x-session-id", sessionId);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    // body should be the package (parsed by supertest for json content-type)
    const body =
      typeof res.body === "object" && Object.keys(res.body).length
        ? res.body
        : JSON.parse(res.text);
    expect(body.id).toBe(packageId);
    expect(Array.isArray(body.policy)).toBe(true);
  });

  it("returns a non-empty docx buffer for format=docx", async () => {
    const res = await request(app)
      .get(`/api/export/${packageId}`)
      .query({ format: "docx" })
      .set("x-session-id", sessionId)
      .buffer(true)
      .parse((r, cb) => {
        const chunks: Buffer[] = [];
        r.on("data", (c: Buffer) => chunks.push(Buffer.from(c)));
        r.on("end", () => cb(null, Buffer.concat(chunks)));
      });

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(
      /application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document/,
    );
    const buf: Buffer = res.body;
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(0);
    // .docx is a zip — verify the PK magic bytes.
    expect(buf.slice(0, 2).toString("latin1")).toBe("PK");
  });

  it("returns print-ready HTML containing the disclaimer for format=pdf", async () => {
    const res = await request(app)
      .get(`/api/export/${packageId}`)
      .query({ format: "pdf", lang: "en" })
      .set("x-session-id", sessionId);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/html/);
    expect(res.text.toLowerCase()).toContain("not legal advice");
  }, 8000);

  it("honors the lang query for the pdf fallback (Spanish disclaimer)", async () => {
    const res = await request(app)
      .get(`/api/export/${packageId}`)
      .query({ format: "pdf", lang: "es" })
      .set("x-session-id", sessionId);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/html/);
    expect(res.text.toLowerCase()).toContain("no constituye asesoramiento jurídico");
  }, 8000);
});

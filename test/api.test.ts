/**
 * HTTP API tests via supertest against createApp() from ../src/server/app.
 *
 * Covers requirements:
 *   #1  Disclaimer gate on /api/generate (403 -> accept -> 200).
 *   #15 /api/contact saves a lead; /api/admin/leads returns it (with token).
 *   #16 Admin can edit /api/admin/config; /api/config reflects it; 401 w/o token.
 *   #18 Uploads inform but never finalize (.png => extractionWeak + warning;
 *       generated package still carries disclaimer + "preliminary" wording).
 */

import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { freshApp, ADMIN_TOKEN, tinyPngBuffer } from "./http";
import { richQuestionnaire } from "./helpers";

function withSession(agent: request.Test, sessionId: string): request.Test {
  return agent.set("x-session-id", sessionId);
}

describe("Disclaimer gate on /api/generate (#1)", () => {
  let app: Express;
  let sessionId: string;

  beforeAll(async () => {
    const h = await freshApp("disclaimer-session");
    app = h.app;
    sessionId = h.sessionId;
  });

  it("returns 403 disclaimer_required before acceptance", async () => {
    const res = await withSession(
      request(app).post("/api/generate"),
      sessionId,
    ).send({ questionnaire: richQuestionnaire() });

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ error: "disclaimer_required" });
  });

  it("allows generation after accepting the disclaimer", async () => {
    const accept = await withSession(
      request(app).post("/api/disclaimer/accept"),
      sessionId,
    ).send({ accepted: true, lang: "en" });
    expect(accept.status).toBe(200);

    const gen = await withSession(
      request(app).post("/api/generate"),
      sessionId,
    ).send({ questionnaire: richQuestionnaire() });

    expect(gen.status).toBe(200);
    expect(gen.body).toHaveProperty("id");
    expect(gen.body).toHaveProperty("policy");
    expect(Array.isArray(gen.body.policy)).toBe(true);
    expect(gen.body.policy.length).toBeGreaterThan(0);
    expect(gen.body.disclaimer).toBeTruthy();
  });

  it("keeps the gate per-session (a different session is still blocked)", async () => {
    const res = await withSession(
      request(app).post("/api/generate"),
      "another-unaccepted-session",
    ).send({ questionnaire: richQuestionnaire() });
    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ error: "disclaimer_required" });
  });
});

describe("Contact leads (#15)", () => {
  let app: Express;

  beforeAll(async () => {
    const h = await freshApp();
    app = h.app;
  });

  it("saves a lead and returns it via admin leads", async () => {
    const lead = {
      name: "Jane Doe",
      company: "Doe & Partners",
      email: "jane@example.com",
      country: "Spain",
      industry: "Legal",
      employees: "11-50",
      currentTools: "ChatGPT, Claude",
      urgency: "high",
      message: "Please review our draft policy.",
    };

    const create = await request(app)
      .post("/api/contact")
      .set("x-session-id", "contact-session")
      .send(lead);
    expect(create.status).toBeLessThan(300);
    expect(create.body).toHaveProperty("id");

    const list = await request(app)
      .get("/api/admin/leads")
      .set("x-admin-token", ADMIN_TOKEN);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);

    const saved = list.body.find((l: any) => l.id === create.body.id);
    expect(saved).toBeDefined();
    expect(saved).toMatchObject({
      name: "Jane Doe",
      email: "jane@example.com",
      company: "Doe & Partners",
    });
  });

  it("rejects admin leads without a valid token", async () => {
    const res = await request(app).get("/api/admin/leads");
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ error: "unauthorized" });
  });
});

describe("Admin config editing (#16)", () => {
  let app: Express;

  beforeAll(async () => {
    const h = await freshApp();
    app = h.app;
  });

  it("rejects admin config reads/writes without the token", async () => {
    const get = await request(app).get("/api/admin/config");
    expect(get.status).toBe(401);
    expect(get.body).toMatchObject({ error: "unauthorized" });

    const put = await request(app).put("/api/admin/config").send({ config: {} });
    expect(put.status).toBe(401);
  });

  it("persists an edited disclaimer/question and reflects it in public config", async () => {
    const current = await request(app)
      .get("/api/admin/config")
      .set("x-admin-token", ADMIN_TOKEN);
    expect(current.status).toBe(200);

    const config = current.body;
    const newDisclaimerEn =
      "EDITED preliminary disclaimer — this is not legal advice and not a final compliance review.";
    config.disclaimer = {
      en: newDisclaimerEn,
      es: "EDITADO aviso preliminar — no constituye asesoramiento jurídico ni una revisión final de cumplimiento.",
    };
    // tweak the first question prompt too
    if (Array.isArray(config.questions) && config.questions.length > 0) {
      config.questions[0].prompt = {
        en: "EDITED: Company legal name",
        es: "EDITADO: Razón social de la empresa",
      };
    }

    const save = await request(app)
      .put("/api/admin/config")
      .set("x-admin-token", ADMIN_TOKEN)
      .send({ config });
    expect(save.status).toBeLessThan(300);

    const publicCfg = await request(app).get("/api/config");
    expect(publicCfg.status).toBe(200);
    expect(publicCfg.body.disclaimer.en).toBe(newDisclaimerEn);
    const firstQ = publicCfg.body.questions[0];
    expect(firstQ.prompt.en).toBe("EDITED: Company legal name");
  });
});

describe("Uploads inform but never finalize (#18)", () => {
  let app: Express;
  let sessionId: string;

  beforeAll(async () => {
    const h = await freshApp("upload-session");
    app = h.app;
    sessionId = h.sessionId;
  });

  it("marks a .png upload as extractionWeak with a warning", async () => {
    const res = await request(app)
      .post("/api/uploads")
      .set("x-session-id", sessionId)
      .attach("file", tinyPngBuffer(), "scan.png");

    expect(res.status).toBeLessThan(300);
    expect(res.body).toMatchObject({ extractionWeak: true });
    expect(res.body.warning).toBeTruthy();
    expect(res.body.warning.en).toBeTruthy();
    expect(res.body.warning.es).toBeTruthy();
  });

  it("still produces a package with the disclaimer and 'preliminary' wording after upload", async () => {
    await request(app)
      .post("/api/disclaimer/accept")
      .set("x-session-id", sessionId)
      .send({ accepted: true, lang: "en" });

    const gen = await request(app)
      .post("/api/generate")
      .set("x-session-id", sessionId)
      .send({ questionnaire: richQuestionnaire() });

    expect(gen.status).toBe(200);
    const pkg = gen.body;
    // disclaimer survives the upload
    expect(pkg.disclaimer).toBeTruthy();
    expect(pkg.disclaimer.en.toLowerCase()).toContain("not legal advice");
    // "preliminary" wording present in title / exec summary
    const blob = (
      pkg.title.en +
      " " +
      pkg.executiveSummary.en +
      " " +
      pkg.title.es +
      " " +
      pkg.executiveSummary.es
    ).toLowerCase();
    expect(blob).toContain("preliminary");
    expect(blob).toContain("preliminar");
  });
});

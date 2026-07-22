/**
 * Express app factory for the AI Governance Policy Builder.
 *
 * `createApp()` returns the configured app WITHOUT calling `listen` so tests can
 * mount it with supertest. `src/server/index.ts` calls `listen`.
 *
 * Session id is carried in the `x-session-id` header. Admin routes require the
 * `x-admin-token` header to equal `process.env.ADMIN_TOKEN || "admin-demo"`.
 */

import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import cors from "cors";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";

import {
  CORE_DISCLAIMER,
  DISCLAIMER_VERSION,
  generatePackage,
  renderHtml,
} from "../shared/index";
import type {
  AdminConfig,
  CompanyProfile,
  ContactLead,
  L,
  Lang,
  PolicyPackage,
  UploadedPolicyDocument,
  UserSession,
} from "../shared/index";
import type { GenerateInput, Section } from "../shared/index";
import { buildDocx } from "./export/docx";
import {
  clearAdminOverride,
  getEffectiveConfig,
  getPackage,
  getSession,
  listLeads,
  newId,
  saveAdminOverride,
  saveLead,
  savePackage,
  saveSession,
} from "./storage";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const UPLOAD_DIR = path.join(PROJECT_ROOT, "uploads");

const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "image/png",
  "image/jpeg",
]);
const ALLOWED_EXT = new Set([".pdf", ".docx", ".txt", ".md", ".png", ".jpg", ".jpeg"]);

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function adminToken(): string {
  return process.env.ADMIN_TOKEN || "admin-demo";
}

function normalizeLang(value: unknown): Lang {
  return value === "es" ? "es" : "en";
}

function normalizeSection(value: unknown): Section {
  const allowed: Section[] = ["full", "policy", "tools", "literacy", "vendor", "incident"];
  return allowed.includes(value as Section) ? (value as Section) : "full";
}

/** Build a fresh session with the default language and an unaccepted disclaimer. */
function buildSession(id: string): UserSession {
  const now = new Date().toISOString();
  return {
    id,
    createdAt: now,
    updatedAt: now,
    language: { lang: "en", updatedAt: now },
    disclaimer: { accepted: false, version: DISCLAIMER_VERSION },
    uploads: [],
  };
}

/**
 * Resolve the session from the `x-session-id` header, creating and persisting a
 * new one if absent or unknown.
 */
function getOrCreateSession(req: Request): UserSession {
  const headerId = req.header("x-session-id");
  if (headerId) {
    const existing = getSession(headerId);
    if (existing) return existing;
    return saveSession(buildSession(headerId));
  }
  return saveSession(buildSession(newId("sess")));
}

/** Public config subset returned from GET /api/config. */
function publicConfig(config: AdminConfig) {
  return {
    disclaimer: config.disclaimer,
    disclaimerVersion: config.disclaimerVersion,
    questions: config.questions,
    categories: config.categories,
    tools: config.tools,
    literacy: config.literacy,
    vendorWorkflow: config.vendorWorkflow,
    conversion: config.conversion,
    cta: config.cta,
    translations: config.translations,
  };
}

export function createApp(): express.Express {
  const app = express();

  app.use(cors({ exposedHeaders: ["Content-Disposition"] }));
  app.use(express.json({ limit: "5mb" }));

  if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (ALLOWED_MIME.has(file.mimetype) || ALLOWED_EXT.has(ext)) {
        cb(null, true);
      } else {
        cb(null, false);
      }
    },
  });

  /* ----------------------------- health ----------------------------- */
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  /* ----------------------------- config ----------------------------- */
  app.get("/api/config", (_req: Request, res: Response) => {
    res.json(publicConfig(getEffectiveConfig()));
  });

  /* ----------------------------- session ---------------------------- */
  app.get("/api/session", (req: Request, res: Response) => {
    res.json(getOrCreateSession(req));
  });

  app.post("/api/session/language", (req: Request, res: Response) => {
    const session = getOrCreateSession(req);
    const lang = normalizeLang(req.body?.lang);
    session.language = { lang, updatedAt: new Date().toISOString() };
    res.json(saveSession(session));
  });

  app.post("/api/disclaimer/accept", (req: Request, res: Response) => {
    const session = getOrCreateSession(req);
    const config = getEffectiveConfig();
    const lang = normalizeLang(req.body?.lang ?? session.language.lang);
    session.disclaimer = {
      accepted: req.body?.accepted === true,
      acceptedAt: new Date().toISOString(),
      version: config.disclaimerVersion,
      lang,
    };
    res.json(saveSession(session));
  });

  app.post("/api/session/profile", (req: Request, res: Response) => {
    const session = getOrCreateSession(req);
    const profile = req.body?.profile as CompanyProfile | undefined;
    if (profile) session.profile = profile;
    res.json(saveSession(session));
  });

  /* ----------------------------- uploads ---------------------------- */
  app.post(
    "/api/uploads",
    upload.single("file"),
    (req: Request, res: Response) => {
      const session = getOrCreateSession(req);
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: "no_file" });
        return;
      }

      const ext = path.extname(file.originalname).toLowerCase();
      const isText =
        file.mimetype === "text/plain" ||
        file.mimetype === "text/markdown" ||
        ext === ".txt" ||
        ext === ".md";

      const weakWarning: L = {
        en: "Text extraction was limited for this file; it will be used only as context, not as legal advice.",
        es: "La extracción de texto fue limitada para este archivo; se usará solo como contexto, no como asesoramiento jurídico.",
      };

      const doc: UploadedPolicyDocument = {
        id: newId("upl"),
        filename: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        extractionWeak: !isText,
        uploadedAt: new Date().toISOString(),
      };

      if (isText) {
        doc.extractedText = file.buffer.toString("utf8");
        doc.extractionWeak = false;
      } else {
        doc.warning = weakWarning;
      }

      session.uploads.push(doc);
      saveSession(session);
      res.json(doc);
    },
  );

  /* ----------------------------- generate --------------------------- */
  app.post("/api/generate", (req: Request, res: Response) => {
    const session = getOrCreateSession(req);
    const config = getEffectiveConfig();

    if (
      session.disclaimer.accepted !== true ||
      session.disclaimer.version !== config.disclaimerVersion
    ) {
      res.status(403).json({ error: "disclaimer_required" });
      return;
    }

    const bodyProfile = req.body?.profile as CompanyProfile | undefined;
    if (bodyProfile) session.profile = bodyProfile;

    const questionnaire = req.body?.questionnaire;
    if (!questionnaire || typeof questionnaire !== "object") {
      res.status(400).json({ error: "questionnaire_required" });
      return;
    }
    session.questionnaire = questionnaire;

    const input: GenerateInput = {
      sessionId: session.id,
      profile: session.profile,
      questionnaire,
      config,
      createdAt: new Date().toISOString(),
    };

    const pkg: PolicyPackage = generatePackage(input);
    savePackage(pkg);
    session.packageId = pkg.id;
    saveSession(session);

    res.json(pkg);
  });

  /* ----------------------------- package ---------------------------- */
  app.get("/api/package/:id", (req: Request, res: Response) => {
    const pkg = getPackage(req.params.id);
    if (!pkg) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.json(pkg);
  });

  /* ----------------------------- export ----------------------------- */
  app.get("/api/export/:id", async (req: Request, res: Response) => {
    const pkg = getPackage(req.params.id);
    if (!pkg) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    const section = normalizeSection(req.query.section);
    const format = String(req.query.format ?? "json");
    const lang = normalizeLang(req.query.lang);
    const baseName = `ai-governance-${section}-${lang}`;

    if (format === "docx") {
      const buffer = await buildDocx(pkg, lang, section);
      res.setHeader("Content-Type", DOCX_MIME);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${baseName}.docx"`,
      );
      res.send(buffer);
      return;
    }

    if (format === "pdf") {
      // Print-ready HTML fallback: the browser's "Save as PDF" produces the PDF.
      const html = renderHtml(pkg, lang, section);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader(
        "X-Export-Note",
        "print-ready HTML fallback - use the browser's Save as PDF",
      );
      res.send(html);
      return;
    }

    // default: json
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${baseName}.json"`,
    );
    res.json(pkg);
  });

  /* ----------------------------- contact ---------------------------- */
  app.post("/api/contact", (req: Request, res: Response) => {
    const session = getOrCreateSession(req);
    const b = req.body ?? {};
    const lead: ContactLead = {
      id: newId("lead"),
      createdAt: new Date().toISOString(),
      name: String(b.name ?? ""),
      company: String(b.company ?? ""),
      email: String(b.email ?? ""),
      country: String(b.country ?? ""),
      industry: String(b.industry ?? ""),
      employees: String(b.employees ?? ""),
      currentTools: String(b.currentTools ?? ""),
      urgency: (["low", "medium", "high"].includes(b.urgency) ? b.urgency : "") as ContactLead["urgency"],
      message: String(b.message ?? ""),
      consent: b.consent === true,
      uploadedPolicyId: b.uploadedPolicyId ? String(b.uploadedPolicyId) : undefined,
      sessionId: session.id,
      packageId: b.packageId ? String(b.packageId) : session.packageId,
    };
    saveLead(lead);
    res.json({ id: lead.id });
  });

  /* ------------------------------ admin ----------------------------- */
  function requireAdmin(req: Request, res: Response, next: NextFunction) {
    if (req.header("x-admin-token") === adminToken()) {
      next();
      return;
    }
    res.status(401).json({ error: "unauthorized" });
  }

  app.get("/api/admin/config", requireAdmin, (_req: Request, res: Response) => {
    res.json(getEffectiveConfig());
  });

  app.put("/api/admin/config", requireAdmin, (req: Request, res: Response) => {
    const config = req.body?.config as Partial<AdminConfig> | undefined;
    if (!config || typeof config !== "object") {
      res.status(400).json({ error: "config_required" });
      return;
    }
    saveAdminOverride(config);
    res.json(getEffectiveConfig());
  });

  app.post("/api/admin/reset", requireAdmin, (_req: Request, res: Response) => {
    clearAdminOverride();
    res.json(getEffectiveConfig());
  });

  app.get("/api/admin/leads", requireAdmin, (_req: Request, res: Response) => {
    res.json(listLeads());
  });

  /* -------------------- static client (production) ------------------- */
  const clientDist = path.join(PROJECT_ROOT, "dist", "client");
  if (existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get(/^(?!\/api).*/, (_req: Request, res: Response) => {
      res.sendFile(path.join(clientDist, "index.html"));
    });
  }

  return app;
}

export { CORE_DISCLAIMER };

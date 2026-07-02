/**
 * CLIENT-ONLY API shim for the static demo deploy (Cloudflare Pages / Vercel).
 *
 * This is a drop-in replacement for `./api` (wired via a Vite resolve.alias in
 * vite.demo.config.ts). It implements the EXACT same `api` surface but runs the
 * whole tool in the browser — no backend:
 *   - config / seed come from the shared `buildDefaultConfig()`
 *   - the policy package is produced by the shared `generatePackage()`
 *   - sessions, packages, leads and admin overrides persist in localStorage
 *   - exports are generated in-browser as downloadable blobs
 *
 * It is a DEMO: data lives only in the visitor's browser. The full server build
 * (src/server) is what emits native .docx and stores leads server-side.
 */

import {
  buildDefaultConfig,
  generatePackage,
  renderHtml,
} from "../shared/index";
import type {
  AdminConfig,
  AIUseQuestionnaireResponse,
  CompanyProfile,
  ContactLead,
  Lang,
  L,
  PolicyPackage,
  UploadedPolicyDocument,
  UserSession,
  AdminQuestion,
  QuestionCategory,
  ToolCatalogEntry,
  VendorApprovalWorkflow,
} from "../shared/index";
import type { Section } from "../shared/render";

/* -------------------------------------------------------------------------- */
/* Shared types re-exported so this file is a perfect drop-in for ./api        */
/* -------------------------------------------------------------------------- */

export interface PublicConfig {
  disclaimer: L;
  disclaimerVersion: string;
  questions: AdminQuestion[];
  categories: QuestionCategory[];
  tools: ToolCatalogEntry[];
  literacy: { id: string; text: L }[];
  vendorWorkflow: VendorApprovalWorkflow;
  conversion: { heading: L; body: L };
  cta: { id: string; label: L }[];
  translations: { en: Record<string, string>; es: Record<string, string> };
}

export interface ExportOptions {
  section: Section;
  format: "pdf" | "docx" | "json";
  lang: Lang;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

/* -------------------------------------------------------------------------- */
/* localStorage helpers                                                        */
/* -------------------------------------------------------------------------- */

const SESSION_ID_KEY = "aigpb_session_id";
const SESSION_KEY = "aigpb_demo_session";
const PKG_PREFIX = "aigpb_demo_pkg_";
const LEADS_KEY = "aigpb_demo_leads";
const ADMIN_KEY = "aigpb_demo_admin_config";
const ADMIN_TOKEN = "admin-demo";

function makeUuid(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getSessionId(): string {
  let id: string | null = null;
  try {
    id = localStorage.getItem(SESSION_ID_KEY);
  } catch {
    id = null;
  }
  if (!id) {
    id = makeUuid();
    try {
      localStorage.setItem(SESSION_ID_KEY, id);
    } catch {
      /* private mode */
    }
  }
  return id;
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota/private mode */
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

/* -------------------------------------------------------------------------- */
/* config (default + admin override)                                          */
/* -------------------------------------------------------------------------- */

function effectiveConfig(): AdminConfig {
  // The admin editor saves the full AdminConfig, so an override (if present) is
  // authoritative; otherwise fall back to the shared seed defaults.
  const override = read<AdminConfig>(ADMIN_KEY);
  if (override && Array.isArray(override.questions)) return override;
  return buildDefaultConfig();
}

function publicConfig(): PublicConfig {
  const c = effectiveConfig();
  return {
    disclaimer: c.disclaimer,
    disclaimerVersion: c.disclaimerVersion,
    questions: c.questions,
    categories: c.categories,
    tools: c.tools,
    literacy: c.literacy,
    vendorWorkflow: c.vendorWorkflow,
    conversion: c.conversion,
    cta: c.cta,
    translations: c.translations,
  };
}

/* -------------------------------------------------------------------------- */
/* session                                                                    */
/* -------------------------------------------------------------------------- */

function loadSession(): UserSession {
  const existing = read<UserSession>(SESSION_KEY);
  if (existing && existing.id) return existing;
  const now = nowIso();
  const session: UserSession = {
    id: getSessionId(),
    createdAt: now,
    updatedAt: now,
    language: { lang: "en", updatedAt: now },
    disclaimer: { accepted: false, version: effectiveConfig().disclaimerVersion },
    uploads: [],
  };
  saveSession(session);
  return session;
}

function saveSession(session: UserSession): UserSession {
  session.updatedAt = nowIso();
  write(SESSION_KEY, session);
  return session;
}

/* -------------------------------------------------------------------------- */
/* packages                                                                   */
/* -------------------------------------------------------------------------- */

function savePackage(pkg: PolicyPackage): void {
  write(PKG_PREFIX + pkg.id, pkg);
}
function loadPackage(id: string): PolicyPackage | null {
  return read<PolicyPackage>(PKG_PREFIX + id);
}

/* -------------------------------------------------------------------------- */
/* export blobs (built in-browser)                                            */
/* -------------------------------------------------------------------------- */

const blobCache = new Map<string, string>();

function exportBlobUrl(id: string, opts: ExportOptions): string {
  const key = `${id}|${opts.section}|${opts.format}|${opts.lang}`;
  const cached = blobCache.get(key);
  if (cached) return cached;
  const pkg = loadPackage(id);
  if (!pkg) return "#";
  let blob: Blob;
  if (opts.format === "json") {
    blob = new Blob([JSON.stringify(pkg, null, 2)], { type: "application/json" });
  } else if (opts.format === "docx") {
    // Demo fallback: a Word-openable HTML document (opens in MS Word /
    // LibreOffice). The full server build emits native OOXML .docx.
    blob = new Blob([renderHtml(pkg, opts.lang, opts.section)], {
      type: "application/msword",
    });
  } else {
    // pdf → print-ready HTML; the browser's "Save as PDF" produces the PDF.
    blob = new Blob([renderHtml(pkg, opts.lang, opts.section)], {
      type: "text/html;charset=utf-8",
    });
  }
  const url = URL.createObjectURL(blob);
  blobCache.set(key, url);
  return url;
}

/* -------------------------------------------------------------------------- */
/* leads                                                                      */
/* -------------------------------------------------------------------------- */

function loadLeads(): ContactLead[] {
  return read<ContactLead[]>(LEADS_KEY) ?? [];
}

/* -------------------------------------------------------------------------- */
/* admin token gate                                                           */
/* -------------------------------------------------------------------------- */

function assertToken(token: string): void {
  if (token !== ADMIN_TOKEN) {
    throw new ApiError(401, "unauthorized", "unauthorized");
  }
}

/* -------------------------------------------------------------------------- */
/* the api object (same shape as ./api)                                        */
/* -------------------------------------------------------------------------- */

const TEXT_MIME = /^text\/|json|markdown/i;
const TEXT_EXT = /\.(txt|md|markdown|csv|json)$/i;

async function readUpload(file: File): Promise<UploadedPolicyDocument> {
  const isText = TEXT_MIME.test(file.type) || TEXT_EXT.test(file.name);
  let extractedText: string | undefined;
  let extractionWeak = true;
  let warning: L | undefined;
  if (isText) {
    try {
      extractedText = await file.text();
      extractionWeak = false;
    } catch {
      extractionWeak = true;
    }
  }
  if (extractionWeak) {
    warning = {
      en: "Text extraction was limited for this file; it will be used only as context.",
      es: "La extracción de texto fue limitada para este archivo; se usará solo como contexto.",
    };
  }
  return {
    id: makeUuid(),
    filename: file.name,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: file.size,
    extractedText,
    extractionWeak,
    warning,
    uploadedAt: nowIso(),
  };
}

export const api = {
  sessionId: getSessionId,

  async getConfig(): Promise<PublicConfig> {
    return publicConfig();
  },

  async getSession(): Promise<UserSession> {
    return loadSession();
  },

  async setLanguage(lang: Lang): Promise<UserSession> {
    const s = loadSession();
    s.language = { lang, updatedAt: nowIso() };
    return saveSession(s);
  },

  async acceptDisclaimer(lang: Lang): Promise<UserSession> {
    const s = loadSession();
    s.disclaimer = {
      accepted: true,
      acceptedAt: nowIso(),
      lang,
      version: effectiveConfig().disclaimerVersion,
    };
    return saveSession(s);
  },

  async saveProfile(profile: CompanyProfile): Promise<UserSession> {
    const s = loadSession();
    s.profile = profile;
    return saveSession(s);
  },

  async upload(file: File): Promise<UploadedPolicyDocument> {
    const doc = await readUpload(file);
    const s = loadSession();
    s.uploads = [...(s.uploads ?? []), doc];
    saveSession(s);
    return doc;
  },

  async generate(payload: {
    profile?: CompanyProfile;
    questionnaire: AIUseQuestionnaireResponse;
  }): Promise<PolicyPackage> {
    const config = effectiveConfig();
    const s = loadSession();
    // Mirror the server 403 gate exactly.
    if (!s.disclaimer.accepted || s.disclaimer.version !== config.disclaimerVersion) {
      throw new ApiError(403, "disclaimer_required", "disclaimer_required");
    }
    if (payload.profile) s.profile = payload.profile;
    s.questionnaire = payload.questionnaire;
    const pkg = generatePackage({
      sessionId: s.id,
      profile: s.profile,
      questionnaire: payload.questionnaire,
      config,
      createdAt: nowIso(),
    });
    savePackage(pkg);
    s.packageId = pkg.id;
    saveSession(s);
    return pkg;
  },

  async getPackage(id: string): Promise<PolicyPackage> {
    const pkg = loadPackage(id);
    if (!pkg) throw new ApiError(404, "not_found", "not_found");
    return pkg;
  },

  exportUrl(id: string, opts: ExportOptions): string {
    return exportBlobUrl(id, opts);
  },

  async contact(
    payload: Omit<ContactLead, "id" | "createdAt">,
  ): Promise<{ id: string }> {
    const lead: ContactLead = { ...payload, id: makeUuid(), createdAt: nowIso() };
    const leads = loadLeads();
    leads.push(lead);
    write(LEADS_KEY, leads);
    return { id: lead.id };
  },

  admin: {
    async getConfig(token: string): Promise<AdminConfig> {
      assertToken(token);
      return effectiveConfig();
    },
    async putConfig(token: string, config: AdminConfig): Promise<AdminConfig> {
      assertToken(token);
      write(ADMIN_KEY, config);
      return config;
    },
    async reset(token: string): Promise<AdminConfig> {
      assertToken(token);
      try {
        localStorage.removeItem(ADMIN_KEY);
      } catch {
        /* ignore */
      }
      return buildDefaultConfig();
    },
    async getLeads(token: string): Promise<ContactLead[]> {
      assertToken(token);
      return loadLeads();
    },
  },
};

export type Api = typeof api;

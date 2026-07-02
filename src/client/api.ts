/**
 * Typed fetch wrapper for the AI Governance Policy Builder API.
 *
 * A session id (UUID) is generated once and persisted in localStorage; it is
 * sent on every request as the `x-session-id` header so the server can scope
 * session state. Admin endpoints additionally send `x-admin-token`.
 */

import type {
  AdminConfig,
  AIUseQuestionnaireResponse,
  CompanyProfile,
  ContactLead,
  Lang,
  PolicyPackage,
  QuestionCategory,
  AdminQuestion,
  ToolCatalogEntry,
  UploadedPolicyDocument,
  UserSession,
  VendorApprovalWorkflow,
  L,
} from "../shared/index";
import type { Section } from "../shared/render";

const SESSION_KEY = "aigpb_session_id";

/** Generate a RFC4122-ish UUID (crypto when available, fallback otherwise). */
function makeUuid(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  // Fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getSessionId(): string {
  let id: string | null = null;
  try {
    id = localStorage.getItem(SESSION_KEY);
  } catch {
    id = null;
  }
  if (!id) {
    id = makeUuid();
    try {
      localStorage.setItem(SESSION_KEY, id);
    } catch {
      /* ignore storage failures (private mode) */
    }
  }
  return id;
}

/** The public config returned by GET /api/config. */
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
  translations: {
    en: Record<string, string>;
    es: Record<string, string>;
    zh?: Record<string, string>;
  };
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

async function request<T>(
  path: string,
  init: RequestInit = {},
  extraHeaders: Record<string, string> = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "x-session-id": getSessionId(),
    ...extraHeaders,
  };
  if (init.body && !(init.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`/api${path}`, { ...init, headers });
  const ct = res.headers.get("content-type") ?? "";
  const isJson = ct.includes("application/json");
  const payload: unknown = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const code =
      isJson && payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : undefined;
    throw new ApiError(res.status, code ?? `HTTP ${res.status}`, code);
  }
  return payload as T;
}

export interface ExportOptions {
  section: Section;
  format: "pdf" | "docx" | "json";
  lang: Lang;
}

export const api = {
  sessionId: getSessionId,

  getConfig(): Promise<PublicConfig> {
    return request<PublicConfig>("/config");
  },

  getSession(): Promise<UserSession> {
    return request<UserSession>("/session");
  },

  setLanguage(lang: Lang): Promise<UserSession> {
    return request<UserSession>("/session/language", {
      method: "POST",
      body: JSON.stringify({ lang }),
    });
  },

  acceptDisclaimer(lang: Lang): Promise<UserSession> {
    return request<UserSession>("/disclaimer/accept", {
      method: "POST",
      body: JSON.stringify({ accepted: true, lang }),
    });
  },

  saveProfile(profile: CompanyProfile): Promise<UserSession> {
    return request<UserSession>("/session/profile", {
      method: "POST",
      body: JSON.stringify({ profile }),
    });
  },

  upload(file: File): Promise<UploadedPolicyDocument> {
    const form = new FormData();
    form.append("file", file);
    return request<UploadedPolicyDocument>("/uploads", {
      method: "POST",
      body: form,
    });
  },

  generate(payload: {
    profile?: CompanyProfile;
    questionnaire: AIUseQuestionnaireResponse;
  }): Promise<PolicyPackage> {
    return request<PolicyPackage>("/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getPackage(id: string): Promise<PolicyPackage> {
    return request<PolicyPackage>(`/package/${encodeURIComponent(id)}`);
  },

  /** Build a direct download URL for the export endpoint (used as an <a href>). */
  exportUrl(id: string, opts: ExportOptions): string {
    const params = new URLSearchParams({
      section: opts.section,
      format: opts.format,
      lang: opts.lang,
      // Including the session id as a query param is harmless and helps any
      // server that prefers to scope exports; the export route is a plain GET.
      sid: getSessionId(),
    });
    return `/api/export/${encodeURIComponent(id)}?${params.toString()}`;
  },

  contact(payload: Omit<ContactLead, "id" | "createdAt">): Promise<{ id: string }> {
    return request<{ id: string }>("/contact", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  admin: {
    getConfig(token: string): Promise<AdminConfig> {
      return request<AdminConfig>("/admin/config", {}, { "x-admin-token": token });
    },
    putConfig(token: string, config: AdminConfig): Promise<AdminConfig> {
      return request<AdminConfig>(
        "/admin/config",
        { method: "PUT", body: JSON.stringify({ config }) },
        { "x-admin-token": token },
      );
    },
    reset(token: string): Promise<AdminConfig> {
      return request<AdminConfig>(
        "/admin/reset",
        { method: "POST" },
        { "x-admin-token": token },
      );
    },
    getLeads(token: string): Promise<ContactLead[]> {
      return request<ContactLead[]>("/admin/leads", {}, { "x-admin-token": token });
    },
  },
};

export type Api = typeof api;

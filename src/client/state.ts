/**
 * App-wide screen type, draft model and helpers to convert the questionnaire
 * draft into the shared `AIUseQuestionnaireResponse` + `CompanyProfile` shapes
 * the API/engine expect.
 */

import type {
  AdminQuestion,
  AIToolRecord,
  AIUseQuestionnaireResponse,
  AnswerValue,
  CompanyProfile,
  ToolStatus,
  PlanType,
  AccountType,
  YesNoUnknown,
} from "../shared/index";

export type Screen =
  | "welcome"
  | "disclaimer"
  | "questionnaire"
  | "summary"
  | "package"
  | "literacy"
  | "vendor"
  | "export"
  | "contact"
  | "admin";

/** The in-progress questionnaire answers, keyed by question id. */
export type AnswerMap = Record<string, AnswerValue>;
/** Per-question free-text "other" companion values. */
export type OtherMap = Record<string, string>;
/** Per-tool detailed records keyed by tool id. */
export type ToolMap = Record<string, AIToolRecord>;

export function emptyToolRecord(toolId: string, toolName: string): AIToolRecord {
  return {
    toolId,
    toolName,
    status: "unknown" as ToolStatus,
    plan: "unknown" as PlanType,
    account: "unknown" as AccountType,
    trainsOnData: "unknown" as YesNoUnknown,
    termsReviewed: "unknown" as YesNoUnknown,
    securityReviewed: "unknown" as YesNoUnknown,
  };
}

/**
 * Compose the questionnaire response sent to /api/generate. "Other" free-text
 * values are appended to their multi-select arrays so the engine can see them.
 */
export function buildQuestionnaire(
  answers: AnswerMap,
  others: OtherMap,
  tools: ToolMap,
): AIUseQuestionnaireResponse {
  const merged: AnswerMap = { ...answers };
  for (const [qid, txt] of Object.entries(others)) {
    if (!txt.trim()) continue;
    const existing = merged[qid];
    if (Array.isArray(existing)) {
      merged[qid] = [...existing, `other:${txt.trim()}`];
    }
  }
  const selectedTools = Array.isArray(answers.toolsUsed)
    ? (answers.toolsUsed as string[])
    : [];
  const toolRecords = selectedTools
    .filter((id) => tools[id])
    .map((id) => tools[id]);

  return {
    answers: merged,
    tools: toolRecords,
    completedAt: new Date().toISOString(),
  };
}

/** Derive a CompanyProfile from category-A answers (best-effort). */
export function buildProfile(answers: AnswerMap): CompanyProfile {
  const str = (k: string): string =>
    typeof answers[k] === "string" ? (answers[k] as string) : "";
  const arr = (k: string): string[] =>
    Array.isArray(answers[k]) ? (answers[k] as string[]) : [];
  const tri = (k: string): YesNoUnknown => {
    const v = answers[k];
    return v === "yes" || v === "no" ? v : "unknown";
  };
  return {
    companyName: str("companyName"),
    industry: str("industry"),
    country: str("country"),
    employees: str("employees"),
    regulatedSector: tri("regulatedSector"),
    dataTypes: arr("dataTypes"),
    governanceRoles: arr("governanceRoles"),
  };
}

/** True when all required questions have a non-empty answer. */
export function requiredComplete(
  questions: AdminQuestion[],
  answers: AnswerMap,
): boolean {
  return questions
    .filter((q) => q.required)
    .every((q) => {
      const v = answers[q.id];
      if (v == null) return false;
      if (typeof v === "string") return v.trim().length > 0;
      if (Array.isArray(v)) return v.length > 0;
      return true;
    });
}

/* ------------------------------------------------------------------ */
/* Multi-select toggle with exclusive ("None of the above") options    */
/* ------------------------------------------------------------------ */

/**
 * Toggle `value` inside a multi-select answer, honouring exclusive options:
 * selecting an exclusive option clears everything else; selecting any other
 * option clears all exclusive ones. Deselecting simply removes the value.
 */
export function applyMultiToggle(
  options: AdminQuestion["options"],
  current: string[],
  value: string,
): string[] {
  const isOn = current.includes(value);
  if (isOn) return current.filter((v) => v !== value);

  const exclusiveValues = new Set(
    (options ?? []).filter((o) => o.exclusive).map((o) => o.value),
  );
  if (exclusiveValues.has(value)) return [value];
  return [...current.filter((v) => !exclusiveValues.has(v)), value];
}

/* ------------------------------------------------------------------ */
/* Draft persistence (autosave + session recovery)                     */
/* ------------------------------------------------------------------ */

/** Minimal Storage-like contract so tests can inject a fake. */
export interface DraftStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const DRAFT_KEY = "aigpb_draft_v1";

export interface DraftState {
  lang?: string;
  accepted?: boolean;
  answers: AnswerMap;
  others: OtherMap;
  toolRecords: ToolMap;
  /** The generated package, if any, so a refresh keeps the report. */
  pkg?: unknown;
  savedAt: string;
}

function defaultStorage(): DraftStorage | null {
  try {
    if (typeof localStorage !== "undefined") return localStorage;
  } catch {
    /* SSR / privacy mode */
  }
  return null;
}

export function saveDraft(
  draft: Omit<DraftState, "savedAt">,
  storage: DraftStorage | null = defaultStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(
      DRAFT_KEY,
      JSON.stringify({ ...draft, savedAt: new Date().toISOString() }),
    );
  } catch {
    /* quota/private mode: autosave is best-effort */
  }
}

export function loadDraft(
  storage: DraftStorage | null = defaultStorage(),
): DraftState | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftState;
    if (!parsed || typeof parsed !== "object" || !parsed.answers) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearDraft(
  storage: DraftStorage | null = defaultStorage(),
): void {
  if (!storage) return;
  try {
    storage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

/** True when a draft has meaningful progress worth offering to restore. */
export function draftHasProgress(draft: DraftState | null): boolean {
  if (!draft) return false;
  return Object.keys(draft.answers ?? {}).length > 0 || draft.pkg != null;
}

/* ------------------------------------------------------------------ */
/* Generation timeout                                                  */
/* ------------------------------------------------------------------ */

/**
 * Reject with Error("generation_timeout") if `promise` takes longer than
 * `ms`. The user's answers are never touched — callers keep state intact
 * and offer a retry.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("generation_timeout")), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

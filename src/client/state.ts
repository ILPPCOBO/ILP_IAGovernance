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

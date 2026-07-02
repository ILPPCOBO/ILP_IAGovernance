/**
 * Shared test helpers and questionnaire fixtures.
 *
 * Fixtures are hand-built `AIUseQuestionnaireResponse` objects exercising the
 * rules engine in specific configurations. Each builder starts from a sparse
 * baseline and layers in only what a given test needs, so triggered findings
 * are predictable.
 */

import type {
  AIToolRecord,
  AIUseQuestionnaireResponse,
  AnswerValue,
} from "../src/shared/types";

/** A fully sparse questionnaire: no answers, no tools. */
export function emptyQuestionnaire(): AIUseQuestionnaireResponse {
  return { answers: {}, tools: [] };
}

/** Build a questionnaire from a partial answers map (+ optional tool records). */
export function makeQuestionnaire(
  answers: Record<string, AnswerValue> = {},
  tools: AIToolRecord[] = [],
): AIUseQuestionnaireResponse {
  return { answers, tools };
}

/**
 * A "rich"/well-governed questionnaire that selects every control option in
 * every scored category. Used to show the readiness score climbs with answers.
 */
export function richQuestionnaire(): AIUseQuestionnaireResponse {
  return {
    answers: {
      companyName: "Acme S.L.",
      industry: "Legal services",
      country: "Spain",
      employees: "51-200",
      regulatedSector: "yes",
      governanceRoles: ["dpo", "compliance", "legal", "itSecurity", "aiOwner"],
      aiUses: ["drafting", "summarizing", "coding"],
      toolsUsed: ["claude"],
      dataInputs: ["confidential"],
      humanReview: [
        "clientComms",
        "legalCompliance",
        "employment",
        "financial",
        "marketing",
        "codeDeploy",
        "support",
        "regulated",
      ],
      disclosure: ["internal", "clients", "public", "media", "decisions", "regulated"],
      incidentProcess: [
        "sensitiveUpload",
        "inaccurate",
        "biased",
        "hallucinated",
        "security",
        "vendorOutage",
        "unauthorizedTool",
        "misuse",
        "clientComplaint",
      ],
      vendorReview: [
        "dataProcessing",
        "training",
        "subprocessors",
        "dataLocation",
        "security",
        "retention",
        "audit",
        "incidentNotice",
        "modelChanges",
        "regulatory",
        "liability",
      ],
      training: [
        "capabilities",
        "hallucinations",
        "confidentiality",
        "personalData",
        "ip",
        "bias",
        "security",
        "promptHygiene",
        "oversight",
        "reporting",
        "approvedTools",
        "prohibited",
      ],
      restrictions: [
        "confidentialToPublic",
        "personalNoApproval",
        "finalDecisions",
        "deceptive",
        "impersonation",
        "automatedHiring",
        "surveillance",
        "noHumanReview",
        "credentials",
        "unapprovedTools",
      ],
    },
    tools: [
      {
        toolId: "claude",
        toolName: "Claude",
        status: "approved",
        plan: "enterprise",
        account: "company",
        trainsOnData: "no",
        termsReviewed: "yes",
        securityReviewed: "yes",
      },
    ],
  };
}

/** A bare tool record with sensible defaults that callers can override. */
export function toolRecord(partial: Partial<AIToolRecord> & { toolId: string }): AIToolRecord {
  return {
    toolName: partial.toolId,
    status: "unknown",
    plan: "unknown",
    account: "unknown",
    trainsOnData: "unknown",
    termsReviewed: "unknown",
    securityReviewed: "unknown",
    ...partial,
  };
}

/**
 * Shared data models for the AI Governance Policy Builder.
 *
 * Everything user-facing is bilingual. The canonical bilingual primitive is
 * `L` (a { en, es } pair). Generated packages always carry BOTH languages so
 * the same package can be rendered in either language at view/export time.
 */

export type Lang = "en" | "es" | "zh";

/**
 * A multilingual string. Every piece of generated/displayed text is an `L`.
 * `zh` is optional: renderers fall back to `en` when a Chinese translation is
 * missing, so content can never render blank.
 */
export interface L {
  en: string;
  es: string;
  zh?: string;
}

export type Severity = "low" | "medium" | "high";

/**
 * Adoption status of an AI tool inside the company ("AI tool usage status").
 * The first four are legacy values kept for backward compatibility with
 * previously saved sessions; the UI now offers the richer set below.
 */
export type ToolStatus =
  | "approved"
  | "tolerated"
  | "prohibited"
  | "unknown"
  | "in_use"
  | "pilot"
  | "pending_approval"
  | "approved_not_implemented"
  | "discarded";

export type ApprovedToolStatus =
  | "approved"
  | "conditionally_approved"
  | "prohibited"
  | "pending_review";

export type AccountType = "company" | "personal" | "mixed" | "unknown";
export type PlanType = "free" | "enterprise" | "mixed" | "unknown";
export type YesNoUnknown = "yes" | "no" | "unknown";

/* ------------------------------------------------------------------ */
/* Questionnaire definition (admin-editable)                           */
/* ------------------------------------------------------------------ */

export type QuestionType =
  | "text"
  | "number"
  | "single" // pick one option
  | "multi" // pick many options
  | "boolean" // yes / no
  | "tristate"; // yes / no / unknown

export interface QuestionOption {
  value: string;
  label: L;
  /** Optional clarifying help shown under/next to the option. */
  help?: L;
  /**
   * Exclusive options ("None of the above"-style): selecting one clears every
   * other selection in the question, and selecting any other option clears it.
   */
  exclusive?: boolean;
}

export interface AdminQuestion {
  id: string;
  /** Questionnaire category A..J */
  category: QuestionCategoryId;
  type: QuestionType;
  prompt: L;
  help?: L;
  options?: QuestionOption[];
  /** Free-text "other" companion field allowed. */
  allowOther?: boolean;
  required?: boolean;
  /** Higher weight questions move the readiness score more. */
  weight?: number;
}

export type QuestionCategoryId =
  | "A" // Company profile
  | "B" // Current AI use
  | "C" // AI tools used
  | "D" // Data & confidentiality
  | "E" // Human review
  | "F" // Disclosure rules
  | "G" // Incident reporting
  | "H" // Vendor approval
  | "I" // AI literacy & training
  | "J"; // Prohibited / restricted uses

export interface QuestionCategory {
  id: QuestionCategoryId;
  title: L;
  description: L;
}

/* ------------------------------------------------------------------ */
/* Tool catalogue                                                      */
/* ------------------------------------------------------------------ */

export interface ToolCatalogEntry {
  id: string;
  name: string; // brand names are not translated
  /** "public" SaaS chatbots vs. enterprise-capable vs. embedded etc. */
  kind: "chatbot" | "assistant" | "image" | "transcription" | "code" | "search" | "embedded" | "custom";
  /** Whether the public/free tier is generally a "public AI tool". */
  publicByDefault: boolean;
  note: L;
}

/* ------------------------------------------------------------------ */
/* Session-scoped records                                              */
/* ------------------------------------------------------------------ */

export interface LanguagePreference {
  lang: Lang;
  updatedAt: string;
}

export interface DisclaimerAcceptance {
  accepted: boolean;
  acceptedAt?: string;
  lang?: Lang;
  version: string;
}

export interface CompanyProfile {
  companyName: string;
  industry: string;
  country: string;
  employees: string; // bucketed range, e.g. "11-50"
  regulatedSector: YesNoUnknown;
  /** keys: personal, confidential, tradeSecrets, client, health, financial, legal, children */
  dataTypes: string[];
  /** keys: dpo, compliance, legal, itSecurity, aiOwner */
  governanceRoles: string[];
}

/** Per-tool record (questionnaire section C). */
export interface AIToolRecord {
  toolId: string;
  toolName: string;
  status: ToolStatus;
  plan: PlanType;
  account: AccountType;
  trainsOnData: YesNoUnknown;
  termsReviewed: YesNoUnknown;
  securityReviewed: YesNoUnknown;
}

/** Raw answers keyed by question id. */
export type AnswerValue = string | number | boolean | string[] | null;

export interface AIUseQuestionnaireResponse {
  answers: Record<string, AnswerValue>;
  tools: AIToolRecord[];
  completedAt?: string;
}

export interface UploadedPolicyDocument {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  /** Extracted text, when extraction is possible. */
  extractedText?: string;
  /** True when extraction was weak/unavailable (scan, image, binary). */
  extractionWeak: boolean;
  warning?: L;
  uploadedAt: string;
}

export interface UserSession {
  id: string;
  createdAt: string;
  updatedAt: string;
  language: LanguagePreference;
  disclaimer: DisclaimerAcceptance;
  profile?: CompanyProfile;
  questionnaire?: AIUseQuestionnaireResponse;
  uploads: UploadedPolicyDocument[];
  packageId?: string;
}

/* ------------------------------------------------------------------ */
/* Generated governance artifacts                                      */
/* ------------------------------------------------------------------ */

export interface GovernanceFinding {
  id: string;
  area: QuestionCategoryId | "general";
  severity: Severity;
  title: L;
  detail: L;
  recommendation: L;
  /** Human-readable list of which answers triggered this finding. */
  triggeredBy: string[];
}

export interface ScoreBreakdownItem {
  category: QuestionCategoryId;
  label: L;
  earned: number;
  max: number;
  notes: L;
}

export type ReadinessBand = "early" | "developing" | "structured" | "mature";

export interface ReadinessScore {
  /** 0-100 "AI governance readiness score" — NOT a compliance score. */
  value: number;
  band: ReadinessBand;
  bandLabel: L;
  summary: L;
  breakdown: ScoreBreakdownItem[];
}

export interface PolicyClause {
  id: string;
  text: L;
}

export interface PolicySection {
  id: string;
  title: L;
  clauses: PolicyClause[];
}

export interface ApprovedToolRule {
  toolId: string;
  toolName: string;
  status: ApprovedToolStatus;
  statusLabel: L;
  permittedUseCases: L;
  restrictedUseCases: L;
  dataAllowed: L;
  dataProhibited: L;
  owner: L;
  reviewDate: L;
}

export interface SensitiveDataRule {
  id: string;
  dataType: L;
  rule: L;
  severity: Severity;
}

export interface HumanReviewRow {
  context: L;
  required: boolean;
  requirement: L;
}

export interface DisclosureRule {
  context: L;
  required: boolean;
  rule: L;
}

export interface IncidentWorkflow {
  whatCounts: L[];
  reportTo: L;
  timeline: L;
  infoToInclude: L[];
  escalation: L[];
  containment: L[];
  documentation: L[];
}

export interface ChecklistItem {
  id: string;
  text: L;
  priority: boolean; // flagged as a priority gap
}

export interface VendorApprovalWorkflow {
  whenRequired: L[];
  intakeFields: L[];
  reviewSteps: L[];
  approvalRoles: L[];
  contractChecks: L[];
  reviewCadence: L;
}

export interface PolicyPackage {
  id: string;
  sessionId: string;
  createdAt: string;
  disclaimerVersion: string;
  companyName: string;
  /** Title is bilingual: "Preliminary AI Governance Policy Package". */
  title: L;
  executiveSummary: L;
  score: ReadinessScore;
  policy: PolicySection[];
  approvedTools: ApprovedToolRule[];
  sensitiveDataRules: SensitiveDataRule[];
  humanReview: HumanReviewRow[];
  disclosureRules: DisclosureRule[];
  incident: IncidentWorkflow;
  aiLiteracy: ChecklistItem[];
  vendorWorkflow: VendorApprovalWorkflow;
  findings: GovernanceFinding[];
  missingInfo: L[];
  nextSteps: L[];
  /** The conversion offer block. */
  conversion: {
    heading: L;
    body: L;
    ctas: { id: string; label: L }[];
  };
  disclaimer: L;
}

/* ------------------------------------------------------------------ */
/* Leads & admin                                                       */
/* ------------------------------------------------------------------ */

export interface ContactLead {
  id: string;
  createdAt: string;
  name: string;
  company: string;
  email: string;
  country: string;
  industry: string;
  employees: string;
  currentTools: string;
  urgency: "low" | "medium" | "high" | "";
  message: string;
  uploadedPolicyId?: string;
  sessionId?: string;
  packageId?: string;
}

/** Admin-editable policy clause library (the "template" store). */
export interface AdminPolicyTemplate {
  clauses: Record<string, L>;
}

/** Admin-editable scoring rules. */
export interface ScoringRule {
  category: QuestionCategoryId;
  label: L;
  max: number;
}

/** Admin-editable UI translation overrides. */
export interface AdminTranslation {
  en: Record<string, string>;
  es: Record<string, string>;
  zh?: Record<string, string>;
}

/** The full editable configuration the admin area can mutate. */
export interface AdminConfig {
  disclaimerVersion: string;
  disclaimer: L;
  questions: AdminQuestion[];
  categories: QuestionCategory[];
  tools: ToolCatalogEntry[];
  templates: AdminPolicyTemplate;
  scoring: ScoringRule[];
  literacy: { id: string; text: L }[];
  vendorWorkflow: VendorApprovalWorkflow;
  cta: { id: string; label: L }[];
  conversion: { heading: L; body: L };
  translations: AdminTranslation;
}

/**
 * generate-samples.ts
 *
 * Produces illustrative, PRELIMINARY mock policy packages so reviewers can see
 * what the engine emits without filling in the questionnaire by hand. It only
 * imports FROZEN shared exports (no server/client code) and writes:
 *
 *   samples/<name>.json     — the full PolicyPackage object
 *   samples/<name>.<lang>.md — renderMarkdown(pkg, lang, "full")
 *
 * Two scenarios are generated:
 *   - "mature-en": a richer answer set (governance roles, broad human review,
 *      incident process, vendor review, training, restrictions, enterprise
 *      tools) — renders in English.
 *   - "early-es": a sparse, early-stage company using public/free ChatGPT with
 *      confidential data and little governance — renders in Spanish.
 *
 * These outputs are NOT legal advice. See samples/README.md.
 *
 * Run with:  npx tsx scripts/generate-samples.ts
 */

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";

import {
  buildDefaultConfig,
  generatePackage,
  renderMarkdown,
} from "../src/shared/index";
import type {
  AIToolRecord,
  AIUseQuestionnaireResponse,
  CompanyProfile,
  GenerateInput,
  Lang,
  PolicyPackage,
} from "../src/shared/index";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "samples");

interface Scenario {
  name: string;
  lang: Lang;
  sessionId: string;
  profile: CompanyProfile;
  questionnaire: AIUseQuestionnaireResponse;
}

/* ------------------------------------------------------------------ */
/* Scenario A — "mature-en": a structured mid-size company             */
/* ------------------------------------------------------------------ */

const matureTools: AIToolRecord[] = [
  {
    toolId: "copilot",
    toolName: "Microsoft Copilot",
    status: "approved",
    plan: "enterprise",
    account: "company",
    trainsOnData: "no",
    termsReviewed: "yes",
    securityReviewed: "yes",
  },
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
  {
    toolId: "github-copilot",
    toolName: "GitHub Copilot",
    status: "tolerated",
    plan: "enterprise",
    account: "company",
    trainsOnData: "no",
    termsReviewed: "yes",
    securityReviewed: "no",
  },
];

const matureScenario: Scenario = {
  name: "mature-en",
  lang: "en",
  sessionId: "sample-mature",
  profile: {
    companyName: "Northwind Analytics",
    industry: "Professional services",
    country: "Spain",
    employees: "51-200",
    regulatedSector: "no",
    dataTypes: ["personal", "confidential", "client", "financial"],
    governanceRoles: ["dpo", "compliance", "legal", "itSecurity", "aiOwner"],
  },
  questionnaire: {
    answers: {
      companyName: "Northwind Analytics",
      industry: "Professional services",
      country: "Spain",
      employees: "51-200",
      regulatedSector: "no",
      dataTypes: ["personal", "confidential", "client", "financial"],
      governanceRoles: ["dpo", "compliance", "legal", "itSecurity", "aiOwner"],
      aiUses: [
        "drafting",
        "summarizing",
        "research",
        "marketing",
        "coding",
        "dataAnalysis",
        "knowledgeSearch",
      ],
      toolsUsed: ["copilot", "claude", "github-copilot"],
      dataInputs: ["confidential", "client", "sourceCode"],
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
      disclosure: ["internal", "clients", "public", "media", "regulated"],
      incidentProcess: [
        "sensitiveUpload",
        "inaccurate",
        "biased",
        "hallucinated",
        "security",
        "unauthorizedTool",
        "misuse",
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
        "noHumanReview",
        "credentials",
        "unapprovedTools",
      ],
    },
    tools: matureTools,
    completedAt: new Date().toISOString(),
  },
};

/* ------------------------------------------------------------------ */
/* Scenario B — "early-es": an early-stage company, little governance  */
/* ------------------------------------------------------------------ */

const earlyTools: AIToolRecord[] = [
  {
    toolId: "chatgpt",
    toolName: "ChatGPT",
    status: "tolerated",
    plan: "free",
    account: "personal",
    trainsOnData: "unknown",
    termsReviewed: "no",
    securityReviewed: "no",
  },
];

const earlyScenario: Scenario = {
  name: "early-es",
  lang: "es",
  sessionId: "sample-early",
  profile: {
    companyName: "Estudio Lumen",
    industry: "Marketing",
    country: "España",
    employees: "1-10",
    regulatedSector: "unknown",
    dataTypes: ["personal", "client", "confidential"],
    governanceRoles: [],
  },
  questionnaire: {
    answers: {
      companyName: "Estudio Lumen",
      industry: "Marketing",
      country: "España",
      employees: "1-10",
      regulatedSector: "unknown",
      dataTypes: ["personal", "client", "confidential"],
      governanceRoles: [],
      aiUses: ["drafting", "summarizing", "marketing"],
      toolsUsed: ["chatgpt"],
      dataInputs: ["personal", "client", "confidential"],
      humanReview: ["marketing"],
      disclosure: [],
      incidentProcess: [],
      vendorReview: [],
      training: [],
      restrictions: [],
    },
    tools: earlyTools,
    completedAt: new Date().toISOString(),
  },
};

/* ------------------------------------------------------------------ */
/* Generation                                                          */
/* ------------------------------------------------------------------ */

function buildPackage(scenario: Scenario): PolicyPackage {
  const config = buildDefaultConfig();
  const input: GenerateInput = {
    sessionId: scenario.sessionId,
    profile: scenario.profile,
    questionnaire: scenario.questionnaire,
    config,
    createdAt: new Date().toISOString(),
  };
  return generatePackage(input);
}

function main(): void {
  mkdirSync(OUT_DIR, { recursive: true });

  const scenarios = [matureScenario, earlyScenario];

  console.log("Generating illustrative (preliminary, non-legal-advice) sample packages…\n");

  for (const scenario of scenarios) {
    const pkg = buildPackage(scenario);

    const jsonPath = join(OUT_DIR, `${scenario.name}.json`);
    writeFileSync(jsonPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");

    const mdPath = join(OUT_DIR, `${scenario.name}.${scenario.lang}.md`);
    writeFileSync(mdPath, renderMarkdown(pkg, scenario.lang, "full"), "utf8");

    const highFindings = pkg.findings.filter((f) => f.severity === "high").length;
    console.log(
      `• ${scenario.name} (${scenario.lang}): ` +
        `readiness ${pkg.score.value}/100 — ${pkg.score.band} ` +
        `(${pkg.score.bandLabel[scenario.lang]}); ` +
        `${pkg.findings.length} finding(s), ${highFindings} high-priority.`,
    );
    console.log(`    → ${jsonPath}`);
    console.log(`    → ${mdPath}`);
  }

  console.log("\nDone. These outputs are illustrative drafts — not legal advice.");
}

main();

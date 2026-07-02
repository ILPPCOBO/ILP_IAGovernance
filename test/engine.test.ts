/**
 * Engine + rendering + scoring tests. These import shared functions directly
 * and build the package via buildDefaultConfig() + generatePackage() with
 * hand-built questionnaire fixtures.
 *
 * Covers requirements:
 *   #3  Spanish output is populated and distinct from English.
 *   #4  Sparse answers produce non-empty missingInfo.
 *   #5  Sensitive-data use -> stricter rules (finding + health clause).
 *   #6  Public tool + confidential data -> high-risk finding.
 *   #7  Missing human review -> missing-human-review finding.
 *   #8  No incident process -> no-incident-process finding.
 *   #9  No AI literacy training -> literacy flagged priority + finding.
 *   #10 Tools used but no vendor review -> no-vendor-review finding.
 *   #11 Readiness score rises with answers and stays within 0..100.
 *   #12 Score summary never claims compliance.
 *   #13 Generated policy text never contains "fully compliant".
 *   #14 Generated policy never claims to be final legal advice.
 */

import { describe, it, expect } from "vitest";
import { buildDefaultConfig } from "../src/shared/config";
import { generatePackage } from "../src/shared/rules/engine";
import { computeScore, SCORING_RULES } from "../src/shared/rules/scoring";
import { renderMarkdown, tr } from "../src/shared/render";
import type { L, PolicyPackage } from "../src/shared/types";
import {
  emptyQuestionnaire,
  makeQuestionnaire,
  richQuestionnaire,
  toolRecord,
} from "./helpers";

const config = buildDefaultConfig();

function gen(qAnswers: Record<string, unknown> = {}, tools: any[] = []): PolicyPackage {
  return generatePackage({
    sessionId: "test-session",
    questionnaire: makeQuestionnaire(qAnswers as any, tools),
    config,
    createdAt: "2026-06-25T10:00:00.000Z",
  });
}

/** Collect every bilingual `L` string of clause/summary text in the package. */
function allPolicyText(pkg: PolicyPackage): L[] {
  const out: L[] = [pkg.executiveSummary, pkg.title, pkg.score.summary];
  for (const sec of pkg.policy) {
    out.push(sec.title);
    for (const c of sec.clauses) out.push(c.text);
  }
  for (const r of pkg.sensitiveDataRules) out.push(r.rule, r.dataType);
  for (const f of pkg.findings) out.push(f.title, f.detail, f.recommendation);
  out.push(pkg.disclaimer);
  return out;
}

describe("Spanish output (#3)", () => {
  it("populates .es on title, executive summary and policy clauses", () => {
    const pkg = gen(richQuestionnaire().answers as any, richQuestionnaire().tools);
    expect(pkg.title.es.trim().length).toBeGreaterThan(0);
    expect(pkg.executiveSummary.es.trim().length).toBeGreaterThan(0);
    const clauses = pkg.policy.flatMap((s) => s.clauses);
    expect(clauses.length).toBeGreaterThan(0);
    for (const c of clauses) {
      expect(c.text.es.trim().length, `empty es clause ${c.id}`).toBeGreaterThan(0);
      expect(c.text.en.trim().length, `empty en clause ${c.id}`).toBeGreaterThan(0);
    }
  });

  it("renders distinct markdown for es vs en and includes Spanish text", () => {
    const pkg = gen(richQuestionnaire().answers as any, richQuestionnaire().tools);
    const en = renderMarkdown(pkg, "en");
    const es = renderMarkdown(pkg, "es");
    expect(es).not.toBe(en);
    // Spanish-specific words that should never appear in the English render.
    expect(es).toContain("Política");
    expect(es).toMatch(/preliminar/i);
  });
});

describe("Missing information (#4)", () => {
  it("produces a non-empty missingInfo list for a sparse questionnaire", () => {
    const pkg = gen(emptyQuestionnaire().answers as any);
    expect(pkg.missingInfo.length).toBeGreaterThan(0);
    for (const m of pkg.missingInfo) {
      expect(m.en.trim().length).toBeGreaterThan(0);
      expect(m.es.trim().length).toBeGreaterThan(0);
    }
  });

  it("shrinks missingInfo when answers are provided", () => {
    const sparse = gen(emptyQuestionnaire().answers as any);
    const rich = gen(richQuestionnaire().answers as any, richQuestionnaire().tools);
    expect(rich.missingInfo.length).toBeLessThan(sparse.missingInfo.length);
  });
});

describe("Sensitive-data use (#5)", () => {
  it("adds the sensitive-data-use finding and the health clause when health is present", () => {
    const pkg = gen({ dataInputs: ["personal", "health", "credentials"] });
    const sensitiveFinding = pkg.findings.find((f) => f.id === "sensitive-data-use");
    expect(sensitiveFinding).toBeDefined();
    // health/credentials => high severity
    expect(sensitiveFinding!.severity).toBe("high");

    const sensitiveSection = pkg.policy.find((s) => s.id === "sensitiveData");
    expect(sensitiveSection).toBeDefined();
    const clauseIds = sensitiveSection!.clauses.map((c) => c.id);
    expect(clauseIds).toContain("sensitiveData.base");
    expect(clauseIds).toContain("sensitiveData.health");
  });

  it("does not add the health clause when health is absent", () => {
    const pkg = gen({ dataInputs: ["confidential"] });
    const sensitiveSection = pkg.policy.find((s) => s.id === "sensitiveData")!;
    const clauseIds = sensitiveSection.clauses.map((c) => c.id);
    expect(clauseIds).toContain("sensitiveData.base");
    expect(clauseIds).not.toContain("sensitiveData.health");
    // still flags sensitive use generally
    expect(pkg.findings.some((f) => f.id === "sensitive-data-use")).toBe(true);
  });
});

describe("Public AI tool + confidential data (#6)", () => {
  it("produces the public-tool-confidential finding at high severity", () => {
    // chatgpt is publicByDefault; selected in toolsUsed with no enterprise record.
    const pkg = gen({ dataInputs: ["confidential", "client"], toolsUsed: ["chatgpt"] });
    const finding = pkg.findings.find((f) => f.id === "public-tool-confidential");
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("high");
  });

  it("also triggers via a free-plan public tool record", () => {
    const pkg = gen(
      { dataInputs: ["personal"], toolsUsed: ["chatgpt"] },
      [toolRecord({ toolId: "chatgpt", toolName: "ChatGPT", plan: "free" })],
    );
    expect(pkg.findings.some((f) => f.id === "public-tool-confidential")).toBe(true);
  });
});

describe("Missing human review (#7)", () => {
  it("flags missing-human-review in high-impact contexts", () => {
    const pkg = gen({ humanReview: [] });
    expect(pkg.findings.some((f) => f.id === "missing-human-review")).toBe(true);
  });

  it("does not flag when all high-impact contexts are covered", () => {
    const pkg = gen({
      humanReview: ["clientComms", "legalCompliance", "employment", "financial", "regulated"],
    });
    expect(pkg.findings.some((f) => f.id === "missing-human-review")).toBe(false);
  });
});

describe("No incident process (#8)", () => {
  it("flags no-incident-process when no reporting process is selected", () => {
    const pkg = gen({ incidentProcess: [] });
    const finding = pkg.findings.find((f) => f.id === "no-incident-process");
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("high");
  });
});

describe("No AI literacy training (#9)", () => {
  it("flags every literacy item as priority and emits no-ai-literacy", () => {
    const pkg = gen({ training: [] });
    expect(pkg.aiLiteracy.length).toBeGreaterThan(0);
    expect(pkg.aiLiteracy.every((i) => i.priority)).toBe(true);
    expect(pkg.aiLiteracy.some((i) => i.priority)).toBe(true);
    expect(pkg.findings.some((f) => f.id === "no-ai-literacy")).toBe(true);
  });
});

describe("Tools used but no vendor review (#10)", () => {
  it("flags no-vendor-review", () => {
    const pkg = gen({ toolsUsed: ["chatgpt"], vendorReview: [] });
    expect(pkg.findings.some((f) => f.id === "no-vendor-review")).toBe(true);
  });

  it("does not flag when no tools are recorded", () => {
    const pkg = gen({ toolsUsed: [], vendorReview: [] });
    expect(pkg.findings.some((f) => f.id === "no-vendor-review")).toBe(false);
  });
});

describe("Readiness score (#11)", () => {
  it("rises with a richer answer set and stays within 0..100", () => {
    const empty = computeScore(emptyQuestionnaire(), SCORING_RULES);
    const rich = computeScore(richQuestionnaire(), SCORING_RULES);
    expect(empty.value).toBeGreaterThanOrEqual(0);
    expect(empty.value).toBeLessThanOrEqual(100);
    expect(rich.value).toBeGreaterThanOrEqual(0);
    expect(rich.value).toBeLessThanOrEqual(100);
    expect(rich.value).toBeGreaterThan(empty.value);
  });

  it("flows the score into the generated package", () => {
    const pkg = gen(richQuestionnaire().answers as any, richQuestionnaire().tools);
    expect(pkg.score.value).toBeGreaterThanOrEqual(0);
    expect(pkg.score.value).toBeLessThanOrEqual(100);
    expect(pkg.score.breakdown.length).toBeGreaterThan(0);
  });
});

describe("Score never claims compliance (#12)", () => {
  it("score summary avoids compliance claims in both languages", () => {
    const pkg = gen(richQuestionnaire().answers as any, richQuestionnaire().tools);
    const en = pkg.score.summary.en.toLowerCase();
    const es = pkg.score.summary.es.toLowerCase();

    expect(en).not.toContain("fully compliant");
    expect(es).not.toContain("cumplimiento legal completo");

    // and it actively states it is NOT a compliance measure
    expect(en).toContain("not a measure of legal compliance");
    expect(es).toContain("no es una medida de cumplimiento legal");
  });

  it("the summary contract holds even for an empty questionnaire", () => {
    const score = computeScore(emptyQuestionnaire(), SCORING_RULES);
    expect(score.summary.en.toLowerCase()).not.toContain("fully compliant");
    expect(score.summary.en.toLowerCase()).toContain("not a measure of legal compliance");
  });
});

describe('Generated policy never says "fully compliant" (#13)', () => {
  it("scans all clause text, summary and findings (en + es)", () => {
    // exercise a broad fixture so many conditional clauses are present
    const pkg = gen({
      regulatedSector: "yes",
      dataInputs: ["personal", "health", "credentials", "confidential"],
      toolsUsed: ["chatgpt", "github-copilot", "midjourney"],
      aiUses: ["coding", "media"],
      restrictions: ["confidentialToPublic", "finalDecisions", "automatedHiring"],
      humanReview: [],
      incidentProcess: [],
      training: [],
      vendorReview: [],
    }, [
      toolRecord({ toolId: "chatgpt", toolName: "ChatGPT", plan: "free", account: "personal", status: "tolerated" }),
    ]);

    for (const text of allPolicyText(pkg)) {
      expect(text.en.toLowerCase(), `en: ${text.en}`).not.toContain("fully compliant");
      expect(text.es.toLowerCase(), `es: ${text.es}`).not.toContain("cumplimiento legal completo");
    }
  });
});

describe("Generated policy never claims final legal advice (#14)", () => {
  it("rendered markdown denies being legal advice and never asserts it is final legal advice", () => {
    const pkg = gen(richQuestionnaire().answers as any, richQuestionnaire().tools);
    const md = renderMarkdown(pkg, "en").toLowerCase();
    expect(md).not.toContain("is final legal advice");
    expect(md).toContain("not legal advice");
  });

  it("the disclaimer itself denies legal-advice status in both languages", () => {
    const pkg = gen(richQuestionnaire().answers as any, richQuestionnaire().tools);
    expect(tr(pkg.disclaimer, "en").toLowerCase()).toContain("not legal advice");
    expect(tr(pkg.disclaimer, "es").toLowerCase()).toContain("no constituye asesoramiento jurídico");
    // no clause asserts the output IS final legal advice
    for (const text of allPolicyText(pkg)) {
      expect(text.en.toLowerCase()).not.toContain("is final legal advice");
      expect(text.es.toLowerCase()).not.toContain("es asesoramiento jurídico final");
    }
  });
});

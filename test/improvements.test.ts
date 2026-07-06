/**
 * Tests for the UX/content improvements layered over the existing flow:
 *
 *  1. Tool usage-status question relabelled (EN/ES) + help text (EN/ES/ZH).
 *  2. dataInputs gains an exclusive "None of the above" option.
 *  3. dataInputs gains an "Anonymized or pseudonymized data" option.
 *  4/5. applyMultiToggle honours exclusive options both ways.
 *  6. Credentials option relabelled with clarifying help.
 *  7/8. incidentProcess gains an exclusive "no process" option + help.
 *  9. Engine findings/scoring for noProcess / anonymized / none answers.
 * 10. Loading-state strings exist while the report generates.
 * 11. Generation failure (timeout) never loses saved progress.
 * 12. Refresh recovery via the localStorage draft.
 * 13. ErrorBoundary sets fallback state instead of a blank screen.
 * 14. Back-to-questionnaire affordance in all languages.
 * 15. PDF download is discoverable.
 * 16. ILP popup can be closed without losing the report.
 * 17. Every new UI label exists in BOTH es and en.
 * 18. Language switch does not erase answers (draft is language-independent).
 * 19. Generated package carries all languages, so it survives a language change.
 * 20. README documents the new options and the draft storage key.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  buildDefaultConfig,
  generatePackage,
  computeScore,
  t,
  UI,
  QUESTIONS,
} from "../src/shared/index";
import type { AdminQuestion, Lang, PolicyPackage } from "../src/shared/index";
import {
  applyMultiToggle,
  saveDraft,
  loadDraft,
  clearDraft,
  draftHasProgress,
  withTimeout,
  DRAFT_KEY,
} from "../src/client/state";
import type { DraftStorage } from "../src/client/state";
import { ErrorBoundary } from "../src/client/components/ErrorBoundary";

const LANGS: Lang[] = ["en", "es", "zh"];

/** In-memory Storage fake so draft tests never touch real localStorage. */
function makeStorage(): DraftStorage {
  const mem = new Map<string, string>();
  return {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => {
      mem.set(k, v);
    },
    removeItem: (k: string) => {
      mem.delete(k);
    },
  };
}

function question(id: string): AdminQuestion {
  const q = QUESTIONS.find((x) => x.id === id);
  if (!q) throw new Error(`question ${id} not found in QUESTIONS`);
  return q;
}

function option(q: AdminQuestion, value: string) {
  const opt = (q.options ?? []).find((o) => o.value === value);
  if (!opt) throw new Error(`option ${value} not found on question ${q.id}`);
  return opt;
}

/** Minimal package generation with sparse answers (the engine tolerates gaps). */
function gen(answers: Record<string, string | string[]>): PolicyPackage {
  return generatePackage({
    sessionId: "t",
    questionnaire: { answers, tools: [] },
    config: buildDefaultConfig(),
    createdAt: new Date().toISOString(),
  });
}

/* ------------------------------------------------------------------ */
/* 1. Tool usage-status question relabelled + help                     */
/* ------------------------------------------------------------------ */

describe("1. tool usage-status question is relabelled with help text", () => {
  it('uses "Estado de uso de la herramienta de IA" / "AI tool usage status"', () => {
    expect(t("es", "q.tool.status")).toBe("Estado de uso de la herramienta de IA");
    expect(t("en", "q.tool.status")).toBe("AI tool usage status");
  });

  it("has a non-empty help text in en, es and zh", () => {
    expect(UI.en["q.tool.statusHelp"]).toBeTypeOf("string");
    expect(UI.en["q.tool.statusHelp"].length).toBeGreaterThan(0);
    expect(UI.es["q.tool.statusHelp"]).toBeTypeOf("string");
    expect(UI.es["q.tool.statusHelp"].length).toBeGreaterThan(0);
    expect(UI.zh["q.tool.statusHelp"]).toBeTypeOf("string");
    expect(UI.zh["q.tool.statusHelp"].length).toBeGreaterThan(0);
  });
});

/* ------------------------------------------------------------------ */
/* 2-3. New dataInputs options                                         */
/* ------------------------------------------------------------------ */

describe('2. dataInputs includes a "None of the above" option', () => {
  it('has option "none" labelled correctly in es and en', () => {
    const none = option(question("dataInputs"), "none");
    expect(none.label.es).toBe("Ninguno de los anteriores");
    expect(none.label.en).toBe("None of the above");
  });
});

describe('3. dataInputs includes an "Anonymized or pseudonymized data" option', () => {
  it('has option "anonymized" labelled correctly in es and en', () => {
    const anonymized = option(question("dataInputs"), "anonymized");
    expect(anonymized.label.es).toBe("Datos anonimizados o seudonimizados");
    expect(anonymized.label.en).toBe("Anonymized or pseudonymized data");
  });
});

/* ------------------------------------------------------------------ */
/* 4-5. Exclusive multi-select toggling on dataInputs                  */
/* ------------------------------------------------------------------ */

describe("4-5. applyMultiToggle exclusivity on dataInputs", () => {
  const opts = question("dataInputs").options;

  it('toggling "none" on clears every other selection', () => {
    expect(applyMultiToggle(opts, ["personal", "client"], "none")).toEqual(["none"]);
  });

  it('toggling a normal option on clears the exclusive "none"', () => {
    expect(applyMultiToggle(opts, ["none"], "personal")).toEqual(["personal"]);
  });
});

/* ------------------------------------------------------------------ */
/* 6. Credentials option relabelled + help                             */
/* ------------------------------------------------------------------ */

describe("6. credentials option is relabelled and explained", () => {
  it("has the new en/es labels and a non-empty en+es help", () => {
    const credentials = option(question("dataInputs"), "credentials");
    expect(credentials.label.en).toBe("Credentials, passwords, tokens or API keys");
    expect(credentials.label.es).toBe("Credenciales, contraseñas, tokens o claves API");
    expect(credentials.help).toBeDefined();
    expect(credentials.help!.en.trim().length).toBeGreaterThan(0);
    expect(credentials.help!.es.trim().length).toBeGreaterThan(0);
  });
});

/* ------------------------------------------------------------------ */
/* 7-8. incidentProcess "noProcess" exclusive option + help            */
/* ------------------------------------------------------------------ */

describe('7. incidentProcess includes an exclusive "noProcess" option and question help', () => {
  const incidentQ = question("incidentProcess");

  it('has option "noProcess" with the exact es/en labels', () => {
    const noProcess = option(incidentQ, "noProcess");
    expect(noProcess.label.es).toBe(
      "No contamos actualmente con un proceso de reporte de incidentes",
    );
    expect(noProcess.label.en).toBe(
      "We do not currently have an incident reporting process",
    );
  });

  it('"noProcess" is exclusive', () => {
    expect(option(incidentQ, "noProcess").exclusive).toBe(true);
  });

  it("the question has help in en and es", () => {
    expect(incidentQ.help).toBeDefined();
    expect(incidentQ.help!.en.trim().length).toBeGreaterThan(0);
    expect(incidentQ.help!.es.trim().length).toBeGreaterThan(0);
  });
});

describe("8. applyMultiToggle exclusivity on incidentProcess", () => {
  const opts = question("incidentProcess").options;

  it('toggling "noProcess" on clears the other selections', () => {
    expect(applyMultiToggle(opts, ["security", "misuse"], "noProcess")).toEqual([
      "noProcess",
    ]);
  });

  it('toggling a control on clears the exclusive "noProcess"', () => {
    expect(applyMultiToggle(opts, ["noProcess"], "security")).toEqual(["security"]);
  });
});

/* ------------------------------------------------------------------ */
/* 9. Engine findings + scoring for the new answers                    */
/* ------------------------------------------------------------------ */

describe("9. engine handles noProcess / anonymized / none answers", () => {
  it('incidentProcess ["noProcess"] yields a high-severity no-incident-process finding', () => {
    const pkg = gen({ incidentProcess: ["noProcess"], toolsUsed: [] });
    const finding = pkg.findings.find((f) => f.id === "no-incident-process");
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("high");
    expect(finding!.recommendation.es).toContain("canal interno de reporte");
  });

  it('incidentProcess ["noProcess"] earns 0 points in scoring category G', () => {
    const score = computeScore({
      answers: { incidentProcess: ["noProcess"], toolsUsed: [] },
      tools: [],
    });
    const g = score.breakdown.find((b) => b.category === "G");
    expect(g).toBeDefined();
    expect(g!.earned).toBe(0);
    expect(g!.max).toBeGreaterThan(0);
  });

  it('dataInputs ["anonymized"] yields the anonymized-data finding', () => {
    const pkg = gen({ dataInputs: ["anonymized"], toolsUsed: [] });
    const finding = pkg.findings.find((f) => f.id === "anonymized-data");
    expect(finding).toBeDefined();
    expect(finding!.detail.es).toContain("anonimizados o seudonimizados");
  });

  it('dataInputs ["none"] yields the no-sensitive-data-identified finding', () => {
    const pkg = gen({ dataInputs: ["none"], toolsUsed: [] });
    const finding = pkg.findings.find((f) => f.id === "no-sensitive-data-identified");
    expect(finding).toBeDefined();
    expect(finding!.detail.es).toBe(
      "La empresa no ha identificado el uso de las categorías de datos sensibles listadas en esta sección.",
    );
  });
});

/* ------------------------------------------------------------------ */
/* 10. Loading-state strings                                           */
/* ------------------------------------------------------------------ */

describe("10. loading-state strings exist for report generation", () => {
  it('shows "Generando informe preliminar…" in es and non-empty en/zh', () => {
    expect(t("es", "gen.loading.title")).toBe("Generando informe preliminar…");
    expect(t("en", "gen.loading.title").trim().length).toBeGreaterThan(0);
    expect(t("zh", "gen.loading.title").trim().length).toBeGreaterThan(0);
  });
});

/* ------------------------------------------------------------------ */
/* 11. Generation failure keeps progress                               */
/* ------------------------------------------------------------------ */

describe("11. a failed/timed-out generation never loses saved progress", () => {
  it('withTimeout rejects with "generation_timeout" on a hung promise', async () => {
    await expect(
      withTimeout(new Promise<never>(() => {}), 50),
    ).rejects.toThrow("generation_timeout");
  });

  it("the saved draft is intact after a simulated generation failure", async () => {
    const storage = makeStorage();
    saveDraft(
      {
        answers: { companyName: "Acme", incidentProcess: ["noProcess"] },
        others: {},
        toolRecords: {},
        accepted: true,
        lang: "es",
      },
      storage,
    );

    // Simulate the generation call hanging until the timeout fires.
    let failed = false;
    try {
      await withTimeout(new Promise<never>(() => {}), 50);
    } catch (e) {
      failed = true;
      expect((e as Error).message).toBe("generation_timeout");
    }
    expect(failed).toBe(true);

    const draft = loadDraft(storage);
    expect(draft).not.toBeNull();
    expect(draft!.answers.companyName).toBe("Acme");
    expect(draft!.answers.incidentProcess).toEqual(["noProcess"]);
  });
});

/* ------------------------------------------------------------------ */
/* 12. Refresh recovery                                                */
/* ------------------------------------------------------------------ */

describe("12. refresh recovery via the draft storage", () => {
  it("saves under the versioned key, restores answers, and clears cleanly", () => {
    const storage = makeStorage();
    saveDraft(
      {
        answers: { companyName: "X" },
        others: {},
        toolRecords: {},
        accepted: true,
        lang: "es",
      },
      storage,
    );

    expect(storage.getItem(DRAFT_KEY)).not.toBeNull();

    const draft = loadDraft(storage);
    expect(draft).not.toBeNull();
    expect(draft!.answers).toEqual({ companyName: "X" });
    expect(draft!.accepted).toBe(true);
    expect(draft!.lang).toBe("es");
    expect(draftHasProgress(draft)).toBe(true);

    clearDraft(storage);
    expect(loadDraft(storage)).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* 13. ErrorBoundary fallback state                                    */
/* ------------------------------------------------------------------ */

describe("13. ErrorBoundary swaps to fallback state instead of a blank screen", () => {
  it("getDerivedStateFromError returns { hasError: true }", () => {
    expect(ErrorBoundary.getDerivedStateFromError(new Error("boom"))).toEqual({
      hasError: true,
    });
  });
});

/* ------------------------------------------------------------------ */
/* 14. Back-to-questionnaire affordance                                */
/* ------------------------------------------------------------------ */

describe("14. back-to-questionnaire action exists in every language", () => {
  it("actions.back is non-empty in en/es/zh and exact in es", () => {
    for (const lang of LANGS) {
      expect(t(lang, "actions.back").trim().length).toBeGreaterThan(0);
    }
    expect(t("es", "actions.back")).toBe("Volver al cuestionario");
  });
});

/* ------------------------------------------------------------------ */
/* 15. PDF discoverability                                             */
/* ------------------------------------------------------------------ */

describe("15. PDF download is discoverable", () => {
  it('labels the button "Descargar PDF" / "Download PDF"', () => {
    expect(t("es", "actions.pdf")).toBe("Descargar PDF");
    expect(t("en", "actions.pdf")).toBe("Download PDF");
  });

  it("the ready message points at the PDF button", () => {
    expect(t("es", "actions.ready")).toContain("Descargar PDF");
  });
});

/* ------------------------------------------------------------------ */
/* 16. Popup closes without losing the report                          */
/* ------------------------------------------------------------------ */

describe("16. ILP popup can be closed without losing the report", () => {
  it('offers "Volver al informe" and promises that results are preserved', () => {
    expect(t("es", "ilp.modal.backToReport")).toBe("Volver al informe");
    expect(t("es", "ilp.modal.subtitle")).toContain("se conservarán");
  });
});

/* ------------------------------------------------------------------ */
/* 17. All new labels exist in BOTH es and en                          */
/* ------------------------------------------------------------------ */

describe("17. every new UI label exists in both es and en", () => {
  const keys = [
    "q.tool.status",
    "q.tool.statusHelp",
    "status.inUse",
    "status.pilot",
    "status.pendingApproval",
    "status.approvedNotImplemented",
    "status.discarded",
    "resume.title",
    "resume.continue",
    "resume.restart",
    "gen.loading.title",
    "gen.error.retry",
    "actions.pdf",
    "actions.word",
    "actions.back",
    "actions.edit",
    "q.saveProgress",
  ];

  it.each(keys)("%s is a non-empty string in en and es", (key) => {
    expect(UI.en[key]).toBeTypeOf("string");
    expect(UI.en[key].trim().length).toBeGreaterThan(0);
    expect(UI.es[key]).toBeTypeOf("string");
    expect(UI.es[key].trim().length).toBeGreaterThan(0);
  });
});

/* ------------------------------------------------------------------ */
/* 18. Language switch does not erase answers                          */
/* ------------------------------------------------------------------ */

describe("18. the draft model is language-independent", () => {
  it("re-saving the same answers with another lang leaves the answers unchanged", () => {
    const storage = makeStorage();
    const answers = { companyName: "Acme", dataInputs: ["anonymized"] };

    saveDraft({ answers, others: {}, toolRecords: {}, accepted: true, lang: "en" }, storage);
    saveDraft({ answers, others: {}, toolRecords: {}, accepted: true, lang: "es" }, storage);

    const draft = loadDraft(storage);
    expect(draft).not.toBeNull();
    expect(draft!.lang).toBe("es");
    expect(draft!.answers).toEqual(answers);
  });
});

/* ------------------------------------------------------------------ */
/* 19. Report survives a language change                               */
/* ------------------------------------------------------------------ */

describe("19. the generated package carries every language", () => {
  it("executiveSummary has non-empty en, es and zh", () => {
    const pkg = gen({
      companyName: "Acme",
      incidentProcess: ["noProcess"],
      dataInputs: ["anonymized"],
      toolsUsed: [],
    });
    expect(pkg.executiveSummary.en.trim().length).toBeGreaterThan(0);
    expect(pkg.executiveSummary.es.trim().length).toBeGreaterThan(0);
    expect((pkg.executiveSummary.zh ?? "").trim().length).toBeGreaterThan(0);
  });
});

/* ------------------------------------------------------------------ */
/* 20. README documents the new options                                */
/* ------------------------------------------------------------------ */

describe("20. README documents the new options and the draft key", () => {
  it("mentions each new option and the aigpb_draft_v1 storage key", () => {
    const readme = readFileSync(
      "/Users/williamhuang/ai-governance-policy-builder/README.md",
      "utf8",
    );
    expect(readme).toContain("None of the above");
    expect(readme).toContain("Anonymized or pseudonymized data");
    expect(readme).toContain("Credentials, passwords, tokens or API keys");
    expect(readme).toContain("incident reporting process");
    expect(readme).toContain("aigpb_draft_v1");
  });
});

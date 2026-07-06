import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  AdminConfig,
  AIToolRecord,
  AnswerValue,
  Lang,
  PolicyPackage,
  UploadedPolicyDocument,
} from "../shared/index";
import { api, ApiError, PublicConfig } from "./api";
import {
  LanguageContext,
  TranslationOverrides,
  useT,
} from "./i18n/useT";
import {
  AnswerMap,
  OtherMap,
  Screen,
  ToolMap,
  buildProfile,
  buildQuestionnaire,
  clearDraft,
  draftHasProgress,
  loadDraft,
  requiredComplete,
  saveDraft,
  withTimeout,
} from "./state";
import { CenterLoading, Toast } from "./components/ui";
import {
  ILP_CONTACT,
  ILPContactModal,
  ILPFloatButton,
  ILPLogo,
} from "./components/ILPBrand";
import { Welcome } from "./screens/Welcome";
import { Disclaimer } from "./screens/Disclaimer";
import { Questionnaire, Stepper } from "./screens/Questionnaire";
import { Summary } from "./screens/Summary";
import { Package } from "./screens/Package";
import { Literacy } from "./screens/Literacy";
import { Vendor } from "./screens/Vendor";
import { Export } from "./screens/Export";
import { Contact } from "./screens/Contact";
import { Admin } from "./screens/Admin";

const EMPTY_OVERRIDES: TranslationOverrides = { en: {}, es: {}, zh: {} };

export default function App(): React.ReactElement {
  const [lang, setLangState] = useState<Lang>("en");
  const [overrides, setOverrides] = useState<TranslationOverrides>(EMPTY_OVERRIDES);
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [loadError, setLoadError] = useState(false);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    void api.setLanguage(next).catch(() => undefined);
  }, []);

  // Keep the document language attribute in sync for accessibility.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Initial bootstrap: load public config + session.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cfg, session] = await Promise.all([api.getConfig(), api.getSession()]);
        if (cancelled) return;
        setConfig(cfg);
        setOverrides({
          en: cfg.translations?.en ?? {},
          es: cfg.translations?.es ?? {},
          zh: cfg.translations?.zh ?? {},
        });
        if (session.language?.lang) setLangState(session.language.lang);
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const ctxValue = useMemo(
    () => ({ lang, setLang, overrides }),
    [lang, setLang, overrides],
  );

  if (loadError) {
    return (
      <LanguageContext.Provider value={ctxValue}>
        <div className="center-load">Something went wrong loading the app.</div>
      </LanguageContext.Provider>
    );
  }

  if (!config) {
    return (
      <LanguageContext.Provider value={ctxValue}>
        <CenterLoading label="Loading…" />
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={ctxValue}>
      <Shell
        config={config}
        onConfigOverride={(cfg) => {
          setConfig((prev) => ({
            ...(prev as PublicConfig),
            disclaimer: cfg.disclaimer,
            disclaimerVersion: cfg.disclaimerVersion,
            questions: cfg.questions,
            categories: cfg.categories,
            tools: cfg.tools,
            literacy: cfg.literacy,
            vendorWorkflow: cfg.vendorWorkflow,
            conversion: cfg.conversion,
            cta: cfg.cta,
            translations: cfg.translations,
          }));
          setOverrides({
            en: cfg.translations?.en ?? {},
            es: cfg.translations?.es ?? {},
            zh: cfg.translations?.zh ?? {},
          });
        }}
      />
    </LanguageContext.Provider>
  );
}

/* ------------------------------------------------------------------ shell */

function Shell(props: {
  config: PublicConfig;
  onConfigOverride: (cfg: AdminConfig) => void;
}): React.ReactElement {
  const { config } = props;
  const { t, tr, lang, setLang } = useT();

  const [screen, setScreen] = useState<Screen>("welcome");
  const [accepted, setAccepted] = useState(false);

  // questionnaire draft
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [others, setOthers] = useState<OtherMap>({});
  const [toolRecords, setToolRecords] = useState<ToolMap>({});
  const [uploads, setUploads] = useState<UploadedPolicyDocument[]>([]);
  // Current questionnaire category index — lifted here so the stepper can
  // jump to a category without the Questionnaire losing any answers.
  const [qStep, setQStep] = useState(0);

  // generated artifacts
  const [pkg, setPkg] = useState<PolicyPackage | null>(null);
  const [clauseEdits, setClauseEdits] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState(false);

  // draft recovery banner + guard so autosave never runs before restore
  const [resumeOpen, setResumeOpen] = useState(false);
  const restoredRef = useRef(false);

  const [toast, setToast] = useState<{ msg: string; variant?: "error" | "info" } | null>(
    null,
  );
  const [ctaPreset, setCtaPreset] = useState<string | null>(null);

  // ILP contact popup: shown once, automatically, when the user finishes —
  // i.e. the first time they open their generated policy package.
  const [ilpOpen, setIlpOpen] = useState(false);
  const ilpAutoShown = useRef(false);
  useEffect(() => {
    if (screen === "package" && pkg && !ilpAutoShown.current) {
      ilpAutoShown.current = true;
      const timer = window.setTimeout(() => setIlpOpen(true), 1400);
      return () => window.clearTimeout(timer);
    }
  }, [screen, pkg]);

  const showToast = useCallback((msg: string, variant?: "error" | "info") => {
    setToast({ msg, variant });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  // B. RECOVERY — restore the autosaved draft once, on mount. Runs before the
  // autosave effect below (declaration order), so nothing is saved earlier.
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const draft = loadDraft();
    if (!draft || !draftHasProgress(draft)) return;
    setAnswers(draft.answers ?? {});
    setOthers(draft.others ?? {});
    setToolRecords(draft.toolRecords ?? {});
    if (draft.pkg) setPkg(draft.pkg as PolicyPackage);
    if (draft.accepted) setAccepted(true);
    if (draft.lang === "en" || draft.lang === "es" || draft.lang === "zh") {
      setLang(draft.lang);
    }
    setResumeOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A. AUTOSAVE — debounced draft persistence whenever the draft changes.
  useEffect(() => {
    if (!restoredRef.current) return;
    const timer = window.setTimeout(() => {
      saveDraft({ lang, accepted, answers, others, toolRecords, pkg });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [lang, accepted, answers, others, toolRecords, pkg]);

  const resumeContinue = () => {
    setResumeOpen(false);
    setScreen(pkg ? "package" : "questionnaire");
  };

  const resumeRestart = () => {
    clearDraft();
    setAnswers({});
    setOthers({});
    setToolRecords({});
    setPkg(null);
    setClauseEdits({});
    setAccepted(false);
    setQStep(0);
    setGenError(false);
    setResumeOpen(false);
    setScreen("welcome");
  };

  const handleSaveProgress = () => {
    saveDraft({ lang, accepted, answers, others, toolRecords, pkg });
    showToast(t("q.savedToast"));
  };

  // F (part of D+F). Offline escape hatch: download the raw draft as JSON.
  const downloadAnswersJson = () => {
    const blob = new Blob(
      [JSON.stringify({ answers, others, toolRecords }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "answers.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Sync accepted state from session on mount.
  useEffect(() => {
    (async () => {
      try {
        const session = await api.getSession();
        if (
          session.disclaimer?.accepted &&
          session.disclaimer.version === config.disclaimerVersion
        ) {
          setAccepted(true);
        }
      } catch {
        /* ignore */
      }
    })();
  }, [config.disclaimerVersion]);

  const setAnswer = (id: string, value: AnswerValue) =>
    setAnswers((a) => ({ ...a, [id]: value }));
  const setOther = (id: string, value: string) =>
    setOthers((o) => ({ ...o, [id]: value }));
  const setToolRecord = (id: string, rec: AIToolRecord) =>
    setToolRecords((tr2) => ({ ...tr2, [id]: rec }));
  const addUpload = (doc: UploadedPolicyDocument) =>
    setUploads((u) => [...u, doc]);

  const acceptDisclaimer = async () => {
    try {
      await api.acceptDisclaimer(lang);
      setAccepted(true);
      setScreen("questionnaire");
    } catch {
      showToast(t("common.error"), "error");
    }
  };

  // Persist clause edit for the current language and the package title context.
  const editClause = (clauseId: string, text: string) =>
    setClauseEdits((e) => ({ ...e, [clauseId]: text }));

  const generate = async () => {
    // Mirror the server 403 gate: block generation without acceptance.
    if (!accepted) {
      showToast(t("disclaimer.mustAccept"), "error");
      setScreen("disclaimer");
      return;
    }
    if (!requiredComplete(config.questions, answers)) {
      showToast(t("common.error"), "error");
      return;
    }
    setGenError(false);
    setGenerating(true);
    // C. Enforce a minimum overlay display so the loading state never flashes.
    const startedAt = Date.now();
    const settleMinDelay = (): Promise<void> => {
      const remaining = 600 - (Date.now() - startedAt);
      return remaining > 0
        ? new Promise((resolve) => setTimeout(resolve, remaining))
        : Promise.resolve();
    };
    try {
      const questionnaire = buildQuestionnaire(answers, others, toolRecords);
      const profile = buildProfile(answers);
      // D+F. Hard 20s cap so a hung request surfaces as a retryable error.
      const result = await withTimeout(
        api.generate({ profile, questionnaire }),
        20000,
      );
      await settleMinDelay();
      setPkg(result);
      setClauseEdits({});
      setScreen("summary");
      showToast(t("actions.ready"));
    } catch (err) {
      await settleMinDelay();
      if (err instanceof ApiError && err.status === 403) {
        showToast(t("disclaimer.mustAccept"), "error");
        setAccepted(false);
        setScreen("disclaimer");
      } else {
        // Any other failure (incl. timeout): keep the screen and every answer
        // intact and show the prominent retry panel instead.
        setGenError(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } finally {
      setGenerating(false);
    }
  };

  // Reset clause edits when language changes (edits are language-specific text).
  useEffect(() => {
    setClauseEdits({});
  }, [lang]);

  const handleCta = (id: string) => {
    setCtaPreset(id);
    setScreen("contact");
  };

  const go = (s: Screen) => {
    // Guard generation-gated screens.
    if ((s === "summary" || s === "package" || s === "export") && !pkg) {
      setScreen(answers && Object.keys(answers).length ? "questionnaire" : "welcome");
      return;
    }
    setScreen(s);
  };

  /* ------------------------------------------------ 6-step journey stepper */

  const stepperLabels = [
    t("stepper.company"), // A
    t("stepper.tools"), // B + C
    t("stepper.data"), // D
    t("stepper.processes"), // E..J
    t("stepper.review"), // summary screen
    t("stepper.report"), // package screen
  ];

  const catGroup = (id: string): number =>
    id === "A" ? 0 : id === "B" || id === "C" ? 1 : id === "D" ? 2 : 3;

  const firstCatIndexOfGroup = (group: number): number =>
    config.categories.findIndex((c) => catGroup(c.id) === group);

  const clampedQStep = Math.max(
    0,
    Math.min(qStep, config.categories.length - 1),
  );

  const stepperCurrent =
    screen === "summary"
      ? 4
      : screen === "package" ||
          screen === "literacy" ||
          screen === "vendor" ||
          screen === "export"
        ? 5
        : catGroup(config.categories[clampedQStep]?.id ?? "A");

  // Previous steps are always revisitable; forward jumps only to reachable
  // steps (review/report need a generated package, which also marks every
  // questionnaire step as visited).
  const canGoStep = (i: number): boolean => {
    if (i === stepperCurrent) return false;
    if (i >= 4) return !!pkg;
    if (firstCatIndexOfGroup(i) < 0) return false;
    return i < stepperCurrent || !!pkg;
  };

  const goStep = (i: number): void => {
    if (!canGoStep(i)) return;
    if (i === 4) {
      setScreen("summary");
      return;
    }
    if (i === 5) {
      setScreen("package");
      return;
    }
    const idx = firstCatIndexOfGroup(i);
    if (idx >= 0) {
      setGenError(false);
      setQStep(idx);
      setScreen("questionnaire");
    }
  };

  const showStepper =
    screen === "questionnaire" || screen === "summary" || screen === "package";

  const navItems: { id: Screen; label: string; needsPkg?: boolean }[] = [
    { id: "welcome", label: t("nav.welcome") },
    { id: "disclaimer", label: t("nav.disclaimer") },
    { id: "questionnaire", label: t("nav.questionnaire") },
    { id: "summary", label: t("nav.summary"), needsPkg: true },
    { id: "package", label: t("nav.package"), needsPkg: true },
    { id: "literacy", label: t("nav.literacy"), needsPkg: true },
    { id: "vendor", label: t("nav.vendor"), needsPkg: true },
    { id: "export", label: t("nav.export"), needsPkg: true },
    { id: "contact", label: t("nav.contact") },
    { id: "admin", label: t("nav.admin") },
  ];

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container">
          <button className="brand" onClick={() => setScreen("welcome")}>
            <ILPLogo />
            <span className="brand__divider" aria-hidden="true" />
            <span className="brand__text">
              <span className="brand__title">{t("app.title")}</span>
              <span className="brand__tag">{t("ilp.tagline")}</span>
            </span>
          </button>
          <span className="header-spacer" />
          <div
            className="lang-toggle"
            role="group"
            aria-label={t("lang.toggle")}
          >
            <button
              aria-pressed={lang === "en"}
              onClick={() => setLang("en")}
            >
              {t("lang.en")}
            </button>
            <button
              aria-pressed={lang === "es"}
              onClick={() => setLang("es")}
            >
              {t("lang.es")}
            </button>
            <button
              aria-pressed={lang === "zh"}
              onClick={() => setLang("zh")}
            >
              {t("lang.zh")}
            </button>
          </div>
        </div>
      </header>

      <nav className="site-nav" aria-label="Primary">
        <div className="container">
          {navItems.map((item) => (
            <button
              key={item.id}
              aria-current={screen === item.id}
              disabled={item.needsPkg && !pkg}
              onClick={() => go(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="main">
        <div className="container">
          {resumeOpen && (
            <div className="resume-banner" role="status">
              <p className="resume-banner__text">{t("resume.title")}</p>
              <div className="btn-row">
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={resumeContinue}
                >
                  {t("resume.continue")}
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={resumeRestart}
                >
                  {t("resume.restart")}
                </button>
              </div>
            </div>
          )}

          {showStepper && (
            <Stepper
              steps={stepperLabels}
              current={stepperCurrent}
              isNavigable={canGoStep}
              onNavigate={goStep}
            />
          )}

          {genError && screen === "questionnaire" && (
            <div className="gen-error" role="alert">
              <h2>{t("gen.error.title")}</h2>
              <p>{t("gen.error.body")}</p>
              <div className="btn-row">
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => void generate()}
                >
                  {t("gen.error.retry")}
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setGenError(false)}
                >
                  {t("gen.error.back")}
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={downloadAnswersJson}
                >
                  {t("gen.error.json")}
                </button>
              </div>
            </div>
          )}

          {screen === "welcome" && (
            <Welcome
              onStart={() => setScreen(accepted ? "questionnaire" : "disclaimer")}
            />
          )}

          {screen === "disclaimer" && (
            <Disclaimer
              text={config.disclaimer}
              alreadyAccepted={accepted}
              onAccept={acceptDisclaimer}
            />
          )}

          {screen === "questionnaire" && (
            <Questionnaire
              questions={config.questions}
              categories={config.categories}
              tools={config.tools}
              answers={answers}
              others={others}
              toolRecords={toolRecords}
              uploads={uploads}
              setAnswer={setAnswer}
              setOther={setOther}
              setToolRecord={setToolRecord}
              addUpload={addUpload}
              onGenerate={generate}
              generating={generating}
              onSaveProgress={handleSaveProgress}
              step={clampedQStep}
              setStep={setQStep}
            />
          )}

          {screen === "summary" && pkg && (
            <Summary pkg={pkg} onViewPackage={() => setScreen("package")} />
          )}

          {screen === "package" && pkg && (
            <Package
              pkg={pkg}
              clauseEdits={clauseEdits}
              onEditClause={editClause}
              goExport={() => setScreen("export")}
              goLiteracy={() => setScreen("literacy")}
              goVendor={() => setScreen("vendor")}
              goContact={() => setScreen("contact")}
              goQuestionnaire={() => setScreen("questionnaire")}
              onCta={handleCta}
            />
          )}

          {screen === "literacy" && pkg && <Literacy pkg={pkg} />}
          {screen === "vendor" && pkg && <Vendor pkg={pkg} />}
          {screen === "export" && pkg && <Export pkg={pkg} />}

          {screen === "contact" && (
            <Contact pkg={pkg} answers={answers} presetCta={ctaPreset} />
          )}

          {screen === "admin" && (
            <Admin onConfigSaved={(cfg) => props.onConfigOverride(cfg)} />
          )}
        </div>
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-ilp">
            <div className="footer-ilp__brand">
              <div>
                <ILPLogo size="sm" />
                <div className="footer-ilp__tagline">{t("ilp.tagline")}</div>
              </div>
            </div>
            <div className="footer-ilp__contact">
              <span>{ILP_CONTACT.address}</span>
              <a href={ILP_CONTACT.phoneHref}>{ILP_CONTACT.phone}</a>
              <a href={ILP_CONTACT.emailHref}>{ILP_CONTACT.email}</a>
              <a href={ILP_CONTACT.webHref} target="_blank" rel="noopener noreferrer">
                {ILP_CONTACT.web}
              </a>
            </div>
          </div>
          <div className="footer-disclaimer">
            <strong>{t("app.title")}</strong>
            <p style={{ margin: "6px 0 0" }}>{tr(config.disclaimer)}</p>
          </div>
          <div className="small">{t("common.disclaimerShort")}</div>
        </div>
      </footer>

      <ILPFloatButton onClick={() => setIlpOpen(true)} />
      <ILPContactModal
        open={ilpOpen}
        hasReport={!!pkg}
        onClose={() => setIlpOpen(false)}
        onReview={() => {
          setIlpOpen(false);
          setScreen("contact");
        }}
      />

      {/* C. Full-screen generation overlay (min 600ms, see generate()). */}
      {generating && (
        <div className="gen-overlay" role="status" aria-live="polite">
          <div className="gen-overlay__card">
            <span className="spinner spinner--lg" aria-hidden="true" />
            <h2>{t("gen.loading.title")}</h2>
            <p>{t("gen.loading.sub")}</p>
            <div className="gen-bar" aria-hidden="true">
              <div className="gen-bar__fill" />
            </div>
            <p className="small muted" style={{ margin: 0 }}>
              {t("gen.loading.warn")}
            </p>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.msg} variant={toast.variant} />}
    </div>
  );
}

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
  requiredComplete,
} from "./state";
import { CenterLoading, Toast } from "./components/ui";
import {
  ILP_CONTACT,
  ILPContactModal,
  ILPFloatButton,
  ILPMark,
} from "./components/ILPBrand";
import { Welcome } from "./screens/Welcome";
import { Disclaimer } from "./screens/Disclaimer";
import { Questionnaire } from "./screens/Questionnaire";
import { Summary } from "./screens/Summary";
import { Package } from "./screens/Package";
import { Literacy } from "./screens/Literacy";
import { Vendor } from "./screens/Vendor";
import { Export } from "./screens/Export";
import { Contact } from "./screens/Contact";
import { Admin } from "./screens/Admin";

const EMPTY_OVERRIDES: TranslationOverrides = { en: {}, es: {} };

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

  // generated artifacts
  const [pkg, setPkg] = useState<PolicyPackage | null>(null);
  const [clauseEdits, setClauseEdits] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);

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
    setGenerating(true);
    try {
      const questionnaire = buildQuestionnaire(answers, others, toolRecords);
      const profile = buildProfile(answers);
      const result = await api.generate({ profile, questionnaire });
      setPkg(result);
      setClauseEdits({});
      setScreen("summary");
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        showToast(t("disclaimer.mustAccept"), "error");
        setAccepted(false);
        setScreen("disclaimer");
      } else {
        showToast(t("common.error"), "error");
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
            <span className="brand__mark brand__mark--ilp">
              <ILPMark size={44} />
            </span>
            <span className="brand__text">
              <span className="brand__title">{t("app.title")}</span>
              <span className="brand__tag">
                {t("ilp.by")} · {t("ilp.tagline")}
              </span>
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
              <ILPMark size={40} />
              <div>
                <strong>{ILP_CONTACT.name}</strong>
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
        onClose={() => setIlpOpen(false)}
        onReview={() => {
          setIlpOpen(false);
          setScreen("contact");
        }}
      />

      {toast && <Toast message={toast.msg} variant={toast.variant} />}
    </div>
  );
}

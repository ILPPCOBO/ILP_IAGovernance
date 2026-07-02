import React from "react";
import type { Lang } from "../../shared/index";
import { useT } from "../i18n/useT";
import { ILPLogo } from "../components/ILPBrand";

export function Welcome(props: { onStart: () => void }): React.ReactElement {
  const { t, lang, setLang } = useT();

  const choose = (l: Lang) => setLang(l);

  return (
    <div className="screen">
      <div className="ilp-notice" role="note">
        <span className="ilp-notice__mark" aria-hidden="true">
          <ILPLogo variant="light" wordless size="sm" />
        </span>
        <div>
          <strong>{t("ilp.notice.title")}</strong>
          <p>{t("ilp.notice.body")}</p>
        </div>
      </div>

      <div className="hero">
        <div>
          <div className="section-eyebrow">{t("ilp.name")}</div>
          <h1>{t("welcome.heading")}</h1>
          <p className="lead">{t("welcome.body")}</p>
          <ul className="feature-list">
            <li>{t("package.policy")}</li>
            <li>{t("package.tools")}</li>
            <li>{t("package.sensitive")}</li>
            <li>{t("package.humanReview")}</li>
            <li>{t("package.incident")}</li>
            <li>{t("package.literacy")}</li>
            <li>{t("package.vendor")}</li>
          </ul>
        </div>

        <div className="hero__panel">
          <h3>{t("welcome.chooseLang")}</h3>
          <div className="lang-choice">
            <button
              type="button"
              className={`lang-card ${lang === "en" ? "lang-card--on" : ""}`}
              onClick={() => choose("en")}
              aria-pressed={lang === "en"}
            >
              English
              <span>EN</span>
            </button>
            <button
              type="button"
              className={`lang-card ${lang === "es" ? "lang-card--on" : ""}`}
              onClick={() => choose("es")}
              aria-pressed={lang === "es"}
            >
              Español
              <span>ES</span>
            </button>
            <button
              type="button"
              className={`lang-card ${lang === "zh" ? "lang-card--on" : ""}`}
              onClick={() => choose("zh")}
              aria-pressed={lang === "zh"}
            >
              中文
              <span>ZH</span>
            </button>
          </div>
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={props.onStart}
          >
            {t("welcome.start")}
          </button>
          <p className="small muted" style={{ marginTop: 14, marginBottom: 0 }}>
            {t("welcome.notLegal")}
          </p>
        </div>
      </div>
    </div>
  );
}

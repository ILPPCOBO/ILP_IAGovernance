import React from "react";
import type { PolicyPackage } from "../../shared/index";
import { useT } from "../i18n/useT";
import { Card, SectionCard, SeverityBadge, Notice } from "../components/ui";

export function Summary(props: {
  pkg: PolicyPackage;
  onViewPackage: () => void;
}): React.ReactElement {
  const { t, tr } = useT();
  const { score } = props.pkg;

  return (
    <div className="screen" style={{ maxWidth: 880, margin: "0 auto" }}>
      <SectionCard title={t("summary.heading")} eyebrow={t("nav.summary")}>
        <div className="score-block">
          <div
            className="gauge"
            style={{ ["--val" as string]: String(score.value) }}
            role="img"
            aria-label={`${t("summary.scoreLabel")}: ${score.value}/100`}
          >
            <div className="gauge__inner">
              <div className="gauge__value">{score.value}</div>
              <div className="gauge__max">/ 100</div>
              <div className="gauge__band">{tr(score.bandLabel)}</div>
            </div>
          </div>
          <div className="score-meta">
            <div className="section-eyebrow">{t("summary.scoreLabel")}</div>
            <p>{tr(score.summary)}</p>
            <Notice variant="warn">{t("summary.notCompliance")}</Notice>
          </div>
        </div>
      </SectionCard>

      <SectionCard title={t("summary.breakdown")}>
        <div>
          {score.breakdown.map((b) => {
            const pct = b.max > 0 ? Math.round((b.earned / b.max) * 100) : 0;
            return (
              <div className="bd-row" key={b.category}>
                <div>
                  <div className="bd-row__label">
                    {b.category}. {tr(b.label)}
                  </div>
                  <div className="bd-row__note">{tr(b.notes)}</div>
                </div>
                <div className="bd-track" aria-hidden="true">
                  <div className="bd-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="bd-score">
                  {b.earned} / {b.max}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title={t("summary.findings")}>
        {props.pkg.findings.length === 0 ? (
          <p className="muted">{tr({ en: "No findings.", es: "Sin hallazgos." })}</p>
        ) : (
          <div>
            {props.pkg.findings.map((f) => (
              <div className="finding" key={f.id}>
                <SeverityBadge severity={f.severity} />
                <div className="finding__body">
                  <h4>{tr(f.title)}</h4>
                  <p>{tr(f.detail)}</p>
                  <div className="finding__rec">
                    <strong>→ </strong>
                    {tr(f.recommendation)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <Card>
        <div className="btn-row btn-row--between">
          <p className="muted small" style={{ margin: 0 }}>
            {t("common.disclaimerShort")}
          </p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={props.onViewPackage}
          >
            {t("summary.viewPackage")}
          </button>
        </div>
      </Card>
    </div>
  );
}

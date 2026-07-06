import React, { useState } from "react";
import type { PolicyPackage, PolicySection } from "../../shared/index";
import { useT } from "../i18n/useT";
import { api } from "../api";
import { Card, SectionCard, SeverityBadge, Notice } from "../components/ui";

interface Props {
  pkg: PolicyPackage;
  /** Map of clauseId -> edited text for the CURRENT language. */
  clauseEdits: Record<string, string>;
  onEditClause: (clauseId: string, text: string) => void;
  goExport: () => void;
  goLiteracy: () => void;
  goVendor: () => void;
  goContact: () => void;
  goQuestionnaire: () => void;
  onCta: (id: string) => void;
}

export function Package(props: Props): React.ReactElement {
  const { t, tr, lang } = useT();
  const p = props.pkg;
  let n = 0;

  return (
    <div className="screen">
      <div className="section-eyebrow">{t("nav.package")}</div>
      <h1 style={{ marginBottom: 4 }}>{tr(p.title)}</h1>
      <p className="muted">{p.companyName}</p>

      {/* Available actions — the "what now?" panel, before the sections */}
      <section className="card actions-panel">
        <h2>{t("actions.title")}</h2>
        <Notice>{t("actions.ready")}</Notice>
        <p className="muted small" style={{ margin: "10px 0 0" }}>
          {t("actions.guide")}
        </p>
        <div className="btn-row">
          <a
            className="btn btn--primary"
            href={api.exportUrl(p.id, { section: "full", format: "pdf", lang })}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("actions.pdf")}
          </a>
          <a
            className="btn btn--navy"
            href={api.exportUrl(p.id, { section: "full", format: "docx", lang })}
            download
          >
            {t("actions.word")}
          </a>
          <a
            className="btn btn--ghost"
            href={api.exportUrl(p.id, { section: "full", format: "json", lang })}
            download
          >
            {t("actions.json")}
          </a>
          <button className="btn btn--ghost" onClick={props.goQuestionnaire}>
            {t("actions.back")}
          </button>
          <button className="btn btn--ghost" onClick={props.goQuestionnaire}>
            {t("actions.edit")}
          </button>
          <button className="btn btn--ghost" onClick={props.goContact}>
            {t("actions.review")}
          </button>
        </div>
      </section>

      <div className="btn-row" style={{ margin: "14px 0 24px" }}>
        <button className="btn btn--primary btn--sm" onClick={props.goExport}>
          {t("nav.export")}
        </button>
        <button className="btn btn--ghost btn--sm" onClick={props.goLiteracy}>
          {t("nav.literacy")}
        </button>
        <button className="btn btn--ghost btn--sm" onClick={props.goVendor}>
          {t("nav.vendor")}
        </button>
        <button className="btn btn--ghost btn--sm" onClick={props.goContact}>
          {t("nav.contact")}
        </button>
      </div>

      {/* 1. Executive summary */}
      <SectionCard num={++n} title={t("package.execSummary")}>
        <p>{tr(p.executiveSummary)}</p>
      </SectionCard>

      {/* 2. Score */}
      <SectionCard num={++n} title={t("package.score")}>
        <div className="score-block">
          <div
            className="gauge"
            style={{ ["--val" as string]: String(p.score.value) }}
            role="img"
            aria-label={`${p.score.value}/100`}
          >
            <div className="gauge__inner">
              <div className="gauge__value">{p.score.value}</div>
              <div className="gauge__max">/ 100</div>
              <div className="gauge__band">{tr(p.score.bandLabel)}</div>
            </div>
          </div>
          <div className="score-meta">
            <p>{tr(p.score.summary)}</p>
            <Notice variant="warn">{t("summary.notCompliance")}</Notice>
          </div>
        </div>
      </SectionCard>

      {/* 3. Internal AI-use policy with editable clauses */}
      <SectionCard num={++n} title={t("package.policy")}>
        {p.policy.map((sec) => (
          <PolicySectionView
            key={sec.id}
            section={sec}
            edits={props.clauseEdits}
            onEdit={props.onEditClause}
          />
        ))}
      </SectionCard>

      {/* 4. Approved-tools list */}
      <SectionCard num={++n} title={t("package.tools")}>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>{t("package.colTool")}</th>
                <th>{t("package.colStatus")}</th>
                <th>{t("package.colPermitted")}</th>
                <th>{t("package.colDataAllowed")}</th>
                <th>{t("package.colDataProhibited")}</th>
                <th>{t("package.colOwner")}</th>
              </tr>
            </thead>
            <tbody>
              {p.approvedTools.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted">
                    —
                  </td>
                </tr>
              )}
              {p.approvedTools.map((tool) => (
                <tr key={tool.toolId}>
                  <td>
                    <strong>{tool.toolName}</strong>
                  </td>
                  <td>
                    <span className="badge badge--navy">
                      {tr(tool.statusLabel)}
                    </span>
                  </td>
                  <td>{tr(tool.permittedUseCases)}</td>
                  <td>{tr(tool.dataAllowed)}</td>
                  <td>{tr(tool.dataProhibited)}</td>
                  <td>{tr(tool.owner)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* 5. Sensitive-data rules */}
      <SectionCard num={++n} title={t("package.sensitive")}>
        <ul className="clean-list">
          {p.sensitiveDataRules.map((r) => (
            <li key={r.id}>
              <SeverityBadge severity={r.severity} />{" "}
              <strong>{tr(r.dataType)}</strong> — {tr(r.rule)}
            </li>
          ))}
        </ul>
      </SectionCard>

      {/* 6. Human-review requirements */}
      <SectionCard num={++n} title={t("package.humanReview")}>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>{t("package.colContext")}</th>
                <th>{t("package.colStatus")}</th>
                <th>{t("package.colRequirement")}</th>
              </tr>
            </thead>
            <tbody>
              {p.humanReview.map((row, i) => (
                <tr key={i}>
                  <td>{tr(row.context)}</td>
                  <td>
                    <span
                      className={`badge ${
                        row.required ? "badge--required" : "badge--rec"
                      }`}
                    >
                      {row.required
                        ? t("package.required")
                        : t("package.notRequired")}
                    </span>
                  </td>
                  <td>{tr(row.requirement)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* 7. Disclosure rules */}
      <SectionCard num={++n} title={t("package.disclosure")}>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>{t("package.colContext")}</th>
                <th>{t("package.colStatus")}</th>
                <th>{t("package.colRule")}</th>
              </tr>
            </thead>
            <tbody>
              {p.disclosureRules.map((row, i) => (
                <tr key={i}>
                  <td>{tr(row.context)}</td>
                  <td>
                    <span
                      className={`badge ${
                        row.required ? "badge--required" : "badge--rec"
                      }`}
                    >
                      {row.required
                        ? t("package.required")
                        : t("package.notRequired")}
                    </span>
                  </td>
                  <td>{tr(row.rule)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* 8. Incident process */}
      <SectionCard num={++n} title={t("package.incident")}>
        <IncidentView pkg={p} />
      </SectionCard>

      {/* 9. AI literacy checklist */}
      <SectionCard num={++n} title={t("package.literacy")}>
        <ul className="clean-list">
          {p.aiLiteracy.map((item) => (
            <li key={item.id}>
              {tr(item.text)}{" "}
              {item.priority && (
                <span className="priority-flag">
                  ★ {tr({ en: "priority", es: "prioridad" })}
                </span>
              )}
            </li>
          ))}
        </ul>
        <div className="btn-row" style={{ marginTop: 14 }}>
          <button className="btn btn--ghost btn--sm" onClick={props.goLiteracy}>
            {t("nav.literacy")} →
          </button>
        </div>
      </SectionCard>

      {/* 10. Vendor workflow */}
      <SectionCard num={++n} title={t("package.vendor")}>
        <VendorSummary pkg={p} />
        <div className="btn-row" style={{ marginTop: 14 }}>
          <button className="btn btn--ghost btn--sm" onClick={props.goVendor}>
            {t("nav.vendor")} →
          </button>
        </div>
      </SectionCard>

      {/* 11. Missing info */}
      <SectionCard num={++n} title={t("package.missing")}>
        {p.missingInfo.length === 0 ? (
          <p className="muted">—</p>
        ) : (
          <ul className="clean-list">
            {p.missingInfo.map((m, i) => (
              <li key={i}>{tr(m)}</li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* 12. Next steps */}
      <SectionCard num={++n} title={t("package.nextSteps")}>
        <ul className="clean-list">
          {p.nextSteps.map((s, i) => (
            <li key={i}>{tr(s)}</li>
          ))}
        </ul>
      </SectionCard>

      {/* 13. Conversion offer */}
      <div className="conversion" style={{ marginTop: 20 }}>
        <div className="section-eyebrow" style={{ color: "var(--gold-soft)" }}>
          {t("package.conversion")}
        </div>
        <h2>{tr(p.conversion.heading)}</h2>
        <p>{tr(p.conversion.body)}</p>
        <div className="btn-row">
          {p.conversion.ctas.map((c, i) => (
            <button
              key={c.id}
              className={`btn ${i === 0 ? "btn--primary" : "btn--ghost"}`}
              onClick={() => props.onCta(c.id)}
            >
              {tr(c.label)}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <p className="small muted" style={{ margin: 0 }}>
          {tr(p.disclaimer)}
        </p>
      </Card>
    </div>
  );
}

/* ----------------------------------------------------- policy section */

function PolicySectionView(props: {
  section: PolicySection;
  edits: Record<string, string>;
  onEdit: (clauseId: string, text: string) => void;
}): React.ReactElement {
  const { tr } = useT();
  return (
    <div className="policy-section">
      <h3>{tr(props.section.title)}</h3>
      {props.section.clauses.length === 0 && (
        <p className="muted small">—</p>
      )}
      {props.section.clauses.map((clause) => (
        <ClauseEditor
          key={clause.id}
          clauseId={clause.id}
          text={tr(clause.text)}
          override={props.edits[clause.id]}
          onSave={(txt) => props.onEdit(clause.id, txt)}
        />
      ))}
    </div>
  );
}

function ClauseEditor(props: {
  clauseId: string;
  text: string;
  override?: string;
  onSave: (text: string) => void;
}): React.ReactElement {
  const { t } = useT();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(props.override ?? props.text);

  const display = props.override ?? props.text;

  const start = () => {
    setDraft(display);
    setEditing(true);
  };
  const save = () => {
    props.onSave(draft);
    setEditing(false);
  };

  return (
    <div className="clause">
      <div className="clause__head">
        <span className="small muted">{props.clauseId}</span>
        {!editing ? (
          <button className="btn btn--ghost btn--sm" onClick={start}>
            {t("package.edit")}
          </button>
        ) : (
          <span className="btn-row">
            <button className="btn btn--primary btn--sm" onClick={save}>
              {t("package.save")}
            </button>
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => setEditing(false)}
            >
              {t("package.cancel")}
            </button>
          </span>
        )}
      </div>
      {editing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
        />
      ) : (
        <p className="clause__text">{display}</p>
      )}
    </div>
  );
}

/* ----------------------------------------------------- incident */

function IncidentView(props: { pkg: PolicyPackage }): React.ReactElement {
  const { tr } = useT();
  const i = props.pkg.incident;
  const group = (title: { en: string; es: string }, items: { en: string; es: string }[]) => (
    <div className="wf-group">
      <h4>{tr(title)}</h4>
      <ul className="clean-list">
        {items.map((it, idx) => (
          <li key={idx}>{tr(it)}</li>
        ))}
      </ul>
    </div>
  );
  return (
    <div>
      {group({ en: "What counts as an incident", es: "Qué cuenta como incidente" }, i.whatCounts)}
      <div className="grid-2">
        <div className="wf-group">
          <h4>{tr({ en: "Report to", es: "Reportar a" })}</h4>
          <p className="small">{tr(i.reportTo)}</p>
        </div>
        <div className="wf-group">
          <h4>{tr({ en: "Timeline", es: "Plazo" })}</h4>
          <p className="small">{tr(i.timeline)}</p>
        </div>
      </div>
      {group({ en: "Information to include", es: "Información a incluir" }, i.infoToInclude)}
      {group({ en: "Escalation", es: "Escalado" }, i.escalation)}
      {group({ en: "Containment", es: "Contención" }, i.containment)}
      {group({ en: "Documentation", es: "Documentación" }, i.documentation)}
    </div>
  );
}

function VendorSummary(props: { pkg: PolicyPackage }): React.ReactElement {
  const { tr } = useT();
  const v = props.pkg.vendorWorkflow;
  return (
    <div>
      <div className="wf-group">
        <h4>{tr({ en: "When required", es: "Cuándo se requiere" })}</h4>
        <ul className="clean-list">
          {v.whenRequired.map((it, i) => (
            <li key={i}>{tr(it)}</li>
          ))}
        </ul>
      </div>
      <p className="small muted">{tr(v.reviewCadence)}</p>
    </div>
  );
}

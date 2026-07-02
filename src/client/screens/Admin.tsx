import React, { useState } from "react";
import type {
  AdminConfig,
  ContactLead,
  L,
} from "../../shared/index";
import { UI_KEYS } from "../../shared/index";
import { useT } from "../i18n/useT";
import { api } from "../api";
import { Card, SectionCard, Spinner } from "../components/ui";
import { LFieldEditor, LListEditor } from "../components/LField";

type Tab =
  | "questions"
  | "templates"
  | "scoring"
  | "literacy"
  | "vendor"
  | "disclaimer"
  | "cta"
  | "translations"
  | "leads";

export function Admin(props: {
  onConfigSaved: (config: AdminConfig) => void;
}): React.ReactElement {
  const { t, tr } = useT();
  const [token, setToken] = useState("");
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [leads, setLeads] = useState<ContactLead[] | null>(null);
  const [tab, setTab] = useState<Tab>("questions");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const unlock = async () => {
    setBusy(true);
    setError(null);
    try {
      const cfg = await api.admin.getConfig(token);
      setConfig(cfg);
    } catch {
      setError(t("admin.badToken"));
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!config) return;
    setBusy(true);
    setError(null);
    setSavedMsg(null);
    try {
      const saved = await api.admin.putConfig(token, config);
      setConfig(saved);
      props.onConfigSaved(saved);
      setSavedMsg(t("admin.saved"));
    } catch {
      setError(t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setBusy(true);
    setError(null);
    setSavedMsg(null);
    try {
      const cfg = await api.admin.reset(token);
      setConfig(cfg);
      props.onConfigSaved(cfg);
      setSavedMsg(t("admin.saved"));
    } catch {
      setError(t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  const loadLeads = async () => {
    setBusy(true);
    setError(null);
    try {
      setLeads(await api.admin.getLeads(token));
    } catch {
      setError(t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  if (!config) {
    return (
      <div className="screen" style={{ maxWidth: 480, margin: "0 auto" }}>
        <SectionCard title={t("admin.heading")} eyebrow={t("nav.admin")}>
          <div className="field">
            <label htmlFor="admin-token">{t("admin.token")}</label>
            <input
              id="admin-token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && unlock()}
            />
          </div>
          {error && (
            <p className="small" style={{ color: "var(--sev-high)" }}>
              {error}
            </p>
          )}
          <button
            className="btn btn--primary"
            onClick={unlock}
            disabled={busy || !token}
          >
            {busy && <Spinner />}
            {t("admin.login")}
          </button>
        </SectionCard>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "questions", label: t("admin.tab.questions") },
    { id: "templates", label: t("admin.tab.templates") },
    { id: "scoring", label: t("admin.tab.scoring") },
    { id: "literacy", label: t("admin.tab.literacy") },
    { id: "vendor", label: t("admin.tab.vendor") },
    { id: "disclaimer", label: t("admin.tab.disclaimer") },
    { id: "cta", label: t("admin.tab.cta") },
    { id: "translations", label: t("admin.tab.translations") },
    { id: "leads", label: t("admin.tab.leads") },
  ];

  const patch = (p: Partial<AdminConfig>) =>
    setConfig((c) => (c ? { ...c, ...p } : c));

  return (
    <div className="screen">
      <div className="btn-row btn-row--between" style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>{t("admin.heading")}</h1>
        <div className="btn-row">
          {savedMsg && <span className="badge badge--low">{savedMsg}</span>}
          <button className="btn btn--ghost btn--sm" onClick={reset} disabled={busy}>
            {t("admin.reset")}
          </button>
          <button className="btn btn--primary btn--sm" onClick={save} disabled={busy}>
            {busy && <Spinner />}
            {t("admin.save")}
          </button>
        </div>
      </div>

      {error && (
        <p className="small" style={{ color: "var(--sev-high)" }}>
          {error}
        </p>
      )}

      <div className="tabs" role="tablist">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            role="tab"
            aria-selected={tab === tb.id}
            onClick={() => {
              setTab(tb.id);
              if (tb.id === "leads" && leads === null) void loadLeads();
            }}
          >
            {tb.label}
          </button>
        ))}
      </div>

      <Card>
        {tab === "questions" && (
          <div>
            {config.questions.map((q, i) => (
              <div className="admin-item" key={q.id}>
                <h4>
                  {q.category}. {q.id}{" "}
                  <span className="muted small">({q.type})</span>
                </h4>
                <LFieldEditor
                  label="Prompt"
                  value={q.prompt}
                  onChange={(v) => {
                    const next = config.questions.slice();
                    next[i] = { ...q, prompt: v };
                    patch({ questions: next });
                  }}
                />
                {q.help && (
                  <LFieldEditor
                    label="Help"
                    value={q.help}
                    onChange={(v) => {
                      const next = config.questions.slice();
                      next[i] = { ...q, help: v };
                      patch({ questions: next });
                    }}
                  />
                )}
                {q.options && q.options.length > 0 && (
                  <div className="tag-pills">
                    {q.options.map((opt, oi) => (
                      <span key={opt.value} className="pill">
                        <input
                          style={{ width: 90, marginRight: 4 }}
                          value={opt.label.en}
                          onChange={(e) => {
                            const next = config.questions.slice();
                            const opts = (q.options ?? []).slice();
                            opts[oi] = {
                              ...opt,
                              label: { ...opt.label, en: e.target.value },
                            };
                            next[i] = { ...q, options: opts };
                            patch({ questions: next });
                          }}
                        />
                        <input
                          style={{ width: 90 }}
                          value={opt.label.es}
                          onChange={(e) => {
                            const next = config.questions.slice();
                            const opts = (q.options ?? []).slice();
                            opts[oi] = {
                              ...opt,
                              label: { ...opt.label, es: e.target.value },
                            };
                            next[i] = { ...q, options: opts };
                            patch({ questions: next });
                          }}
                        />
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "templates" && (
          <div>
            {Object.entries(config.templates.clauses).map(([id, val]) => (
              <div className="admin-item" key={id}>
                <h4>{id}</h4>
                <LFieldEditor
                  value={val}
                  rows={3}
                  onChange={(v) =>
                    patch({
                      templates: {
                        clauses: { ...config.templates.clauses, [id]: v },
                      },
                    })
                  }
                />
              </div>
            ))}
          </div>
        )}

        {tab === "scoring" && (
          <div>
            {config.scoring.map((s, i) => (
              <div className="admin-item" key={s.category}>
                <div className="kv">
                  <label>{s.category}</label>
                  <input
                    value={s.label.en}
                    onChange={(e) => {
                      const next = config.scoring.slice();
                      next[i] = { ...s, label: { ...s.label, en: e.target.value } };
                      patch({ scoring: next });
                    }}
                  />
                </div>
                <div className="kv">
                  <label>Max</label>
                  <input
                    type="number"
                    value={s.max}
                    onChange={(e) => {
                      const next = config.scoring.slice();
                      next[i] = { ...s, max: Number(e.target.value) };
                      patch({ scoring: next });
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "literacy" && (
          <div>
            {config.literacy.map((item, i) => (
              <div className="admin-item" key={item.id}>
                <h4>{item.id}</h4>
                <LFieldEditor
                  value={item.text}
                  onChange={(v) => {
                    const next = config.literacy.slice();
                    next[i] = { ...item, text: v };
                    patch({ literacy: next });
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {tab === "vendor" && (
          <div>
            <LListEditor
              label={tr({ en: "When required", es: "Cuándo se requiere" })}
              items={config.vendorWorkflow.whenRequired}
              onChange={(items) =>
                patch({
                  vendorWorkflow: { ...config.vendorWorkflow, whenRequired: items },
                })
              }
            />
            <LListEditor
              label={tr({ en: "Intake fields", es: "Campos de admisión" })}
              items={config.vendorWorkflow.intakeFields}
              onChange={(items) =>
                patch({
                  vendorWorkflow: { ...config.vendorWorkflow, intakeFields: items },
                })
              }
            />
            <LListEditor
              label={tr({ en: "Review steps", es: "Pasos de revisión" })}
              items={config.vendorWorkflow.reviewSteps}
              onChange={(items) =>
                patch({
                  vendorWorkflow: { ...config.vendorWorkflow, reviewSteps: items },
                })
              }
            />
            <LListEditor
              label={tr({ en: "Approval roles", es: "Roles de aprobación" })}
              items={config.vendorWorkflow.approvalRoles}
              onChange={(items) =>
                patch({
                  vendorWorkflow: { ...config.vendorWorkflow, approvalRoles: items },
                })
              }
            />
            <LListEditor
              label={tr({ en: "Contract checks", es: "Verificaciones contractuales" })}
              items={config.vendorWorkflow.contractChecks}
              onChange={(items) =>
                patch({
                  vendorWorkflow: { ...config.vendorWorkflow, contractChecks: items },
                })
              }
            />
            <div className="admin-item">
              <h4>{tr({ en: "Review cadence", es: "Cadencia de revisión" })}</h4>
              <LFieldEditor
                value={config.vendorWorkflow.reviewCadence}
                onChange={(v) =>
                  patch({
                    vendorWorkflow: { ...config.vendorWorkflow, reviewCadence: v },
                  })
                }
              />
            </div>
          </div>
        )}

        {tab === "disclaimer" && (
          <div>
            <div className="kv">
              <label>Version</label>
              <input
                value={config.disclaimerVersion}
                onChange={(e) => patch({ disclaimerVersion: e.target.value })}
              />
            </div>
            <LFieldEditor
              label={t("admin.tab.disclaimer")}
              value={config.disclaimer}
              rows={5}
              onChange={(v) => patch({ disclaimer: v })}
            />
          </div>
        )}

        {tab === "cta" && (
          <div>
            <div className="admin-item">
              <h4>{tr({ en: "Conversion heading", es: "Encabezado de conversión" })}</h4>
              <LFieldEditor
                value={config.conversion.heading}
                onChange={(v) =>
                  patch({ conversion: { ...config.conversion, heading: v } })
                }
              />
              <h4>{tr({ en: "Conversion body", es: "Cuerpo de conversión" })}</h4>
              <LFieldEditor
                value={config.conversion.body}
                rows={3}
                onChange={(v) =>
                  patch({ conversion: { ...config.conversion, body: v } })
                }
              />
            </div>
            {config.cta.map((c, i) => (
              <div className="admin-item" key={c.id}>
                <h4>{c.id}</h4>
                <LFieldEditor
                  value={c.label}
                  onChange={(v) => {
                    const next = config.cta.slice();
                    next[i] = { ...c, label: v };
                    patch({ cta: next });
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {tab === "translations" && (
          <TranslationsEditor config={config} patch={patch} />
        )}

        {tab === "leads" && (
          <LeadsView leads={leads} busy={busy} reload={loadLeads} />
        )}
      </Card>
    </div>
  );
}

/* --------------------------------------------------- translations editor */

function TranslationsEditor(props: {
  config: AdminConfig;
  patch: (p: Partial<AdminConfig>) => void;
}): React.ReactElement {
  const { config, patch } = props;
  const [filter, setFilter] = useState("");
  const keys = UI_KEYS.filter((k) =>
    filter ? k.toLowerCase().includes(filter.toLowerCase()) : true,
  );

  const setVal = (lang: "en" | "es", key: string, value: string) => {
    patch({
      translations: {
        ...config.translations,
        [lang]: { ...config.translations[lang], [key]: value },
      },
    });
  };

  return (
    <div>
      <div className="field">
        <input
          type="text"
          placeholder="Filter keys…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      {keys.map((key) => (
        <div className="admin-item" key={key}>
          <h4>{key}</h4>
          <div className="grid-2">
            <label>
              <span className="mini-label">EN</span>
              <input
                value={config.translations.en[key] ?? ""}
                onChange={(e) => setVal("en", key, e.target.value)}
              />
            </label>
            <label>
              <span className="mini-label">ES</span>
              <input
                value={config.translations.es[key] ?? ""}
                onChange={(e) => setVal("es", key, e.target.value)}
              />
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}

/* --------------------------------------------------- leads viewer */

function LeadsView(props: {
  leads: ContactLead[] | null;
  busy: boolean;
  reload: () => void;
}): React.ReactElement {
  const { t } = useT();
  if (props.busy && props.leads === null) {
    return <Spinner />;
  }
  if (!props.leads || props.leads.length === 0) {
    return <p className="muted">{t("admin.leads.none")}</p>;
  }
  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>
            <th>{t("contact.name")}</th>
            <th>{t("contact.company")}</th>
            <th>{t("contact.email")}</th>
            <th>{t("contact.urgency")}</th>
            <th>{t("contact.message")}</th>
          </tr>
        </thead>
        <tbody>
          {props.leads.map((lead) => (
            <tr key={lead.id}>
              <td>{lead.name}</td>
              <td>{lead.company}</td>
              <td>{lead.email}</td>
              <td>{lead.urgency || "—"}</td>
              <td>{lead.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

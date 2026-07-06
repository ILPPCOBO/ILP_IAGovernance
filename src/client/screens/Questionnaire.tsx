import React, { useMemo, useState } from "react";
import type {
  AdminQuestion,
  AIToolRecord,
  AnswerValue,
  QuestionCategory,
  ToolCatalogEntry,
  UploadedPolicyDocument,
} from "../../shared/index";
import { useT } from "../i18n/useT";
import { api } from "../api";
import { QuestionField } from "../components/QuestionField";
import { ProgressBar, Spinner } from "../components/ui";
import {
  AnswerMap,
  OtherMap,
  ToolMap,
  emptyToolRecord,
} from "../state";

interface Props {
  questions: AdminQuestion[];
  categories: QuestionCategory[];
  tools: ToolCatalogEntry[];
  answers: AnswerMap;
  others: OtherMap;
  toolRecords: ToolMap;
  uploads: UploadedPolicyDocument[];
  setAnswer: (id: string, value: AnswerValue) => void;
  setOther: (id: string, value: string) => void;
  setToolRecord: (id: string, rec: AIToolRecord) => void;
  addUpload: (doc: UploadedPolicyDocument) => void;
  onGenerate: () => Promise<void>;
  generating: boolean;
  /** Manual "save progress" action (wired from App: saveDraft + toast). */
  onSaveProgress?: () => void;
  /** Current category index — lifted to App so the stepper can drive it. */
  step: number;
  setStep: (step: number) => void;
}

/* ------------------------------------------------------------- stepper */

/**
 * Horizontal 6-step journey indicator (company → tools → data → processes →
 * review → report). Rendered by App above the questionnaire, summary and
 * package screens; completed steps show a check and are clickable.
 */
export function Stepper(props: {
  steps: string[];
  current: number;
  isNavigable: (index: number) => boolean;
  onNavigate: (index: number) => void;
}): React.ReactElement {
  return (
    <ol className="stepper">
      {props.steps.map((label, i) => {
        const done = i < props.current;
        const isCurrent = i === props.current;
        const clickable = !isCurrent && props.isNavigable(i);
        const state = done
          ? "stepper__item--done"
          : isCurrent
            ? "stepper__item--current"
            : "stepper__item--upcoming";
        return (
          <li key={`${i}-${label}`} className={`stepper__item ${state}`}>
            <button
              type="button"
              className="stepper__btn"
              disabled={!clickable}
              aria-current={isCurrent ? "step" : undefined}
              onClick={() => props.onNavigate(i)}
            >
              <span className="stepper__num" aria-hidden="true">
                {done ? "✓" : i + 1}
              </span>
              <span className="stepper__label">{label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

export function Questionnaire(props: Props): React.ReactElement {
  const { t, tr } = useT();

  const cats = props.categories;
  const total = cats.length;
  // Clamp in case the admin config shrank the category list mid-session.
  const step = Math.max(0, Math.min(props.step, total - 1));
  const cat = cats[step];

  const questionsForCat = useMemo(
    () => props.questions.filter((q) => q.category === cat.id),
    [props.questions, cat.id],
  );

  const isLast = step === total - 1;
  const isFirst = step === 0;

  const back = () => props.setStep(Math.max(0, step - 1));
  const next = () => props.setStep(Math.min(total - 1, step + 1));

  return (
    <div className="screen" style={{ maxWidth: 800, margin: "0 auto" }}>
      <ProgressBar
        current={step + 1}
        total={total}
        label={t("q.progress", { n: step + 1, total })}
        caption={`${tr(cat.title)}`}
      />
      <div className="steps" aria-hidden="true">
        {cats.map((c, i) => (
          <span
            key={c.id}
            className={`step-dot ${
              i < step ? "step-dot--done" : i === step ? "step-dot--current" : ""
            }`}
          >
            {c.id}
          </span>
        ))}
      </div>

      <section className="card" style={{ marginTop: 18 }}>
        <div className="section-eyebrow">
          {t("nav.questionnaire")} · {cat.id}
        </div>
        <h2>{tr(cat.title)}</h2>
        <p className="muted">{tr(cat.description)}</p>
        <hr className="divider" />

        {questionsForCat.map((q) => (
          <div key={q.id}>
            <QuestionField
              question={q}
              value={props.answers[q.id] ?? null}
              otherValue={props.others[q.id]}
              onChange={(v) => props.setAnswer(q.id, v)}
              onOtherChange={(v) => props.setOther(q.id, v)}
            />
            {q.id === "toolsUsed" && (
              <ToolEditors
                tools={props.tools}
                selected={
                  Array.isArray(props.answers.toolsUsed)
                    ? (props.answers.toolsUsed as string[])
                    : []
                }
                records={props.toolRecords}
                setToolRecord={props.setToolRecord}
              />
            )}
          </div>
        ))}

        {/* Optional uploads block lives with the tools/data context */}
        {(cat.id === "C" || cat.id === "D") && (
          <UploadsBlock uploads={props.uploads} addUpload={props.addUpload} />
        )}
      </section>

      <div className="btn-row btn-row--between" style={{ marginTop: 18 }}>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={back}
          disabled={isFirst}
        >
          {t("q.back")}
        </button>
        <span className="btn-row">
          {props.onSaveProgress && (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={props.onSaveProgress}
            >
              {t("q.saveProgress")}
            </button>
          )}
          {!isLast ? (
            <button type="button" className="btn btn--navy" onClick={next}>
              {t("q.next")}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--primary"
              onClick={props.onGenerate}
              disabled={props.generating}
            >
              {props.generating && <Spinner />}
              {t("q.generate")}
            </button>
          )}
        </span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- tool editors */

function ToolEditors(props: {
  tools: ToolCatalogEntry[];
  selected: string[];
  records: ToolMap;
  setToolRecord: (id: string, rec: AIToolRecord) => void;
}): React.ReactElement | null {
  const { t, tr } = useT();
  const catalog = useMemo(
    () => new Map(props.tools.map((tl) => [tl.id, tl])),
    [props.tools],
  );

  if (props.selected.length === 0) return null;

  return (
    <div style={{ marginTop: 8 }}>
      {props.selected.map((id) => {
        const cat = catalog.get(id);
        const name = cat?.name ?? id;
        const rec = props.records[id] ?? emptyToolRecord(id, name);
        const set = (patch: Partial<AIToolRecord>) =>
          props.setToolRecord(id, { ...rec, ...patch });

        return (
          <div className="tool-editor" key={id}>
            <h4>
              {t("q.tool.add")}: {name}
            </h4>
            {cat?.note && <p className="field__help">{tr(cat.note)}</p>}
            <div className="tool-grid">
              <Select
                label={t("q.tool.status")}
                help={t("q.tool.statusHelp")}
                value={rec.status}
                onChange={(v) => set({ status: v as AIToolRecord["status"] })}
                options={[
                  ["in_use", t("status.inUse")],
                  ["pilot", t("status.pilot")],
                  ["pending_approval", t("status.pendingApproval")],
                  ["approved_not_implemented", t("status.approvedNotImplemented")],
                  ["discarded", t("status.discarded")],
                  ["unknown", t("status.unknown")],
                ]}
              />
              <Select
                label={t("q.tool.plan")}
                value={rec.plan}
                onChange={(v) => set({ plan: v as AIToolRecord["plan"] })}
                options={[
                  ["free", t("plan.free")],
                  ["enterprise", t("plan.enterprise")],
                  ["mixed", t("plan.mixed")],
                  ["unknown", t("status.unknown")],
                ]}
              />
              <Select
                label={t("q.tool.account")}
                value={rec.account}
                onChange={(v) => set({ account: v as AIToolRecord["account"] })}
                options={[
                  ["company", t("account.company")],
                  ["personal", t("account.personal")],
                  ["mixed", t("account.mixed")],
                  ["unknown", t("status.unknown")],
                ]}
              />
              <Select
                label={t("q.tool.trains")}
                value={rec.trainsOnData}
                onChange={(v) =>
                  set({ trainsOnData: v as AIToolRecord["trainsOnData"] })
                }
                options={yesNoUnknown(t)}
              />
              <Select
                label={t("q.tool.terms")}
                value={rec.termsReviewed}
                onChange={(v) =>
                  set({ termsReviewed: v as AIToolRecord["termsReviewed"] })
                }
                options={yesNoUnknown(t)}
              />
              <Select
                label={t("q.tool.security")}
                value={rec.securityReviewed}
                onChange={(v) =>
                  set({ securityReviewed: v as AIToolRecord["securityReviewed"] })
                }
                options={yesNoUnknown(t)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function yesNoUnknown(t: (k: string) => string): [string, string][] {
  return [
    ["yes", t("q.yes")],
    ["no", t("q.no")],
    ["unknown", t("q.unknown")],
  ];
}

function Select(props: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
  /** Optional clarifying text rendered directly under the select. */
  help?: string;
}): React.ReactElement {
  return (
    <label>
      <span className="mini-label">{props.label}</span>
      <select value={props.value} onChange={(e) => props.onChange(e.target.value)}>
        {props.options.map(([v, lbl]) => (
          <option key={v} value={v}>
            {lbl}
          </option>
        ))}
      </select>
      {props.help && <p className="field__help">{props.help}</p>}
    </label>
  );
}

/* ---------------------------------------------------------- uploads */

function UploadsBlock(props: {
  uploads: UploadedPolicyDocument[];
  addUpload: (doc: UploadedPolicyDocument) => void;
}): React.ReactElement {
  const { t, tr } = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const doc = await api.upload(file);
      props.addUpload(doc);
    } catch {
      setError(t("common.error"));
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  return (
    <div style={{ marginTop: 18 }}>
      <hr className="divider" />
      <h4>{t("upload.heading")}</h4>
      <p className="field__help">{t("upload.body")}</p>
      <div className="upload-drop">
        <label className="btn btn--ghost btn--sm" style={{ cursor: "pointer" }}>
          {busy ? <Spinner /> : t("upload.choose")}
          <input
            type="file"
            className="sr-only"
            accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg"
            onChange={onFile}
            disabled={busy}
          />
        </label>
      </div>
      {error && (
        <p className="small" style={{ color: "var(--sev-high)" }}>
          {error}
        </p>
      )}
      {props.uploads.map((u) => (
        <div className="file-row" key={u.id}>
          <span>
            <strong>{u.filename}</strong>{" "}
            <span className="muted">
              ({Math.max(1, Math.round(u.sizeBytes / 1024))} KB)
            </span>
            {u.extractionWeak && u.warning && (
              <div className="small" style={{ color: "var(--warn)" }}>
                {tr(u.warning)}
              </div>
            )}
          </span>
          <span className="badge badge--gold">{t("upload.uploaded")}</span>
        </div>
      ))}
    </div>
  );
}

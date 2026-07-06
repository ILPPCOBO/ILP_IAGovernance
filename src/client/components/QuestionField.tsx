/**
 * Renders a single AdminQuestion of any type, bilingually, and reports value
 * changes via onChange. The companion "other" free-text value (for multi
 * questions with allowOther) is stored under `${question.id}__other`.
 */

import React from "react";
import type { AdminQuestion, AnswerValue } from "../../shared/index";
import { useT } from "../i18n/useT";
import { applyMultiToggle } from "../state";

interface Props {
  question: AdminQuestion;
  value: AnswerValue;
  otherValue?: string;
  onChange: (value: AnswerValue) => void;
  onOtherChange?: (value: string) => void;
}

function asArray(v: AnswerValue): string[] {
  return Array.isArray(v) ? v : [];
}

export function QuestionField({
  question,
  value,
  otherValue,
  onChange,
  onOtherChange,
}: Props): React.ReactElement {
  const { tr, t } = useT();
  const q = question;

  const labelId = `q-${q.id}-label`;

  const triOptions: { value: string; label: string }[] = [
    { value: "yes", label: t("q.yes") },
    { value: "no", label: t("q.no") },
    ...(q.type === "tristate" ? [{ value: "unknown", label: t("q.unknown") }] : []),
  ];

  return (
    <div className="field" role="group" aria-labelledby={labelId}>
      <div className="field-label" id={labelId}>
        {tr(q.prompt)}
        {q.required && <span className="req" aria-hidden="true">*</span>}
      </div>
      {q.help && <p className="field__help">{tr(q.help)}</p>}

      {q.type === "text" && (
        <input
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          aria-labelledby={labelId}
        />
      )}

      {q.type === "number" && (
        <input
          type="number"
          value={typeof value === "number" ? value : ""}
          onChange={(e) =>
            onChange(e.target.value === "" ? null : Number(e.target.value))
          }
          aria-labelledby={labelId}
        />
      )}

      {q.type === "single" && (
        <div className="options">
          {(q.options ?? []).map((opt) => {
            const on = value === opt.value;
            return (
              <label key={opt.value} className={`option ${on ? "option--on" : ""}`}>
                <input
                  type="radio"
                  name={q.id}
                  checked={on}
                  onChange={() => onChange(opt.value)}
                />
                {tr(opt.label)}
              </label>
            );
          })}
        </div>
      )}

      {q.type === "multi" && (
        <>
          <div className="field__help">{t("q.selectAll")}</div>
          <div className="options">
            {(q.options ?? []).map((opt) => {
              const arr = asArray(value);
              const on = arr.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className={`option ${on ? "option--on" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() =>
                      onChange(applyMultiToggle(q.options, arr, opt.value))
                    }
                  />
                  <span className="option__body">
                    {tr(opt.label)}
                    {opt.help && (
                      <span className="option__help">{tr(opt.help)}</span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
          {q.allowOther && (
            <input
              type="text"
              style={{ marginTop: 10 }}
              placeholder={t("q.other")}
              value={otherValue ?? ""}
              onChange={(e) => onOtherChange?.(e.target.value)}
              aria-label={t("q.other")}
            />
          )}
        </>
      )}

      {(q.type === "boolean" || q.type === "tristate") && (
        <div className="options">
          {triOptions.map((opt) => {
            const on = value === opt.value;
            return (
              <label key={opt.value} className={`option ${on ? "option--on" : ""}`}>
                <input
                  type="radio"
                  name={q.id}
                  checked={on}
                  onChange={() => onChange(opt.value)}
                />
                {opt.label}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

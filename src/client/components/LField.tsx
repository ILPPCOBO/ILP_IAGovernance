/**
 * Editors for bilingual `L` values and plain strings used by the admin area.
 */

import React from "react";
import type { L } from "../../shared/index";

export function LFieldEditor(props: {
  label?: string;
  value: L;
  onChange: (v: L) => void;
  rows?: number;
}): React.ReactElement {
  return (
    <div className="field">
      {props.label && <span className="field-label">{props.label}</span>}
      <div className="grid-2">
        <label>
          <span className="mini-label">EN</span>
          <textarea
            rows={props.rows ?? 2}
            value={props.value.en}
            onChange={(e) => props.onChange({ ...props.value, en: e.target.value })}
          />
        </label>
        <label>
          <span className="mini-label">ES</span>
          <textarea
            rows={props.rows ?? 2}
            value={props.value.es}
            onChange={(e) => props.onChange({ ...props.value, es: e.target.value })}
          />
        </label>
      </div>
    </div>
  );
}

export function LListEditor(props: {
  label: string;
  items: L[];
  onChange: (items: L[]) => void;
}): React.ReactElement {
  const update = (i: number, v: L) => {
    const next = props.items.slice();
    next[i] = v;
    props.onChange(next);
  };
  const remove = (i: number) =>
    props.onChange(props.items.filter((_, idx) => idx !== i));
  const add = () => props.onChange([...props.items, { en: "", es: "" }]);

  return (
    <div className="admin-item">
      <h4>{props.label}</h4>
      {props.items.map((it, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <LFieldEditor value={it} onChange={(v) => update(i, v)} />
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => remove(i)}
          >
            ✕
          </button>
        </div>
      ))}
      <button type="button" className="btn btn--ghost btn--sm" onClick={add}>
        +
      </button>
    </div>
  );
}

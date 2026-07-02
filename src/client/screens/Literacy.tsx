import React, { useState } from "react";
import type { PolicyPackage } from "../../shared/index";
import { useT } from "../i18n/useT";
import { SectionCard } from "../components/ui";

export function Literacy(props: { pkg: PolicyPackage }): React.ReactElement {
  const { t, tr } = useT();
  const [done, setDone] = useState<Record<string, boolean>>({});

  const toggle = (id: string) =>
    setDone((d) => ({ ...d, [id]: !d[id] }));

  const items = props.pkg.aiLiteracy;
  const completed = items.filter((i) => done[i.id]).length;

  return (
    <div className="screen" style={{ maxWidth: 760, margin: "0 auto" }}>
      <SectionCard title={t("package.literacy")} eyebrow={t("nav.literacy")}>
        <p className="muted">
          {completed} / {items.length}
        </p>
        <ul className="checklist">
          {items.map((item) => (
            <li key={item.id}>
              <input
                type="checkbox"
                id={`lit-${item.id}`}
                checked={!!done[item.id]}
                onChange={() => toggle(item.id)}
              />
              <label
                className={`checklist__text ${done[item.id] ? "done" : ""}`}
                htmlFor={`lit-${item.id}`}
              >
                {tr(item.text)}{" "}
                {item.priority && (
                  <span className="priority-flag">
                    ★ {tr({ en: "priority", es: "prioridad" })}
                  </span>
                )}
              </label>
            </li>
          ))}
        </ul>
        <p className="small muted" style={{ marginTop: 16 }}>
          {t("common.disclaimerShort")}
        </p>
      </SectionCard>
    </div>
  );
}

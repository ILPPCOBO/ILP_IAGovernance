import React from "react";
import type { L, PolicyPackage } from "../../shared/index";
import { useT } from "../i18n/useT";
import { SectionCard } from "../components/ui";

export function Vendor(props: { pkg: PolicyPackage }): React.ReactElement {
  const { t, tr } = useT();
  const v = props.pkg.vendorWorkflow;

  const group = (title: L, items: L[]) => (
    <div className="wf-group">
      <h4>{tr(title)}</h4>
      <ul className="clean-list">
        {items.map((it, i) => (
          <li key={i}>{tr(it)}</li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="screen" style={{ maxWidth: 820, margin: "0 auto" }}>
      <SectionCard title={t("package.vendor")} eyebrow={t("nav.vendor")}>
        {group({ en: "When required", es: "Cuándo se requiere" }, v.whenRequired)}
        {group({ en: "Intake fields", es: "Campos de admisión" }, v.intakeFields)}
        {group({ en: "Review steps", es: "Pasos de revisión" }, v.reviewSteps)}
        {group({ en: "Approval roles", es: "Roles de aprobación" }, v.approvalRoles)}
        {group(
          { en: "Contract checks", es: "Verificaciones contractuales" },
          v.contractChecks,
        )}
        <div className="wf-group">
          <h4>{tr({ en: "Review cadence", es: "Cadencia de revisión" })}</h4>
          <p className="small">{tr(v.reviewCadence)}</p>
        </div>
        <p className="small muted">{t("common.disclaimerShort")}</p>
      </SectionCard>
    </div>
  );
}

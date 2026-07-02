import React from "react";
import type { PolicyPackage } from "../../shared/index";
import type { Section } from "../../shared/render";
import { useT } from "../i18n/useT";
import { api } from "../api";
import { SectionCard, Notice } from "../components/ui";

export function Export(props: { pkg: PolicyPackage }): React.ReactElement {
  const { t, lang } = useT();
  const id = props.pkg.id;

  const rows: { section: Section; label: string }[] = [
    { section: "full", label: t("export.full") },
    { section: "policy", label: t("export.policyOnly") },
    { section: "tools", label: t("export.tools") },
    { section: "literacy", label: t("export.literacy") },
    { section: "vendor", label: t("export.vendor") },
    { section: "incident", label: t("export.incident") },
  ];

  const formats: { fmt: "pdf" | "docx" | "json"; label: string; cls: string }[] = [
    { fmt: "pdf", label: t("export.pdf"), cls: "btn--navy" },
    { fmt: "docx", label: t("export.docx"), cls: "btn--ghost" },
    { fmt: "json", label: t("export.json"), cls: "btn--ghost" },
  ];

  return (
    <div className="screen" style={{ maxWidth: 900, margin: "0 auto" }}>
      <SectionCard title={t("export.heading")} eyebrow={t("nav.export")}>
        <p className="muted">{t("export.body")}</p>
        <Notice>{t("export.pdfFallback")}</Notice>

        <div className="export-grid" style={{ marginTop: 20 }}>
          {rows.map((row) => (
            <React.Fragment key={row.section}>
              <div className="export-row__label">{row.label}</div>
              {formats.map((f) => (
                <a
                  key={f.fmt}
                  className={`btn ${f.cls} btn--sm`}
                  href={api.exportUrl(id, {
                    section: row.section,
                    format: f.fmt,
                    lang,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  // pdf renders as HTML print view; docx/json download
                  {...(f.fmt === "json" || f.fmt === "docx"
                    ? { download: `${row.section}.${f.fmt}` }
                    : {})}
                >
                  {f.label}
                </a>
              ))}
            </React.Fragment>
          ))}
        </div>

        <p className="small muted" style={{ marginTop: 18 }}>
          {t("common.disclaimerShort")}
        </p>
      </SectionCard>
    </div>
  );
}

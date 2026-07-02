/**
 * Language-aware rendering of a PolicyPackage into an ordered, structured
 * document. Used by the export center (PDF/DOCX/JSON), the admin export and
 * the client preview so they all stay consistent.
 */

import type { Lang, L, PolicyPackage } from "./types";
import { CORE_DISCLAIMER } from "./i18n";

export function tr(v: L, lang: Lang): string {
  return v[lang] ?? v.en;
}

export interface RenderedBlock {
  /** "h1" | "h2" | "h3" | "p" | "li" | "table" */
  type: "h1" | "h2" | "h3" | "p" | "li" | "table";
  text?: string;
  /** For tables: header row + body rows. */
  head?: string[];
  rows?: string[][];
}

export type Section = "full" | "policy" | "tools" | "literacy" | "vendor" | "incident";

const T = {
  execSummary: { en: "Executive summary", es: "Resumen ejecutivo" },
  score: { en: "AI governance readiness score", es: "Puntuación de preparación en gobernanza de IA" },
  policy: { en: "Internal AI-use policy", es: "Política interna de uso de IA" },
  tools: { en: "Approved-tools list", es: "Lista de herramientas aprobadas" },
  sensitive: { en: "Sensitive-data rules", es: "Reglas sobre datos sensibles" },
  humanReview: { en: "Human-review requirements", es: "Requisitos de revisión humana" },
  disclosure: { en: "Employee disclosure rules", es: "Reglas de divulgación del uso de IA" },
  incident: { en: "Incident-reporting process", es: "Proceso de reporte de incidentes" },
  literacy: { en: "AI literacy checklist", es: "Checklist de alfabetización en IA" },
  vendor: { en: "Vendor-approval workflow", es: "Flujo de aprobación de proveedores" },
  missing: { en: "Missing information", es: "Información faltante" },
  nextSteps: { en: "Recommended next steps", es: "Próximos pasos recomendados" },
  conversion: { en: "Professional review", es: "Revisión profesional" },
  disclaimer: { en: "Disclaimer", es: "Aviso legal" },
  required: { en: "Required", es: "Obligatoria" },
  recommended: { en: "Recommended", es: "Recomendada" },
  findings: { en: "Key findings", es: "Hallazgos clave" },
  whenRequired: { en: "When required", es: "Cuándo se requiere" },
  intake: { en: "Intake fields", es: "Campos de admisión" },
  steps: { en: "Review steps", es: "Pasos de revisión" },
  roles: { en: "Approval roles", es: "Roles de aprobación" },
  contractChecks: { en: "Contract checks", es: "Verificaciones contractuales" },
  cadence: { en: "Review cadence", es: "Cadencia de revisión" },
  whatCounts: { en: "What counts as an incident", es: "Qué cuenta como incidente" },
  reportTo: { en: "Report to", es: "Reportar a" },
  timeline: { en: "Timeline", es: "Plazo" },
  include: { en: "Information to include", es: "Información a incluir" },
  escalation: { en: "Escalation", es: "Escalado" },
  containment: { en: "Containment", es: "Contención" },
  documentation: { en: "Documentation", es: "Documentación" },
} as const;

function policyBlocks(pkg: PolicyPackage, lang: Lang): RenderedBlock[] {
  const b: RenderedBlock[] = [{ type: "h2", text: tr(T.policy, lang) }];
  for (const sec of pkg.policy) {
    b.push({ type: "h3", text: tr(sec.title, lang) });
    for (const c of sec.clauses) b.push({ type: "p", text: tr(c.text, lang) });
  }
  return b;
}

function toolsBlocks(pkg: PolicyPackage, lang: Lang): RenderedBlock[] {
  const head = lang === "es"
    ? ["Herramienta", "Estado", "Datos permitidos", "Datos prohibidos"]
    : ["Tool", "Status", "Data allowed", "Data prohibited"];
  return [
    { type: "h2", text: tr(T.tools, lang) },
    {
      type: "table",
      head,
      rows: pkg.approvedTools.map((t) => [
        t.toolName,
        tr(t.statusLabel, lang),
        tr(t.dataAllowed, lang),
        tr(t.dataProhibited, lang),
      ]),
    },
  ];
}

function literacyBlocks(pkg: PolicyPackage, lang: Lang): RenderedBlock[] {
  const b: RenderedBlock[] = [{ type: "h2", text: tr(T.literacy, lang) }];
  for (const it of pkg.aiLiteracy) {
    const star = it.priority ? (lang === "es" ? " (prioridad)" : " (priority)") : "";
    b.push({ type: "li", text: `${tr(it.text, lang)}${star}` });
  }
  return b;
}

function vendorBlocks(pkg: PolicyPackage, lang: Lang): RenderedBlock[] {
  const v = pkg.vendorWorkflow;
  const b: RenderedBlock[] = [{ type: "h2", text: tr(T.vendor, lang) }];
  const group = (title: L, items: L[]) => {
    b.push({ type: "h3", text: tr(title, lang) });
    for (const it of items) b.push({ type: "li", text: tr(it, lang) });
  };
  group(T.whenRequired, v.whenRequired);
  group(T.intake, v.intakeFields);
  group(T.steps, v.reviewSteps);
  group(T.roles, v.approvalRoles);
  group(T.contractChecks, v.contractChecks);
  b.push({ type: "h3", text: tr(T.cadence, lang) });
  b.push({ type: "p", text: tr(v.reviewCadence, lang) });
  return b;
}

function incidentBlocks(pkg: PolicyPackage, lang: Lang): RenderedBlock[] {
  const i = pkg.incident;
  const b: RenderedBlock[] = [{ type: "h2", text: tr(T.incident, lang) }];
  const group = (title: L, items: L[]) => {
    b.push({ type: "h3", text: tr(title, lang) });
    for (const it of items) b.push({ type: "li", text: tr(it, lang) });
  };
  group(T.whatCounts, i.whatCounts);
  b.push({ type: "h3", text: tr(T.reportTo, lang) });
  b.push({ type: "p", text: tr(i.reportTo, lang) });
  b.push({ type: "h3", text: tr(T.timeline, lang) });
  b.push({ type: "p", text: tr(i.timeline, lang) });
  group(T.include, i.infoToInclude);
  group(T.escalation, i.escalation);
  group(T.containment, i.containment);
  group(T.documentation, i.documentation);
  return b;
}

/** Build an ordered block list for a section selection. */
export function renderBlocks(pkg: PolicyPackage, lang: Lang, section: Section = "full"): RenderedBlock[] {
  const blocks: RenderedBlock[] = [];
  const title = tr(pkg.title, lang);

  if (section === "policy") return [{ type: "h1", text: tr(T.policy, lang) }, ...policyBlocks(pkg, lang).slice(1), disclaimerBlock(lang)];
  if (section === "tools") return [{ type: "h1", text: tr(T.tools, lang) }, ...toolsBlocks(pkg, lang).slice(1), disclaimerBlock(lang)];
  if (section === "literacy") return [{ type: "h1", text: tr(T.literacy, lang) }, ...literacyBlocks(pkg, lang).slice(1), disclaimerBlock(lang)];
  if (section === "vendor") return [{ type: "h1", text: tr(T.vendor, lang) }, ...vendorBlocks(pkg, lang).slice(1), disclaimerBlock(lang)];
  if (section === "incident") return [{ type: "h1", text: tr(T.incident, lang) }, ...incidentBlocks(pkg, lang).slice(1), disclaimerBlock(lang)];

  // full package
  blocks.push({ type: "h1", text: title });
  blocks.push({ type: "p", text: `${pkg.companyName}` });

  blocks.push({ type: "h2", text: tr(T.execSummary, lang) });
  blocks.push({ type: "p", text: tr(pkg.executiveSummary, lang) });

  blocks.push({ type: "h2", text: tr(T.score, lang) });
  blocks.push({ type: "p", text: `${pkg.score.value}/100 — ${tr(pkg.score.bandLabel, lang)}` });
  blocks.push({ type: "p", text: tr(pkg.score.summary, lang) });

  if (pkg.findings.length) {
    blocks.push({ type: "h2", text: tr(T.findings, lang) });
    for (const f of pkg.findings) {
      blocks.push({ type: "li", text: `[${f.severity.toUpperCase()}] ${tr(f.title, lang)} — ${tr(f.recommendation, lang)}` });
    }
  }

  blocks.push(...policyBlocks(pkg, lang));
  blocks.push(...toolsBlocks(pkg, lang));

  blocks.push({ type: "h2", text: tr(T.sensitive, lang) });
  for (const r of pkg.sensitiveDataRules) blocks.push({ type: "li", text: `${tr(r.dataType, lang)}: ${tr(r.rule, lang)}` });

  blocks.push({ type: "h2", text: tr(T.humanReview, lang) });
  blocks.push({
    type: "table",
    head: lang === "es" ? ["Contexto", "Requisito"] : ["Context", "Requirement"],
    rows: pkg.humanReview.map((r) => [tr(r.context, lang), `${r.required ? tr(T.required, lang) : tr(T.recommended, lang)} — ${tr(r.requirement, lang)}`]),
  });

  blocks.push({ type: "h2", text: tr(T.disclosure, lang) });
  blocks.push({
    type: "table",
    head: lang === "es" ? ["Contexto", "Regla"] : ["Context", "Rule"],
    rows: pkg.disclosureRules.map((r) => [tr(r.context, lang), `${r.required ? tr(T.required, lang) : tr(T.recommended, lang)} — ${tr(r.rule, lang)}`]),
  });

  blocks.push(...incidentBlocks(pkg, lang));
  blocks.push(...literacyBlocks(pkg, lang));
  blocks.push(...vendorBlocks(pkg, lang));

  if (pkg.missingInfo.length) {
    blocks.push({ type: "h2", text: tr(T.missing, lang) });
    for (const m of pkg.missingInfo) blocks.push({ type: "li", text: tr(m, lang) });
  }

  blocks.push({ type: "h2", text: tr(T.nextSteps, lang) });
  for (const s of pkg.nextSteps) blocks.push({ type: "li", text: tr(s, lang) });

  blocks.push({ type: "h2", text: tr(T.conversion, lang) });
  blocks.push({ type: "p", text: tr(pkg.conversion.heading, lang) });
  blocks.push({ type: "p", text: tr(pkg.conversion.body, lang) });

  blocks.push(disclaimerBlock(lang));
  return blocks;
}

function disclaimerBlock(lang: Lang): RenderedBlock {
  return { type: "p", text: `⚠ ${CORE_DISCLAIMER[lang]}` };
}

/** Render blocks to GitHub-flavored Markdown. */
export function renderMarkdown(pkg: PolicyPackage, lang: Lang, section: Section = "full"): string {
  const blocks = renderBlocks(pkg, lang, section);
  const out: string[] = [];
  for (const b of blocks) {
    switch (b.type) {
      case "h1": out.push(`# ${b.text}\n`); break;
      case "h2": out.push(`\n## ${b.text}\n`); break;
      case "h3": out.push(`\n### ${b.text}\n`); break;
      case "p": out.push(`${b.text}\n`); break;
      case "li": out.push(`- ${b.text}`); break;
      case "table": {
        if (b.head && b.rows) {
          out.push(`\n| ${b.head.join(" | ")} |`);
          out.push(`| ${b.head.map(() => "---").join(" | ")} |`);
          for (const r of b.rows) out.push(`| ${r.map((c) => c.replace(/\|/g, "\\|").replace(/\n/g, " ")).join(" | ")} |`);
          out.push("");
        }
        break;
      }
    }
  }
  return out.join("\n");
}

/** Render blocks to a standalone, print-ready HTML document (PDF fallback). */
export function renderHtml(pkg: PolicyPackage, lang: Lang, section: Section = "full"): string {
  const blocks = renderBlocks(pkg, lang, section);
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const body: string[] = [];
  for (const b of blocks) {
    switch (b.type) {
      case "h1": body.push(`<h1>${esc(b.text!)}</h1>`); break;
      case "h2": body.push(`<h2>${esc(b.text!)}</h2>`); break;
      case "h3": body.push(`<h3>${esc(b.text!)}</h3>`); break;
      case "p": body.push(`<p>${esc(b.text!)}</p>`); break;
      case "li": body.push(`<li>${esc(b.text!)}</li>`); break;
      case "table": {
        if (b.head && b.rows) {
          const head = `<tr>${b.head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr>`;
          const rows = b.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("");
          body.push(`<table>${head}${rows}</table>`);
        }
        break;
      }
    }
  }
  // group consecutive <li> into <ul>
  const grouped = body.join("\n").replace(/(<li>.*?<\/li>\n?)+/gs, (m) => `<ul>\n${m}</ul>\n`);
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">
<title>${esc(tr(pkg.title, lang))}</title>
<style>
  body{font-family:Georgia,'Times New Roman',serif;color:#1a2233;max-width:820px;margin:40px auto;padding:0 24px;line-height:1.5}
  h1{font-size:26px;border-bottom:3px solid #b8954f;padding-bottom:8px;color:#15233f}
  h2{font-size:20px;color:#15233f;margin-top:28px;border-bottom:1px solid #e3e7ee;padding-bottom:4px}
  h3{font-size:16px;color:#26334d;margin-top:18px}
  table{border-collapse:collapse;width:100%;margin:12px 0;font-size:13px}
  th,td{border:1px solid #cfd6e2;padding:6px 8px;text-align:left;vertical-align:top}
  th{background:#15233f;color:#fff}
  ul{margin:8px 0 8px 18px}
  @media print{body{margin:0}}
</style></head><body>
${grouped}
<hr><p style="font-size:12px;color:#667">${esc(CORE_DISCLAIMER[lang])}</p>
</body></html>`;
}

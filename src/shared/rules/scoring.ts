import type {
  AIUseQuestionnaireResponse,
  L,
  ReadinessBand,
  ReadinessScore,
  ScoreBreakdownItem,
  ScoringRule,
} from "../types";

const l = (en: string, es: string, zh: string): L => ({ en, es, zh });

/**
 * Default scoring rules. The readiness score rewards governance CONTROLS that
 * are present (roles, review, disclosure, incident, vendor, training,
 * restrictions, tool hygiene). Categories B (usage breadth) and D (what may be
 * entered) are informational/risk signals and carry max 0 — they drive
 * findings, not the score. Maxes sum to 100.
 *
 * This is explicitly an "AI governance readiness score", NOT a compliance
 * score, and never certifies legal compliance.
 */
export const SCORING_RULES: ScoringRule[] = [
  { category: "A", label: l("Governance roles & ownership", "Roles y responsabilidad de gobernanza", "治理角色与职责归属"), max: 14 },
  { category: "B", label: l("Current AI use (informational)", "Uso actual de IA (informativo)", "当前人工智能使用情况（仅供参考）"), max: 0 },
  { category: "C", label: l("Tool governance & review", "Gobernanza y revisión de herramientas", "工具治理与审查"), max: 12 },
  { category: "D", label: l("Data exposure (informational)", "Exposición de datos (informativo)", "数据暴露情况（仅供参考）"), max: 0 },
  { category: "E", label: l("Human-review coverage", "Cobertura de revisión humana", "人工审核覆盖范围"), max: 16 },
  { category: "F", label: l("Disclosure rules", "Reglas de divulgación", "披露规则"), max: 8 },
  { category: "G", label: l("Incident-reporting process", "Proceso de reporte de incidentes", "事件报告流程"), max: 12 },
  { category: "H", label: l("Vendor review", "Revisión de proveedores", "供应商审查"), max: 12 },
  { category: "I", label: l("AI literacy & training", "Alfabetización y formación en IA", "AI 素养与培训"), max: 14 },
  { category: "J", label: l("Prohibited/restricted-use rules", "Reglas de uso prohibido/restringido", "禁止/限制使用规则"), max: 12 },
];

/** Number of options available per multi-select question (denominators). */
const DENOM: Record<string, number> = {
  governanceRoles: 5,
  humanReview: 8,
  disclosure: 6,
  incidentProcess: 9,
  vendorReview: 11,
  training: 12,
  restrictions: 10,
};

function arr(v: unknown): string[] {
  return Array.isArray(v) ? (v as string[]) : [];
}

function band(value: number): ReadinessBand {
  if (value <= 25) return "early";
  if (value <= 50) return "developing";
  if (value <= 75) return "structured";
  return "mature";
}

export const BAND_LABEL: Record<ReadinessBand, L> = {
  early: l("Early stage", "Etapa inicial", "起步阶段"),
  developing: l("Developing", "En desarrollo", "发展中"),
  structured: l("Structured", "Estructurada", "结构化"),
  mature: l("Mature", "Madura", "成熟"),
};

export function computeScore(
  resp: AIUseQuestionnaireResponse,
  rules: ScoringRule[] = SCORING_RULES,
): ReadinessScore {
  const a = resp.answers;
  const breakdown: ScoreBreakdownItem[] = [];
  let total = 0;
  let maxTotal = 0;

  for (const rule of rules) {
    let earned = 0;
    let notes: L = l(
      "Informational only — not scored.",
      "Solo informativo — no puntúa.",
      "仅供参考——不计入评分。",
    );

    if (rule.max > 0) {
      switch (rule.category) {
        case "A": {
          const roles = arr(a.governanceRoles);
          earned = Math.round((rule.max * roles.length) / DENOM.governanceRoles);
          notes = l(
            `${roles.length} of ${DENOM.governanceRoles} governance roles present.`,
            `${roles.length} de ${DENOM.governanceRoles} roles de gobernanza presentes.`,
            `已具备 ${roles.length}/${DENOM.governanceRoles} 个治理角色。`,
          );
          break;
        }
        case "C": {
          const tools = resp.tools ?? [];
          if (tools.length === 0) {
            earned = rule.max;
            notes = l(
              "No specific tools recorded.",
              "No se registraron herramientas específicas.",
              "未记录具体工具。",
            );
          } else {
            const per = tools.map(
              (t) =>
                (t.status !== "unknown" ? 0.5 : 0) +
                (t.securityReviewed === "yes" ? 0.25 : 0) +
                (t.termsReviewed === "yes" ? 0.25 : 0),
            );
            const avg = per.reduce((x, y) => x + y, 0) / tools.length;
            earned = Math.round(rule.max * avg);
            const reviewed = tools.filter((t) => t.securityReviewed === "yes").length;
            notes = l(
              `${reviewed} of ${tools.length} tools security-reviewed.`,
              `${reviewed} de ${tools.length} herramientas con revisión de seguridad.`,
              `已对 ${reviewed}/${tools.length} 个工具完成安全审查。`,
            );
          }
          break;
        }
        default: {
          const key = {
            E: "humanReview",
            F: "disclosure",
            G: "incidentProcess",
            H: "vendorReview",
            I: "training",
            J: "restrictions",
          }[rule.category as "E" | "F" | "G" | "H" | "I" | "J"];
          if (key) {
            const selected = arr(a[key]);
            const denom = DENOM[key] ?? 1;
            earned = Math.round((rule.max * selected.length) / denom);
            notes = l(
              `${selected.length} of ${denom} controls present.`,
              `${selected.length} de ${denom} controles presentes.`,
              `已具备 ${selected.length}/${denom} 项控制措施。`,
            );
          }
        }
      }
    }

    earned = Math.max(0, Math.min(rule.max, earned));
    total += earned;
    maxTotal += rule.max;
    breakdown.push({ category: rule.category, label: rule.label, earned, max: rule.max, notes });
  }

  const value = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;
  const b = band(value);

  return {
    value,
    band: b,
    bandLabel: BAND_LABEL[b],
    summary: l(
      `AI governance readiness score: ${value}/100 (${BAND_LABEL[b].en.toLowerCase()}). This indicates how structured your internal AI governance is. It is not a measure of legal compliance.`,
      `Puntuación de preparación en gobernanza de IA: ${value}/100 (${BAND_LABEL[b].es.toLowerCase()}). Indica cómo de estructurada está su gobernanza interna de IA. No es una medida de cumplimiento legal.`,
      `人工智能治理准备度评分：${value}/100（${BAND_LABEL[b].zh ?? BAND_LABEL[b].en}）。该评分反映贵公司内部人工智能治理的结构化程度，不构成对法律合规情况的衡量。`,
    ),
    breakdown,
  };
}

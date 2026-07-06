/**
 * Rules engine: maps questionnaire answers to a preliminary, bilingual
 * governance package — findings, risk flags, policy clauses, controls and
 * recommended workflows. This is deliberately rule-based and explainable, not
 * a black box.
 *
 * Safety invariants enforced here and covered by tests:
 *  - Never claims the company is "fully compliant".
 *  - Never presents output as "final legal advice".
 *  - Output is always "preliminary" / "draft" / "for review".
 *  - Nothing is invented: tools, data types and controls come from answers.
 */

import type {
  AdminConfig,
  AIUseQuestionnaireResponse,
  ApprovedToolRule,
  ChecklistItem,
  CompanyProfile,
  DisclosureRule,
  GovernanceFinding,
  HumanReviewRow,
  IncidentWorkflow,
  L,
  PolicyClause,
  PolicyPackage,
  PolicySection,
  SensitiveDataRule,
} from "../types";
import { POLICY_SECTION_ORDER } from "../seed/templates";
import { computeScore } from "./scoring";

const l = (en: string, es: string, zh: string): L => ({ en, es, zh });

function interp(text: L, vars: Record<string, string>): L {
  const apply = (s: string) =>
    s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
  return { en: apply(text.en), es: apply(text.es), ...(text.zh !== undefined ? { zh: apply(text.zh) } : {}) };
}

function arr(v: unknown): string[] {
  return Array.isArray(v) ? (v as string[]) : [];
}

export interface GenerateInput {
  sessionId: string;
  profile?: CompanyProfile;
  questionnaire: AIUseQuestionnaireResponse;
  config: AdminConfig;
  createdAt: string;
}

/* Sensitive data types tracked for the sensitive-data rules + stricter logic. */
const SENSITIVE_TYPES: { id: string; label: L }[] = [
  { id: "personal", label: l("Personal data", "Datos personales", "个人数据") },
  { id: "client", label: l("Client/customer data", "Datos de clientes", "客户数据") },
  { id: "confidential", label: l("Confidential information", "Información confidencial", "机密信息") },
  { id: "sourceCode", label: l("Source code", "Código fuente", "源代码") },
  { id: "contracts", label: l("Contracts", "Contratos", "合同") },
  { id: "financial", label: l("Financial information", "Información financiera", "财务信息") },
  { id: "employee", label: l("Employee data", "Datos de empleados", "员工数据") },
  { id: "health", label: l("Health data", "Datos de salud", "健康数据") },
  { id: "legal", label: l("Legal/privileged material", "Material legal/privilegiado", "法律/受特权保护的材料") },
  { id: "tradeSecrets", label: l("Trade secrets", "Secretos comerciales", "商业秘密") },
  { id: "credentials", label: l("Credentials, passwords, tokens or API keys", "Credenciales, contraseñas, tokens o claves API", "凭据、密码、令牌或 API 密钥") },
  { id: "regulatory", label: l("Sensitive regulatory data", "Datos regulatorios sensibles", "敏感监管数据") },
];

const HIGH_IMPACT_REVIEW = ["clientComms", "legalCompliance", "employment", "financial", "regulated"];

export function generatePackage(input: GenerateInput): PolicyPackage {
  const { questionnaire: q, config, profile, createdAt } = input;
  const a = q.answers;
  const clauses = config.templates.clauses;

  const companyName =
    (profile?.companyName || (a.companyName as string) || "").trim() || "Your company";

  // Determine policy owner from governance roles (no invention — default placeholder).
  const roles = arr(a.governanceRoles);
  const ownerL: L = roles.includes("aiOwner")
    ? l("AI governance owner", "Responsable de gobernanza de IA", "人工智能治理负责人")
    : roles.includes("compliance")
      ? l("Compliance officer", "Responsable de cumplimiento", "合规负责人")
      : roles.includes("legal")
        ? l("Legal team", "Equipo jurídico", "法务团队")
        : roles.includes("dpo")
          ? l("Data Protection Officer", "Delegado de Protección de Datos", "数据保护官（DPO）")
          : l("to be assigned", "por asignar", "待指定");

  const vars = { company: companyName, owner: ownerL.en };
  const varsEs = { company: companyName, owner: ownerL.es };
  const varsZh = { company: companyName, owner: ownerL.zh ?? ownerL.en };

  // helper that pulls a clause from the (admin-editable) library and interpolates
  const C = (id: string): PolicyClause | null => {
    const base = clauses[id];
    if (!base) return null;
    return {
      id,
      text: { en: interp(base, vars).en, es: interp(base, varsEs).es, zh: interp(base, varsZh).zh },
    };
  };

  const dataInputs = arr(a.dataInputs);
  const dataTypes = arr(a.dataTypes);
  const toolsUsed = arr(a.toolsUsed);
  const humanReview = arr(a.humanReview);
  const disclosure = arr(a.disclosure);
  // "noProcess" is the exclusive "we have no incident-reporting process"
  // option: it is an explicit gap signal, not a control.
  const incidentProcessAll = arr(a.incidentProcess);
  const noIncidentProcess = incidentProcessAll.includes("noProcess");
  const incidentProcess = incidentProcessAll.filter((v) => v !== "noProcess");
  const vendorReview = arr(a.vendorReview);
  const training = arr(a.training);
  const restrictions = arr(a.restrictions);
  const regulated = a.regulatedSector === "yes";

  const usesSensitive = dataInputs.some((d) =>
    ["personal", "client", "confidential", "sourceCode", "contracts", "financial", "employee", "health", "legal", "tradeSecrets", "credentials", "regulatory"].includes(d),
  );
  const usesHealth = dataInputs.includes("health") || dataTypes.includes("health");
  const usesChildren = dataTypes.includes("children");

  // Public tools (free/unknown plan) that are public-by-default in the catalog.
  const catalogById = new Map(config.tools.map((t) => [t.id, t]));
  const publicToolsInUse = (q.tools ?? []).filter((rec) => {
    const cat = catalogById.get(rec.toolId);
    return cat?.publicByDefault && (rec.plan === "free" || rec.plan === "unknown" || rec.plan === "mixed");
  });
  // Also count selected tools that are public-by-default but lack a detailed record.
  const publicSelectedNoRecord = toolsUsed.filter(
    (id) => catalogById.get(id)?.publicByDefault && !(q.tools ?? []).some((r) => r.toolId === id),
  );
  const confidentialish = dataInputs.some((d) =>
    ["personal", "client", "confidential", "tradeSecrets", "legal", "health"].includes(d),
  );
  const highRiskPublic =
    confidentialish && (publicToolsInUse.length > 0 || publicSelectedNoRecord.length > 0);

  /* ---------------- Findings ---------------- */
  const findings: GovernanceFinding[] = [];
  const push = (f: GovernanceFinding) => findings.push(f);

  if (usesSensitive) {
    push({
      id: "sensitive-data-use",
      area: "D",
      severity: usesHealth || dataInputs.includes("credentials") ? "high" : "medium",
      title: l("Sensitive data may be entered into AI tools", "Pueden introducirse datos sensibles en herramientas de IA", "敏感数据可能被输入人工智能工具"),
      detail: l(
        "Employees may currently input sensitive data into AI tools. This requires stricter sensitive-data rules and tool restrictions.",
        "Los empleados pueden introducir actualmente datos sensibles en herramientas de IA. Esto requiere reglas más estrictas sobre datos sensibles y restricciones de herramientas.",
        "员工目前可能将敏感数据输入人工智能工具。这需要更严格的敏感数据规则和工具限制。",
      ),
      recommendation: l(
        "Apply the stricter sensitive-data rules in this package and restrict sensitive data to approved, enterprise-grade tools.",
        "Aplique las reglas más estrictas sobre datos sensibles de este paquete y limite los datos sensibles a herramientas empresariales aprobadas.",
        "请应用本方案包中更严格的敏感数据规则，并将敏感数据限制在经批准的企业级工具中使用。",
      ),
      triggeredBy: dataInputs,
    });
  }

  if (dataInputs.includes("anonymized")) {
    push({
      id: "anonymized-data",
      area: "D",
      severity: "low",
      title: l(
        "Anonymized or pseudonymized data in use",
        "Uso de datos anonimizados o seudonimizados",
        "使用匿名化或假名化数据",
      ),
      detail: l(
        "The company indicates it uses anonymized or pseudonymized data. This may reduce certain privacy risks, but it should be reviewed whether anonymization is irreversible or whether pseudonymization allows re-identification.",
        "La empresa indica que utiliza datos anonimizados o seudonimizados. Esto puede reducir ciertos riesgos de privacidad, pero debe revisarse si la anonimización es irreversible o si la seudonimización permite reidentificación.",
        "企业表示其使用匿名化或假名化数据。这可以降低某些隐私风险，但应审查匿名化是否不可逆，以及假名化是否可能允许重新识别。",
      ),
      recommendation: l(
        "Have qualified professionals verify the robustness of the anonymization/pseudonymization and document the assessment.",
        "Haga que profesionales cualificados verifiquen la solidez de la anonimización/seudonimización y documenten la evaluación.",
        "请由合格的专业人士核实匿名化/假名化的可靠性，并将评估记录在案。",
      ),
      triggeredBy: ["dataInputs: anonymized"],
    });
  }

  if (dataInputs.includes("none")) {
    push({
      id: "no-sensitive-data-identified",
      area: "D",
      severity: "low",
      title: l(
        "No sensitive data categories identified",
        "Sin categorías de datos sensibles identificadas",
        "未识别敏感数据类别",
      ),
      detail: l(
        "The company has not identified the use of the sensitive data categories listed in this section.",
        "La empresa no ha identificado el uso de las categorías de datos sensibles listadas en esta sección.",
        "企业未发现使用本节所列的敏感数据类别。",
      ),
      recommendation: l(
        "Keep this under periodic review: AI use evolves quickly, and new data categories may enter AI tools over time.",
        "Manténgalo bajo revisión periódica: el uso de IA evoluciona rápido y nuevas categorías de datos pueden entrar en las herramientas con el tiempo.",
        "请定期复查这一情况：人工智能的使用变化很快，新的数据类别可能随时间进入人工智能工具。",
      ),
      triggeredBy: ["dataInputs: none"],
    });
  }

  if (highRiskPublic) {
    push({
      id: "public-tool-confidential",
      area: "C",
      severity: "high",
      title: l("High risk: confidential data with public AI tools", "Riesgo alto: datos confidenciales con IA pública", "高风险：在公共人工智能工具中使用机密数据"),
      detail: l(
        "Confidential, personal or client data may be entering public/free AI tools that can use inputs to train models. This is a high-risk combination.",
        "Datos confidenciales, personales o de clientes pueden estar entrando en herramientas de IA públicas/gratuitas que pueden usar las entradas para entrenar modelos. Es una combinación de alto riesgo.",
        "机密信息、个人数据或客户数据可能正在进入可将输入用于训练模型的公共/免费人工智能工具。这是一种高风险组合。",
      ),
      recommendation: l(
        "Prohibit confidential data in public tools and migrate to approved enterprise tools with suitable contractual terms.",
        "Prohíba los datos confidenciales en herramientas públicas y migre a herramientas empresariales aprobadas con términos contractuales adecuados.",
        "请禁止在公共工具中输入机密数据，并迁移至具备适当合同条款的经批准企业级工具。",
      ),
      triggeredBy: [...publicToolsInUse.map((t) => t.toolName), ...publicSelectedNoRecord],
    });
  }

  const missingHighImpactReview = HIGH_IMPACT_REVIEW.filter((c) => !humanReview.includes(c));
  if (missingHighImpactReview.length > 0) {
    push({
      id: "missing-human-review",
      area: "E",
      severity: missingHighImpactReview.length >= 3 ? "high" : "medium",
      title: l("Human review missing in high-impact contexts", "Falta revisión humana en contextos de alto impacto", "高影响场景缺少人工审核"),
      detail: l(
        "AI outputs are not consistently reviewed by a human before use in high-impact contexts such as client, legal, employment, financial or regulated work.",
        "Los resultados de IA no se revisan de forma consistente por un humano antes de usarse en contextos de alto impacto como trabajo con clientes, legal, laboral, financiero o regulado.",
        "在客户、法律、劳动人事、财务或受监管工作等高影响场景中，人工智能输出在使用前未得到一致的人工审核。",
      ),
      recommendation: l(
        "Require human review before AI output is used in the listed high-impact contexts.",
        "Exija revisión humana antes de usar resultados de IA en los contextos de alto impacto listados.",
        "请要求在所列高影响场景中使用人工智能输出前进行人工审核。",
      ),
      triggeredBy: missingHighImpactReview,
    });
  }

  if (incidentProcess.length === 0 || noIncidentProcess) {
    push({
      id: "no-incident-process",
      area: "G",
      severity: "high",
      title: l("No AI incident-reporting process", "Sin proceso de reporte de incidentes de IA", "缺少人工智能事件报告流程"),
      detail: l(
        noIncidentProcess
          ? "The company states it does not currently have an incident-reporting process for AI-related incidents. This is a governance gap."
          : "There is no process for reporting AI incidents such as accidental data uploads, harmful output or unauthorized tool use.",
        noIncidentProcess
          ? "La empresa indica que no cuenta actualmente con un proceso de reporte de incidentes relacionados con IA. Esto es una brecha de gobernanza."
          : "No existe un proceso para reportar incidentes de IA como subidas accidentales de datos, resultados dañinos o uso de herramientas no autorizadas.",
        noIncidentProcess
          ? "企业表示目前没有针对人工智能相关事件的报告流程。这是一项治理缺口。"
          : "目前没有用于报告人工智能事件（如数据意外上传、有害输出或未经授权使用工具）的流程。",
      ),
      recommendation: l(
        "Adopt the incident-reporting process included in this package: establish an internal reporting channel, define responsible owners, document incidents, create a review protocol, set response times, and escalate relevant incidents to legal/compliance/IT/security.",
        "Adopte el proceso de reporte de incidentes incluido en este paquete: establezca un canal interno de reporte, defina responsables, documente los incidentes, cree un protocolo de revisión, establezca tiempos de respuesta y escale los incidentes relevantes a legal/cumplimiento/TI/seguridad.",
        "请采用本方案包中包含的事件报告流程：建立内部报告渠道，明确负责人，记录事件，制定审查规程，设定响应时限，并将重大事件上报法务/合规/IT/安全部门。",
      ),
      triggeredBy: noIncidentProcess ? ["incidentProcess: noProcess"] : ["incidentProcess: none selected"],
    });
  }

  const trainingDenom = 12;
  if (training.length === 0) {
    push({
      id: "no-ai-literacy",
      area: "I",
      severity: "high",
      title: l("No AI literacy training", "Sin formación en alfabetización de IA", "缺少 AI 素养培训"),
      detail: l(
        "Employees do not receive AI literacy training. This is a priority gap given current AI use.",
        "Los empleados no reciben formación en alfabetización de IA. Es una brecha prioritaria dado el uso actual de IA.",
        "员工未接受 AI 素养培训。鉴于当前的人工智能使用情况，这是一个需要优先解决的缺口。",
      ),
      recommendation: l(
        "Roll out the AI literacy checklist in this package as a priority.",
        "Implemente el checklist de alfabetización en IA de este paquete como prioridad.",
        "请优先落实本方案包中的 AI 素养清单。",
      ),
      triggeredBy: ["training: none selected"],
    });
  } else if (training.length < trainingDenom / 2) {
    push({
      id: "partial-ai-literacy",
      area: "I",
      severity: "medium",
      title: l("AI literacy training is incomplete", "La formación en alfabetización de IA es incompleta", "AI 素养培训不完整"),
      detail: l(
        "Employees receive only partial AI training. Key topics may be missing.",
        "Los empleados reciben solo formación parcial en IA. Pueden faltar temas clave.",
        "员工仅接受了部分人工智能培训，可能缺少关键主题。",
      ),
      recommendation: l(
        "Use the AI literacy checklist to cover the remaining topics.",
        "Use el checklist de alfabetización para cubrir los temas restantes.",
        "请使用 AI 素养清单覆盖其余主题。",
      ),
      triggeredBy: training,
    });
  }

  if (toolsUsed.length > 0 && vendorReview.length === 0) {
    push({
      id: "no-vendor-review",
      area: "H",
      severity: "high",
      title: l("AI vendors used without review", "Proveedores de IA usados sin revisión", "使用人工智能供应商但未经审查"),
      detail: l(
        "AI tools are in use but vendors are not reviewed for data processing, training on data, security or contractual terms.",
        "Se usan herramientas de IA pero no se revisa a los proveedores en cuanto a tratamiento de datos, entrenamiento con datos, seguridad o términos contractuales.",
        "已在使用人工智能工具，但未就数据处理、是否使用数据进行训练、安全性或合同条款对供应商进行审查。",
      ),
      recommendation: l(
        "Adopt the vendor-approval workflow in this package before further tool adoption.",
        "Adopte el flujo de aprobación de proveedores de este paquete antes de adoptar más herramientas.",
        "在进一步采用工具之前，请采用本方案包中的供应商审批流程。",
      ),
      triggeredBy: toolsUsed,
    });
  }

  if (roles.length === 0) {
    push({
      id: "no-governance-owner",
      area: "A",
      severity: "medium",
      title: l("No governance roles assigned", "Sin roles de gobernanza asignados", "未指定治理角色"),
      detail: l(
        "No DPO, compliance, legal, IT/security or AI governance owner is identified to own AI governance.",
        "No se identifica un DPO, cumplimiento, legal, TI/seguridad ni responsable de gobernanza de IA para liderar la gobernanza de IA.",
        "未确定数据保护官（DPO）、合规、法务、IT/安全或人工智能治理负责人来主导人工智能治理。",
      ),
      recommendation: l(
        "Assign an AI governance owner responsible for this policy.",
        "Asigne un responsable de gobernanza de IA encargado de esta política.",
        "请指定一名负责本政策的人工智能治理负责人。",
      ),
      triggeredBy: ["governanceRoles: none selected"],
    });
  }

  if (regulated) {
    push({
      id: "regulated-sector",
      area: "A",
      severity: "medium",
      title: l("Regulated sector — additional controls", "Sector regulado — controles adicionales", "受监管行业 — 附加控制措施"),
      detail: l(
        "Operating in a regulated sector means AI use may be subject to sector-specific rules requiring professional review.",
        "Operar en un sector regulado implica que el uso de IA puede estar sujeto a normas sectoriales que requieren revisión profesional.",
        "在受监管行业运营意味着人工智能的使用可能受特定行业规则约束，需要专业审查。",
      ),
      recommendation: l(
        "Have qualified professionals map sector rules to your AI use cases.",
        "Haga que profesionales cualificados asignen las normas del sector a sus casos de uso de IA.",
        "请由合格的专业人士将行业规则对应到贵公司的人工智能使用场景。",
      ),
      triggeredBy: ["regulatedSector: yes"],
    });
  }

  /* ---------------- Policy sections ---------------- */
  const policy: PolicySection[] = POLICY_SECTION_ORDER.map((sec) => {
    const out: PolicyClause[] = [];
    const add = (id: string) => {
      const c = C(id);
      if (c) out.push(c);
    };
    add(`${sec.id}.base`);
    switch (sec.id) {
      case "purposeScope":
        if (regulated) add("purposeScope.regulated");
        break;
      case "approvedTools":
        if ((q.tools ?? []).some((t) => t.status === "unknown") || toolsUsed.length === 0)
          add("approvedTools.unknownStatus");
        if ((q.tools ?? []).some((t) => t.account === "personal" || t.account === "mixed"))
          add("approvedTools.personalAccounts");
        break;
      case "restrictedUses":
        if (arr(a.aiUses).includes("coding") || toolsUsed.includes("github-copilot")) add("restrictedUses.code");
        if (arr(a.aiUses).includes("media") || toolsUsed.some((t) => ["midjourney", "dalle"].includes(t)))
          add("restrictedUses.media");
        break;
      case "prohibitedUses":
        if (restrictions.includes("confidentialToPublic") || highRiskPublic) add("prohibitedUses.confidentialPublic");
        if (restrictions.includes("finalDecisions")) add("prohibitedUses.finalDecisions");
        if (restrictions.includes("automatedHiring") || restrictions.includes("surveillance"))
          add("prohibitedUses.automatedHiring");
        break;
      case "sensitiveData":
        if (usesHealth) add("sensitiveData.health");
        if (usesChildren) add("sensitiveData.children");
        break;
      case "security":
        if ((q.tools ?? []).some((t) => t.securityReviewed !== "yes")) add("security.noReview");
        break;
    }
    return { id: sec.id, title: sec.title, clauses: out };
  });

  /* ---------------- Approved-tools list ---------------- */
  const approvedTools = buildApprovedTools(q, config, highRiskPublic);

  /* ---------------- Sensitive-data rules ---------------- */
  const sensitiveDataRules: SensitiveDataRule[] = SENSITIVE_TYPES.map((s) => {
    const entered = dataInputs.includes(s.id);
    const special =
      s.id === "health"
        ? l(
            "Never enter health data into AI tools that are not specifically approved and contracted for health data.",
            "Nunca introduzca datos de salud en herramientas de IA que no estén específicamente aprobadas y contratadas para datos de salud.",
            "切勿将健康数据输入未经专门批准并就健康数据签订合同的人工智能工具。",
          )
        : s.id === "credentials"
          ? l(
              "Never enter credentials, passwords, API keys or secrets into any AI tool.",
              "Nunca introduzca credenciales, contraseñas, claves API o secretos en ninguna herramienta de IA.",
              "切勿将凭据、密码、API 密钥或其他机密凭证输入任何人工智能工具。",
            )
          : l(
              `Do not enter ${s.label.en.toLowerCase()} into AI tools unless the specific tool is approved for it.`,
              `No introduzca ${s.label.es.toLowerCase()} en herramientas de IA salvo que la herramienta concreta esté aprobada para ello.`,
              `不得将${s.label.zh ?? s.label.en}输入人工智能工具，除非该特定工具已获批准用于此类数据。`,
            );
    return {
      id: s.id,
      dataType: s.label,
      rule: special,
      severity: s.id === "health" || s.id === "credentials" || s.id === "tradeSecrets" ? "high" : entered ? "high" : "medium",
    };
  });

  /* ---------------- Human-review requirements ---------------- */
  const humanReviewRows: HumanReviewRow[] = [
    rrow("clientComms", l("Client communications", "Comunicaciones con clientes", "客户沟通")),
    rrow("legalCompliance", l("Legal / compliance analysis", "Análisis legal / de cumplimiento", "法律 / 合规分析")),
    rrow("employment", l("HR / employment decisions", "Decisiones de RR. HH. / laborales", "人力资源 / 劳动人事决策")),
    rrow("financial", l("Financial decisions", "Decisiones financieras", "财务决策")),
    rrow("codeDeploy", l("Code deployment", "Despliegue de código", "代码部署")),
    rrow("marketing", l("Public marketing content", "Contenido de marketing público", "公开营销内容")),
    rrow("support", l("Customer support", "Atención al cliente", "客户支持")),
    rrow("regulated", l("Regulated / high-impact activities", "Actividades reguladas / de alto impacto", "受监管 / 高影响活动")),
  ];
  function rrow(key: string, context: L): HumanReviewRow {
    const covered = humanReview.includes(key);
    return {
      context,
      required: true,
      requirement: covered
        ? l("Required — currently performed. Keep documenting the reviewer.", "Obligatoria — actualmente se realiza. Siga documentando al revisor.", "必需 — 目前已执行。请继续记录审核人。")
        : l("Required before use — currently a gap to close.", "Obligatoria antes de usar — actualmente una brecha por cerrar.", "使用前必需 — 目前是有待弥补的缺口。"),
    };
  }

  /* ---------------- Disclosure rules ---------------- */
  const disclosureRules: DisclosureRule[] = [
    drow("internal", l("Internal use of AI", "Uso interno de IA", "人工智能的内部使用")),
    drow("clients", l("Communications to clients/customers", "Comunicaciones a clientes", "面向客户的沟通")),
    drow("public", l("Public-facing content", "Contenido público", "面向公众的内容")),
    drow("media", l("AI-generated images/audio/video", "Imágenes/audio/vídeo generados por IA", "人工智能生成的图像/音频/视频")),
    drow("decisions", l("Decisions based on AI output", "Decisiones basadas en resultados de IA", "基于人工智能输出的决策")),
    drow("regulated", l("AI used in regulated work", "IA usada en trabajo regulado", "在受监管工作中使用人工智能")),
  ];
  function drow(key: string, context: L): DisclosureRule {
    const have = disclosure.includes(key);
    const mustRequired = ["public", "media", "regulated"].includes(key);
    return {
      context,
      required: mustRequired || have,
      rule: mustRequired
        ? l("Disclosure recommended/required — adopt a clear rule.", "Divulgación recomendada/obligatoria — adopte una regla clara.", "建议/要求进行披露 — 请制定明确的规则。")
        : have
          ? l("Disclosure rule already exists — keep it documented.", "Ya existe una regla de divulgación — manténgala documentada.", "已有披露规则 — 请保持书面记录。")
          : l("Consider whether disclosure is appropriate here.", "Considere si la divulgación es apropiada aquí.", "请考虑此处是否适宜进行披露。"),
    };
  }

  /* ---------------- Incident workflow ---------------- */
  const incident = buildIncident();

  /* ---------------- AI literacy checklist ---------------- */
  const literacyTopicMap: Record<string, string> = {
    limitations: "capabilities",
    verify: "hallucinations",
    confidential: "confidentiality",
    personal: "personalData",
    ip: "ip",
    hallucinations: "hallucinations",
    review: "oversight",
    approvedTools: "approvedTools",
    report: "reporting",
  };
  const aiLiteracy: ChecklistItem[] = config.literacy.map((item) => {
    const topic = literacyTopicMap[item.id];
    const covered = topic ? training.includes(topic) : false;
    return { id: item.id, text: item.text, priority: !covered };
  });

  /* ---------------- Vendor workflow ---------------- */
  const vendorWorkflow = structuredClone(config.vendorWorkflow);

  /* ---------------- Missing information ---------------- */
  const missingInfo: L[] = [];
  const need = (cond: boolean, en: string, es: string, zh: string) => {
    if (cond) missingInfo.push(l(en, es, zh));
  };
  need(!companyName || companyName === "Your company", "Company name not provided.", "No se indicó el nombre de la empresa.", "未提供公司名称。");
  need(!(a.industry as string), "Industry not provided.", "No se indicó el sector.", "未提供所属行业。");
  need(!(a.country as string), "Country / jurisdiction not provided.", "No se indicó el país / jurisdicción.", "未提供国家 / 司法管辖区。");
  need(a.regulatedSector === "unknown" || a.regulatedSector == null, "Regulated-sector status unknown.", "Estado de sector regulado desconocido.", "受监管行业状态未知。");
  need(arr(a.aiUses).length === 0, "No current AI uses recorded.", "No se registraron usos actuales de IA.", "未记录当前的人工智能用途。");
  need(toolsUsed.length === 0, "No AI tools recorded.", "No se registraron herramientas de IA.", "未记录任何人工智能工具。");
  need((q.tools ?? []).some((t) => t.trainsOnData === "unknown"), "For some tools, it is unknown whether data is used for training.", "Para algunas herramientas se desconoce si los datos se usan para entrenamiento.", "对于部分工具，尚不清楚数据是否被用于训练。");
  need(roles.length === 0, "No governance roles identified.", "No se identificaron roles de gobernanza.", "未确定治理角色。");
  need(dataInputs.length === 0, "Data employees may enter was not specified.", "No se especificó qué datos pueden introducir los empleados.", "未说明员工可能输入的数据。");

  /* ---------------- Next steps ---------------- */
  const nextSteps: L[] = [];
  const step = (en: string, es: string, zh: string) => nextSteps.push(l(en, es, zh));
  step("Have this preliminary package reviewed and adapted by qualified professionals.", "Haga que profesionales cualificados revisen y adapten este paquete preliminar.", "请由合格的专业人士审查并调整本初步方案包。");
  if (highRiskPublic) step("Immediately restrict confidential data in public AI tools.", "Restrinja de inmediato los datos confidenciales en herramientas de IA públicas.", "请立即限制在公共人工智能工具中使用机密数据。");
  if (roles.length === 0) step("Assign an AI governance owner.", "Asigne un responsable de gobernanza de IA.", "请指定一名人工智能治理负责人。");
  if (incidentProcess.length === 0) step("Stand up the incident-reporting process.", "Ponga en marcha el proceso de reporte de incidentes.", "请建立事件报告流程。");
  if (training.length < 6) step("Schedule AI literacy training for employees.", "Programe formación en alfabetización de IA para empleados.", "请为员工安排 AI 素养培训。");
  if (vendorReview.length === 0 && toolsUsed.length > 0) step("Run approved tools through the vendor-approval workflow.", "Pase las herramientas aprobadas por el flujo de aprobación de proveedores.", "请将批准工具纳入供应商审批流程进行评估。");
  step("Re-run this assessment after implementing changes to track progress.", "Vuelva a ejecutar esta evaluación tras implementar cambios para medir el progreso.", "在实施变更后请重新进行本评估，以跟踪进展。");

  /* ---------------- Score & summary ---------------- */
  const score = computeScore(q, config.scoring);

  const highCount = findings.filter((f) => f.severity === "high").length;
  const executiveSummary: L = {
    en: `This is a preliminary AI governance package for ${companyName}. Its AI governance readiness score is ${score.value}/100 (${score.bandLabel.en.toLowerCase()}). It identifies ${findings.length} finding(s), including ${highCount} high-priority item(s), and provides draft policies, controls and workflows. It is not legal advice and is not a final compliance review; it should be reviewed and adapted by qualified professionals before implementation.`,
    es: `Este es un paquete preliminar de gobernanza de IA para ${companyName}. Su puntuación de preparación en gobernanza de IA es ${score.value}/100 (${score.bandLabel.es.toLowerCase()}). Identifica ${findings.length} hallazgo(s), incluidos ${highCount} de alta prioridad, y ofrece políticas, controles y flujos en borrador. No constituye asesoramiento jurídico ni una revisión final de cumplimiento; debe ser revisado y adaptado por profesionales cualificados antes de su implementación.`,
    zh: `这是为${companyName}准备的初步人工智能治理方案包。其人工智能治理准备度评分为${score.value}/100（${score.bandLabel.zh ?? score.bandLabel.en}）。方案共识别出${findings.length}项发现（其中${highCount}项为高优先级），并提供政策、控制措施和流程的草案。本材料不构成法律意见，也不属于最终合规审查；在实施之前，应由合格的专业人士进行审查和调整。`,
  };

  return {
    id: `pkg_${input.sessionId}_${createdAt.replace(/[^0-9]/g, "").slice(0, 14)}`,
    sessionId: input.sessionId,
    createdAt,
    disclaimerVersion: config.disclaimerVersion,
    companyName,
    title: l("Preliminary AI Governance Policy Package", "Paquete preliminar de política de gobernanza de IA", "初步人工智能治理政策方案包"),
    executiveSummary,
    score,
    policy,
    approvedTools,
    sensitiveDataRules,
    humanReview: humanReviewRows,
    disclosureRules,
    incident,
    aiLiteracy,
    vendorWorkflow,
    findings,
    missingInfo,
    nextSteps,
    conversion: {
      heading: config.conversion.heading,
      body: config.conversion.body,
      ctas: config.cta,
    },
    disclaimer: config.disclaimer,
  };
}

function buildApprovedTools(
  q: AIUseQuestionnaireResponse,
  config: AdminConfig,
  highRiskPublic: boolean,
): ApprovedToolRule[] {
  const catalogById = new Map(config.tools.map((t) => [t.id, t]));
  const recordsById = new Map((q.tools ?? []).map((r) => [r.toolId, r]));
  const selected = arr(q.answers.toolsUsed);
  const ids = new Set<string>([...selected, ...(q.tools ?? []).map((r) => r.toolId)]);

  const statusLabel = (s: ApprovedToolRule["status"]): L =>
    ({
      approved: l("Approved", "Aprobada", "已批准"),
      conditionally_approved: l("Conditionally approved", "Aprobada con condiciones", "有条件批准"),
      prohibited: l("Prohibited", "Prohibida", "禁止使用"),
      pending_review: l("Pending review", "Pendiente de revisión", "待审核"),
    })[s];

  return [...ids].map((id) => {
    const cat = catalogById.get(id);
    const rec = recordsById.get(id);
    const name = rec?.toolName || cat?.name || id;
    let status: ApprovedToolRule["status"] = "pending_review";
    if (rec) {
      // Map the usage-status answer (incl. legacy values) to the list status.
      if (rec.status === "prohibited" || rec.status === "discarded") status = "prohibited";
      else if (rec.status === "approved" || rec.status === "in_use" || rec.status === "approved_not_implemented")
        status = rec.securityReviewed === "yes" && rec.termsReviewed === "yes" ? "approved" : "conditionally_approved";
      else if (rec.status === "tolerated" || rec.status === "pilot") status = "conditionally_approved";
      else status = "pending_review";
    }
    const isPublic = cat?.publicByDefault && (!rec || rec.plan !== "enterprise");
    return {
      toolId: id,
      toolName: name,
      status,
      statusLabel: statusLabel(status),
      permittedUseCases:
        status === "prohibited"
          ? l("None — prohibited.", "Ninguno — prohibida.", "无 — 禁止使用。")
          : l("Low-risk, non-sensitive productivity tasks with human review.", "Tareas de productividad de bajo riesgo y no sensibles con revisión humana.", "经人工审核的低风险、非敏感生产力任务。"),
      restrictedUseCases: l("High-impact, regulated or sensitive-data tasks without approval.", "Tareas de alto impacto, reguladas o con datos sensibles sin aprobación.", "未经批准的高影响、受监管或涉及敏感数据的任务。"),
      dataAllowed:
        status === "approved" && !isPublic
          ? l("Non-sensitive business data per approval scope.", "Datos de negocio no sensibles según el alcance de aprobación.", "按批准范围使用的非敏感业务数据。")
          : l("Non-sensitive, non-confidential, public-safe content only.", "Solo contenido no sensible, no confidencial y apto para herramientas públicas.", "仅限非敏感、非机密且可安全用于公共工具的内容。"),
      dataProhibited:
        isPublic || highRiskPublic
          ? l("Personal, client, confidential, trade-secret, credentials, regulated data.", "Datos personales, de clientes, confidenciales, secretos comerciales, credenciales, regulados.", "个人数据、客户数据、机密信息、商业秘密、凭据以及受监管数据。")
          : l("Credentials/secrets and any data outside the approval scope.", "Credenciales/secretos y cualquier dato fuera del alcance de aprobación.", "凭据/密码以及任何超出批准范围的数据。"),
      owner: l("To be assigned (IT/Security or AI governance owner).", "Por asignar (TI/Seguridad o responsable de gobernanza de IA).", "待指定（IT/安全或人工智能治理负责人）。"),
      reviewDate: l("Set at adoption; review at least annually.", "Definir al adoptar; revisar al menos anualmente.", "在采用时确定；至少每年审查一次。"),
    };
  });
}

function buildIncident(): IncidentWorkflow {
  const l2 = l;
  return {
    whatCounts: [
      l2("Accidental upload of sensitive, personal or confidential data to an AI tool.", "Subida accidental de datos sensibles, personales o confidenciales a una herramienta de IA.", "将敏感数据、个人数据或机密信息意外上传至人工智能工具。"),
      l2("Inaccurate, hallucinated or fabricated AI output that was relied upon.", "Resultado de IA inexacto, alucinado o inventado en el que se confió.", "被采信的不准确、幻觉（虚构内容）或捏造的人工智能输出。"),
      l2("Discriminatory or biased AI output.", "Resultado de IA discriminatorio o sesgado.", "具有歧视性或偏见的人工智能输出。"),
      l2("Security incident or suspected data exposure via an AI tool.", "Incidente de seguridad o sospecha de exposición de datos vía una herramienta de IA.", "通过人工智能工具发生的安全事件或疑似数据泄露。"),
      l2("Use of an unauthorized AI tool, or vendor outage.", "Uso de una herramienta de IA no autorizada, o caída de proveedor.", "使用未经授权的人工智能工具，或供应商服务中断。"),
    ],
    reportTo: l2("Report to the AI governance owner (or IT/Security and Legal/Compliance if unassigned).", "Reporte al responsable de gobernanza de IA (o a TI/Seguridad y Legal/Cumplimiento si no está asignado).", "请报告给人工智能治理负责人（如未指定，则报告给 IT/安全及法务/合规部门）。"),
    timeline: l2("Report without undue delay — ideally within 24 hours of discovery.", "Reporte sin demora indebida — idealmente dentro de las 24 horas tras el descubrimiento.", "请及时报告，不得无故迟延 — 最好在发现后 24 小时内报告。"),
    infoToInclude: [
      l2("What happened and when.", "Qué ocurrió y cuándo.", "发生了什么以及何时发生。"),
      l2("Which tool and data were involved.", "Qué herramienta y datos estuvieron implicados.", "涉及哪些工具和数据。"),
      l2("Who was affected and potential impact.", "Quién se vio afectado y el impacto potencial.", "谁受到影响以及潜在影响。"),
    ],
    escalation: [
      l2("AI governance owner assesses severity.", "El responsable de gobernanza de IA evalúa la gravedad.", "由人工智能治理负责人评估严重程度。"),
      l2("Escalate to Legal/Compliance and Security for high-severity incidents.", "Escale a Legal/Cumplimiento y Seguridad en incidentes graves.", "对于高严重性事件，请上报至法务/合规及安全部门。"),
      l2("Notify affected parties/regulators only on professional advice.", "Notifique a afectados/reguladores solo con asesoramiento profesional.", "仅在获得专业意见后方可通知受影响方/监管机构。"),
    ],
    containment: [
      l2("Stop the activity and revoke access if needed.", "Detenga la actividad y revoque accesos si es necesario.", "停止相关活动，必要时撤销访问权限。"),
      l2("Request deletion from the vendor where possible.", "Solicite la eliminación al proveedor cuando sea posible.", "在可能的情况下请求供应商删除相关数据。"),
      l2("Preserve evidence for review.", "Conserve evidencia para su revisión.", "保留证据以供审查。"),
    ],
    documentation: [
      l2("Record the incident, decisions and actions taken.", "Registre el incidente, las decisiones y las acciones tomadas.", "记录事件、所做决定及采取的措施。"),
      l2("Track remediation to completion.", "Haga seguimiento de la remediación hasta su finalización.", "跟踪整改直至完成。"),
      l2("Feed lessons learned back into training and this policy.", "Incorpore las lecciones aprendidas a la formación y a esta política.", "将经验教训反馈到培训和本政策中。"),
    ],
  };
}

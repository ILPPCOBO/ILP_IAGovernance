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

const l = (en: string, es: string): L => ({ en, es });

function interp(text: L, vars: Record<string, string>): L {
  const apply = (s: string) =>
    s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
  return { en: apply(text.en), es: apply(text.es) };
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
  { id: "personal", label: l("Personal data", "Datos personales") },
  { id: "client", label: l("Client/customer data", "Datos de clientes") },
  { id: "confidential", label: l("Confidential information", "Información confidencial") },
  { id: "sourceCode", label: l("Source code", "Código fuente") },
  { id: "contracts", label: l("Contracts", "Contratos") },
  { id: "financial", label: l("Financial information", "Información financiera") },
  { id: "employee", label: l("Employee data", "Datos de empleados") },
  { id: "health", label: l("Health data", "Datos de salud") },
  { id: "legal", label: l("Legal/privileged material", "Material legal/privilegiado") },
  { id: "tradeSecrets", label: l("Trade secrets", "Secretos comerciales") },
  { id: "credentials", label: l("Credentials / secrets / API keys", "Credenciales / secretos / claves API") },
  { id: "regulatory", label: l("Sensitive regulatory data", "Datos regulatorios sensibles") },
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
    ? l("AI governance owner", "Responsable de gobernanza de IA")
    : roles.includes("compliance")
      ? l("Compliance officer", "Responsable de cumplimiento")
      : roles.includes("legal")
        ? l("Legal team", "Equipo jurídico")
        : roles.includes("dpo")
          ? l("Data Protection Officer", "Delegado de Protección de Datos")
          : l("to be assigned", "por asignar");

  const vars = { company: companyName, owner: ownerL.en };
  const varsEs = { company: companyName, owner: ownerL.es };

  // helper that pulls a clause from the (admin-editable) library and interpolates
  const C = (id: string): PolicyClause | null => {
    const base = clauses[id];
    if (!base) return null;
    return {
      id,
      text: { en: interp(base, vars).en, es: interp(base, varsEs).es },
    };
  };

  const dataInputs = arr(a.dataInputs);
  const dataTypes = arr(a.dataTypes);
  const toolsUsed = arr(a.toolsUsed);
  const humanReview = arr(a.humanReview);
  const disclosure = arr(a.disclosure);
  const incidentProcess = arr(a.incidentProcess);
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
      title: l("Sensitive data may be entered into AI tools", "Pueden introducirse datos sensibles en herramientas de IA"),
      detail: l(
        "Employees may currently input sensitive data into AI tools. This requires stricter sensitive-data rules and tool restrictions.",
        "Los empleados pueden introducir actualmente datos sensibles en herramientas de IA. Esto requiere reglas más estrictas sobre datos sensibles y restricciones de herramientas.",
      ),
      recommendation: l(
        "Apply the stricter sensitive-data rules in this package and restrict sensitive data to approved, enterprise-grade tools.",
        "Aplique las reglas más estrictas sobre datos sensibles de este paquete y limite los datos sensibles a herramientas empresariales aprobadas.",
      ),
      triggeredBy: dataInputs,
    });
  }

  if (highRiskPublic) {
    push({
      id: "public-tool-confidential",
      area: "C",
      severity: "high",
      title: l("High risk: confidential data with public AI tools", "Riesgo alto: datos confidenciales con IA pública"),
      detail: l(
        "Confidential, personal or client data may be entering public/free AI tools that can use inputs to train models. This is a high-risk combination.",
        "Datos confidenciales, personales o de clientes pueden estar entrando en herramientas de IA públicas/gratuitas que pueden usar las entradas para entrenar modelos. Es una combinación de alto riesgo.",
      ),
      recommendation: l(
        "Prohibit confidential data in public tools and migrate to approved enterprise tools with suitable contractual terms.",
        "Prohíba los datos confidenciales en herramientas públicas y migre a herramientas empresariales aprobadas con términos contractuales adecuados.",
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
      title: l("Human review missing in high-impact contexts", "Falta revisión humana en contextos de alto impacto"),
      detail: l(
        "AI outputs are not consistently reviewed by a human before use in high-impact contexts such as client, legal, employment, financial or regulated work.",
        "Los resultados de IA no se revisan de forma consistente por un humano antes de usarse en contextos de alto impacto como trabajo con clientes, legal, laboral, financiero o regulado.",
      ),
      recommendation: l(
        "Require human review before AI output is used in the listed high-impact contexts.",
        "Exija revisión humana antes de usar resultados de IA en los contextos de alto impacto listados.",
      ),
      triggeredBy: missingHighImpactReview,
    });
  }

  if (incidentProcess.length === 0) {
    push({
      id: "no-incident-process",
      area: "G",
      severity: "high",
      title: l("No AI incident-reporting process", "Sin proceso de reporte de incidentes de IA"),
      detail: l(
        "There is no process for reporting AI incidents such as accidental data uploads, harmful output or unauthorized tool use.",
        "No existe un proceso para reportar incidentes de IA como subidas accidentales de datos, resultados dañinos o uso de herramientas no autorizadas.",
      ),
      recommendation: l(
        "Adopt the incident-reporting process included in this package.",
        "Adopte el proceso de reporte de incidentes incluido en este paquete.",
      ),
      triggeredBy: ["incidentProcess: none selected"],
    });
  }

  const trainingDenom = 12;
  if (training.length === 0) {
    push({
      id: "no-ai-literacy",
      area: "I",
      severity: "high",
      title: l("No AI literacy training", "Sin formación en alfabetización de IA"),
      detail: l(
        "Employees do not receive AI literacy training. This is a priority gap given current AI use.",
        "Los empleados no reciben formación en alfabetización de IA. Es una brecha prioritaria dado el uso actual de IA.",
      ),
      recommendation: l(
        "Roll out the AI literacy checklist in this package as a priority.",
        "Implemente el checklist de alfabetización en IA de este paquete como prioridad.",
      ),
      triggeredBy: ["training: none selected"],
    });
  } else if (training.length < trainingDenom / 2) {
    push({
      id: "partial-ai-literacy",
      area: "I",
      severity: "medium",
      title: l("AI literacy training is incomplete", "La formación en alfabetización de IA es incompleta"),
      detail: l(
        "Employees receive only partial AI training. Key topics may be missing.",
        "Los empleados reciben solo formación parcial en IA. Pueden faltar temas clave.",
      ),
      recommendation: l(
        "Use the AI literacy checklist to cover the remaining topics.",
        "Use el checklist de alfabetización para cubrir los temas restantes.",
      ),
      triggeredBy: training,
    });
  }

  if (toolsUsed.length > 0 && vendorReview.length === 0) {
    push({
      id: "no-vendor-review",
      area: "H",
      severity: "high",
      title: l("AI vendors used without review", "Proveedores de IA usados sin revisión"),
      detail: l(
        "AI tools are in use but vendors are not reviewed for data processing, training on data, security or contractual terms.",
        "Se usan herramientas de IA pero no se revisa a los proveedores en cuanto a tratamiento de datos, entrenamiento con datos, seguridad o términos contractuales.",
      ),
      recommendation: l(
        "Adopt the vendor-approval workflow in this package before further tool adoption.",
        "Adopte el flujo de aprobación de proveedores de este paquete antes de adoptar más herramientas.",
      ),
      triggeredBy: toolsUsed,
    });
  }

  if (roles.length === 0) {
    push({
      id: "no-governance-owner",
      area: "A",
      severity: "medium",
      title: l("No governance roles assigned", "Sin roles de gobernanza asignados"),
      detail: l(
        "No DPO, compliance, legal, IT/security or AI governance owner is identified to own AI governance.",
        "No se identifica un DPO, cumplimiento, legal, TI/seguridad ni responsable de gobernanza de IA para liderar la gobernanza de IA.",
      ),
      recommendation: l(
        "Assign an AI governance owner responsible for this policy.",
        "Asigne un responsable de gobernanza de IA encargado de esta política.",
      ),
      triggeredBy: ["governanceRoles: none selected"],
    });
  }

  if (regulated) {
    push({
      id: "regulated-sector",
      area: "A",
      severity: "medium",
      title: l("Regulated sector — additional controls", "Sector regulado — controles adicionales"),
      detail: l(
        "Operating in a regulated sector means AI use may be subject to sector-specific rules requiring professional review.",
        "Operar en un sector regulado implica que el uso de IA puede estar sujeto a normas sectoriales que requieren revisión profesional.",
      ),
      recommendation: l(
        "Have qualified professionals map sector rules to your AI use cases.",
        "Haga que profesionales cualificados asignen las normas del sector a sus casos de uso de IA.",
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
          )
        : s.id === "credentials"
          ? l(
              "Never enter credentials, passwords, API keys or secrets into any AI tool.",
              "Nunca introduzca credenciales, contraseñas, claves API o secretos en ninguna herramienta de IA.",
            )
          : l(
              `Do not enter ${s.label.en.toLowerCase()} into AI tools unless the specific tool is approved for it.`,
              `No introduzca ${s.label.es.toLowerCase()} en herramientas de IA salvo que la herramienta concreta esté aprobada para ello.`,
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
    rrow("clientComms", l("Client communications", "Comunicaciones con clientes")),
    rrow("legalCompliance", l("Legal / compliance analysis", "Análisis legal / de cumplimiento")),
    rrow("employment", l("HR / employment decisions", "Decisiones de RR. HH. / laborales")),
    rrow("financial", l("Financial decisions", "Decisiones financieras")),
    rrow("codeDeploy", l("Code deployment", "Despliegue de código")),
    rrow("marketing", l("Public marketing content", "Contenido de marketing público")),
    rrow("support", l("Customer support", "Atención al cliente")),
    rrow("regulated", l("Regulated / high-impact activities", "Actividades reguladas / de alto impacto")),
  ];
  function rrow(key: string, context: L): HumanReviewRow {
    const covered = humanReview.includes(key);
    return {
      context,
      required: true,
      requirement: covered
        ? l("Required — currently performed. Keep documenting the reviewer.", "Obligatoria — actualmente se realiza. Siga documentando al revisor.")
        : l("Required before use — currently a gap to close.", "Obligatoria antes de usar — actualmente una brecha por cerrar."),
    };
  }

  /* ---------------- Disclosure rules ---------------- */
  const disclosureRules: DisclosureRule[] = [
    drow("internal", l("Internal use of AI", "Uso interno de IA")),
    drow("clients", l("Communications to clients/customers", "Comunicaciones a clientes")),
    drow("public", l("Public-facing content", "Contenido público")),
    drow("media", l("AI-generated images/audio/video", "Imágenes/audio/vídeo generados por IA")),
    drow("decisions", l("Decisions based on AI output", "Decisiones basadas en resultados de IA")),
    drow("regulated", l("AI used in regulated work", "IA usada en trabajo regulado")),
  ];
  function drow(key: string, context: L): DisclosureRule {
    const have = disclosure.includes(key);
    const mustRequired = ["public", "media", "regulated"].includes(key);
    return {
      context,
      required: mustRequired || have,
      rule: mustRequired
        ? l("Disclosure recommended/required — adopt a clear rule.", "Divulgación recomendada/obligatoria — adopte una regla clara.")
        : have
          ? l("Disclosure rule already exists — keep it documented.", "Ya existe una regla de divulgación — manténgala documentada.")
          : l("Consider whether disclosure is appropriate here.", "Considere si la divulgación es apropiada aquí."),
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
  const need = (cond: boolean, en: string, es: string) => {
    if (cond) missingInfo.push(l(en, es));
  };
  need(!companyName || companyName === "Your company", "Company name not provided.", "No se indicó el nombre de la empresa.");
  need(!(a.industry as string), "Industry not provided.", "No se indicó el sector.");
  need(!(a.country as string), "Country / jurisdiction not provided.", "No se indicó el país / jurisdicción.");
  need(a.regulatedSector === "unknown" || a.regulatedSector == null, "Regulated-sector status unknown.", "Estado de sector regulado desconocido.");
  need(arr(a.aiUses).length === 0, "No current AI uses recorded.", "No se registraron usos actuales de IA.");
  need(toolsUsed.length === 0, "No AI tools recorded.", "No se registraron herramientas de IA.");
  need((q.tools ?? []).some((t) => t.trainsOnData === "unknown"), "For some tools, it is unknown whether data is used for training.", "Para algunas herramientas se desconoce si los datos se usan para entrenamiento.");
  need(roles.length === 0, "No governance roles identified.", "No se identificaron roles de gobernanza.");
  need(dataInputs.length === 0, "Data employees may enter was not specified.", "No se especificó qué datos pueden introducir los empleados.");

  /* ---------------- Next steps ---------------- */
  const nextSteps: L[] = [];
  const step = (en: string, es: string) => nextSteps.push(l(en, es));
  step("Have this preliminary package reviewed and adapted by qualified professionals.", "Haga que profesionales cualificados revisen y adapten este paquete preliminar.");
  if (highRiskPublic) step("Immediately restrict confidential data in public AI tools.", "Restrinja de inmediato los datos confidenciales en herramientas de IA públicas.");
  if (roles.length === 0) step("Assign an AI governance owner.", "Asigne un responsable de gobernanza de IA.");
  if (incidentProcess.length === 0) step("Stand up the incident-reporting process.", "Ponga en marcha el proceso de reporte de incidentes.");
  if (training.length < 6) step("Schedule AI literacy training for employees.", "Programe formación en alfabetización de IA para empleados.");
  if (vendorReview.length === 0 && toolsUsed.length > 0) step("Run approved tools through the vendor-approval workflow.", "Pase las herramientas aprobadas por el flujo de aprobación de proveedores.");
  step("Re-run this assessment after implementing changes to track progress.", "Vuelva a ejecutar esta evaluación tras implementar cambios para medir el progreso.");

  /* ---------------- Score & summary ---------------- */
  const score = computeScore(q, config.scoring);

  const highCount = findings.filter((f) => f.severity === "high").length;
  const executiveSummary: L = {
    en: `This is a preliminary AI governance package for ${companyName}. Its AI governance readiness score is ${score.value}/100 (${score.bandLabel.en.toLowerCase()}). It identifies ${findings.length} finding(s), including ${highCount} high-priority item(s), and provides draft policies, controls and workflows. It is not legal advice and is not a final compliance review; it should be reviewed and adapted by qualified professionals before implementation.`,
    es: `Este es un paquete preliminar de gobernanza de IA para ${companyName}. Su puntuación de preparación en gobernanza de IA es ${score.value}/100 (${score.bandLabel.es.toLowerCase()}). Identifica ${findings.length} hallazgo(s), incluidos ${highCount} de alta prioridad, y ofrece políticas, controles y flujos en borrador. No constituye asesoramiento jurídico ni una revisión final de cumplimiento; debe ser revisado y adaptado por profesionales cualificados antes de su implementación.`,
  };

  return {
    id: `pkg_${input.sessionId}_${createdAt.replace(/[^0-9]/g, "").slice(0, 14)}`,
    sessionId: input.sessionId,
    createdAt,
    disclaimerVersion: config.disclaimerVersion,
    companyName,
    title: l("Preliminary AI Governance Policy Package", "Paquete preliminar de política de gobernanza de IA"),
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
      approved: l("Approved", "Aprobada"),
      conditionally_approved: l("Conditionally approved", "Aprobada con condiciones"),
      prohibited: l("Prohibited", "Prohibida"),
      pending_review: l("Pending review", "Pendiente de revisión"),
    })[s];

  return [...ids].map((id) => {
    const cat = catalogById.get(id);
    const rec = recordsById.get(id);
    const name = rec?.toolName || cat?.name || id;
    let status: ApprovedToolRule["status"] = "pending_review";
    if (rec) {
      if (rec.status === "prohibited") status = "prohibited";
      else if (rec.status === "approved")
        status = rec.securityReviewed === "yes" && rec.termsReviewed === "yes" ? "approved" : "conditionally_approved";
      else if (rec.status === "tolerated") status = "conditionally_approved";
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
          ? l("None — prohibited.", "Ninguno — prohibida.")
          : l("Low-risk, non-sensitive productivity tasks with human review.", "Tareas de productividad de bajo riesgo y no sensibles con revisión humana."),
      restrictedUseCases: l("High-impact, regulated or sensitive-data tasks without approval.", "Tareas de alto impacto, reguladas o con datos sensibles sin aprobación."),
      dataAllowed:
        status === "approved" && !isPublic
          ? l("Non-sensitive business data per approval scope.", "Datos de negocio no sensibles según el alcance de aprobación.")
          : l("Non-sensitive, non-confidential, public-safe content only.", "Solo contenido no sensible, no confidencial y apto para herramientas públicas."),
      dataProhibited:
        isPublic || highRiskPublic
          ? l("Personal, client, confidential, trade-secret, credentials, regulated data.", "Datos personales, de clientes, confidenciales, secretos comerciales, credenciales, regulados.")
          : l("Credentials/secrets and any data outside the approval scope.", "Credenciales/secretos y cualquier dato fuera del alcance de aprobación."),
      owner: l("To be assigned (IT/Security or AI governance owner).", "Por asignar (TI/Seguridad o responsable de gobernanza de IA)."),
      reviewDate: l("Set at adoption; review at least annually.", "Definir al adoptar; revisar al menos anualmente."),
    };
  });
}

function buildIncident(): IncidentWorkflow {
  const l2 = l;
  return {
    whatCounts: [
      l2("Accidental upload of sensitive, personal or confidential data to an AI tool.", "Subida accidental de datos sensibles, personales o confidenciales a una herramienta de IA."),
      l2("Inaccurate, hallucinated or fabricated AI output that was relied upon.", "Resultado de IA inexacto, alucinado o inventado en el que se confió."),
      l2("Discriminatory or biased AI output.", "Resultado de IA discriminatorio o sesgado."),
      l2("Security incident or suspected data exposure via an AI tool.", "Incidente de seguridad o sospecha de exposición de datos vía una herramienta de IA."),
      l2("Use of an unauthorized AI tool, or vendor outage.", "Uso de una herramienta de IA no autorizada, o caída de proveedor."),
    ],
    reportTo: l2("Report to the AI governance owner (or IT/Security and Legal/Compliance if unassigned).", "Reporte al responsable de gobernanza de IA (o a TI/Seguridad y Legal/Cumplimiento si no está asignado)."),
    timeline: l2("Report without undue delay — ideally within 24 hours of discovery.", "Reporte sin demora indebida — idealmente dentro de las 24 horas tras el descubrimiento."),
    infoToInclude: [
      l2("What happened and when.", "Qué ocurrió y cuándo."),
      l2("Which tool and data were involved.", "Qué herramienta y datos estuvieron implicados."),
      l2("Who was affected and potential impact.", "Quién se vio afectado y el impacto potencial."),
    ],
    escalation: [
      l2("AI governance owner assesses severity.", "El responsable de gobernanza de IA evalúa la gravedad."),
      l2("Escalate to Legal/Compliance and Security for high-severity incidents.", "Escale a Legal/Cumplimiento y Seguridad en incidentes graves."),
      l2("Notify affected parties/regulators only on professional advice.", "Notifique a afectados/reguladores solo con asesoramiento profesional."),
    ],
    containment: [
      l2("Stop the activity and revoke access if needed.", "Detenga la actividad y revoque accesos si es necesario."),
      l2("Request deletion from the vendor where possible.", "Solicite la eliminación al proveedor cuando sea posible."),
      l2("Preserve evidence for review.", "Conserve evidencia para su revisión."),
    ],
    documentation: [
      l2("Record the incident, decisions and actions taken.", "Registre el incidente, las decisiones y las acciones tomadas."),
      l2("Track remediation to completion.", "Haga seguimiento de la remediación hasta su finalización."),
      l2("Feed lessons learned back into training and this policy.", "Incorpore las lecciones aprendidas a la formación y a esta política."),
    ],
  };
}

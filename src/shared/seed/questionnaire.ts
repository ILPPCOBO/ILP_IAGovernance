import type { AdminQuestion, QuestionCategory, QuestionOption, L } from "../types";

/** Small helper to build a bilingual option. */
const o = (value: string, en: string, es: string): QuestionOption => ({
  value,
  label: { en, es },
});
const l = (en: string, es: string): L => ({ en, es });

export const CATEGORIES: QuestionCategory[] = [
  { id: "A", title: l("Company profile", "Perfil de la empresa"), description: l("Basic context about your organization.", "Contexto básico sobre su organización.") },
  { id: "B", title: l("Current AI use", "Uso actual de IA"), description: l("How employees use AI today.", "Cómo usan la IA los empleados hoy.") },
  { id: "C", title: l("AI tools used", "Herramientas de IA utilizadas"), description: l("Which tools are in use and how they are governed.", "Qué herramientas se usan y cómo se gobiernan.") },
  { id: "D", title: l("Data & confidentiality", "Datos y confidencialidad"), description: l("What employees may enter into AI tools.", "Qué pueden introducir los empleados en las herramientas de IA.") },
  { id: "E", title: l("Human review", "Revisión humana"), description: l("Where AI outputs are checked before use.", "Dónde se revisan los resultados de IA antes de usarlos.") },
  { id: "F", title: l("Disclosure rules", "Reglas de divulgación"), description: l("When AI use must be disclosed.", "Cuándo debe divulgarse el uso de IA.") },
  { id: "G", title: l("Incident reporting", "Reporte de incidentes"), description: l("Whether there is a process for AI incidents.", "Si existe un proceso para incidentes de IA.") },
  { id: "H", title: l("Vendor approval", "Aprobación de proveedores"), description: l("How AI vendors are reviewed.", "Cómo se revisan los proveedores de IA.") },
  { id: "I", title: l("AI literacy & training", "Alfabetización y formación en IA"), description: l("What training employees receive.", "Qué formación reciben los empleados.") },
  { id: "J", title: l("Prohibited / restricted uses", "Usos prohibidos / restringidos"), description: l("What the company wants to prohibit or restrict.", "Qué desea prohibir o restringir la empresa.") },
];

export const QUESTIONS: AdminQuestion[] = [
  /* ---------------- A. Company profile ---------------- */
  { id: "companyName", category: "A", type: "text", required: true, weight: 0, prompt: l("Company name", "Nombre de la empresa") },
  { id: "industry", category: "A", type: "text", required: true, weight: 0, prompt: l("Industry", "Sector") },
  { id: "country", category: "A", type: "text", required: true, weight: 0, prompt: l("Country / main jurisdiction", "País / jurisdicción principal") },
  {
    id: "employees", category: "A", type: "single", required: true, weight: 0,
    prompt: l("Number of employees", "Número de empleados"),
    options: [o("1-10", "1–10", "1–10"), o("11-50", "11–50", "11–50"), o("51-200", "51–200", "51–200"), o("201-1000", "201–1000", "201–1000"), o("1000+", "1000+", "1000+")],
  },
  {
    id: "regulatedSector", category: "A", type: "tristate", weight: 4,
    prompt: l("Does the company operate in regulated sectors?", "¿Opera la empresa en sectores regulados?"),
    help: l("E.g. finance, health, legal, insurance, public sector.", "P. ej. finanzas, salud, legal, seguros, sector público."),
  },
  {
    id: "dataTypes", category: "A", type: "multi", weight: 4,
    prompt: l("Which kinds of data does the company handle?", "¿Qué tipos de datos maneja la empresa?"),
    options: [
      o("personal", "Personal data", "Datos personales"),
      o("confidential", "Confidential information", "Información confidencial"),
      o("tradeSecrets", "Trade secrets", "Secretos comerciales"),
      o("client", "Client data", "Datos de clientes"),
      o("health", "Health data", "Datos de salud"),
      o("financial", "Financial data", "Datos financieros"),
      o("legal", "Legal data", "Datos jurídicos"),
      o("children", "Children's data", "Datos de menores"),
    ],
  },
  {
    id: "governanceRoles", category: "A", type: "multi", weight: 6,
    prompt: l("Which governance roles exist in the company?", "¿Qué roles de gobernanza existen en la empresa?"),
    options: [
      o("dpo", "Data Protection Officer (DPO)", "Delegado de Protección de Datos (DPO)"),
      o("compliance", "Compliance officer", "Responsable de cumplimiento"),
      o("legal", "Legal team", "Equipo jurídico"),
      o("itSecurity", "IT / security team", "Equipo de TI / seguridad"),
      o("aiOwner", "AI governance owner", "Responsable de gobernanza de IA"),
    ],
  },

  /* ---------------- B. Current AI use ---------------- */
  {
    id: "aiUses", category: "B", type: "multi", weight: 3, allowOther: true,
    prompt: l("What do employees use AI for?", "¿Para qué usan los empleados la IA?"),
    options: [
      o("drafting", "Drafting emails", "Redactar correos"),
      o("summarizing", "Summarizing documents", "Resumir documentos"),
      o("research", "Legal or regulatory research", "Investigación legal o regulatoria"),
      o("support", "Customer support", "Atención al cliente"),
      o("hr", "HR or recruiting", "RR. HH. o selección"),
      o("marketing", "Marketing content", "Contenido de marketing"),
      o("coding", "Coding or software development", "Programación o desarrollo de software"),
      o("media", "Image/video/audio generation", "Generación de imagen/vídeo/audio"),
      o("transcription", "Meeting transcription", "Transcripción de reuniones"),
      o("translation", "Translation", "Traducción"),
      o("dataAnalysis", "Data analysis", "Análisis de datos"),
      o("contractReview", "Contract review", "Revisión de contratos"),
      o("salesCrm", "Sales or CRM", "Ventas o CRM"),
      o("finance", "Finance / accounting", "Finanzas / contabilidad"),
      o("knowledgeSearch", "Internal knowledge search", "Búsqueda de conocimiento interno"),
    ],
  },

  /* ---------------- C. AI tools used ---------------- */
  {
    id: "toolsUsed", category: "C", type: "multi", weight: 2, allowOther: true,
    prompt: l("Which AI tools are currently used?", "¿Qué herramientas de IA se utilizan actualmente?"),
    help: l("For each tool you select, you can set its status, plan, accounts and review state.", "Para cada herramienta seleccionada puede indicar su estado, plan, cuentas y estado de revisión."),
    options: [
      o("chatgpt", "ChatGPT", "ChatGPT"),
      o("copilot", "Microsoft Copilot", "Microsoft Copilot"),
      o("gemini", "Google Gemini", "Google Gemini"),
      o("claude", "Claude", "Claude"),
      o("perplexity", "Perplexity", "Perplexity"),
      o("midjourney", "Midjourney", "Midjourney"),
      o("dalle", "DALL·E", "DALL·E"),
      o("notion-ai", "Notion AI", "Notion AI"),
      o("grammarly", "Grammarly", "Grammarly"),
      o("meeting-assistants", "Otter / Fireflies / meeting assistants", "Otter / Fireflies / asistentes de reuniones"),
      o("github-copilot", "GitHub Copilot", "GitHub Copilot"),
      o("saas-embedded", "AI embedded in SaaS platforms", "IA integrada en plataformas SaaS"),
      o("custom-internal", "Custom / internal AI tools", "Herramientas de IA propias / internas"),
    ],
  },

  /* ---------------- D. Data & confidentiality ---------------- */
  {
    id: "dataInputs", category: "D", type: "multi", weight: 8,
    prompt: l("What may employees currently input into AI tools?", "¿Qué pueden introducir actualmente los empleados en las herramientas de IA?"),
    help: l("Select everything employees are currently able to enter, even if not officially allowed.", "Seleccione todo lo que los empleados pueden introducir, aunque no esté oficialmente permitido."),
    options: [
      o("personal", "Personal data", "Datos personales"),
      o("client", "Client/customer data", "Datos de clientes"),
      o("confidential", "Confidential business information", "Información confidencial de negocio"),
      o("sourceCode", "Source code", "Código fuente"),
      o("contracts", "Contracts", "Contratos"),
      o("financial", "Financial information", "Información financiera"),
      o("employee", "Employee data", "Datos de empleados"),
      o("health", "Health data", "Datos de salud"),
      o("legal", "Legal advice or privileged material", "Asesoramiento legal o material privilegiado"),
      o("tradeSecrets", "Trade secrets", "Secretos comerciales"),
      o("credentials", "Credentials / secrets / API keys", "Credenciales / secretos / claves API"),
      o("regulatory", "Sensitive regulatory data", "Datos regulatorios sensibles"),
    ],
  },

  /* ---------------- E. Human review ---------------- */
  {
    id: "humanReview", category: "E", type: "multi", weight: 8,
    prompt: l("In which contexts are AI outputs reviewed by a human before use?", "¿En qué contextos un humano revisa los resultados de IA antes de usarlos?"),
    help: l("Select only the contexts where review actually happens today.", "Seleccione solo los contextos donde la revisión ocurre realmente hoy."),
    options: [
      o("clientComms", "Client communications", "Comunicaciones con clientes"),
      o("legalCompliance", "Legal / compliance decisions", "Decisiones legales / de cumplimiento"),
      o("employment", "Employment decisions", "Decisiones laborales"),
      o("financial", "Financial decisions", "Decisiones financieras"),
      o("marketing", "Public marketing", "Marketing público"),
      o("codeDeploy", "Code deployment", "Despliegue de código"),
      o("support", "Customer support", "Atención al cliente"),
      o("regulated", "Regulated or high-impact contexts", "Contextos regulados o de alto impacto"),
    ],
  },

  /* ---------------- F. Disclosure rules ---------------- */
  {
    id: "disclosure", category: "F", type: "multi", weight: 4,
    prompt: l("When must employees currently disclose AI use?", "¿Cuándo deben divulgar actualmente los empleados el uso de IA?"),
    options: [
      o("internal", "Internally", "Internamente"),
      o("clients", "To clients/customers", "A clientes"),
      o("public", "In public-facing content", "En contenido público"),
      o("media", "When generating images/audio/video", "Al generar imágenes/audio/vídeo"),
      o("decisions", "When making decisions based on AI output", "Al tomar decisiones basadas en IA"),
      o("regulated", "When using AI in regulated work", "Al usar IA en trabajo regulado"),
    ],
  },

  /* ---------------- G. Incident reporting ---------------- */
  {
    id: "incidentProcess", category: "G", type: "multi", weight: 6,
    prompt: l("For which situations does the company have a reporting process?", "¿Para qué situaciones tiene la empresa un proceso de reporte?"),
    options: [
      o("sensitiveUpload", "Accidental upload of sensitive data", "Subida accidental de datos sensibles"),
      o("inaccurate", "Inaccurate AI output", "Resultado de IA inexacto"),
      o("biased", "Discriminatory or biased output", "Resultado discriminatorio o sesgado"),
      o("hallucinated", "Hallucinated legal/financial/technical content", "Contenido legal/financiero/técnico alucinado"),
      o("security", "Security incident", "Incidente de seguridad"),
      o("vendorOutage", "Vendor outage", "Caída de proveedor"),
      o("unauthorizedTool", "Unauthorized AI tool use", "Uso de herramienta de IA no autorizada"),
      o("misuse", "Employee misuse", "Mal uso por empleados"),
      o("clientComplaint", "Client complaint", "Queja de cliente"),
    ],
  },

  /* ---------------- H. Vendor approval ---------------- */
  {
    id: "vendorReview", category: "H", type: "multi", weight: 6,
    prompt: l("What does the company review AI vendors for?", "¿Qué revisa la empresa de los proveedores de IA?"),
    options: [
      o("dataProcessing", "Data processing terms", "Términos de tratamiento de datos"),
      o("training", "Training on customer data", "Entrenamiento con datos de clientes"),
      o("subprocessors", "Subprocessors", "Subencargados"),
      o("dataLocation", "Data location", "Ubicación de los datos"),
      o("security", "Security certifications", "Certificaciones de seguridad"),
      o("retention", "Retention / deletion", "Retención / eliminación"),
      o("audit", "Audit rights", "Derechos de auditoría"),
      o("incidentNotice", "Incident notification", "Notificación de incidentes"),
      o("modelChanges", "Model changes", "Cambios de modelo"),
      o("regulatory", "Regulatory cooperation", "Cooperación regulatoria"),
      o("liability", "Liability and indemnities", "Responsabilidad e indemnizaciones"),
    ],
  },

  /* ---------------- I. AI literacy & training ---------------- */
  {
    id: "training", category: "I", type: "multi", weight: 6,
    prompt: l("On which topics do employees receive AI training?", "¿Sobre qué temas reciben formación en IA los empleados?"),
    options: [
      o("capabilities", "What AI can and cannot do", "Qué puede y qué no puede hacer la IA"),
      o("hallucinations", "Hallucinations and verification", "Alucinaciones y verificación"),
      o("confidentiality", "Confidentiality", "Confidencialidad"),
      o("personalData", "Personal data", "Datos personales"),
      o("ip", "Intellectual property", "Propiedad intelectual"),
      o("bias", "Bias and discrimination", "Sesgo y discriminación"),
      o("security", "Security risks", "Riesgos de seguridad"),
      o("promptHygiene", "Prompt hygiene", "Higiene de prompts"),
      o("oversight", "Human oversight", "Supervisión humana"),
      o("reporting", "Reporting incidents", "Reporte de incidentes"),
      o("approvedTools", "Approved tools", "Herramientas aprobadas"),
      o("prohibited", "Prohibited uses", "Usos prohibidos"),
    ],
  },

  /* ---------------- J. Prohibited / restricted uses ---------------- */
  {
    id: "restrictions", category: "J", type: "multi", weight: 5,
    prompt: l("Which uses does the company want to prohibit or restrict?", "¿Qué usos desea prohibir o restringir la empresa?"),
    options: [
      o("confidentialToPublic", "Uploading confidential data to public AI tools", "Subir datos confidenciales a IA pública"),
      o("personalNoApproval", "Uploading personal data without approval", "Subir datos personales sin aprobación"),
      o("finalDecisions", "Using AI for final legal/medical/financial/HR/compliance decisions", "Usar IA para decisiones finales legales/médicas/financieras/RR. HH./cumplimiento"),
      o("deceptive", "Generating deceptive content", "Generar contenido engañoso"),
      o("impersonation", "Impersonation or deepfakes", "Suplantación o deepfakes"),
      o("automatedHiring", "Automated hiring decisions", "Decisiones de contratación automatizadas"),
      o("surveillance", "Surveillance or employee scoring", "Vigilancia o puntuación de empleados"),
      o("noHumanReview", "Using AI outputs without human review", "Usar resultados de IA sin revisión humana"),
      o("credentials", "Entering credentials, passwords, API keys or secrets", "Introducir credenciales, contraseñas, claves API o secretos"),
      o("unapprovedTools", "Using unapproved tools", "Usar herramientas no aprobadas"),
    ],
  },
];

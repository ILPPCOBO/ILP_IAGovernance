import type { AdminQuestion, QuestionCategory, QuestionOption, L } from "../types";

/** Small helper to build a trilingual option. */
const o = (value: string, en: string, es: string, zh: string): QuestionOption => ({
  value,
  label: { en, es, zh },
});
const l = (en: string, es: string, zh: string): L => ({ en, es, zh });

export const CATEGORIES: QuestionCategory[] = [
  { id: "A", title: l("Company profile", "Perfil de la empresa", "公司概况"), description: l("Basic context about your organization.", "Contexto básico sobre su organización.", "关于贵组织的基本背景信息。") },
  { id: "B", title: l("Current AI use", "Uso actual de IA", "当前人工智能使用情况"), description: l("How employees use AI today.", "Cómo usan la IA los empleados hoy.", "员工目前如何使用人工智能。") },
  { id: "C", title: l("AI tools used", "Herramientas de IA utilizadas", "使用的人工智能工具"), description: l("Which tools are in use and how they are governed.", "Qué herramientas se usan y cómo se gobiernan.", "目前使用哪些工具以及如何对其进行治理。") },
  { id: "D", title: l("Data & confidentiality", "Datos y confidencialidad", "数据与保密"), description: l("What employees may enter into AI tools.", "Qué pueden introducir los empleados en las herramientas de IA.", "员工可以在人工智能工具中输入哪些内容。") },
  { id: "E", title: l("Human review", "Revisión humana", "人工审核"), description: l("Where AI outputs are checked before use.", "Dónde se revisan los resultados de IA antes de usarlos.", "人工智能输出在使用前于哪些环节接受检查。") },
  { id: "F", title: l("Disclosure rules", "Reglas de divulgación", "披露规则"), description: l("When AI use must be disclosed.", "Cuándo debe divulgarse el uso de IA.", "何时必须披露人工智能的使用。") },
  { id: "G", title: l("Incident reporting", "Reporte de incidentes", "事件报告"), description: l("Whether there is a process for AI incidents.", "Si existe un proceso para incidentes de IA.", "是否存在针对人工智能事件的处理流程。") },
  { id: "H", title: l("Vendor approval", "Aprobación de proveedores", "供应商审批"), description: l("How AI vendors are reviewed.", "Cómo se revisan los proveedores de IA.", "如何审查人工智能供应商。") },
  { id: "I", title: l("AI literacy & training", "Alfabetización y formación en IA", "AI 素养与培训"), description: l("What training employees receive.", "Qué formación reciben los empleados.", "员工接受哪些培训。") },
  { id: "J", title: l("Prohibited / restricted uses", "Usos prohibidos / restringidos", "禁止/限制的用途"), description: l("What the company wants to prohibit or restrict.", "Qué desea prohibir o restringir la empresa.", "公司希望禁止或限制哪些用途。") },
];

export const QUESTIONS: AdminQuestion[] = [
  /* ---------------- A. Company profile ---------------- */
  { id: "companyName", category: "A", type: "text", required: true, weight: 0, prompt: l("Company name", "Nombre de la empresa", "公司名称") },
  { id: "industry", category: "A", type: "text", required: true, weight: 0, prompt: l("Industry", "Sector", "行业") },
  { id: "country", category: "A", type: "text", required: true, weight: 0, prompt: l("Country / main jurisdiction", "País / jurisdicción principal", "国家 / 主要司法管辖区") },
  {
    id: "employees", category: "A", type: "single", required: true, weight: 0,
    prompt: l("Number of employees", "Número de empleados", "员工人数"),
    options: [o("1-10", "1–10", "1–10", "1–10"), o("11-50", "11–50", "11–50", "11–50"), o("51-200", "51–200", "51–200", "51–200"), o("201-1000", "201–1000", "201–1000", "201–1000"), o("1000+", "1000+", "1000+", "1000+")],
  },
  {
    id: "regulatedSector", category: "A", type: "tristate", weight: 4,
    prompt: l("Does the company operate in regulated sectors?", "¿Opera la empresa en sectores regulados?", "公司是否在受监管行业开展经营？"),
    help: l("E.g. finance, health, legal, insurance, public sector.", "P. ej. finanzas, salud, legal, seguros, sector público.", "例如：金融、医疗、法律、保险、公共部门。"),
  },
  {
    id: "dataTypes", category: "A", type: "multi", weight: 4,
    prompt: l("Which kinds of data does the company handle?", "¿Qué tipos de datos maneja la empresa?", "公司处理哪些类型的数据？"),
    options: [
      o("personal", "Personal data", "Datos personales", "个人数据"),
      o("confidential", "Confidential information", "Información confidencial", "机密信息"),
      o("tradeSecrets", "Trade secrets", "Secretos comerciales", "商业秘密"),
      o("client", "Client data", "Datos de clientes", "客户数据"),
      o("health", "Health data", "Datos de salud", "健康数据"),
      o("financial", "Financial data", "Datos financieros", "财务数据"),
      o("legal", "Legal data", "Datos jurídicos", "法律数据"),
      o("children", "Children's data", "Datos de menores", "未成年人数据"),
    ],
  },
  {
    id: "governanceRoles", category: "A", type: "multi", weight: 6,
    prompt: l("Which governance roles exist in the company?", "¿Qué roles de gobernanza existen en la empresa?", "公司设有哪些治理角色？"),
    options: [
      o("dpo", "Data Protection Officer (DPO)", "Delegado de Protección de Datos (DPO)", "数据保护官（DPO）"),
      o("compliance", "Compliance officer", "Responsable de cumplimiento", "合规负责人"),
      o("legal", "Legal team", "Equipo jurídico", "法务团队"),
      o("itSecurity", "IT / security team", "Equipo de TI / seguridad", "IT / 安全团队"),
      o("aiOwner", "AI governance owner", "Responsable de gobernanza de IA", "人工智能治理负责人"),
    ],
  },

  /* ---------------- B. Current AI use ---------------- */
  {
    id: "aiUses", category: "B", type: "multi", weight: 3, allowOther: true,
    prompt: l("What do employees use AI for?", "¿Para qué usan los empleados la IA?", "员工将人工智能用于哪些用途？"),
    options: [
      o("drafting", "Drafting emails", "Redactar correos", "起草电子邮件"),
      o("summarizing", "Summarizing documents", "Resumir documentos", "总结文档"),
      o("research", "Legal or regulatory research", "Investigación legal o regulatoria", "法律或监管调研"),
      o("support", "Customer support", "Atención al cliente", "客户支持"),
      o("hr", "HR or recruiting", "RR. HH. o selección", "人力资源或招聘"),
      o("marketing", "Marketing content", "Contenido de marketing", "营销内容"),
      o("coding", "Coding or software development", "Programación o desarrollo de software", "编程或软件开发"),
      o("media", "Image/video/audio generation", "Generación de imagen/vídeo/audio", "图像/视频/音频生成"),
      o("transcription", "Meeting transcription", "Transcripción de reuniones", "会议转录"),
      o("translation", "Translation", "Traducción", "翻译"),
      o("dataAnalysis", "Data analysis", "Análisis de datos", "数据分析"),
      o("contractReview", "Contract review", "Revisión de contratos", "合同审查"),
      o("salesCrm", "Sales or CRM", "Ventas o CRM", "销售或 CRM"),
      o("finance", "Finance / accounting", "Finanzas / contabilidad", "财务 / 会计"),
      o("knowledgeSearch", "Internal knowledge search", "Búsqueda de conocimiento interno", "内部知识检索"),
    ],
  },

  /* ---------------- C. AI tools used ---------------- */
  {
    id: "toolsUsed", category: "C", type: "multi", weight: 2, allowOther: true,
    prompt: l("Which AI tools are currently used?", "¿Qué herramientas de IA se utilizan actualmente?", "目前使用哪些人工智能工具？"),
    help: l("For each tool you select, you can set its status, plan, accounts and review state.", "Para cada herramienta seleccionada puede indicar su estado, plan, cuentas y estado de revisión.", "对于您选择的每款工具，均可设置其状态、订阅方案、账户和审查状态。"),
    options: [
      o("chatgpt", "ChatGPT", "ChatGPT", "ChatGPT"),
      o("copilot", "Microsoft Copilot", "Microsoft Copilot", "Microsoft Copilot"),
      o("gemini", "Google Gemini", "Google Gemini", "Google Gemini"),
      o("claude", "Claude", "Claude", "Claude"),
      o("perplexity", "Perplexity", "Perplexity", "Perplexity"),
      o("midjourney", "Midjourney", "Midjourney", "Midjourney"),
      o("dalle", "DALL·E", "DALL·E", "DALL·E"),
      o("notion-ai", "Notion AI", "Notion AI", "Notion AI"),
      o("grammarly", "Grammarly", "Grammarly", "Grammarly"),
      o("meeting-assistants", "Otter / Fireflies / meeting assistants", "Otter / Fireflies / asistentes de reuniones", "Otter / Fireflies / 会议助手"),
      o("github-copilot", "GitHub Copilot", "GitHub Copilot", "GitHub Copilot"),
      o("saas-embedded", "AI embedded in SaaS platforms", "IA integrada en plataformas SaaS", "集成于 SaaS 平台的人工智能"),
      o("custom-internal", "Custom / internal AI tools", "Herramientas de IA propias / internas", "自研 / 内部人工智能工具"),
    ],
  },

  /* ---------------- D. Data & confidentiality ---------------- */
  {
    id: "dataInputs", category: "D", type: "multi", weight: 8,
    prompt: l("What may employees currently input into AI tools?", "¿Qué pueden introducir actualmente los empleados en las herramientas de IA?", "员工目前可以在人工智能工具中输入哪些内容？"),
    help: l("Select everything employees are currently able to enter, even if not officially allowed.", "Seleccione todo lo que los empleados pueden introducir, aunque no esté oficialmente permitido.", "请选择员工目前实际能够输入的所有内容，即使并未获得正式许可。"),
    options: [
      o("personal", "Personal data", "Datos personales", "个人数据"),
      o("client", "Client/customer data", "Datos de clientes", "客户数据"),
      o("confidential", "Confidential business information", "Información confidencial de negocio", "机密商业信息"),
      o("sourceCode", "Source code", "Código fuente", "源代码"),
      o("contracts", "Contracts", "Contratos", "合同"),
      o("financial", "Financial information", "Información financiera", "财务信息"),
      o("employee", "Employee data", "Datos de empleados", "员工数据"),
      o("health", "Health data", "Datos de salud", "健康数据"),
      o("legal", "Legal advice or privileged material", "Asesoramiento legal o material privilegiado", "法律意见或受特权保护的材料"),
      o("tradeSecrets", "Trade secrets", "Secretos comerciales", "商业秘密"),
      o("credentials", "Credentials / secrets / API keys", "Credenciales / secretos / claves API", "凭据、密码或 API 密钥"),
      o("regulatory", "Sensitive regulatory data", "Datos regulatorios sensibles", "敏感监管数据"),
    ],
  },

  /* ---------------- E. Human review ---------------- */
  {
    id: "humanReview", category: "E", type: "multi", weight: 8,
    prompt: l("In which contexts are AI outputs reviewed by a human before use?", "¿En qué contextos un humano revisa los resultados de IA antes de usarlos?", "在哪些情境下，人工智能输出在使用前会经人工审核？"),
    help: l("Select only the contexts where review actually happens today.", "Seleccione solo los contextos donde la revisión ocurre realmente hoy.", "请仅选择目前实际进行审核的情境。"),
    options: [
      o("clientComms", "Client communications", "Comunicaciones con clientes", "客户沟通"),
      o("legalCompliance", "Legal / compliance decisions", "Decisiones legales / de cumplimiento", "法律 / 合规决策"),
      o("employment", "Employment decisions", "Decisiones laborales", "雇佣决策"),
      o("financial", "Financial decisions", "Decisiones financieras", "财务决策"),
      o("marketing", "Public marketing", "Marketing público", "公开营销"),
      o("codeDeploy", "Code deployment", "Despliegue de código", "代码部署"),
      o("support", "Customer support", "Atención al cliente", "客户支持"),
      o("regulated", "Regulated or high-impact contexts", "Contextos regulados o de alto impacto", "受监管或高影响情境"),
    ],
  },

  /* ---------------- F. Disclosure rules ---------------- */
  {
    id: "disclosure", category: "F", type: "multi", weight: 4,
    prompt: l("When must employees currently disclose AI use?", "¿Cuándo deben divulgar actualmente los empleados el uso de IA?", "员工目前在何种情况下必须披露人工智能的使用？"),
    options: [
      o("internal", "Internally", "Internamente", "在公司内部"),
      o("clients", "To clients/customers", "A clientes", "向客户"),
      o("public", "In public-facing content", "En contenido público", "在面向公众的内容中"),
      o("media", "When generating images/audio/video", "Al generar imágenes/audio/vídeo", "在生成图像/音频/视频时"),
      o("decisions", "When making decisions based on AI output", "Al tomar decisiones basadas en IA", "在基于人工智能输出作出决策时"),
      o("regulated", "When using AI in regulated work", "Al usar IA en trabajo regulado", "在受监管工作中使用人工智能时"),
    ],
  },

  /* ---------------- G. Incident reporting ---------------- */
  {
    id: "incidentProcess", category: "G", type: "multi", weight: 6,
    prompt: l("For which situations does the company have a reporting process?", "¿Para qué situaciones tiene la empresa un proceso de reporte?", "公司针对哪些情形设有报告流程？"),
    options: [
      o("sensitiveUpload", "Accidental upload of sensitive data", "Subida accidental de datos sensibles", "意外上传敏感数据"),
      o("inaccurate", "Inaccurate AI output", "Resultado de IA inexacto", "人工智能输出不准确"),
      o("biased", "Discriminatory or biased output", "Resultado discriminatorio o sesgado", "具有歧视性或偏见的输出"),
      o("hallucinated", "Hallucinated legal/financial/technical content", "Contenido legal/financiero/técnico alucinado", "含幻觉（虚构内容）的法律/财务/技术内容"),
      o("security", "Security incident", "Incidente de seguridad", "安全事件"),
      o("vendorOutage", "Vendor outage", "Caída de proveedor", "供应商服务中断"),
      o("unauthorizedTool", "Unauthorized AI tool use", "Uso de herramienta de IA no autorizada", "未经授权使用人工智能工具"),
      o("misuse", "Employee misuse", "Mal uso por empleados", "员工不当使用"),
      o("clientComplaint", "Client complaint", "Queja de cliente", "客户投诉"),
    ],
  },

  /* ---------------- H. Vendor approval ---------------- */
  {
    id: "vendorReview", category: "H", type: "multi", weight: 6,
    prompt: l("What does the company review AI vendors for?", "¿Qué revisa la empresa de los proveedores de IA?", "公司对人工智能供应商审查哪些方面？"),
    options: [
      o("dataProcessing", "Data processing terms", "Términos de tratamiento de datos", "数据处理条款"),
      o("training", "Training on customer data", "Entrenamiento con datos de clientes", "使用客户数据进行训练"),
      o("subprocessors", "Subprocessors", "Subencargados", "子处理者"),
      o("dataLocation", "Data location", "Ubicación de los datos", "数据存储位置"),
      o("security", "Security certifications", "Certificaciones de seguridad", "安全认证"),
      o("retention", "Retention / deletion", "Retención / eliminación", "保留 / 删除"),
      o("audit", "Audit rights", "Derechos de auditoría", "审计权"),
      o("incidentNotice", "Incident notification", "Notificación de incidentes", "事件通知"),
      o("modelChanges", "Model changes", "Cambios de modelo", "模型变更"),
      o("regulatory", "Regulatory cooperation", "Cooperación regulatoria", "监管合作"),
      o("liability", "Liability and indemnities", "Responsabilidad e indemnizaciones", "责任与赔偿"),
    ],
  },

  /* ---------------- I. AI literacy & training ---------------- */
  {
    id: "training", category: "I", type: "multi", weight: 6,
    prompt: l("On which topics do employees receive AI training?", "¿Sobre qué temas reciben formación en IA los empleados?", "员工在哪些主题上接受人工智能培训？"),
    options: [
      o("capabilities", "What AI can and cannot do", "Qué puede y qué no puede hacer la IA", "人工智能的能力与局限"),
      o("hallucinations", "Hallucinations and verification", "Alucinaciones y verificación", "幻觉（虚构内容）与核实"),
      o("confidentiality", "Confidentiality", "Confidencialidad", "保密"),
      o("personalData", "Personal data", "Datos personales", "个人数据"),
      o("ip", "Intellectual property", "Propiedad intelectual", "知识产权"),
      o("bias", "Bias and discrimination", "Sesgo y discriminación", "偏见与歧视"),
      o("security", "Security risks", "Riesgos de seguridad", "安全风险"),
      o("promptHygiene", "Prompt hygiene", "Higiene de prompts", "提示词使用规范"),
      o("oversight", "Human oversight", "Supervisión humana", "人工监督"),
      o("reporting", "Reporting incidents", "Reporte de incidentes", "事件报告"),
      o("approvedTools", "Approved tools", "Herramientas aprobadas", "批准工具"),
      o("prohibited", "Prohibited uses", "Usos prohibidos", "禁止用途"),
    ],
  },

  /* ---------------- J. Prohibited / restricted uses ---------------- */
  {
    id: "restrictions", category: "J", type: "multi", weight: 5,
    prompt: l("Which uses does the company want to prohibit or restrict?", "¿Qué usos desea prohibir o restringir la empresa?", "公司希望禁止或限制哪些用途？"),
    options: [
      o("confidentialToPublic", "Uploading confidential data to public AI tools", "Subir datos confidenciales a IA pública", "将机密数据上传至公共人工智能工具"),
      o("personalNoApproval", "Uploading personal data without approval", "Subir datos personales sin aprobación", "未经批准上传个人数据"),
      o("finalDecisions", "Using AI for final legal/medical/financial/HR/compliance decisions", "Usar IA para decisiones finales legales/médicas/financieras/RR. HH./cumplimiento", "使用人工智能作出法律/医疗/财务/人力资源/合规方面的最终决策"),
      o("deceptive", "Generating deceptive content", "Generar contenido engañoso", "生成误导性内容"),
      o("impersonation", "Impersonation or deepfakes", "Suplantación o deepfakes", "冒充他人或深度伪造"),
      o("automatedHiring", "Automated hiring decisions", "Decisiones de contratación automatizadas", "自动化招聘决策"),
      o("surveillance", "Surveillance or employee scoring", "Vigilancia o puntuación de empleados", "监控或员工评分"),
      o("noHumanReview", "Using AI outputs without human review", "Usar resultados de IA sin revisión humana", "未经人工审核即使用人工智能输出"),
      o("credentials", "Entering credentials, passwords, API keys or secrets", "Introducir credenciales, contraseñas, claves API o secretos", "输入凭据、密码、API 密钥或其他机密"),
      o("unapprovedTools", "Using unapproved tools", "Usar herramientas no aprobadas", "使用未经批准的工具"),
    ],
  },
];

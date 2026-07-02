import type { L, VendorApprovalWorkflow } from "../types";

const l = (en: string, es: string, zh: string): L => ({ en, es, zh });

/**
 * Editable clause library. The rules engine selects clause ids per policy
 * section based on questionnaire answers; the text comes from here (or from
 * admin overrides). This is what the admin "Templates" tab edits.
 *
 * Clause id convention: <sectionId>.<key>. Clauses ending in a capability
 * (e.g. ".base") are always included; others are conditional.
 */
export const POLICY_CLAUSES: Record<string, L> = {
  /* purpose & scope */
  "purposeScope.base": l(
    "This policy sets out how employees and contractors may use generative AI tools at {company}. It is a preliminary, internal draft and should be reviewed and adapted by qualified professionals before implementation.",
    "Esta política establece cómo los empleados y contratistas pueden usar herramientas de IA generativa en {company}. Es un borrador interno preliminar y debe ser revisado y adaptado por profesionales cualificados antes de su implementación.",
    "本政策规定了{company}的员工和承包商可以如何使用生成式人工智能工具。本政策为内部初步草案，在实施之前应由合格的专业人士审阅并加以调整。",
  ),
  "purposeScope.regulated": l(
    "Because {company} operates in a regulated sector, AI use in regulated activities is subject to additional controls and to applicable sector rules.",
    "Dado que {company} opera en un sector regulado, el uso de IA en actividades reguladas está sujeto a controles adicionales y a las normas sectoriales aplicables.",
    "鉴于{company}在受监管行业运营，在受监管活动中使用人工智能须遵守额外的管控措施以及适用的行业规则。",
  ),

  /* applies to */
  "applies.base": l(
    "This policy applies to all employees, contractors, interns and third parties who use AI tools on behalf of {company} or with company data.",
    "Esta política se aplica a todos los empleados, contratistas, becarios y terceros que usen herramientas de IA en nombre de {company} o con datos de la empresa.",
    "本政策适用于代表{company}或使用公司数据使用人工智能工具的所有员工、承包商、实习生及第三方。",
  ),

  /* approved tools */
  "approvedTools.base": l(
    "Only AI tools that appear on the company's approved-tools list, with the status and conditions stated there, may be used for company work.",
    "Solo pueden usarse para el trabajo de la empresa las herramientas de IA que figuren en la lista de herramientas aprobadas, con el estado y las condiciones allí indicados.",
    "只有列入公司批准工具清单、并符合清单所载状态和条件的人工智能工具，方可用于公司工作。",
  ),
  "approvedTools.unknownStatus": l(
    "Several tools currently in use have an undefined status. Until each is reviewed and classified, treat it as restricted and do not enter sensitive data.",
    "Varias herramientas en uso tienen un estado indefinido. Hasta que cada una se revise y clasifique, trátela como restringida y no introduzca datos sensibles.",
    "目前在用的若干工具状态尚未确定。在每一工具经过审查和分类之前，应将其视为受限工具，且不得输入敏感数据。",
  ),
  "approvedTools.personalAccounts": l(
    "Personal AI accounts must not be used for company work where company-managed accounts are available; this helps preserve confidentiality and audit ability.",
    "No deben usarse cuentas personales de IA para el trabajo de la empresa cuando existan cuentas gestionadas por la empresa; esto ayuda a preservar la confidencialidad y la trazabilidad.",
    "在有公司管理账户可用的情况下，不得使用个人人工智能账户处理公司工作；这有助于维护机密性和可审计性。",
  ),

  /* permitted uses */
  "permittedUses.base": l(
    "Subject to the rules below, employees may use approved AI tools for low-risk productivity tasks such as drafting, summarizing, brainstorming and reformatting non-sensitive content.",
    "Sujeto a las reglas siguientes, los empleados pueden usar herramientas de IA aprobadas para tareas de productividad de bajo riesgo como redactar, resumir, generar ideas y reformatear contenido no sensible.",
    "在遵守下列规则的前提下，员工可以将经批准的人工智能工具用于低风险的生产力任务，例如对非敏感内容进行起草、摘要、构思和重新排版。",
  ),

  /* restricted uses */
  "restrictedUses.base": l(
    "Higher-risk uses are permitted only with the controls in this policy: human review, no sensitive data, and disclosure where required.",
    "Los usos de mayor riesgo solo se permiten con los controles de esta política: revisión humana, sin datos sensibles y divulgación cuando se requiera.",
    "较高风险的用途仅在符合本政策所列管控措施的情况下方可进行：人工审核、不使用敏感数据，并在必要时进行披露。",
  ),
  "restrictedUses.code": l(
    "AI coding tools may be used for non-confidential code, but generated code must be reviewed before deployment and must not include secrets or proprietary source unless the tool is approved for that purpose.",
    "Las herramientas de IA para programación pueden usarse con código no confidencial, pero el código generado debe revisarse antes del despliegue y no debe incluir secretos ni código propietario salvo que la herramienta esté aprobada para ello.",
    "人工智能编程工具可用于非机密代码，但生成的代码在部署前必须经过审查，且不得包含密钥等机密凭据或专有源代码，除非该工具已获批准用于此目的。",
  ),
  "restrictedUses.media": l(
    "AI-generated images, audio or video must be reviewed for accuracy and IP risk and disclosed as synthetic where required.",
    "Las imágenes, audio o vídeo generados por IA deben revisarse por exactitud y riesgo de PI y divulgarse como sintéticos cuando se requiera.",
    "人工智能生成的图像、音频或视频必须就准确性和知识产权风险进行审查，并在必要时披露其为合成内容。",
  ),

  /* prohibited uses */
  "prohibitedUses.base": l(
    "The following are prohibited: entering credentials, passwords, API keys or secrets into AI tools; using AI to produce deceptive content, impersonation or deepfakes; and presenting AI output as final professional advice without review.",
    "Queda prohibido: introducir credenciales, contraseñas, claves API o secretos en herramientas de IA; usar IA para producir contenido engañoso, suplantación o deepfakes; y presentar resultados de IA como asesoramiento profesional final sin revisión.",
    "以下行为被禁止：在人工智能工具中输入凭据、密码、API 密钥或其他机密信息；使用人工智能制作欺骗性内容、进行冒充或制作深度伪造内容；以及未经审核即将人工智能输出作为最终专业意见呈现。",
  ),
  "prohibitedUses.confidentialPublic": l(
    "Uploading confidential, client, personal or trade-secret data to public/free AI tools is prohibited unless an approved, enterprise-grade tool with suitable contractual terms is used.",
    "Está prohibido subir datos confidenciales, de clientes, personales o secretos comerciales a herramientas de IA públicas/gratuitas, salvo que se use una herramienta empresarial aprobada con términos contractuales adecuados.",
    "禁止将机密信息、客户数据、个人数据或商业秘密上传至公共/免费人工智能工具，除非使用具备适当合同条款、经批准的企业级工具。",
  ),
  "prohibitedUses.finalDecisions": l(
    "AI must not be used to make final legal, medical, financial, HR or compliance decisions without qualified human judgment.",
    "La IA no debe usarse para tomar decisiones finales legales, médicas, financieras, de RR. HH. o de cumplimiento sin juicio humano cualificado.",
    "不得在缺乏合格人员判断的情况下使用人工智能作出最终的法律、医疗、财务、人力资源或合规决定。",
  ),
  "prohibitedUses.automatedHiring": l(
    "Fully automated hiring decisions and employee surveillance/scoring using AI are prohibited without explicit approval, a documented lawful basis and human oversight.",
    "Quedan prohibidas las decisiones de contratación totalmente automatizadas y la vigilancia/puntuación de empleados mediante IA sin aprobación explícita, base legal documentada y supervisión humana.",
    "在未经明确批准、缺乏书面记录的合法依据和人工监督的情况下，禁止完全自动化的招聘决策以及利用人工智能对员工进行监控/评分。",
  ),

  /* sensitive data */
  "sensitiveData.base": l(
    "Do not enter sensitive data into AI tools unless the specific tool is approved for that data type. Sensitive data includes personal data, client data, confidential information, trade secrets, source code, contracts, legal/privileged material, financial data and regulated data.",
    "No introduzca datos sensibles en herramientas de IA salvo que la herramienta concreta esté aprobada para ese tipo de dato. Los datos sensibles incluyen datos personales, datos de clientes, información confidencial, secretos comerciales, código fuente, contratos, material legal/privilegiado, datos financieros y datos regulados.",
    "除非特定工具已获批准处理相应数据类型，否则请勿在人工智能工具中输入敏感数据。敏感数据包括个人数据、客户数据、机密信息、商业秘密、源代码、合同、法律/特权材料、财务数据和受监管数据。",
  ),
  "sensitiveData.health": l(
    "Health data must never be entered into AI tools that are not specifically approved and contracted for health data, given heightened legal sensitivity.",
    "Los datos de salud nunca deben introducirse en herramientas de IA que no estén específicamente aprobadas y contratadas para datos de salud, dada su mayor sensibilidad legal.",
    "鉴于健康数据在法律上具有更高的敏感性，绝不得将其输入未经专门批准并订立相应合同以处理健康数据的人工智能工具。",
  ),
  "sensitiveData.children": l(
    "Children's data must not be entered into AI tools; this requires specific legal review before any processing.",
    "Los datos de menores no deben introducirse en herramientas de IA; esto requiere una revisión legal específica antes de cualquier tratamiento.",
    "不得将儿童数据输入人工智能工具；任何处理之前均须进行专门的法律审查。",
  ),

  /* confidentiality */
  "confidentiality.base": l(
    "Treat anything entered into an AI tool as potentially disclosed outside the company. Do not enter information you would not be comfortable sharing with an external third party absent appropriate contractual protection.",
    "Considere que todo lo que introduce en una herramienta de IA puede divulgarse fuera de la empresa. No introduzca información que no compartiría con un tercero externo sin la protección contractual adecuada.",
    "请将输入人工智能工具的任何内容视为可能被披露至公司之外。凡在缺乏适当合同保护的情况下您不愿与外部第三方分享的信息，均请勿输入。",
  ),

  /* personal data */
  "personalData.base": l(
    "Personal data may only be processed with AI where there is a lawful basis, data-minimization is applied and the tool's terms permit such processing. When in doubt, consult the DPO or legal team.",
    "Los datos personales solo pueden tratarse con IA cuando exista una base legal, se aplique la minimización de datos y los términos de la herramienta permitan dicho tratamiento. En caso de duda, consulte al DPO o al equipo jurídico.",
    "只有在存在合法依据、已适用数据最小化原则且工具条款允许此类处理的情况下，方可使用人工智能处理个人数据。如有疑问，请咨询数据保护官（DPO）或法务团队。",
  ),

  /* ip & output */
  "ipOutput.base": l(
    "AI outputs may carry intellectual-property and accuracy risks. Verify originality and rights before publishing or relying on AI-generated content, and do not assume ownership of generated material.",
    "Los resultados de IA pueden conllevar riesgos de propiedad intelectual y exactitud. Verifique la originalidad y los derechos antes de publicar o confiar en contenido generado por IA, y no asuma la titularidad del material generado.",
    "人工智能输出可能带有知识产权和准确性方面的风险。在发布或依赖人工智能生成的内容之前，请核实其原创性和权利归属，且不要假定对生成材料拥有所有权。",
  ),

  /* human review */
  "humanReview.base": l(
    "A qualified person must review AI output before it is used in any external, legal, financial, employment, regulated or high-impact context. AI assists; humans remain accountable.",
    "Una persona cualificada debe revisar los resultados de IA antes de usarlos en cualquier contexto externo, legal, financiero, laboral, regulado o de alto impacto. La IA asiste; las personas siguen siendo responsables.",
    "在任何对外、法律、财务、劳动、受监管或高影响的场景中使用人工智能输出之前，必须由合格人员进行审核。人工智能提供辅助；责任仍由人承担。",
  ),

  /* disclosure */
  "disclosure.base": l(
    "Disclose AI use where it affects others' understanding or decisions: in public-facing content, when generating synthetic media, and when AI materially informs a decision affecting a client, employee or the public.",
    "Divulgue el uso de IA cuando afecte la comprensión o las decisiones de terceros: en contenido público, al generar contenido sintético y cuando la IA influya materialmente en una decisión que afecte a un cliente, empleado o al público.",
    "当人工智能的使用影响他人的理解或决定时，应予披露：在面向公众的内容中、在生成合成媒体时，以及当人工智能对影响客户、员工或公众的决定产生实质性影响时。",
  ),

  /* security */
  "security.base": l(
    "Use company-managed accounts and approved tools, keep software updated, never share login credentials, and report suspected data exposure immediately.",
    "Use cuentas gestionadas por la empresa y herramientas aprobadas, mantenga el software actualizado, nunca comparta credenciales y reporte de inmediato cualquier posible exposición de datos.",
    "请使用公司管理的账户和批准工具，保持软件更新，切勿共享登录凭据，并在怀疑发生数据泄露时立即报告。",
  ),
  "security.noReview": l(
    "Tools that have not undergone a security/privacy review must not be used with any company or personal data until that review is completed.",
    "Las herramientas que no hayan pasado una revisión de seguridad/privacidad no deben usarse con datos de la empresa o personales hasta que se complete dicha revisión.",
    "未经过安全/隐私审查的工具，在该审查完成之前，不得用于任何公司数据或个人数据。",
  ),

  /* vendor approval */
  "vendorApproval.base": l(
    "New AI tools and vendors must be approved before use through the vendor-approval workflow, which reviews data processing, training on data, security, retention and contractual terms.",
    "Las nuevas herramientas y proveedores de IA deben aprobarse antes de su uso mediante el flujo de aprobación de proveedores, que revisa el tratamiento de datos, el entrenamiento con datos, la seguridad, la retención y los términos contractuales.",
    "新的人工智能工具和供应商在使用前必须通过供应商审批流程获得批准，该流程审查数据处理、是否用数据进行训练、安全性、数据保留和合同条款。",
  ),

  /* incident */
  "incident.base": l(
    "Report AI incidents — such as accidental upload of sensitive data, harmful or hallucinated output, or unauthorized tool use — promptly through the incident-reporting process so they can be contained and documented.",
    "Reporte los incidentes de IA — como la subida accidental de datos sensibles, resultados dañinos o alucinados, o el uso de herramientas no autorizadas — con prontitud mediante el proceso de reporte de incidentes para que puedan contenerse y documentarse.",
    "请通过事件报告流程及时报告人工智能事件——例如敏感数据的意外上传、有害或幻觉（虚构内容）输出、或未经授权使用工具——以便对其加以控制并记录在案。",
  ),

  /* training */
  "training.base": l(
    "Employees must complete AI literacy training covering AI limitations, verification of outputs, confidentiality, personal data, approved tools, prohibited uses and how to report incidents.",
    "Los empleados deben completar la formación en alfabetización de IA que cubra las limitaciones de la IA, la verificación de resultados, la confidencialidad, los datos personales, las herramientas aprobadas, los usos prohibidos y cómo reportar incidentes.",
    "员工必须完成 AI 素养培训，内容涵盖人工智能的局限性、输出结果的核验、保密要求、个人数据、批准工具、禁止用途以及事件报告方法。",
  ),

  /* enforcement */
  "enforcement.base": l(
    "Breaches of this policy may lead to access restrictions and disciplinary measures. The policy is preliminary and will be reviewed and adapted with qualified professionals.",
    "El incumplimiento de esta política puede dar lugar a restricciones de acceso y medidas disciplinarias. La política es preliminar y se revisará y adaptará con profesionales cualificados.",
    "违反本政策可能导致访问限制和纪律处分。本政策为初步草案，将与合格的专业人士共同进行审阅和调整。",
  ),

  /* owner & review */
  "ownerReview.base": l(
    "Policy owner: {owner}. This preliminary policy should be reviewed at least every 6–12 months and whenever AI use, tools or regulation change materially.",
    "Responsable de la política: {owner}. Esta política preliminar debe revisarse al menos cada 6–12 meses y cuando el uso de IA, las herramientas o la regulación cambien de forma material.",
    "政策负责人：{owner}。本初步政策应至少每 6–12 个月审阅一次，并在人工智能使用、工具或监管发生重大变化时随时予以审阅。",
  ),
};

/** Ordered policy section definitions: id + title + which clause is the base. */
export const POLICY_SECTION_ORDER: { id: string; title: L }[] = [
  { id: "purposeScope", title: l("Purpose and scope", "Propósito y alcance", "目的与范围") },
  { id: "applies", title: l("Who the policy applies to", "A quién se aplica la política", "政策适用对象") },
  { id: "approvedTools", title: l("Approved AI tools", "Herramientas de IA aprobadas", "批准的人工智能工具") },
  { id: "permittedUses", title: l("Permitted uses", "Usos permitidos", "允许的用途") },
  { id: "restrictedUses", title: l("Restricted uses", "Usos restringidos", "受限的用途") },
  { id: "prohibitedUses", title: l("Prohibited uses", "Usos prohibidos", "禁止的用途") },
  { id: "sensitiveData", title: l("Sensitive-data rules", "Reglas sobre datos sensibles", "敏感数据规则") },
  { id: "confidentiality", title: l("Confidentiality rules", "Reglas de confidencialidad", "保密规则") },
  { id: "personalData", title: l("Personal-data rules", "Reglas sobre datos personales", "个人数据规则") },
  { id: "ipOutput", title: l("IP and output-use rules", "Reglas de PI y uso de resultados", "知识产权与输出使用规则") },
  { id: "humanReview", title: l("Human-review requirements", "Requisitos de revisión humana", "人工审核要求") },
  { id: "disclosure", title: l("Disclosure requirements", "Requisitos de divulgación", "披露要求") },
  { id: "security", title: l("Security requirements", "Requisitos de seguridad", "安全要求") },
  { id: "vendorApproval", title: l("Vendor approval process", "Proceso de aprobación de proveedores", "供应商审批流程") },
  { id: "incident", title: l("Incident reporting process", "Proceso de reporte de incidentes", "事件报告流程") },
  { id: "training", title: l("Employee training and AI literacy", "Formación de empleados y alfabetización en IA", "员工培训与 AI 素养") },
  { id: "enforcement", title: l("Enforcement and policy review", "Cumplimiento y revisión de la política", "执行与政策审查") },
  { id: "ownerReview", title: l("Policy owner and review cadence", "Responsable y cadencia de revisión", "政策负责人与审查周期") },
];

/** Default AI literacy checklist (admin-editable). */
export const LITERACY_ITEMS: { id: string; text: L }[] = [
  { id: "limitations", text: l("Understand what AI can and cannot do (its limitations).", "Comprender qué puede y qué no puede hacer la IA (sus limitaciones).", "了解人工智能能做什么、不能做什么（其局限性）。") },
  { id: "verify", text: l("Verify outputs before relying on them.", "Verificar los resultados antes de confiar en ellos.", "在依赖输出结果之前先予以核验。") },
  { id: "confidential", text: l("Protect confidential data — do not paste it into public tools.", "Proteger los datos confidenciales — no pegarlos en herramientas públicas.", "保护机密数据——不要将其粘贴到公共工具中。") },
  { id: "personal", text: l("Avoid misuse of personal data; apply data minimization.", "Evitar el mal uso de datos personales; aplicar la minimización de datos.", "避免滥用个人数据；适用数据最小化原则。") },
  { id: "ip", text: l("Check intellectual-property risks in AI outputs.", "Revisar los riesgos de propiedad intelectual en los resultados de IA.", "检查人工智能输出中的知识产权风险。") },
  { id: "hallucinations", text: l("Detect hallucinations and fabricated facts.", "Detectar alucinaciones y datos inventados.", "识别幻觉（虚构内容）和捏造的事实。") },
  { id: "review", text: l("Apply human review in high-impact contexts.", "Aplicar revisión humana en contextos de alto impacto.", "在高影响场景中实施人工审核。") },
  { id: "approvedTools", text: l("Follow approved-tool rules and statuses.", "Seguir las reglas y estados de las herramientas aprobadas.", "遵守批准工具的规则和状态。") },
  { id: "report", text: l("Know how and when to report incidents.", "Saber cómo y cuándo reportar incidentes.", "了解如何以及何时报告事件。") },
];

/** Default vendor-approval workflow (admin-editable). */
export const VENDOR_WORKFLOW: VendorApprovalWorkflow = {
  whenRequired: [
    l("Before adopting any new AI tool or vendor.", "Antes de adoptar cualquier nueva herramienta o proveedor de IA.", "在采用任何新的人工智能工具或供应商之前。"),
    l("When an existing vendor adds AI features or changes its model.", "Cuando un proveedor existente añade funciones de IA o cambia su modelo.", "当现有供应商新增人工智能功能或变更其模型时。"),
    l("Before sending confidential, personal or client data to a tool.", "Antes de enviar datos confidenciales, personales o de clientes a una herramienta.", "在向某一工具发送机密数据、个人数据或客户数据之前。"),
  ],
  intakeFields: [
    l("Tool/vendor name and purpose.", "Nombre del proveedor/herramienta y propósito.", "工具/供应商名称及用途。"),
    l("Data types to be processed.", "Tipos de datos a tratar.", "拟处理的数据类型。"),
    l("Plan/tier (free vs. enterprise) and account type.", "Plan/nivel (gratuito vs. empresarial) y tipo de cuenta.", "方案/层级（免费版还是企业版）及账户类型。"),
    l("Business owner requesting the tool.", "Responsable de negocio que solicita la herramienta.", "申请该工具的业务负责人。"),
  ],
  reviewSteps: [
    l("Privacy review: lawful basis, data processing terms, training on data.", "Revisión de privacidad: base legal, términos de tratamiento, entrenamiento con datos.", "隐私审查：合法依据、数据处理条款、是否用数据进行训练。"),
    l("Security review: certifications, data location, retention/deletion.", "Revisión de seguridad: certificaciones, ubicación de datos, retención/eliminación.", "安全审查：认证情况、数据所在位置、保留/删除。"),
    l("Legal review: subprocessors, audit rights, incident notice, liability.", "Revisión legal: subencargados, derechos de auditoría, notificación de incidentes, responsabilidad.", "法律审查：分包处理者、审计权、事件通知、责任。"),
  ],
  approvalRoles: [
    l("Privacy/DPO sign-off.", "Aprobación de privacidad/DPO.", "隐私/数据保护官（DPO）批准。"),
    l("Security/IT sign-off.", "Aprobación de seguridad/TI.", "安全/IT 批准。"),
    l("Legal/compliance sign-off.", "Aprobación legal/cumplimiento.", "法律/合规批准。"),
  ],
  contractChecks: [
    l("No training on customer data without consent.", "Sin entrenamiento con datos de clientes sin consentimiento.", "未经同意不得使用客户数据进行训练。"),
    l("Defined retention and deletion.", "Retención y eliminación definidas.", "明确的数据保留与删除规定。"),
    l("Incident notification and audit rights.", "Notificación de incidentes y derechos de auditoría.", "事件通知与审计权。"),
    l("Liability, indemnities and regulatory cooperation.", "Responsabilidad, indemnizaciones y cooperación regulatoria.", "责任、赔偿与监管配合。"),
  ],
  reviewCadence: l("Re-review approved vendors at least annually or on material change.", "Revisar de nuevo los proveedores aprobados al menos anualmente o ante cambios materiales.", "至少每年一次或在发生重大变化时对已批准的供应商进行重新审查。"),
};

/** Default conversion offer + CTAs (admin-editable). */
export const CONVERSION = {
  heading: l("Have the policy reviewed and adapted to your company.", "Haz que la política sea revisada y adaptada a tu empresa.", "让本政策得到审阅，并根据您的公司进行调整。"),
  body: l(
    "This package is a preliminary draft. Our team can review and adapt it to your company, jurisdiction and risk profile, and train your employees.",
    "Este paquete es un borrador preliminar. Nuestro equipo puede revisarlo y adaptarlo a su empresa, jurisdicción y perfil de riesgo, y formar a sus empleados.",
    "本套文件为初步草案。我们的团队可以对其进行审阅，并根据您的公司、司法辖区和风险状况加以调整，同时为您的员工提供培训。",
  ),
};

export const CTAS: { id: string; label: L }[] = [
  { id: "request", label: l("Request policy review", "Solicitar revisión de la política", "申请政策审阅") },
  { id: "book", label: l("Book AI governance consultation", "Agendar consulta de gobernanza de IA", "预约人工智能治理咨询") },
  { id: "training", label: l("Get employee AI training package", "Solicitar paquete de formación en IA para empleados", "获取员工人工智能培训套餐") },
];

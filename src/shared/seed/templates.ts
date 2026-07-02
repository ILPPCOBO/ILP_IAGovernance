import type { L, VendorApprovalWorkflow } from "../types";

const l = (en: string, es: string): L => ({ en, es });

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
  ),
  "purposeScope.regulated": l(
    "Because {company} operates in a regulated sector, AI use in regulated activities is subject to additional controls and to applicable sector rules.",
    "Dado que {company} opera en un sector regulado, el uso de IA en actividades reguladas está sujeto a controles adicionales y a las normas sectoriales aplicables.",
  ),

  /* applies to */
  "applies.base": l(
    "This policy applies to all employees, contractors, interns and third parties who use AI tools on behalf of {company} or with company data.",
    "Esta política se aplica a todos los empleados, contratistas, becarios y terceros que usen herramientas de IA en nombre de {company} o con datos de la empresa.",
  ),

  /* approved tools */
  "approvedTools.base": l(
    "Only AI tools that appear on the company's approved-tools list, with the status and conditions stated there, may be used for company work.",
    "Solo pueden usarse para el trabajo de la empresa las herramientas de IA que figuren en la lista de herramientas aprobadas, con el estado y las condiciones allí indicados.",
  ),
  "approvedTools.unknownStatus": l(
    "Several tools currently in use have an undefined status. Until each is reviewed and classified, treat it as restricted and do not enter sensitive data.",
    "Varias herramientas en uso tienen un estado indefinido. Hasta que cada una se revise y clasifique, trátela como restringida y no introduzca datos sensibles.",
  ),
  "approvedTools.personalAccounts": l(
    "Personal AI accounts must not be used for company work where company-managed accounts are available; this helps preserve confidentiality and audit ability.",
    "No deben usarse cuentas personales de IA para el trabajo de la empresa cuando existan cuentas gestionadas por la empresa; esto ayuda a preservar la confidencialidad y la trazabilidad.",
  ),

  /* permitted uses */
  "permittedUses.base": l(
    "Subject to the rules below, employees may use approved AI tools for low-risk productivity tasks such as drafting, summarizing, brainstorming and reformatting non-sensitive content.",
    "Sujeto a las reglas siguientes, los empleados pueden usar herramientas de IA aprobadas para tareas de productividad de bajo riesgo como redactar, resumir, generar ideas y reformatear contenido no sensible.",
  ),

  /* restricted uses */
  "restrictedUses.base": l(
    "Higher-risk uses are permitted only with the controls in this policy: human review, no sensitive data, and disclosure where required.",
    "Los usos de mayor riesgo solo se permiten con los controles de esta política: revisión humana, sin datos sensibles y divulgación cuando se requiera.",
  ),
  "restrictedUses.code": l(
    "AI coding tools may be used for non-confidential code, but generated code must be reviewed before deployment and must not include secrets or proprietary source unless the tool is approved for that purpose.",
    "Las herramientas de IA para programación pueden usarse con código no confidencial, pero el código generado debe revisarse antes del despliegue y no debe incluir secretos ni código propietario salvo que la herramienta esté aprobada para ello.",
  ),
  "restrictedUses.media": l(
    "AI-generated images, audio or video must be reviewed for accuracy and IP risk and disclosed as synthetic where required.",
    "Las imágenes, audio o vídeo generados por IA deben revisarse por exactitud y riesgo de PI y divulgarse como sintéticos cuando se requiera.",
  ),

  /* prohibited uses */
  "prohibitedUses.base": l(
    "The following are prohibited: entering credentials, passwords, API keys or secrets into AI tools; using AI to produce deceptive content, impersonation or deepfakes; and presenting AI output as final professional advice without review.",
    "Queda prohibido: introducir credenciales, contraseñas, claves API o secretos en herramientas de IA; usar IA para producir contenido engañoso, suplantación o deepfakes; y presentar resultados de IA como asesoramiento profesional final sin revisión.",
  ),
  "prohibitedUses.confidentialPublic": l(
    "Uploading confidential, client, personal or trade-secret data to public/free AI tools is prohibited unless an approved, enterprise-grade tool with suitable contractual terms is used.",
    "Está prohibido subir datos confidenciales, de clientes, personales o secretos comerciales a herramientas de IA públicas/gratuitas, salvo que se use una herramienta empresarial aprobada con términos contractuales adecuados.",
  ),
  "prohibitedUses.finalDecisions": l(
    "AI must not be used to make final legal, medical, financial, HR or compliance decisions without qualified human judgment.",
    "La IA no debe usarse para tomar decisiones finales legales, médicas, financieras, de RR. HH. o de cumplimiento sin juicio humano cualificado.",
  ),
  "prohibitedUses.automatedHiring": l(
    "Fully automated hiring decisions and employee surveillance/scoring using AI are prohibited without explicit approval, a documented lawful basis and human oversight.",
    "Quedan prohibidas las decisiones de contratación totalmente automatizadas y la vigilancia/puntuación de empleados mediante IA sin aprobación explícita, base legal documentada y supervisión humana.",
  ),

  /* sensitive data */
  "sensitiveData.base": l(
    "Do not enter sensitive data into AI tools unless the specific tool is approved for that data type. Sensitive data includes personal data, client data, confidential information, trade secrets, source code, contracts, legal/privileged material, financial data and regulated data.",
    "No introduzca datos sensibles en herramientas de IA salvo que la herramienta concreta esté aprobada para ese tipo de dato. Los datos sensibles incluyen datos personales, datos de clientes, información confidencial, secretos comerciales, código fuente, contratos, material legal/privilegiado, datos financieros y datos regulados.",
  ),
  "sensitiveData.health": l(
    "Health data must never be entered into AI tools that are not specifically approved and contracted for health data, given heightened legal sensitivity.",
    "Los datos de salud nunca deben introducirse en herramientas de IA que no estén específicamente aprobadas y contratadas para datos de salud, dada su mayor sensibilidad legal.",
  ),
  "sensitiveData.children": l(
    "Children's data must not be entered into AI tools; this requires specific legal review before any processing.",
    "Los datos de menores no deben introducirse en herramientas de IA; esto requiere una revisión legal específica antes de cualquier tratamiento.",
  ),

  /* confidentiality */
  "confidentiality.base": l(
    "Treat anything entered into an AI tool as potentially disclosed outside the company. Do not enter information you would not be comfortable sharing with an external third party absent appropriate contractual protection.",
    "Considere que todo lo que introduce en una herramienta de IA puede divulgarse fuera de la empresa. No introduzca información que no compartiría con un tercero externo sin la protección contractual adecuada.",
  ),

  /* personal data */
  "personalData.base": l(
    "Personal data may only be processed with AI where there is a lawful basis, data-minimization is applied and the tool's terms permit such processing. When in doubt, consult the DPO or legal team.",
    "Los datos personales solo pueden tratarse con IA cuando exista una base legal, se aplique la minimización de datos y los términos de la herramienta permitan dicho tratamiento. En caso de duda, consulte al DPO o al equipo jurídico.",
  ),

  /* ip & output */
  "ipOutput.base": l(
    "AI outputs may carry intellectual-property and accuracy risks. Verify originality and rights before publishing or relying on AI-generated content, and do not assume ownership of generated material.",
    "Los resultados de IA pueden conllevar riesgos de propiedad intelectual y exactitud. Verifique la originalidad y los derechos antes de publicar o confiar en contenido generado por IA, y no asuma la titularidad del material generado.",
  ),

  /* human review */
  "humanReview.base": l(
    "A qualified person must review AI output before it is used in any external, legal, financial, employment, regulated or high-impact context. AI assists; humans remain accountable.",
    "Una persona cualificada debe revisar los resultados de IA antes de usarlos en cualquier contexto externo, legal, financiero, laboral, regulado o de alto impacto. La IA asiste; las personas siguen siendo responsables.",
  ),

  /* disclosure */
  "disclosure.base": l(
    "Disclose AI use where it affects others' understanding or decisions: in public-facing content, when generating synthetic media, and when AI materially informs a decision affecting a client, employee or the public.",
    "Divulgue el uso de IA cuando afecte la comprensión o las decisiones de terceros: en contenido público, al generar contenido sintético y cuando la IA influya materialmente en una decisión que afecte a un cliente, empleado o al público.",
  ),

  /* security */
  "security.base": l(
    "Use company-managed accounts and approved tools, keep software updated, never share login credentials, and report suspected data exposure immediately.",
    "Use cuentas gestionadas por la empresa y herramientas aprobadas, mantenga el software actualizado, nunca comparta credenciales y reporte de inmediato cualquier posible exposición de datos.",
  ),
  "security.noReview": l(
    "Tools that have not undergone a security/privacy review must not be used with any company or personal data until that review is completed.",
    "Las herramientas que no hayan pasado una revisión de seguridad/privacidad no deben usarse con datos de la empresa o personales hasta que se complete dicha revisión.",
  ),

  /* vendor approval */
  "vendorApproval.base": l(
    "New AI tools and vendors must be approved before use through the vendor-approval workflow, which reviews data processing, training on data, security, retention and contractual terms.",
    "Las nuevas herramientas y proveedores de IA deben aprobarse antes de su uso mediante el flujo de aprobación de proveedores, que revisa el tratamiento de datos, el entrenamiento con datos, la seguridad, la retención y los términos contractuales.",
  ),

  /* incident */
  "incident.base": l(
    "Report AI incidents — such as accidental upload of sensitive data, harmful or hallucinated output, or unauthorized tool use — promptly through the incident-reporting process so they can be contained and documented.",
    "Reporte los incidentes de IA — como la subida accidental de datos sensibles, resultados dañinos o alucinados, o el uso de herramientas no autorizadas — con prontitud mediante el proceso de reporte de incidentes para que puedan contenerse y documentarse.",
  ),

  /* training */
  "training.base": l(
    "Employees must complete AI literacy training covering AI limitations, verification of outputs, confidentiality, personal data, approved tools, prohibited uses and how to report incidents.",
    "Los empleados deben completar la formación en alfabetización de IA que cubra las limitaciones de la IA, la verificación de resultados, la confidencialidad, los datos personales, las herramientas aprobadas, los usos prohibidos y cómo reportar incidentes.",
  ),

  /* enforcement */
  "enforcement.base": l(
    "Breaches of this policy may lead to access restrictions and disciplinary measures. The policy is preliminary and will be reviewed and adapted with qualified professionals.",
    "El incumplimiento de esta política puede dar lugar a restricciones de acceso y medidas disciplinarias. La política es preliminar y se revisará y adaptará con profesionales cualificados.",
  ),

  /* owner & review */
  "ownerReview.base": l(
    "Policy owner: {owner}. This preliminary policy should be reviewed at least every 6–12 months and whenever AI use, tools or regulation change materially.",
    "Responsable de la política: {owner}. Esta política preliminar debe revisarse al menos cada 6–12 meses y cuando el uso de IA, las herramientas o la regulación cambien de forma material.",
  ),
};

/** Ordered policy section definitions: id + title + which clause is the base. */
export const POLICY_SECTION_ORDER: { id: string; title: L }[] = [
  { id: "purposeScope", title: l("Purpose and scope", "Propósito y alcance") },
  { id: "applies", title: l("Who the policy applies to", "A quién se aplica la política") },
  { id: "approvedTools", title: l("Approved AI tools", "Herramientas de IA aprobadas") },
  { id: "permittedUses", title: l("Permitted uses", "Usos permitidos") },
  { id: "restrictedUses", title: l("Restricted uses", "Usos restringidos") },
  { id: "prohibitedUses", title: l("Prohibited uses", "Usos prohibidos") },
  { id: "sensitiveData", title: l("Sensitive-data rules", "Reglas sobre datos sensibles") },
  { id: "confidentiality", title: l("Confidentiality rules", "Reglas de confidencialidad") },
  { id: "personalData", title: l("Personal-data rules", "Reglas sobre datos personales") },
  { id: "ipOutput", title: l("IP and output-use rules", "Reglas de PI y uso de resultados") },
  { id: "humanReview", title: l("Human-review requirements", "Requisitos de revisión humana") },
  { id: "disclosure", title: l("Disclosure requirements", "Requisitos de divulgación") },
  { id: "security", title: l("Security requirements", "Requisitos de seguridad") },
  { id: "vendorApproval", title: l("Vendor approval process", "Proceso de aprobación de proveedores") },
  { id: "incident", title: l("Incident reporting process", "Proceso de reporte de incidentes") },
  { id: "training", title: l("Employee training and AI literacy", "Formación de empleados y alfabetización en IA") },
  { id: "enforcement", title: l("Enforcement and policy review", "Cumplimiento y revisión de la política") },
  { id: "ownerReview", title: l("Policy owner and review cadence", "Responsable y cadencia de revisión") },
];

/** Default AI literacy checklist (admin-editable). */
export const LITERACY_ITEMS: { id: string; text: L }[] = [
  { id: "limitations", text: l("Understand what AI can and cannot do (its limitations).", "Comprender qué puede y qué no puede hacer la IA (sus limitaciones).") },
  { id: "verify", text: l("Verify outputs before relying on them.", "Verificar los resultados antes de confiar en ellos.") },
  { id: "confidential", text: l("Protect confidential data — do not paste it into public tools.", "Proteger los datos confidenciales — no pegarlos en herramientas públicas.") },
  { id: "personal", text: l("Avoid misuse of personal data; apply data minimization.", "Evitar el mal uso de datos personales; aplicar la minimización de datos.") },
  { id: "ip", text: l("Check intellectual-property risks in AI outputs.", "Revisar los riesgos de propiedad intelectual en los resultados de IA.") },
  { id: "hallucinations", text: l("Detect hallucinations and fabricated facts.", "Detectar alucinaciones y datos inventados.") },
  { id: "review", text: l("Apply human review in high-impact contexts.", "Aplicar revisión humana en contextos de alto impacto.") },
  { id: "approvedTools", text: l("Follow approved-tool rules and statuses.", "Seguir las reglas y estados de las herramientas aprobadas.") },
  { id: "report", text: l("Know how and when to report incidents.", "Saber cómo y cuándo reportar incidentes.") },
];

/** Default vendor-approval workflow (admin-editable). */
export const VENDOR_WORKFLOW: VendorApprovalWorkflow = {
  whenRequired: [
    l("Before adopting any new AI tool or vendor.", "Antes de adoptar cualquier nueva herramienta o proveedor de IA."),
    l("When an existing vendor adds AI features or changes its model.", "Cuando un proveedor existente añade funciones de IA o cambia su modelo."),
    l("Before sending confidential, personal or client data to a tool.", "Antes de enviar datos confidenciales, personales o de clientes a una herramienta."),
  ],
  intakeFields: [
    l("Tool/vendor name and purpose.", "Nombre del proveedor/herramienta y propósito."),
    l("Data types to be processed.", "Tipos de datos a tratar."),
    l("Plan/tier (free vs. enterprise) and account type.", "Plan/nivel (gratuito vs. empresarial) y tipo de cuenta."),
    l("Business owner requesting the tool.", "Responsable de negocio que solicita la herramienta."),
  ],
  reviewSteps: [
    l("Privacy review: lawful basis, data processing terms, training on data.", "Revisión de privacidad: base legal, términos de tratamiento, entrenamiento con datos."),
    l("Security review: certifications, data location, retention/deletion.", "Revisión de seguridad: certificaciones, ubicación de datos, retención/eliminación."),
    l("Legal review: subprocessors, audit rights, incident notice, liability.", "Revisión legal: subencargados, derechos de auditoría, notificación de incidentes, responsabilidad."),
  ],
  approvalRoles: [
    l("Privacy/DPO sign-off.", "Aprobación de privacidad/DPO."),
    l("Security/IT sign-off.", "Aprobación de seguridad/TI."),
    l("Legal/compliance sign-off.", "Aprobación legal/cumplimiento."),
  ],
  contractChecks: [
    l("No training on customer data without consent.", "Sin entrenamiento con datos de clientes sin consentimiento."),
    l("Defined retention and deletion.", "Retención y eliminación definidas."),
    l("Incident notification and audit rights.", "Notificación de incidentes y derechos de auditoría."),
    l("Liability, indemnities and regulatory cooperation.", "Responsabilidad, indemnizaciones y cooperación regulatoria."),
  ],
  reviewCadence: l("Re-review approved vendors at least annually or on material change.", "Revisar de nuevo los proveedores aprobados al menos anualmente o ante cambios materiales."),
};

/** Default conversion offer + CTAs (admin-editable). */
export const CONVERSION = {
  heading: l("Have the policy reviewed and adapted to your company.", "Haz que la política sea revisada y adaptada a tu empresa."),
  body: l(
    "This package is a preliminary draft. Our team can review and adapt it to your company, jurisdiction and risk profile, and train your employees.",
    "Este paquete es un borrador preliminar. Nuestro equipo puede revisarlo y adaptarlo a su empresa, jurisdicción y perfil de riesgo, y formar a sus empleados.",
  ),
};

export const CTAS: { id: string; label: L }[] = [
  { id: "request", label: l("Request policy review", "Solicitar revisión de la política") },
  { id: "book", label: l("Book AI governance consultation", "Agendar consulta de gobernanza de IA") },
  { id: "training", label: l("Get employee AI training package", "Solicitar paquete de formación en IA para empleados") },
];

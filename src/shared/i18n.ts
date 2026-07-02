/**
 * Bilingual UI string dictionary (EN/ES).
 *
 * Keys are flat dotted strings. `t(lang, key)` resolves a string, optionally
 * merged with admin translation overrides. Generated policy content does NOT
 * live here — it lives in the seed templates and is produced by the rules
 * engine as bilingual `L` objects.
 */

import type { Lang } from "./types";

export const DISCLAIMER_VERSION = "2026-06";

/** The core disclaimer, used verbatim per the product spec. */
export const CORE_DISCLAIMER = {
  en:
    "This tool generates preliminary AI governance materials for informational " +
    "purposes only. It is not legal advice, not a final compliance review, and " +
    "does not create a lawyer-client relationship. Your company's AI policy " +
    "should be reviewed and adapted by qualified professionals before implementation.",
  es:
    "Esta herramienta genera materiales preliminares de gobernanza de IA con " +
    "fines informativos. No constituye asesoramiento jurídico, no es una revisión " +
    "final de cumplimiento y no crea una relación abogado-cliente. La política de " +
    "IA de su empresa debe ser revisada y adaptada por profesionales cualificados " +
    "antes de su implementación.",
};

type Dict = Record<string, string>;

const en: Dict = {
  "app.title": "AI Governance Policy Builder",
  "app.tagline": "Preliminary AI governance for companies that use AI — not just AI companies.",
  "app.langName": "English",

  "nav.welcome": "Welcome",
  "nav.disclaimer": "Disclaimer",
  "nav.questionnaire": "Questionnaire",
  "nav.summary": "Maturity summary",
  "nav.package": "Policy package",
  "nav.literacy": "AI literacy",
  "nav.vendor": "Vendor approval",
  "nav.export": "Export center",
  "nav.contact": "Contact",
  "nav.admin": "Admin",

  "lang.toggle": "Language",
  "lang.en": "English",
  "lang.es": "Español",

  "welcome.heading": "Build a preliminary AI governance policy for your company",
  "welcome.body":
    "Answer structured questions about how your team uses generative AI, and get a first-draft internal governance package: an AI-use policy, approved-tools list, sensitive-data rules, human-review requirements, disclosure rules, an incident process, an AI literacy checklist and a vendor-approval workflow.",
  "welcome.start": "Get started",
  "welcome.chooseLang": "Choose your language",
  "welcome.notLegal": "Preliminary draft — not legal advice.",

  "disclaimer.heading": "Before you begin",
  "disclaimer.accept": "I have read and accept this disclaimer",
  "disclaimer.continue": "Accept and continue",
  "disclaimer.mustAccept": "You must accept the disclaimer before generating a policy.",

  "q.progress": "Step {n} of {total}",
  "q.next": "Next",
  "q.back": "Back",
  "q.generate": "Generate policy package",
  "q.other": "Other (please specify)",
  "q.yes": "Yes",
  "q.no": "No",
  "q.unknown": "Unknown",
  "q.selectAll": "Select all that apply",
  "q.tool.add": "Configure tool",
  "q.tool.status": "Status",
  "q.tool.plan": "Plan",
  "q.tool.account": "Accounts",
  "q.tool.trains": "Data used for training?",
  "q.tool.terms": "Contract terms reviewed?",
  "q.tool.security": "Security/privacy review done?",
  "status.approved": "Approved",
  "status.tolerated": "Tolerated",
  "status.prohibited": "Prohibited",
  "status.unknown": "Unknown",
  "plan.free": "Free",
  "plan.enterprise": "Enterprise",
  "plan.mixed": "Mixed",
  "account.company": "Company accounts",
  "account.personal": "Personal accounts",
  "account.mixed": "Mixed",

  "summary.heading": "AI governance readiness",
  "summary.scoreLabel": "AI governance readiness score",
  "summary.notCompliance": "This is a readiness indicator, not a compliance score. It does not certify legal compliance.",
  "summary.breakdown": "Score breakdown",
  "summary.findings": "Key findings",
  "summary.viewPackage": "View full policy package",

  "package.title": "Preliminary AI Governance Policy Package",
  "package.execSummary": "Executive summary",
  "package.score": "AI governance readiness score",
  "package.policy": "Internal AI-use policy",
  "package.tools": "Approved-tools list",
  "package.sensitive": "Sensitive-data rules",
  "package.humanReview": "Human-review requirements",
  "package.disclosure": "Employee disclosure rules",
  "package.incident": "Incident-reporting process",
  "package.literacy": "AI literacy checklist",
  "package.vendor": "Vendor-approval workflow",
  "package.missing": "Missing information",
  "package.nextSteps": "Recommended next steps",
  "package.conversion": "Professional review offer",
  "package.edit": "Edit",
  "package.save": "Save",
  "package.cancel": "Cancel",
  "package.required": "Human review required",
  "package.notRequired": "Recommended",
  "package.colContext": "Context",
  "package.colRequirement": "Requirement",
  "package.colRule": "Rule",
  "package.colTool": "Tool",
  "package.colStatus": "Status",
  "package.colPermitted": "Permitted uses",
  "package.colRestricted": "Restricted uses",
  "package.colDataAllowed": "Data allowed",
  "package.colDataProhibited": "Data prohibited",
  "package.colOwner": "Owner",
  "package.colReview": "Review date",

  "export.heading": "Export center",
  "export.body": "Download your preliminary package. Documents are drafts for professional review.",
  "export.full": "Full policy package",
  "export.policyOnly": "Internal AI-use policy only",
  "export.tools": "Approved-tools list",
  "export.literacy": "AI literacy checklist",
  "export.vendor": "Vendor-approval workflow",
  "export.incident": "Incident-reporting process",
  "export.pdf": "PDF",
  "export.docx": "DOCX",
  "export.json": "JSON",
  "export.pdfFallback": "PDF export opens a print-ready view — use your browser's \"Save as PDF\".",

  "conversion.request": "Request policy review",
  "conversion.book": "Book AI governance consultation",
  "conversion.training": "Get employee AI training package",

  "contact.heading": "Have the policy reviewed and adapted to your company",
  "contact.name": "Name",
  "contact.company": "Company",
  "contact.email": "Email",
  "contact.country": "Country",
  "contact.industry": "Industry",
  "contact.employees": "Number of employees",
  "contact.tools": "Current AI tools",
  "contact.urgency": "Urgency",
  "contact.message": "Message",
  "contact.upload": "Upload existing policy",
  "contact.submit": "Send request",
  "contact.sent": "Thank you — we received your request and will be in touch.",
  "contact.urgency.low": "Low",
  "contact.urgency.medium": "Medium",
  "contact.urgency.high": "High",

  "upload.heading": "Upload existing documents (optional)",
  "upload.body": "Upload existing AI/IT/acceptable-use policies, vendor lists or training materials. Supported: PDF, DOCX, TXT, PNG, JPG, JPEG. Uploaded documents only inform the preliminary draft — they are never treated as final legal advice.",
  "upload.choose": "Choose file",
  "upload.weak": "Text extraction was limited for this file; it will be used only as context.",
  "upload.uploaded": "Uploaded",

  "admin.heading": "Admin",
  "admin.tab.questions": "Questions",
  "admin.tab.templates": "Templates",
  "admin.tab.scoring": "Scoring",
  "admin.tab.literacy": "AI literacy",
  "admin.tab.vendor": "Vendor workflow",
  "admin.tab.disclaimer": "Disclaimer",
  "admin.tab.cta": "CTA & conversion",
  "admin.tab.translations": "Translations",
  "admin.tab.leads": "Leads",
  "admin.save": "Save changes",
  "admin.saved": "Saved.",
  "admin.reset": "Reset to defaults",
  "admin.exportJson": "Export JSON",
  "admin.token": "Admin token",
  "admin.login": "Unlock admin",
  "admin.badToken": "Invalid admin token.",
  "admin.leads.none": "No leads yet.",
  "admin.en": "English",
  "admin.es": "Español",

  "common.loading": "Loading…",
  "common.error": "Something went wrong.",
  "common.optional": "optional",
  "common.disclaimerShort": "Preliminary draft — review with qualified professionals before use.",

  "ilp.name": "ILP Abogados",
  "ilp.by": "by ILP Abogados",
  "ilp.tagline": "Intelligence that understands your business",
  "ilp.notice.title": "A free tool by ILP Abogados — not a substitute for legal services",
  "ilp.notice.body":
    "This tool creates a helpful first draft of your AI governance policy in minutes. It does not replace legal services or professional advice. When your draft is ready, the ILP Abogados team can review it, adapt it to your company and jurisdiction, and train your people.",
  "ilp.modal.eyebrow": "ILP Abogados · Legal + Technology",
  "ilp.modal.title": "Your draft is ready. Now make it solid.",
  "ilp.modal.body":
    "You have a preliminary AI governance package — a great starting point, but not legal advice. ILP Abogados combines legal expertise and technology to turn drafts like this into policies your company can actually rely on: reviewed, adapted to your jurisdiction and sector, and rolled out with employee training.",
  "ilp.modal.review": "Request professional review",
  "ilp.modal.call": "Call us",
  "ilp.modal.email": "Write to us",
  "ilp.modal.web": "Visit ilpabogados.com",
  "ilp.modal.later": "Maybe later",
  "ilp.modal.fineprint":
    "This tool does not substitute legal services and creates no lawyer-client relationship.",
  "ilp.float": "Contact ILP Abogados",
};

const es: Dict = {
  "app.title": "Generador de Políticas de Gobernanza de IA",
  "app.tagline": "Gobernanza de IA preliminar para empresas que usan IA — no solo empresas de IA.",
  "app.langName": "Español",

  "nav.welcome": "Inicio",
  "nav.disclaimer": "Aviso legal",
  "nav.questionnaire": "Cuestionario",
  "nav.summary": "Resumen de madurez",
  "nav.package": "Paquete de política",
  "nav.literacy": "Alfabetización en IA",
  "nav.vendor": "Aprobación de proveedores",
  "nav.export": "Centro de exportación",
  "nav.contact": "Contacto",
  "nav.admin": "Administración",

  "lang.toggle": "Idioma",
  "lang.en": "English",
  "lang.es": "Español",

  "welcome.heading": "Cree una política preliminar de gobernanza de IA para su empresa",
  "welcome.body":
    "Responda preguntas estructuradas sobre cómo su equipo utiliza la IA generativa y obtenga un primer borrador de paquete interno de gobernanza: política de uso de IA, lista de herramientas aprobadas, reglas sobre datos sensibles, requisitos de revisión humana, reglas de divulgación, proceso de incidentes, checklist de alfabetización en IA y flujo de aprobación de proveedores.",
  "welcome.start": "Comenzar",
  "welcome.chooseLang": "Elija su idioma",
  "welcome.notLegal": "Borrador preliminar — no es asesoramiento jurídico.",

  "disclaimer.heading": "Antes de comenzar",
  "disclaimer.accept": "He leído y acepto este aviso",
  "disclaimer.continue": "Aceptar y continuar",
  "disclaimer.mustAccept": "Debe aceptar el aviso antes de generar una política.",

  "q.progress": "Paso {n} de {total}",
  "q.next": "Siguiente",
  "q.back": "Atrás",
  "q.generate": "Generar paquete de política",
  "q.other": "Otro (especifique)",
  "q.yes": "Sí",
  "q.no": "No",
  "q.unknown": "No se sabe",
  "q.selectAll": "Seleccione todas las que correspondan",
  "q.tool.add": "Configurar herramienta",
  "q.tool.status": "Estado",
  "q.tool.plan": "Plan",
  "q.tool.account": "Cuentas",
  "q.tool.trains": "¿Se usan los datos para entrenamiento?",
  "q.tool.terms": "¿Se revisaron los términos contractuales?",
  "q.tool.security": "¿Se hizo revisión de seguridad/privacidad?",
  "status.approved": "Aprobada",
  "status.tolerated": "Tolerada",
  "status.prohibited": "Prohibida",
  "status.unknown": "No se sabe",
  "plan.free": "Gratuita",
  "plan.enterprise": "Empresarial",
  "plan.mixed": "Mixta",
  "account.company": "Cuentas de empresa",
  "account.personal": "Cuentas personales",
  "account.mixed": "Mixtas",

  "summary.heading": "Preparación en gobernanza de IA",
  "summary.scoreLabel": "Puntuación de preparación en gobernanza de IA",
  "summary.notCompliance": "Es un indicador de preparación, no una puntuación de cumplimiento. No certifica el cumplimiento legal.",
  "summary.breakdown": "Desglose de la puntuación",
  "summary.findings": "Hallazgos clave",
  "summary.viewPackage": "Ver el paquete completo de política",

  "package.title": "Paquete preliminar de política de gobernanza de IA",
  "package.execSummary": "Resumen ejecutivo",
  "package.score": "Puntuación de preparación en gobernanza de IA",
  "package.policy": "Política interna de uso de IA",
  "package.tools": "Lista de herramientas aprobadas",
  "package.sensitive": "Reglas sobre datos sensibles",
  "package.humanReview": "Requisitos de revisión humana",
  "package.disclosure": "Reglas de divulgación del uso de IA",
  "package.incident": "Proceso de reporte de incidentes",
  "package.literacy": "Checklist de alfabetización en IA",
  "package.vendor": "Flujo de aprobación de proveedores",
  "package.missing": "Información faltante",
  "package.nextSteps": "Próximos pasos recomendados",
  "package.conversion": "Oferta de revisión profesional",
  "package.edit": "Editar",
  "package.save": "Guardar",
  "package.cancel": "Cancelar",
  "package.required": "Revisión humana obligatoria",
  "package.notRequired": "Recomendada",
  "package.colContext": "Contexto",
  "package.colRequirement": "Requisito",
  "package.colRule": "Regla",
  "package.colTool": "Herramienta",
  "package.colStatus": "Estado",
  "package.colPermitted": "Usos permitidos",
  "package.colRestricted": "Usos restringidos",
  "package.colDataAllowed": "Datos permitidos",
  "package.colDataProhibited": "Datos prohibidos",
  "package.colOwner": "Responsable",
  "package.colReview": "Fecha de revisión",

  "export.heading": "Centro de exportación",
  "export.body": "Descargue su paquete preliminar. Los documentos son borradores para revisión profesional.",
  "export.full": "Paquete completo de política",
  "export.policyOnly": "Solo política interna de uso de IA",
  "export.tools": "Lista de herramientas aprobadas",
  "export.literacy": "Checklist de alfabetización en IA",
  "export.vendor": "Flujo de aprobación de proveedores",
  "export.incident": "Proceso de reporte de incidentes",
  "export.pdf": "PDF",
  "export.docx": "DOCX",
  "export.json": "JSON",
  "export.pdfFallback": "La exportación PDF abre una vista lista para imprimir — use «Guardar como PDF» de su navegador.",

  "conversion.request": "Solicitar revisión de la política",
  "conversion.book": "Agendar consulta de gobernanza de IA",
  "conversion.training": "Solicitar paquete de formación en IA para empleados",

  "contact.heading": "Haz que la política sea revisada y adaptada a tu empresa",
  "contact.name": "Nombre",
  "contact.company": "Empresa",
  "contact.email": "Correo electrónico",
  "contact.country": "País",
  "contact.industry": "Sector",
  "contact.employees": "Número de empleados",
  "contact.tools": "Herramientas de IA utilizadas",
  "contact.urgency": "Urgencia",
  "contact.message": "Mensaje",
  "contact.upload": "Subir política existente",
  "contact.submit": "Enviar solicitud",
  "contact.sent": "Gracias — hemos recibido su solicitud y nos pondremos en contacto.",
  "contact.urgency.low": "Baja",
  "contact.urgency.medium": "Media",
  "contact.urgency.high": "Alta",

  "upload.heading": "Subir documentos existentes (opcional)",
  "upload.body": "Suba políticas de IA/TI/uso aceptable, listas de proveedores o materiales de formación existentes. Formatos: PDF, DOCX, TXT, PNG, JPG, JPEG. Los documentos subidos solo informan el borrador preliminar — nunca se tratan como asesoramiento jurídico final.",
  "upload.choose": "Elegir archivo",
  "upload.weak": "La extracción de texto fue limitada para este archivo; se usará solo como contexto.",
  "upload.uploaded": "Subido",

  "admin.heading": "Administración",
  "admin.tab.questions": "Preguntas",
  "admin.tab.templates": "Plantillas",
  "admin.tab.scoring": "Puntuación",
  "admin.tab.literacy": "Alfabetización en IA",
  "admin.tab.vendor": "Flujo de proveedores",
  "admin.tab.disclaimer": "Aviso legal",
  "admin.tab.cta": "CTA y conversión",
  "admin.tab.translations": "Traducciones",
  "admin.tab.leads": "Leads",
  "admin.save": "Guardar cambios",
  "admin.saved": "Guardado.",
  "admin.reset": "Restablecer valores por defecto",
  "admin.exportJson": "Exportar JSON",
  "admin.token": "Token de administrador",
  "admin.login": "Desbloquear administración",
  "admin.badToken": "Token de administrador no válido.",
  "admin.leads.none": "Aún no hay leads.",
  "admin.en": "English",
  "admin.es": "Español",

  "common.loading": "Cargando…",
  "common.error": "Algo salió mal.",
  "common.optional": "opcional",
  "common.disclaimerShort": "Borrador preliminar — revíselo con profesionales cualificados antes de usarlo.",

  "ilp.name": "ILP Abogados",
  "ilp.by": "por ILP Abogados",
  "ilp.tagline": "Inteligencia que entiende tu negocio",
  "ilp.notice.title": "Una herramienta gratuita de ILP Abogados — no sustituye los servicios legales",
  "ilp.notice.body":
    "Esta herramienta crea en minutos un primer borrador útil de su política de gobernanza de IA. No sustituye los servicios legales ni el asesoramiento profesional. Cuando su borrador esté listo, el equipo de ILP Abogados puede revisarlo, adaptarlo a su empresa y jurisdicción, y formar a su equipo.",
  "ilp.modal.eyebrow": "ILP Abogados · Legal + Tecnología",
  "ilp.modal.title": "Su borrador está listo. Ahora hágalo sólido.",
  "ilp.modal.body":
    "Ya tiene un paquete preliminar de gobernanza de IA: un gran punto de partida, pero no es asesoramiento jurídico. ILP Abogados combina experiencia legal y tecnología para convertir borradores como este en políticas en las que su empresa pueda confiar de verdad: revisadas, adaptadas a su jurisdicción y sector, e implantadas con formación para empleados.",
  "ilp.modal.review": "Solicitar revisión profesional",
  "ilp.modal.call": "Llámenos",
  "ilp.modal.email": "Escríbanos",
  "ilp.modal.web": "Visitar ilpabogados.com",
  "ilp.modal.later": "Quizás más tarde",
  "ilp.modal.fineprint":
    "Esta herramienta no sustituye los servicios legales y no crea una relación abogado-cliente.",
  "ilp.float": "Contactar con ILP Abogados",
};

export const UI: Record<Lang, Dict> = { en, es };

/** All UI keys (used by the admin translations editor). */
export const UI_KEYS = Object.keys(en);

/**
 * Resolve a UI string. `overrides` lets the admin area shadow defaults.
 * Supports simple {placeholder} interpolation.
 */
export function t(
  lang: Lang,
  key: string,
  vars?: Record<string, string | number>,
  overrides?: Record<Lang, Dict>,
): string {
  const base = UI[lang][key];
  const override = overrides?.[lang]?.[key];
  let str = override ?? base ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return str;
}

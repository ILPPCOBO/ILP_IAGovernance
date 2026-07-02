import type { AdminConfig } from "./types";
import { CORE_DISCLAIMER, DISCLAIMER_VERSION, UI } from "./i18n";
import { CATEGORIES, QUESTIONS } from "./seed/questionnaire";
import { TOOL_CATALOG } from "./seed/tools";
import {
  CONVERSION,
  CTAS,
  LITERACY_ITEMS,
  POLICY_CLAUSES,
  VENDOR_WORKFLOW,
} from "./seed/templates";
import { SCORING_RULES } from "./rules/scoring";

/**
 * Build the full editable admin configuration from seed defaults. This is the
 * single source of truth the admin area mutates and the rules engine consumes.
 */
export function buildDefaultConfig(): AdminConfig {
  return {
    disclaimerVersion: DISCLAIMER_VERSION,
    disclaimer: { ...CORE_DISCLAIMER },
    questions: structuredClone(QUESTIONS),
    categories: structuredClone(CATEGORIES),
    tools: structuredClone(TOOL_CATALOG),
    templates: { clauses: structuredClone(POLICY_CLAUSES) },
    scoring: structuredClone(SCORING_RULES),
    literacy: structuredClone(LITERACY_ITEMS),
    vendorWorkflow: structuredClone(VENDOR_WORKFLOW),
    cta: structuredClone(CTAS),
    conversion: { heading: { ...CONVERSION.heading }, body: { ...CONVERSION.body } },
    translations: { en: { ...UI.en }, es: { ...UI.es }, zh: { ...UI.zh } },
  };
}

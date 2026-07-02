import type { ToolCatalogEntry } from "../types";

/**
 * Catalogue of AI tools the questionnaire asks about (section C).
 * `publicByDefault` flags tools whose default/free tier behaves like a
 * "public AI tool" for the purposes of the high-risk confidential-data rule.
 */
export const TOOL_CATALOG: ToolCatalogEntry[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    kind: "chatbot",
    publicByDefault: true,
    note: {
      en: "Public/free tiers may use inputs to improve models unless settings/enterprise terms say otherwise.",
      es: "Las versiones públicas/gratuitas pueden usar las entradas para mejorar modelos salvo configuración/términos empresariales.",
    },
  },
  {
    id: "copilot",
    name: "Microsoft Copilot",
    kind: "assistant",
    publicByDefault: false,
    note: {
      en: "Enterprise (M365) Copilot offers commercial data protection; consumer Copilot does not.",
      es: "Copilot empresarial (M365) ofrece protección de datos comercial; el Copilot de consumo no.",
    },
  },
  {
    id: "gemini",
    name: "Google Gemini",
    kind: "chatbot",
    publicByDefault: true,
    note: {
      en: "Consumer Gemini may retain conversations; Workspace/enterprise terms differ.",
      es: "Gemini de consumo puede retener conversaciones; los términos de Workspace/empresa difieren.",
    },
  },
  {
    id: "claude",
    name: "Claude",
    kind: "chatbot",
    publicByDefault: true,
    note: {
      en: "Consumer tiers vs. Team/Enterprise/API have different data-use defaults.",
      es: "Las versiones de consumo frente a Team/Enterprise/API tienen distintos valores de uso de datos.",
    },
  },
  {
    id: "perplexity",
    name: "Perplexity",
    kind: "search",
    publicByDefault: true,
    note: {
      en: "AI research/search tool; outputs can be inaccurate and must be verified.",
      es: "Herramienta de búsqueda/investigación con IA; los resultados pueden ser inexactos y deben verificarse.",
    },
  },
  {
    id: "midjourney",
    name: "Midjourney",
    kind: "image",
    publicByDefault: true,
    note: {
      en: "Image generation; IP/licensing and disclosure considerations apply.",
      es: "Generación de imágenes; aplican consideraciones de PI/licencia y divulgación.",
    },
  },
  {
    id: "dalle",
    name: "DALL·E",
    kind: "image",
    publicByDefault: true,
    note: {
      en: "Image generation; review output rights and disclosure for synthetic media.",
      es: "Generación de imágenes; revise derechos de uso y divulgación de contenido sintético.",
    },
  },
  {
    id: "notion-ai",
    name: "Notion AI",
    kind: "embedded",
    publicByDefault: false,
    note: {
      en: "AI embedded in a SaaS workspace; data scope follows the underlying workspace.",
      es: "IA integrada en un espacio SaaS; el alcance de datos sigue al espacio subyacente.",
    },
  },
  {
    id: "grammarly",
    name: "Grammarly",
    kind: "embedded",
    publicByDefault: true,
    note: {
      en: "Processes text you write, including potentially sensitive drafts.",
      es: "Procesa el texto que escribe, incluidos posibles borradores sensibles.",
    },
  },
  {
    id: "meeting-assistants",
    name: "Otter / Fireflies / meeting assistants",
    kind: "transcription",
    publicByDefault: true,
    note: {
      en: "Recording/transcription raises consent, confidentiality and retention issues.",
      es: "La grabación/transcripción plantea cuestiones de consentimiento, confidencialidad y retención.",
    },
  },
  {
    id: "github-copilot",
    name: "GitHub Copilot",
    kind: "code",
    publicByDefault: false,
    note: {
      en: "AI coding tool; source-code exposure and license/IP review needed.",
      es: "Herramienta de programación con IA; requiere revisión de exposición de código y licencias/PI.",
    },
  },
  {
    id: "saas-embedded",
    name: "AI embedded in SaaS platforms",
    kind: "embedded",
    publicByDefault: false,
    note: {
      en: "AI features bundled into existing SaaS; review each platform's data terms.",
      es: "Funciones de IA incluidas en SaaS existente; revise los términos de datos de cada plataforma.",
    },
  },
  {
    id: "custom-internal",
    name: "Custom / internal AI tools",
    kind: "custom",
    publicByDefault: false,
    note: {
      en: "Internally built/hosted AI; governance depends on your own controls.",
      es: "IA construida/alojada internamente; la gobernanza depende de sus propios controles.",
    },
  },
];

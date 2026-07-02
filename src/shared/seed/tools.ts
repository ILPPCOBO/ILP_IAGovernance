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
      zh: "公共/免费版本可能将输入内容用于改进模型，除非相关设置或企业版条款另有规定。",
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
      zh: "企业版（M365）Copilot 提供商业数据保护；消费者版 Copilot 则不提供。",
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
      zh: "消费者版 Gemini 可能留存对话内容；Workspace/企业版条款有所不同。",
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
      zh: "消费者版本与 Team/Enterprise/API 版本的默认数据使用规则不同。",
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
      zh: "人工智能检索/研究工具；输出内容可能不准确，必须加以核实。",
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
      zh: "图像生成；需考虑知识产权/许可以及披露相关事项。",
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
      zh: "图像生成；请审查输出内容的使用权利及合成媒体的披露要求。",
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
      zh: "嵌入 SaaS 工作区的人工智能；数据范围取决于所在的底层工作区。",
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
      zh: "会处理您撰写的文本，包括可能涉及敏感内容的草稿。",
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
      zh: "录音/转写涉及同意、保密及数据留存等问题。",
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
      zh: "人工智能编程工具；需审查源代码暴露风险及许可/知识产权问题。",
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
      zh: "集成于现有 SaaS 的人工智能功能；请审查各平台的数据条款。",
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
      zh: "内部构建/托管的人工智能；其治理取决于贵公司自身的控制措施。",
    },
  },
];

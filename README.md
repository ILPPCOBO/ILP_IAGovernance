# AI Governance Policy Builder

A bilingual (English / Spanish) full-stack TypeScript web app that produces a
**preliminary, internal AI-governance policy package** for ordinary companies
that *use* generative AI — not just AI companies. A user answers a structured
questionnaire about how their team uses AI, and the app's explainable,
rule-based engine returns a first-draft governance package they can review and
export.

> ## ⚠ This is preliminary — not legal advice
>
> **English.** This tool generates preliminary AI governance materials for
> informational purposes only. It is not legal advice, not a final compliance
> review, and does not create a lawyer-client relationship. Your company's AI
> policy should be reviewed and adapted by qualified professionals before
> implementation.
>
> **Español.** Esta herramienta genera materiales preliminares de gobernanza de
> IA con fines informativos. No constituye asesoramiento jurídico, no es una
> revisión final de cumplimiento y no crea una relación abogado-cliente. La
> política de IA de su empresa debe ser revisada y adaptada por profesionales
> cualificados antes de su implementación.

The disclaimer above is the **core disclaimer** (`CORE_DISCLAIMER`,
version `2026-06`). The user must accept it before any package is generated, and
it is embedded in every generated package and every export.

---

## What you get — the 10 main package sections

Every generated **policy package** is a single bilingual object whose ten main
sections map directly to product features:

| # | Section | What it is |
| --- | --- | --- |
| 1 | **Executive summary** | A plain-language overview of the company, its readiness score and the count of findings — always flagged as preliminary, never as "compliant". |
| 2 | **AI governance readiness score** | A 0–100 *readiness* indicator (band: early / developing / structured / mature) with a per-category breakdown. **Not** a compliance score. |
| 3 | **Internal AI-use policy** | An 18-section draft policy (purpose & scope, approved tools, permitted/restricted/prohibited uses, sensitive data, confidentiality, personal data, IP, human review, disclosure, security, vendor approval, incidents, training, enforcement, owner & review). Clauses are selected from an editable library based on the answers. |
| 4 | **Approved-tools list** | A per-tool table (status, permitted/restricted uses, data allowed/prohibited, owner, review date), derived from the tools the company reported. |
| 5 | **Sensitive-data rules** | Per-data-type rules (personal, client, confidential, source code, contracts, financial, employee, health, legal, trade secrets, credentials, regulatory) with severities. |
| 6 | **Human-review requirements** | A table of high-impact contexts (client comms, legal/compliance, employment, financial, code deploy, marketing, support, regulated) marking what is required vs. a gap. |
| 7 | **Employee disclosure rules** | When AI use must/should be disclosed (internal, clients, public, synthetic media, decisions, regulated work). |
| 8 | **Incident-reporting process** | What counts as an incident, who to report to, timeline, info to include, escalation, containment and documentation steps. |
| 9 | **AI literacy checklist** | Training topics to cover, with priority flags on topics the company does not yet train on. |
| 10 | **Vendor-approval workflow** | When approval is required, intake fields, review steps, approval roles, contract checks and review cadence. |

Each package also carries **key findings** (severity-ranked, explainable —
every finding lists what triggered it), **missing information**, **recommended
next steps**, and a **professional-review conversion offer** with CTAs.

---

## Features

- **Bilingual everywhere (EN/ES).** Every generated string is a `{ en, es }`
  pair, so the same package can be viewed or exported in either language. A
  language toggle is available throughout the UI.
- **Disclaimer gate.** Packages cannot be generated until the current
  disclaimer is accepted (enforced server-side with a `403`).
- **Structured questionnaire** across 10 categories (A–J): company profile,
  current AI use, AI tools, data & confidentiality, human review, disclosure,
  incidents, vendor approval, AI literacy, and prohibited/restricted uses.
- **Explainable rule-based engine** — no black box. Findings, clauses and
  controls are derived only from the answers; nothing is invented.
- **Optional document uploads** (PDF/DOCX/TXT/MD/PNG/JPG/JPEG) used only as
  context for the preliminary draft, never treated as final advice.
- **Export center**: full package or individual sections as **JSON**, real
  **DOCX**, or a **print-ready HTML "Save as PDF"** fallback — always with the
  disclaimer.
- **Lead capture**: a contact form turns an assessment into a request for
  professional review.
- **Admin area** (token-protected) to edit questions, templates/clauses,
  scoring, AI-literacy items, the vendor workflow, the disclaimer, CTAs &
  conversion copy, and UI translations — plus view leads and export config.

---

## Architecture & folder map

ESM throughout (`"type": "module"`); extensionless relative imports resolved by
tsx / Vite / Vitest. TypeScript strict. React 18 + Vite client; Express server;
JSON-file storage under `data/`.

```
ai-governance-policy-builder/
├── README.md                  ← you are here
├── package.json               ← scripts & deps (ESM)
├── tsconfig.json              ← strict, ES2022, bundler resolution
├── vite.config.ts             ← client root src/client, port 5200, /api → :8830
├── vitest.config.ts           ← node env, test/**/*.test.ts
│
├── docs/
│   └── CONTRACT.md            ← the frozen integration contract (authoritative)
│
├── src/
│   ├── shared/                ← FROZEN shared spine (do not modify)
│   │   ├── types.ts           ← all data models (the L = {en,es} primitive, etc.)
│   │   ├── i18n.ts            ← UI strings, CORE_DISCLAIMER, t(), DISCLAIMER_VERSION
│   │   ├── config.ts          ← buildDefaultConfig(): AdminConfig (seed defaults)
│   │   ├── render.ts          ← renderBlocks / renderMarkdown / renderHtml / tr
│   │   ├── index.ts           ← single entry re-exporting the spine
│   │   ├── rules/
│   │   │   ├── engine.ts      ← generatePackage(input): PolicyPackage
│   │   │   └── scoring.ts     ← computeScore, SCORING_RULES, BAND_LABEL
│   │   └── seed/
│   │       ├── questionnaire.ts ← QUESTIONS, CATEGORIES
│   │       ├── templates.ts     ← POLICY_CLAUSES, sections, literacy, vendor, CTAs
│   │       └── tools.ts         ← TOOL_CATALOG
│   │
│   ├── server/                ← Express API (createApp factory + index listener)
│   └── client/                ← React 18 + Vite SPA (index.html + main.tsx + UI)
│
├── scripts/
│   └── generate-samples.ts    ← writes illustrative mock packages to samples/
│
├── samples/                   ← generated illustrative outputs (see samples/README.md)
│
├── test/                      ← Vitest suite (see "Tests")
│
├── data/                      ← JSON storage (config, sessions, packages, leads.json)
└── uploads/                   ← uploaded document files
```

The **shared spine** (`src/shared/**`) is the single source of truth for data
models, the rules engine, scoring, rendering, i18n and seed data. The server and
client both import from `src/shared/index`.

---

## Prerequisites

- **Node.js 18+** (Node 20 recommended; `@types/node` ^20).
- **npm** (a `package-lock.json` is committed).

## Install

```bash
npm install
```

## Run (development)

The dev client runs under Vite on **http://localhost:5200** and proxies `/api`
to the Express server on **http://localhost:8830**.

```bash
npm run dev
```

This launches both processes together (via `concurrently`):

- **client** → Vite on **port 5200** (open this in your browser)
- **server** → Express on **port 8830**

To run them separately:

```bash
npm run dev:server   # Express API (tsx watch) on :8830
npm run dev:client   # Vite client on :5200, proxying /api → :8830
```

## Build & run (production)

```bash
npm run build        # tsc --noEmit type-check, then vite build → dist/client
npm start            # start the Express server (serves dist/client if present)
```

In production the Express server serves the built client from `dist/client` and
exposes the same `/api` routes on port **8830**.

> **Admin token.** The admin area is protected by a token, default
> **`admin-demo`**, configurable via the `ADMIN_TOKEN` environment variable.
> Storage location is configurable via `DATA_DIR` (used by tests for a temp
> dir).

---

## Tests

```bash
npm test             # vitest run (test/**/*.test.ts)
npm run test:watch   # watch mode
```

The suite covers **18 checks** spanning the engine, scoring, rendering and the
API contract:

1. **Disclaimer gate** — `POST /api/generate` returns `403 { error:"disclaimer_required" }` until the session has accepted the current disclaimer.
2. **Generation after acceptance** — once accepted, generation returns a full `PolicyPackage` and sets `session.packageId`.
3. **Safety: no "fully compliant"** — generated content never claims the company is fully compliant.
4. **Safety: no "final legal advice"** — output is always framed as preliminary / draft / for review.
5. **Disclaimer always present** — every package and every export embeds the core disclaimer.
6. **Readiness score is 0–100** and carries a valid band (early/developing/structured/mature).
7. **Score is a readiness, not compliance, indicator** — wording and breakdown maxes (sum to 100; informational categories score 0) are correct.
8. **Findings are explainable** — each finding lists what triggered it; nothing is invented from outside the answers.
9. **High-risk public-tool + confidential data** finding fires for free/public tools with confidential inputs.
10. **Approved-tools list** is derived correctly (status mapping: approved / conditionally_approved / prohibited / pending_review).
11. **Sensitive-data rules** cover the tracked data types with correct severities (health/credentials/trade secrets = high).
12. **Human-review table** marks high-impact contexts as required vs. gaps.
13. **Incident & vendor workflows** are present and complete in the package.
14. **AI literacy checklist** flags untrained topics as priorities.
15. **Markdown rendering** (`renderMarkdown`) produces the full ordered document including the disclaimer.
16. **DOCX & PDF-fallback export** — `GET /api/export/:id` streams JSON, a real `.docx`, or print-ready HTML; the disclaimer is always included.
17. **Contact lead capture** — `POST /api/contact` persists a `ContactLead` and returns `{ id }`; admin can list leads.
18. **Admin auth & config** — admin routes require `x-admin-token`; bad/missing token → `401`; config get/put/reset round-trips.

---

## Editing content via the Admin area

Almost everything user-facing is **admin-editable at runtime** without code
changes. Open the **Admin** screen, unlock it with the admin token (default
`admin-demo`, env `ADMIN_TOKEN`), and use the tabs:

| Admin tab | Edits | Backed by seed |
| --- | --- | --- |
| **Questions** | The questionnaire (prompts, options, help, weights, categories A–J). | `src/shared/seed/questionnaire.ts` |
| **Templates** | The policy clause library (clause text, by clause id). | `src/shared/seed/templates.ts` (`POLICY_CLAUSES`) |
| **Scoring** | Per-category scoring maxes/labels. | `src/shared/rules/scoring.ts` (`SCORING_RULES`) |
| **AI literacy** | The literacy checklist items. | `src/shared/seed/templates.ts` (`LITERACY_ITEMS`) |
| **Vendor workflow** | The vendor-approval workflow steps. | `src/shared/seed/templates.ts` (`VENDOR_WORKFLOW`) |
| **Disclaimer** | Disclaimer text + version. | `src/shared/i18n.ts` (`CORE_DISCLAIMER`, `DISCLAIMER_VERSION`) |
| **CTA & conversion** | Conversion heading/body and CTA buttons. | `src/shared/seed/templates.ts` (`CONVERSION`, `CTAS`) |
| **Translations** | Per-key UI string overrides (EN/ES). | `src/shared/i18n.ts` (`UI`, `UI_KEYS`) |
| **Leads** | View submitted contact leads. | `data/leads.json` |

Admin edits are persisted as overrides over `buildDefaultConfig()`:

- `GET /api/admin/config` → full `AdminConfig`
- `PUT /api/admin/config { config }` → persist overrides
- `POST /api/admin/reset` → restore `buildDefaultConfig()` defaults
- `GET /api/admin/leads` → list leads
- `GET /api/admin/config` can be exported as JSON from the admin UI

The **public** subset of this config (`GET /api/config`) is what the client uses
to render the questionnaire, tool catalog, literacy items, vendor workflow,
conversion/CTA copy, the disclaimer and any translation overrides.

To change the **defaults that ship with the app** (rather than runtime
overrides), edit the seed files under `src/shared/seed/*` and the strings in
`src/shared/i18n.ts`. *(Note: the shared spine is frozen for this build; prefer
the Admin area for content changes.)*

---

## Generating a policy package (the flow)

1. **Choose a language** (EN/ES) on the welcome screen — toggle any time.
2. **Read and accept the disclaimer.** This is required; generation is blocked
   until the current disclaimer version is accepted.
3. *(Optional)* **Upload existing documents** (PDF/DOCX/TXT/MD/PNG/JPG/JPEG).
   They inform the preliminary draft only.
4. **Answer the questionnaire** (categories A–J), including configuring each AI
   tool's status, plan, accounts and review state.
5. **Generate** the package. The server checks disclaimer acceptance, runs
   `generatePackage`, persists the package and sets `session.packageId`.
6. **Review** the maturity summary (readiness score + findings) and the full
   package (the 10 sections above), then export or request a professional
   review.

Under the hood: `POST /api/generate { profile?, questionnaire }` →
`generatePackage({ sessionId, profile?, questionnaire, config, createdAt })` →
stored `PolicyPackage`, retrievable at `GET /api/package/:id`.

---

## Exporting

From the **Export center**, download the full package or any single section
(`policy`, `tools`, `literacy`, `vendor`, `incident`) in one of three formats:

- **JSON** — the structured data (`application/json`).
- **DOCX** — a real Word document via the `docx` package.
- **PDF (print fallback)** — a print-ready HTML view (`text/html`); use your
  browser's **"Save as PDF"**. This is a documented, dependency-light fallback.

All exports always include the disclaimer.

```
GET /api/export/:id?section=<full|policy|tools|literacy|vendor|incident>&format=<pdf|docx|json>&lang=<en|es>
```

Admins can also **export the full configuration as JSON** from the Admin area.

---

## Reviewing leads

Submitted contact requests are saved as `ContactLead` records:

- Users submit via the contact form → `POST /api/contact` → `{ id }`.
- Admins review them under **Admin → Leads**.
- Stored on disk at `data/leads.json` (within `DATA_DIR`).

---

## Data models

All models live in `src/shared/types.ts`. The bilingual primitive is
`L = { en: string; es: string }`. Key models:

- **Session & input**: `UserSession`, `LanguagePreference`,
  `DisclaimerAcceptance`, `CompanyProfile`, `AIUseQuestionnaireResponse`,
  `AIToolRecord`, `AnswerValue`, `UploadedPolicyDocument`.
- **Questionnaire definition**: `AdminQuestion`, `QuestionOption`,
  `QuestionCategory`, `QuestionCategoryId` (A–J), `QuestionType`,
  `ToolCatalogEntry`.
- **Generated package**: `PolicyPackage`, `ReadinessScore` /
  `ScoreBreakdownItem` / `ReadinessBand`, `GovernanceFinding`, `PolicySection` /
  `PolicyClause`, `ApprovedToolRule`, `SensitiveDataRule`, `HumanReviewRow`,
  `DisclosureRule`, `IncidentWorkflow`, `ChecklistItem`,
  `VendorApprovalWorkflow`.
- **Leads & admin**: `ContactLead`, `AdminConfig`, `AdminPolicyTemplate`,
  `ScoringRule`, `AdminTranslation`.

---

## Safety guarantees

The rules engine enforces these invariants, and the UI/exports must not undo
them:

- **Never claims full compliance.** No generated text says the company is
  "fully compliant" or certifies legal compliance.
- **Never presented as final legal advice.** Output is always framed as
  *preliminary* / *draft* / *for review*.
- **The disclaimer is always shown** — in the app, in every package, and in
  every export (PDF/DOCX/JSON).
- **The readiness score is explicitly not a compliance score** — it measures how
  structured internal AI governance is, nothing more.
- **Nothing is invented.** Findings, clauses, tools, data types and controls are
  derived only from the user's answers; every finding records what triggered it.
- **Disclaimer gate.** No package is generated until the current disclaimer is
  accepted (`403 disclaimer_required` otherwise).

---

## Sample outputs

Generate two illustrative mock packages (a "mature" English company and an
"early-stage" Spanish company) into `samples/`:

```bash
npx tsx scripts/generate-samples.ts
```

This writes `samples/<name>.json` (the full `PolicyPackage`) and
`samples/<name>.<lang>.md` (`renderMarkdown`) for each scenario, and logs each
readiness score. See `samples/README.md`. These outputs are illustrative,
preliminary, and **not legal advice**.

---

## Ports & conventions at a glance

- **Client (Vite):** http://localhost:5200
- **Server (Express):** http://localhost:8830 (API base `/api`)
- **Session id:** carried in the `x-session-id` header (client-generated UUID).
- **Admin token:** `x-admin-token` header; default `admin-demo` (env
  `ADMIN_TOKEN`).
- **Storage dir:** `data/` (override with `DATA_DIR`).
- **Languages:** English / Spanish / Chinese (中文), toggleable throughout.

## Questionnaire clarity & stability options (2026-07 update)

The questionnaire and result flow include several usability options:

- **AI tool usage status** (ES: «Estado de uso de la herramienta de IA») — the
  per-tool "status" field now uses adoption-focused options: *In use*,
  *Pilot/testing phase*, *Pending approval*, *Approved but not yet implemented*,
  *Discarded*, *Not sure / to be confirmed*, with a help text explaining the
  field. Legacy values remain supported.
- **Data & confidentiality**: the list now includes **"Anonymized or pseudonymized data"**
  (informational: the report notes that anonymization robustness should be
  reviewed) and **"None of the above"** (ES: «Ninguno de los anteriores»), an
  *exclusive* option — selecting it clears the other choices and vice versa.
  The credentials option is now labelled
  **"Credentials, passwords, tokens or API keys"** with a help text.
- **Incident reporting**: a new exclusive option **"We do not currently have an
  incident reporting process"** (ES: «No contamos actualmente con un proceso de
  reporte de incidentes»). Selecting it scores the incident category as a gap
  and adds a high-priority recommendation to establish an internal reporting
  channel, owners, documentation, review protocol, response times and
  escalation to legal/compliance/IT/security.
- **Autosave & session recovery**: questionnaire progress (language, answers,
  tool records, generated report) is autosaved to `localStorage`
  (`aigpb_draft_v1`). After a refresh the app offers *Continue* / *Start over*.
- **Stable generation**: a clear loading state, a 20s timeout with retry, and
  an error panel (retry / back to questionnaire / download answers as JSON)
  that never discards answers; a global error boundary prevents blank screens.
- **Guided result**: a visible 6-step stepper (Company details → AI tools →
  Data & confidentiality → Internal processes → Review → Report), and an
  "Available actions" panel on the report with *Download PDF / Word / JSON*,
  *Back to questionnaire*, *Edit answers* and *Request legal review*.

All of the above is available in English, Spanish and Chinese.

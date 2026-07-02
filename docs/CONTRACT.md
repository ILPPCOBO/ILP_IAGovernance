# Build contract (frozen) — for parallel module construction

The **shared spine is complete and frozen**: `src/shared/**`. Do NOT modify shared
files. Build your module against these exports. Read the actual files for exact
types; this is the integration contract.

## Stack
- ESM everywhere (`"type": "module"`). Use extensionless relative imports
  (tsx/vite/vitest resolve them). In server code there is no `__dirname`; use
  `import { fileURLToPath } from "node:url"` + `import.meta.url`.
- TypeScript, strict. React 18 + Vite (client root = `src/client`, dev port 5200,
  proxies `/api` → `http://localhost:8830`). Express server on port **8830**.
- Storage: JSON files under `data/` via the storage module.

## Shared exports (from `src/shared`)
- `types.ts` — ALL data models (UserSession, CompanyProfile,
  AIUseQuestionnaireResponse, AIToolRecord, UploadedPolicyDocument,
  PolicyPackage, GovernanceFinding, ApprovedToolRule, IncidentWorkflow,
  VendorApprovalWorkflow, ContactLead, AdminConfig, etc.). `L = {en,es}`.
- `i18n.ts` — `UI`, `UI_KEYS`, `t(lang,key,vars?,overrides?)`,
  `CORE_DISCLAIMER`, `DISCLAIMER_VERSION`.
- `config.ts` — `buildDefaultConfig(): AdminConfig` (seed defaults).
- `rules/engine.ts` — `generatePackage(input: GenerateInput): PolicyPackage`.
  `GenerateInput = { sessionId, profile?, questionnaire, config, createdAt }`.
- `rules/scoring.ts` — `computeScore`, `SCORING_RULES`, `BAND_LABEL`.
- `render.ts` — `renderBlocks(pkg,lang,section)`, `renderMarkdown(...)`,
  `renderHtml(...)`, `tr(L,lang)`. `Section = "full"|"policy"|"tools"|"literacy"|"vendor"|"incident"`.
- `seed/*` — questionnaire (`QUESTIONS`,`CATEGORIES`), `TOOL_CATALOG`, templates.

## Server API (the server module MUST implement exactly this; client + tests rely on it)
Base path `/api`. JSON in/out. A session id is carried in the `x-session-id`
header (client generates a UUID and stores it in localStorage).

- `GET  /api/health` → `{ ok: true }`
- `GET  /api/config` → public config: `{ disclaimer:L, disclaimerVersion, questions, categories, tools, literacy, vendorWorkflow, conversion, cta, translations }` (admin-overridable). Used to render the questionnaire + UI overrides.
- `GET  /api/session` → current `UserSession` (creates one if absent).
- `POST /api/session/language` `{ lang }` → updated session.
- `POST /api/disclaimer/accept` `{ accepted:true, lang }` → updated session (sets disclaimer.accepted + acceptedAt + version).
- `POST /api/session/profile` `{ profile: CompanyProfile }` → session.
- `POST /api/uploads` (multipart, field `file`) → `UploadedPolicyDocument` (PDF/DOCX/TXT/PNG/JPG/JPEG; TXT/MD extracts text, others set extractionWeak + warning). Appends to session.uploads.
- `POST /api/generate` `{ profile?, questionnaire: AIUseQuestionnaireResponse }`
   → **403** `{ error:"disclaimer_required" }` if the session has not accepted the
   current disclaimer. Otherwise builds the package via `generatePackage`,
   persists it, sets `session.packageId`, returns `PolicyPackage`.
   **This 403 gate is required by test #1 — do not generate without acceptance.**
- `GET  /api/package/:id` → stored `PolicyPackage`.
- `GET  /api/export/:id?section=<Section>&format=<pdf|docx|json>&lang=<en|es>`
   → streams a download. `json` → application/json; `docx` → real .docx via the
   `docx` npm package; `pdf` → print-ready HTML (Content-Type text/html) as a
   documented fallback (browser "Save as PDF"). Always include the disclaimer.
- `POST /api/contact` `{ ContactLead fields }` → saves a lead (returns `{ id }`).
- Admin (header `x-admin-token: admin-demo`, configurable via env `ADMIN_TOKEN`):
  - `GET  /api/admin/config` → full `AdminConfig`.
  - `PUT  /api/admin/config` `{ config: AdminConfig }` → persists overrides.
  - `POST /api/admin/reset` → resets to `buildDefaultConfig()`.
  - `GET  /api/admin/leads` → `ContactLead[]`.
  - Bad/missing token → 401 `{ error:"unauthorized" }`.

The server must also serve the built client from `dist/client` in production
(if it exists), but in dev the client runs under Vite.

### Export app factory for tests
Export a `createApp()` from `src/server/app.ts` returning the configured Express
app (no `listen`). `src/server/index.ts` imports it and calls `listen(8830)`.
Storage must support an env `DATA_DIR` override so tests use a temp dir.

## Admin token
Default `admin-demo` (env `ADMIN_TOKEN`). The client admin screen asks for it and
sends it as `x-admin-token`.

## Safety (enforced by engine; do not undo in UI/exports)
Never render text claiming the company is "fully compliant" or that output is
"final legal advice". Always show the disclaimer. The engine already guarantees
this in generated content.

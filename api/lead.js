/*
 * Vercel serverless function: receives the static demo's contact lead (POSTed
 * fire-and-forget by api.local.ts contact()) and forwards it to the LeadOS CRM
 * ingest webhook.
 *
 * LEADOS_INGEST_URL (Vercel env var) is the full webhook URL including the
 * tool's ingest token, e.g. https://ilp-leados.onrender.com/api/ingest/<token>.
 * The token therefore never appears in client-side code or in this repo.
 *
 * Deliberately dependency-free plain JS: it lives outside the TypeScript
 * project (tsconfig covers src/) and needs nothing from node_modules.
 */

// Attempt delays: immediate, then two quick retries. Serverless invocations are
// time-capped, so this is a short in-request retry, not a minutes-long backoff.
// LeadOS dedupes on externalRef, so a retry can never double-create a lead.
const DELAYS_MS = [0, 2000, 8000];
const ATTEMPT_TIMEOUT_MS = 6000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const str = (v) => (typeof v === 'string' && v.trim() ? v.trim() : '');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  const url = process.env.LEADOS_INGEST_URL;
  if (!url) {
    res.status(503).json({ error: 'not_configured' });
    return;
  }

  const b = req.body && typeof req.body === 'object' ? req.body : {};
  const name = str(b.name);
  const email = str(b.email);
  if (!name || !/.+@.+\..+/.test(email)) {
    res.status(400).json({ error: 'name_and_email_required' });
    return;
  }
  if (b.consent !== true) {
    res.status(400).json({ error: 'consent_required' });
    return;
  }

  const country = str(b.country);
  const industry = str(b.industry);
  const employees = str(b.employees);
  const tools = str(b.currentTools);
  const urgency = str(b.urgency);
  const report = b.report && typeof b.report === 'object' ? b.report : null;
  const createdAt = str(b.createdAt) || new Date().toISOString();

  // Internal CRM summary stays in English regardless of the lead's language;
  // the firm's staff work the pipeline in one language.
  const summary = [
    'AI Governance Policy Builder enquiry.',
    country ? `Country: ${country}.` : '',
    industry ? `Industry: ${industry}.` : '',
    employees ? `Employees: ${employees}.` : '',
    tools ? `AI tools in use: ${tools}.` : '',
    urgency ? `Urgency: ${urgency}.` : '',
    report && typeof report.scoreValue === 'number'
      ? `AI governance readiness score: ${report.scoreValue}/100 (${report.scoreBand || 'n/a'}).`
      : '',
    str(b.packageId) ? `Policy package: ${str(b.packageId)}.` : 'No policy package generated.',
    str(b.uploadedPolicyId) ? 'Visitor uploaded an existing policy document.' : '',
    str(b.message) ? `User message: ${str(b.message)}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const payload = {
    externalRef: str(b.id)
      ? `ia-governance:${str(b.id)}`
      : `ia-governance:${globalThis.crypto.randomUUID()}`,
    name,
    email,
    company: str(b.company) || undefined,
    message: summary,
    consent: true,
    privacyConsent: true,
    marketingConsent: false,
    consentTimestamp: createdAt,
    practiceArea: 'AI Governance',
    language: b.locale === 'en' ? 'en' : 'es',
    country: country || undefined,
    industry: industry || undefined,
    legalNeeds: ['AI governance policy review'],
    assessmentAnswers: {
      country: country || null,
      industry: industry || null,
      employees: employees || null,
      currentTools: tools || null,
      urgency: urgency || null,
      packageId: str(b.packageId) || null,
      uploadedPolicyId: str(b.uploadedPolicyId) || null,
      readinessScore: report && typeof report.scoreValue === 'number' ? report.scoreValue : null,
      scoreBand: (report && report.scoreBand) || null,
    },
    reportSummary: summary,
    sourceTool: 'AI Governance Policy Builder',
    isDemo: b.isDemo === true,
  };

  let lastReason = 'not_attempted';
  for (let i = 0; i < DELAYS_MS.length; i++) {
    if (DELAYS_MS[i] > 0) await sleep(DELAYS_MS[i]);
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
      });
      if (r.ok) {
        res.status(202).json({ ok: true, forwarded: true });
        return;
      }
      lastReason = `http_${r.status}`;
      // 4xx = our payload/token is wrong; retrying the same request is futile.
      if (r.status < 500 && r.status !== 429) break;
    } catch (err) {
      lastReason = err && err.name === 'TimeoutError' ? 'timeout' : 'network_error';
    }
  }
  console.error(`[lead] forward to LeadOS failed (${lastReason})`);
  // The demo keeps its localStorage copy and the visitor still sees the
  // confirmation screen with the firm's direct contact details.
  res.status(202).json({ ok: true, forwarded: false });
}

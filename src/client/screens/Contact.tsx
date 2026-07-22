import React, { useState } from "react";
import type { ContactLead, PolicyPackage, UploadedPolicyDocument } from "../../shared/index";
import { useT } from "../i18n/useT";
import { api } from "../api";
import { SectionCard, Spinner } from "../components/ui";
import { AnswerMap } from "../state";

interface Props {
  pkg: PolicyPackage | null;
  answers: AnswerMap;
  presetCta?: string | null;
}

type LeadDraft = Omit<ContactLead, "id" | "createdAt">;

export function Contact(props: Props): React.ReactElement {
  const { t, tr } = useT();

  const str = (k: string): string =>
    typeof props.answers[k] === "string" ? (props.answers[k] as string) : "";
  const toolList = Array.isArray(props.answers.toolsUsed)
    ? (props.answers.toolsUsed as string[]).join(", ")
    : "";

  // Seed the message from the conversion CTA the visitor clicked, if any.
  const presetMessage = props.presetCta
    ? t(
        {
          request: "conversion.request",
          book: "conversion.book",
          training: "conversion.training",
        }[props.presetCta] ?? "contact.heading",
      )
    : "";

  const [form, setForm] = useState<LeadDraft>({
    name: "",
    company: str("companyName"),
    email: "",
    country: str("country"),
    industry: str("industry"),
    employees: str("employees"),
    currentTools: toolList,
    urgency: "",
    message: presetMessage,
    consent: false,
    sessionId: api.sessionId(),
    packageId: props.pkg?.id,
  });
  const [upload, setUpload] = useState<UploadedPolicyDocument | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (patch: Partial<LeadDraft>) => setForm((f) => ({ ...f, ...patch }));

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const doc = await api.upload(file);
      setUpload(doc);
      set({ uploadedPolicyId: doc.id });
    } catch {
      setError(t("common.error"));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.contact(form);
      setSent(true);
    } catch {
      setError(t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="screen" style={{ maxWidth: 680, margin: "0 auto" }}>
        <SectionCard title={t("contact.heading")} eyebrow={t("nav.contact")}>
          <div className="notice">{t("contact.sent")}</div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="screen" style={{ maxWidth: 760, margin: "0 auto" }}>
      <SectionCard title={t("contact.heading")} eyebrow={t("nav.contact")}>
        <form onSubmit={submit}>
          <div className="field-grid">
            <Text
              label={t("contact.name")}
              value={form.name}
              onChange={(v) => set({ name: v })}
              required
            />
            <Text
              label={t("contact.company")}
              value={form.company}
              onChange={(v) => set({ company: v })}
            />
            <Text
              label={t("contact.email")}
              type="email"
              value={form.email}
              onChange={(v) => set({ email: v })}
              required
            />
            <Text
              label={t("contact.country")}
              value={form.country}
              onChange={(v) => set({ country: v })}
            />
            <Text
              label={t("contact.industry")}
              value={form.industry}
              onChange={(v) => set({ industry: v })}
            />
            <Text
              label={t("contact.employees")}
              value={form.employees}
              onChange={(v) => set({ employees: v })}
            />
          </div>

          <div className="field-grid">
            <Text
              label={t("contact.tools")}
              value={form.currentTools}
              onChange={(v) => set({ currentTools: v })}
            />
            <div className="field">
              <label htmlFor="urgency">{t("contact.urgency")}</label>
              <select
                id="urgency"
                value={form.urgency}
                onChange={(e) =>
                  set({ urgency: e.target.value as LeadDraft["urgency"] })
                }
              >
                <option value="">—</option>
                <option value="low">{t("contact.urgency.low")}</option>
                <option value="medium">{t("contact.urgency.medium")}</option>
                <option value="high">{t("contact.urgency.high")}</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="message">{t("contact.message")}</label>
            <textarea
              id="message"
              value={form.message}
              onChange={(e) => set({ message: e.target.value })}
              rows={5}
            />
          </div>

          <div className="field">
            <span className="field-label">
              {t("contact.upload")}{" "}
              <span className="muted small">({t("common.optional")})</span>
            </span>
            <div className="upload-drop">
              <label className="btn btn--ghost btn--sm" style={{ cursor: "pointer" }}>
                {uploading ? <Spinner /> : t("upload.choose")}
                <input
                  type="file"
                  className="sr-only"
                  accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg"
                  onChange={onFile}
                  disabled={uploading}
                />
              </label>
            </div>
            {upload && (
              <div className="file-row">
                <span>
                  <strong>{upload.filename}</strong>
                  {upload.extractionWeak && upload.warning && (
                    <div className="small" style={{ color: "var(--warn)" }}>
                      {tr(upload.warning)}
                    </div>
                  )}
                </span>
                <span className="badge badge--gold">{t("upload.uploaded")}</span>
              </div>
            )}
          </div>

          <div className="field">
            <label
              style={{
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
                fontWeight: "normal",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={form.consent === true}
                onChange={(e) => set({ consent: e.target.checked })}
                style={{ marginTop: 3, flex: "none" }}
                required
              />
              <span>
                {t("contact.consent")}{" "}
                <a
                  href="https://ilpabogados.com/politica-de-privacidad/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("contact.consentLink")}
                </a>
                .<span className="req">*</span>
              </span>
            </label>
          </div>

          {error && (
            <p className="small" style={{ color: "var(--sev-high)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn--primary"
            disabled={busy || !form.name || !form.email || !form.consent}
          >
            {busy && <Spinner />}
            {t("contact.submit")}
          </button>
          <p className="small muted" style={{ marginTop: 14 }}>
            {t("common.disclaimerShort")}
          </p>
        </form>
      </SectionCard>
    </div>
  );
}

function Text(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}): React.ReactElement {
  const id = `c-${props.label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="field">
      <label htmlFor={id}>
        {props.label}
        {props.required && <span className="req">*</span>}
      </label>
      <input
        id={id}
        type={props.type ?? "text"}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        required={props.required}
      />
    </div>
  );
}

/**
 * ILP Abogados branding: logo mark, contact popup and floating button.
 *
 * Contact details are the firm's public ones from https://ilpabogados.com
 * (verified 2026-07-02). The popup is promotional but always restates that the
 * tool does not substitute legal services.
 */

import React, { useEffect } from "react";
import { useT } from "../i18n/useT";

export const ILP_CONTACT = {
  name: "ILP Abogados",
  address: "Paseo de la Castellana 120, 5º Izq., 28046 Madrid",
  phone: "+34 914 582 492",
  phoneHref: "tel:+34914582492",
  email: "atencionalcliente@ilpabogados.com",
  emailHref: "mailto:atencionalcliente@ilpabogados.com",
  web: "ilpabogados.com",
  webHref: "https://ilpabogados.com",
} as const;

/**
 * The ILP Abogados wordmark, recreated to scale (not a pasted image):
 * a white rounded box with lowercase serif "ilp" + bold "ABOGADOS".
 *
 * variant "navy"  → for dark/navy backgrounds (white box, white word) — default
 * variant "light" → for light backgrounds (navy box, navy word)
 * stacked         → box above the word (used in the contact popup side panel)
 * wordless        → just the "ilp" box
 * size            → em-based scale: "sm" | "md" | "lg"
 */
export function ILPLogo(props: {
  variant?: "navy" | "light";
  stacked?: boolean;
  wordless?: boolean;
  size?: "sm" | "md" | "lg";
}): React.ReactElement {
  const variant = props.variant ?? "navy";
  const cls = [
    "ilp-logo",
    `ilp-logo--${variant}`,
    props.stacked ? "ilp-logo--stacked" : "",
    props.size ? `ilp-logo--${props.size}` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <span className={cls} role="img" aria-label="ILP Abogados">
      <span className="ilp-logo__box" aria-hidden="true">
        ilp
      </span>
      {!props.wordless && (
        <span className="ilp-logo__word" aria-hidden="true">
          ABOGADOS
        </span>
      )}
    </span>
  );
}

function IconPin(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 21s-7-5.6-7-11a7 7 0 1 1 14 0c0 5.4-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}
function IconPhone(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
    </svg>
  );
}
function IconMail(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}
function IconGlobe(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
    </svg>
  );
}

/** Promotional ILP contact popup, shown when the user finishes generating. */
export function ILPContactModal(props: {
  open: boolean;
  onClose: () => void;
  onReview: () => void;
  /** When a report exists beneath the overlay, dismissing reads "back to report". */
  hasReport?: boolean;
}): React.ReactElement | null {
  const { t } = useT();
  const dismissLabel = props.hasReport
    ? t("ilp.modal.backToReport")
    : t("ilp.modal.later");

  useEffect(() => {
    if (!props.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") props.onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [props.open, props.onClose]);

  if (!props.open) return null;

  return (
    <div
      className="ilp-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={t("ilp.modal.title")}
      onClick={(e) => {
        if (e.target === e.currentTarget) props.onClose();
      }}
    >
      <div className="ilp-modal">
        <button
          type="button"
          className="ilp-modal__close"
          aria-label={dismissLabel}
          onClick={props.onClose}
        >
          ×
        </button>

        <aside className="ilp-modal__side">
          <ILPLogo stacked size="lg" />
          <div className="ilp-modal__tagline">{t("ilp.tagline")}</div>
          <div className="ilp-modal__rule" />
          <div className="ilp-modal__side-note">Legal + Tech · Madrid</div>
        </aside>

        <div className="ilp-modal__body">
          <div className="section-eyebrow">{t("ilp.modal.eyebrow")}</div>
          <h2>{t("ilp.modal.title")}</h2>
          <p className="ilp-modal__subtitle">{t("ilp.modal.subtitle")}</p>
          <p>{t("ilp.modal.body")}</p>

          <ul className="ilp-contact-list">
            <li>
              <IconPin />
              <span>{ILP_CONTACT.address}</span>
            </li>
            <li>
              <IconPhone />
              <a href={ILP_CONTACT.phoneHref}>{ILP_CONTACT.phone}</a>
            </li>
            <li>
              <IconMail />
              <a href={ILP_CONTACT.emailHref}>{ILP_CONTACT.email}</a>
            </li>
            <li>
              <IconGlobe />
              <a href={ILP_CONTACT.webHref} target="_blank" rel="noopener noreferrer">
                {ILP_CONTACT.web}
              </a>
            </li>
          </ul>

          <div className="ilp-modal__actions">
            <button type="button" className="btn btn--primary" onClick={props.onReview}>
              {t("ilp.modal.review")}
            </button>
            <a className="btn btn--navy" href={ILP_CONTACT.emailHref}>
              {t("ilp.modal.email")}
            </a>
            <a className="btn btn--ghost" href={ILP_CONTACT.phoneHref}>
              {t("ilp.modal.call")}
            </a>
            <button type="button" className="btn btn--plain" onClick={props.onClose}>
              {dismissLabel}
            </button>
          </div>

          <p className="small muted ilp-modal__fineprint">{t("ilp.modal.fineprint")}</p>
        </div>
      </div>
    </div>
  );
}

/** Persistent floating button to reopen the ILP contact popup. */
export function ILPFloatButton(props: { onClick: () => void }): React.ReactElement {
  const { t } = useT();
  return (
    <button
      type="button"
      className="ilp-float"
      onClick={props.onClick}
      aria-label={t("ilp.float")}
      title={t("ilp.float")}
    >
      <span className="ilp-logo__box ilp-logo__box--float" aria-hidden="true">
        ilp
      </span>
      <span className="ilp-float__label">{t("ilp.float")}</span>
    </button>
  );
}

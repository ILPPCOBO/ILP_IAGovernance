import React, { useState } from "react";
import type { L } from "../../shared/index";
import { useT } from "../i18n/useT";
import { SectionCard, Spinner } from "../components/ui";

export function Disclaimer(props: {
  /** The disclaimer text (admin-overridable, from /api/config). */
  text: L;
  alreadyAccepted: boolean;
  onAccept: () => Promise<void>;
}): React.ReactElement {
  const { t, tr } = useT();
  const [checked, setChecked] = useState(props.alreadyAccepted);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!checked) return;
    setBusy(true);
    try {
      await props.onAccept();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen" style={{ maxWidth: 760, margin: "0 auto" }}>
      <SectionCard title={t("disclaimer.heading")} eyebrow={t("nav.disclaimer")}>
        <div className="disclaimer-box">{tr(props.text)}</div>

        <label className="accept-row">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          <span>{t("disclaimer.accept")}</span>
        </label>

        <button
          type="button"
          className="btn btn--primary"
          disabled={!checked || busy}
          onClick={submit}
        >
          {busy && <Spinner />}
          {t("disclaimer.continue")}
        </button>
      </SectionCard>
    </div>
  );
}

/**
 * Global error boundary: any uncaught render error shows a branded recovery
 * screen instead of a blank page. Answers are safe — the questionnaire draft
 * is autosaved to localStorage (see state.ts saveDraft), so a reload resumes
 * where the user left off.
 */

import React from "react";
import type { Lang } from "../../shared/index";
import { t as sharedT } from "../../shared/index";

interface Props {
  /** Best-effort language for the fallback copy (read once at mount). */
  getLang?: () => Lang;
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: unknown): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown): void {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error);
  }

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;

    let lang: Lang = "en";
    try {
      lang = this.props.getLang?.() ?? "en";
    } catch {
      /* keep default */
    }

    return (
      <div className="errb" role="alert">
        <div className="errb__card">
          <h1>{sharedT(lang, "errb.title")}</h1>
          <p>{sharedT(lang, "errb.body")}</p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => window.location.reload()}
          >
            {sharedT(lang, "errb.reload")}
          </button>
        </div>
      </div>
    );
  }
}

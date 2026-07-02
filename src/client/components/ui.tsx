/**
 * Small presentational building blocks shared across screens.
 */

import React from "react";
import type { Severity } from "../../shared/index";

export function Card(
  props: React.PropsWithChildren<{ className?: string; id?: string }>,
): React.ReactElement {
  return (
    <section className={`card ${props.className ?? ""}`} id={props.id}>
      {props.children}
    </section>
  );
}

export function SectionCard(props: {
  num?: number;
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  id?: string;
}): React.ReactElement {
  return (
    <Card id={props.id}>
      <div className="card__head">
        {props.num !== undefined && <div className="card__num">{props.num}</div>}
        <div>
          {props.eyebrow && <div className="section-eyebrow">{props.eyebrow}</div>}
          <h2>{props.title}</h2>
        </div>
      </div>
      {props.children}
    </Card>
  );
}

export function SeverityBadge(props: {
  severity: Severity;
  label?: string;
}): React.ReactElement {
  const text = props.label ?? props.severity.toUpperCase();
  return <span className={`badge badge--${props.severity}`}>{text}</span>;
}

export function Spinner(): React.ReactElement {
  return <span className="spinner" aria-hidden="true" />;
}

export function CenterLoading(props: { label: string }): React.ReactElement {
  return (
    <div className="center-load" role="status" aria-live="polite">
      <Spinner />
      <span>{props.label}</span>
    </div>
  );
}

export function Toast(props: {
  message: string;
  variant?: "info" | "error";
}): React.ReactElement {
  return (
    <div
      className={`toast ${props.variant === "error" ? "toast--error" : ""}`}
      role="status"
      aria-live="assertive"
    >
      {props.message}
    </div>
  );
}

export function ProgressBar(props: {
  current: number;
  total: number;
  label: string;
  caption?: string;
}): React.ReactElement {
  const pct = props.total > 0 ? Math.round((props.current / props.total) * 100) : 0;
  return (
    <div className="progress">
      <div className="progress__meta">
        <span>{props.label}</span>
        {props.caption && <span>{props.caption}</span>}
      </div>
      <div
        className="progress__bar"
        role="progressbar"
        aria-valuenow={props.current}
        aria-valuemin={0}
        aria-valuemax={props.total}
      >
        <div className="progress__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Notice(
  props: React.PropsWithChildren<{ variant?: "info" | "warn" }>,
): React.ReactElement {
  return (
    <div className={`notice ${props.variant === "warn" ? "notice--warn" : ""}`}>
      {props.children}
    </div>
  );
}

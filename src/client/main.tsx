import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { loadDraft } from "./state";
import type { Lang } from "../shared/index";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root container #root not found in index.html");
}

/** Best-effort language for the error fallback: last autosaved draft wins. */
function getLang(): Lang {
  const lang = loadDraft()?.lang;
  return lang === "es" || lang === "zh" ? lang : "en";
}

createRoot(container).render(
  <React.StrictMode>
    <ErrorBoundary getLang={getLang}>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

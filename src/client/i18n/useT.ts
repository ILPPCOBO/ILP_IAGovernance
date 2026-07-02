/**
 * Client-side i18n helpers.
 *
 * - `LanguageContext` carries the current language + a setter.
 * - `useT()` returns `{ lang, setLang, t, tr }` where `t` is bound to the
 *   current language and merges admin translation overrides loaded from
 *   /api/config, and `tr(L)` picks a language out of a bilingual `L` object.
 */

import { createContext, useContext } from "react";
import type { Lang, L } from "../../shared/index";
import { t as sharedT } from "../../shared/index";

export interface TranslationOverrides {
  en: Record<string, string>;
  es: Record<string, string>;
}

export interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Admin translation overrides from /api/config (may be empty). */
  overrides: TranslationOverrides;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);

export interface UseT {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Translate a UI key with optional {placeholder} vars + admin overrides. */
  t: (key: string, vars?: Record<string, string | number>) => string;
  /** Pick the current language from a bilingual L object. */
  tr: (value: L | undefined | null) => string;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageContext provider");
  }
  return ctx;
}

export function useT(): UseT {
  const { lang, setLang, overrides } = useLanguage();
  return {
    lang,
    setLang,
    t: (key, vars) =>
      sharedT(lang, key, vars, { en: overrides.en, es: overrides.es }),
    tr: (value) => (value ? value[lang] ?? value.en : ""),
  };
}

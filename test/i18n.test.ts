/**
 * Requirement #2 — Language toggle.
 *
 * For several core UI keys, the English and Spanish strings differ and both are
 * non-empty. This guards the bilingual contract at the dictionary level.
 */

import { describe, it, expect } from "vitest";
import { t, UI } from "../src/shared/i18n";

const CORE_KEYS = [
  "package.title",
  "app.title",
  "welcome.heading",
  "summary.scoreLabel",
  "package.policy",
  "export.heading",
  "contact.heading",
];

describe("i18n language toggle (#2)", () => {
  it("returns a different, non-empty string per language for package.title", () => {
    const en = t("en", "package.title");
    const es = t("es", "package.title");
    expect(en).toBeTruthy();
    expect(es).toBeTruthy();
    expect(en).not.toBe(es);
  });

  it("differs across en/es and is non-empty for several core keys", () => {
    for (const key of CORE_KEYS) {
      const en = t("en", key);
      const es = t("es", key);
      expect(en, `en missing for ${key}`).toBeTruthy();
      expect(es, `es missing for ${key}`).toBeTruthy();
      expect(en.length, `en empty for ${key}`).toBeGreaterThan(0);
      expect(es.length, `es empty for ${key}`).toBeGreaterThan(0);
      expect(en, `en === es for ${key}`).not.toBe(es);
    }
  });

  it("exposes both language dictionaries with matching key coverage", () => {
    expect(Object.keys(UI.en).length).toBeGreaterThan(0);
    for (const key of CORE_KEYS) {
      expect(UI.en).toHaveProperty(key);
      expect(UI.es).toHaveProperty(key);
    }
  });

  it("supports admin translation overrides without mutating defaults", () => {
    const overrides = { en: { "package.title": "Custom Title" }, es: {} };
    expect(t("en", "package.title", undefined, overrides)).toBe("Custom Title");
    // default still intact for the non-overridden language
    expect(t("es", "package.title", undefined, overrides)).toBe(t("es", "package.title"));
  });
});

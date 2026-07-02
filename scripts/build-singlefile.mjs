/**
 * Inline the static demo build (dist/demo) into ONE self-contained .html file.
 *
 * Everything (JS bundle + CSS) is embedded, so the result is a single file that
 * runs the whole tool with no server, no assets folder — uploadable anywhere or
 * openable by double-click. Run `npm run build:demo` first.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demoDir = path.join(root, "dist", "demo");

let html = readFileSync(path.join(demoDir, "index.html"), "utf8");

const cssMatch = html.match(/<link\b[^>]*\bhref="\.\/(assets\/[^"]+\.css)"[^>]*>/);
const jsMatch = html.match(/<script\b[^>]*\bsrc="\.\/(assets\/[^"]+\.js)"[^>]*><\/script>/);
if (!cssMatch || !jsMatch) {
  throw new Error("Could not locate built asset tags in dist/demo/index.html — run `npm run build:demo` first.");
}

const css = readFileSync(path.join(demoDir, cssMatch[1]), "utf8");
// Escape any literal </script> that may live inside JS string literals so it
// cannot terminate the inline <script> tag early.
const js = readFileSync(path.join(demoDir, jsMatch[1]), "utf8").replace(/<\/script>/gi, "<\\/script>");

// IMPORTANT: use function replacements so `$` sequences inside the CSS/JS are
// inserted literally (string replacements would treat $&, $`, $1, … specially
// and corrupt minified code that contains `$`).
html = html.replace(cssMatch[0], () => `<style>\n${css}\n</style>`);
html = html.replace(jsMatch[0], () => `<script type="module">\n${js}\n</script>`);

const targets = [
  path.join(root, "DemoDeployer_AI Governance Policy", "AI-Governance-Policy-Builder.standalone.html"),
  path.join(root, "AI-Governance-Policy-Builder.standalone.html"),
];
for (const t of targets) writeFileSync(t, html);

console.log(`Single-file build: ${(html.length / 1024).toFixed(0)} KB`);
for (const t of targets) console.log("  →", t);

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Static, backend-free build of the tool for drag-and-drop / CLI deploy to
 * Cloudflare Pages or Vercel (identical output on both).
 *
 * - `base: "./"` → relative asset paths, so it works at any host/subpath.
 * - resolve.alias swaps the network `api` module for the in-browser
 *   `api.local` shim (localStorage + shared rules engine), so no server is
 *   needed. Everything else (screens, i18n, engine) is reused unchanged.
 */
export default defineConfig({
  plugins: [react()],
  root: "src/client",
  base: "./",
  publicDir: false,
  resolve: {
    alias: [
      {
        find: /^\.\.?\/api$/,
        replacement: path.resolve(here, "src/client/api.local.ts"),
      },
    ],
  },
  build: {
    outDir: path.resolve(here, "dist/demo"),
    emptyOutDir: true,
  },
});

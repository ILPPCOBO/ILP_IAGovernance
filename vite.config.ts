import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The client dev server runs on 5200 and proxies API calls to the Express
// server on 8830. See README for the full run instructions.
export default defineConfig({
  plugins: [react()],
  root: "src/client",
  publicDir: false,
  server: {
    port: 5200,
    proxy: {
      // Anchored regex so the proxy matches real API routes (/api/health, …)
      // but NOT the client's own module requests like /api.ts.
      "^/api/": {
        target: "http://localhost:8830",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "../../dist/client",
    emptyOutDir: true,
  },
});

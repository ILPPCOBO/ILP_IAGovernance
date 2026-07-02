/**
 * HTTP test harness.
 *
 * Each test file that needs the Express app calls `freshApp()` which:
 *   1. points process.env.DATA_DIR at a brand-new temp directory (isolated
 *      storage per suite) BEFORE the app/storage module reads it, and
 *   2. dynamically imports the app factory and builds the app.
 *
 * The dynamic import means the env var is set before the server module's
 * module-level code runs. We also bust the module cache with a query string so
 * repeated calls in the same process get a server bound to the new DATA_DIR.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Express } from "express";
import { createApp } from "../src/server/app";

export const ADMIN_TOKEN = "admin-demo";

let counter = 0;

export interface Harness {
  app: Express;
  dataDir: string;
  sessionId: string;
}

/**
 * Make a unique temp DATA_DIR and build a fresh app bound to it.
 *
 * Storage resolves `process.env.DATA_DIR` lazily on every read/write, so setting
 * it before each `createApp()` (and before any request runs) gives each suite
 * isolated, throwaway storage. The env var is set synchronously here so it is in
 * place by the time the app handles requests.
 */
export async function freshApp(sessionId?: string): Promise<Harness> {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "aigov-"));
  process.env.DATA_DIR = dataDir;
  process.env.ADMIN_TOKEN = ADMIN_TOKEN;

  const app = createApp();

  return {
    app,
    dataDir,
    sessionId: sessionId ?? `sess-${Date.now()}-${counter++}`,
  };
}

/** A 1x1 transparent PNG, as a Buffer (used for upload tests). */
export function tinyPngBuffer(): Buffer {
  const base64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  return Buffer.from(base64, "base64");
}

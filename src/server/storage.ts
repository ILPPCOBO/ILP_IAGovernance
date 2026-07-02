/**
 * JSON file storage for the server module.
 *
 * The data directory is resolved LAZILY on every read/write as
 * `process.env.DATA_DIR || <projectRoot>/data` so tests can override DATA_DIR
 * per-call. Files and the directory are created on demand. Ids use
 * `crypto.randomUUID`.
 */

import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type {
  AdminConfig,
  ContactLead,
  PolicyPackage,
  UserSession,
} from "../shared/index";
import { buildDefaultConfig } from "../shared/index";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Project root is two levels up from src/server. */
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");

/** Resolve the data dir lazily so DATA_DIR can be overridden per-call. */
function dataDir(): string {
  return process.env.DATA_DIR || path.join(PROJECT_ROOT, "data");
}

function ensureDir(): string {
  const dir = dataDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

function filePath(name: string): string {
  return path.join(ensureDir(), name);
}

function readJson<T>(name: string, fallback: T): T {
  const file = filePath(name);
  if (!existsSync(file)) {
    writeFileSync(file, JSON.stringify(fallback, null, 2), "utf8");
    return fallback;
  }
  try {
    const raw = readFileSync(file, "utf8");
    if (!raw.trim()) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(name: string, value: T): void {
  const file = filePath(name);
  writeFileSync(file, JSON.stringify(value, null, 2), "utf8");
}

/** crypto.randomUUID id helper, optionally prefixed. */
export function newId(prefix = ""): string {
  const id = randomUUID();
  return prefix ? `${prefix}_${id}` : id;
}

/* ------------------------------------------------------------------ */
/* Sessions (sessions.json, keyed by id)                               */
/* ------------------------------------------------------------------ */

type SessionMap = Record<string, UserSession>;

export function getSession(id: string): UserSession | undefined {
  const map = readJson<SessionMap>("sessions.json", {});
  return map[id];
}

export function saveSession(session: UserSession): UserSession {
  const map = readJson<SessionMap>("sessions.json", {});
  session.updatedAt = new Date().toISOString();
  map[session.id] = session;
  writeJson("sessions.json", map);
  return session;
}

export function listSessions(): UserSession[] {
  return Object.values(readJson<SessionMap>("sessions.json", {}));
}

/* ------------------------------------------------------------------ */
/* Packages (packages.json, keyed by id)                               */
/* ------------------------------------------------------------------ */

type PackageMap = Record<string, PolicyPackage>;

export function getPackage(id: string): PolicyPackage | undefined {
  const map = readJson<PackageMap>("packages.json", {});
  return map[id];
}

export function savePackage(pkg: PolicyPackage): PolicyPackage {
  const map = readJson<PackageMap>("packages.json", {});
  map[pkg.id] = pkg;
  writeJson("packages.json", map);
  return pkg;
}

/* ------------------------------------------------------------------ */
/* Leads (leads.json, array)                                           */
/* ------------------------------------------------------------------ */

export function listLeads(): ContactLead[] {
  return readJson<ContactLead[]>("leads.json", []);
}

export function saveLead(lead: ContactLead): ContactLead {
  const leads = listLeads();
  leads.push(lead);
  writeJson("leads.json", leads);
  return lead;
}

/* ------------------------------------------------------------------ */
/* Admin config override (admin-config.json, partial)                  */
/* ------------------------------------------------------------------ */

export function getAdminOverride(): Partial<AdminConfig> {
  return readJson<Partial<AdminConfig>>("admin-config.json", {});
}

export function saveAdminOverride(override: Partial<AdminConfig>): Partial<AdminConfig> {
  writeJson("admin-config.json", override);
  return override;
}

export function clearAdminOverride(): void {
  writeJson("admin-config.json", {});
}

/**
 * Merge the persisted admin override over the seed defaults to produce the
 * effective AdminConfig. Deep-ish merge: when the override provides a value for
 * a key it wins (objects are merged one level down for the L-shaped/nested
 * config fields; arrays and primitives are replaced wholesale).
 */
export function getEffectiveConfig(): AdminConfig {
  const base = buildDefaultConfig();
  const override = getAdminOverride();
  return mergeConfig(base, override);
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function mergeConfig(base: AdminConfig, override: Partial<AdminConfig>): AdminConfig {
  const out: Record<string, unknown> = { ...(base as unknown as Record<string, unknown>) };
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue;
    const current = out[key];
    if (isPlainObject(value) && isPlainObject(current)) {
      out[key] = { ...current, ...value };
    } else {
      out[key] = value;
    }
  }
  return out as unknown as AdminConfig;
}

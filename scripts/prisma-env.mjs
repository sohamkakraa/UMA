/**
 * Prisma schema may define `directUrl` (e.g. Neon: pooled DATABASE_URL + direct DIRECT_URL).
 * When only DATABASE_URL is set, default DIRECT_URL so generate/migrate work.
 *
 * Prisma CLI loads `.env` in its own process, but our wrapper scripts run in Node first.
 * If DATABASE_URL exists only in `.env`, it is not in process.env until we load these files.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(relPath) {
  const p = resolve(process.cwd(), relPath);
  if (!existsSync(p)) return;
  const text = readFileSync(p, "utf8");
  for (let line of text.split("\n")) {
    line = line.replace(/\r$/, "").trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    if (process.env[key] !== undefined) continue;
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

export function loadProjectEnvForPrismaScripts() {
  loadEnvFile(".env");
  loadEnvFile(".env.local");
  loadEnvFile(".env.development.local");
}

export function applyDirectUrlDefault() {
  loadProjectEnvForPrismaScripts();
  if (!process.env.DIRECT_URL?.trim() && process.env.DATABASE_URL?.trim()) {
    process.env.DIRECT_URL = process.env.DATABASE_URL;
  }
}

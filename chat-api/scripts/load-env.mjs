import nextEnv from "@next/env";
import fs from "node:fs";
import path from "node:path";

/** Match Next.js dotenv parsing. Never source .env files as shell scripts. */
export function loadLocalEnv(root) {
  if (!fs.existsSync(path.join(root, ".env.local"))) throw new Error(".env.local missing");
  const inherited = new Set(Object.keys(process.env));
  let failed = false;
  const result = nextEnv.loadEnvConfig(root, false, { info() {}, error() { failed = true; } });
  if (failed) throw new Error("Local environment loading failed");
  const keys = new Set(result.loadedEnvFiles.flatMap((file) =>
    file.contents.split("\n").map((line) => line.match(/^\s*(?:export\s+)?([A-Z_][A-Z0-9_]*)\s*=/)?.[1]).filter(Boolean)));
  const shadowed = [...keys].filter((key) => inherited.has(key));
  if (shadowed.length) console.warn(`[env] inherited variables take precedence: ${shadowed.join(", ")}`);
  return result;
}

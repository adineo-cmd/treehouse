#!/usr/bin/env node
/* Bring the two atlases into this checkout.
 *
 * They are submodules, not copies: `memex/` and `careermap/` each point at
 * their own repository, which stays the place where that app's content and
 * data live. This only fetches whatever commit this repo pins.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const run = (args, label) => {
  const result = spawnSync("git", args, { cwd: root, stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`[bootstrap] ${label} failed (exit ${result.status ?? 1}).`);
    process.exit(result.status ?? 1);
  }
};

if (!fs.existsSync(path.join(root, ".gitmodules"))) {
  console.error("[bootstrap] no .gitmodules — this checkout is not Meridian.");
  process.exit(1);
}

run(["submodule", "update", "--init", "--depth", "1"], "submodule update");

for (const name of ["memex", "careermap"]) {
  const dir = path.join(root, name);
  const present = fs.existsSync(path.join(dir, "package.json"));
  console.log(`[bootstrap] ${name}: ${present ? "ready" : "missing files"}`);
}

console.log("[bootstrap] ready — run `npm run build`, then `npm start`");

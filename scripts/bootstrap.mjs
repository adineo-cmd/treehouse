#!/usr/bin/env node
/* Fetch the two atlases the portal combines.
 *
 * Meridian is a shell, not a monorepo: Memex and CareerMap stay separate
 * repositories with their own content, build and data. This script only
 * clones them next to this checkout so `npm run build` can find them.
 * Nothing is copied between them.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const parent = path.dirname(here);

const APPS = [
  { dir: "memex", url: "https://github.com/adineo-cmd/memex.git" },
  { dir: "careermap", url: "https://github.com/adineo-cmd/careermap.git" },
];

for (const app of APPS) {
  const target = path.join(parent, app.dir);
  if (fs.existsSync(path.join(target, "package.json"))) {
    console.log(`[bootstrap] ${app.dir} already checked out at ${target}`);
    continue;
  }
  console.log(`[bootstrap] cloning ${app.dir} into ${target}…`);
  const result = spawnSync("git", ["clone", "--depth", "1", app.url, target], { stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`[bootstrap] could not clone ${app.dir}. Clone it manually as a sibling directory.`);
    process.exit(result.status ?? 1);
  }
}

console.log("[bootstrap] ready — run `npm run build`, then `npm start`");

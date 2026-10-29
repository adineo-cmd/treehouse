#!/usr/bin/env node
/* Build the Treehouse shell around the two existing sites.
 *
 * The two projects are built with their own configs and their own data. This
 * script copies the results side by side, generates the portal from their
 * separate artifacts, and injects one small navigation script. It never
 * reads one project's records into the other's output.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Empty for a domain root, or "/<repo>" for a GitHub project Pages site.
const siteBase = (process.env.SITE_BASE || "").replace(/\/+$/, "");
const appBase = (name) => `${siteBase}/${name}/`;

// Both apps live inside this repo as submodules: library/ and compass/.
const locate = (name) => {
  const inside = path.join(root, name);
  if (fs.existsSync(path.join(inside, ".git"))) return inside;
  console.error(`[treehouse] ${name}/ is missing — run \`npm run bootstrap\` first.`);
  process.exit(1);
};

const libraryDir = locate("library");
const compassDir = locate("compass");
const siteDir = path.join(root, "site");
const srcDir = path.join(root, "src");

const args = new Set(process.argv.slice(2));
const skipBuild = args.has("--skip-build");

const assetVersion = crypto
  .createHash("sha1")
  .update(fs.readFileSync(path.join(srcDir, "portal.css")))
  .update(fs.readFileSync(path.join(srcDir, "portal.js")))
  .update(fs.readFileSync(path.join(srcDir, "shell.js")))
  .digest("hex")
  .slice(0, 10);

const log = (message) => console.log(`[treehouse] ${message}`);
const fail = (message) => {
  console.error(`[treehouse] ${message}`);
  process.exit(1);
};

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&#39;";
      default: return character;
    }
  });

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const number = (value) => Number(value).toLocaleString("en-US");

const run = (cwd, command, commandArgs, label) => {
  log(`${label}…`);
  const result = spawnSync(command, commandArgs, {
    cwd,
    encoding: "utf8",
    env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1" },
  });

  if (result.status !== 0) {
    if (result.stdout) console.error(result.stdout.trim());
    if (result.stderr) console.error(result.stderr.trim());
    fail(`${label} failed with exit code ${result.status}`);
  }

  const output = `${result.stdout || ""}\n${result.stderr || ""}`.trim();
  const lastLine = output.split("\n").filter(Boolean).at(-1);
  if (lastLine) log(`${label}: ${lastLine}`);
};

const ensureDependencies = (cwd, label) => {
  if (fs.existsSync(path.join(cwd, "node_modules"))) return;
  run(cwd, "npm", ["install", "--no-audit", "--no-fund"], `${label} dependencies`);
};

const buildProject = (cwd, label) => {
  ensureDependencies(cwd, label);
  run(cwd, "npm", ["run", "build"], label);
};

const copyDirectory = (from, to, label) => {
  if (!fs.existsSync(from)) fail(`${label} output not found at ${from}`);
  fs.cpSync(from, to, { recursive: true });
};

const walk = (directory, visit) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full, visit);
    else visit(full);
  }
};

const countFiles = (directory, extension) => {
  let count = 0;
  walk(directory, (file) => {
    if (file.endsWith(extension)) count += 1;
  });
  return count;
};

const injectShell = (html, version) => {
  if (html.includes("/_shell/shell.js")) return html;
  const base = JSON.stringify(siteBase);
  const tag = `<script>window.__TREEHOUSE_BASE__=${base};</script><script src="${siteBase}/_shell/shell.js?v=${version}" defer></script>`;
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${tag}</body>`);
  return `${html}\n${tag}`;
};

/* A miniature of the Library fan. The colours and names come only from
   library/public/data/artifacts/structure.json. */
const libraryMotif = (structure) => {
  const trunks = structure.trunks;
  const width = 560;
  const height = 260;
  const rootPoint = { x: 42, y: height / 2 };
  const endX = 312;
  const labelX = endX + 14;
  const top = 34;
  const bottom = height - 34;
  const step = (bottom - top) / Math.max(1, trunks.length - 1);

  const arcs = trunks.map((trunk, index) => {
    const y = top + step * index;
    const curve = `M ${rootPoint.x} ${rootPoint.y} C ${rootPoint.x + 118} ${rootPoint.y}, ${endX - 118} ${y}, ${endX} ${y}`;
    return [
      `<path d="${curve}" fill="none" stroke="${escapeHtml(trunk.color)}" stroke-width="1.15" opacity=".72"/>`,
      `<circle cx="${endX}" cy="${y}" r="2.8" fill="${escapeHtml(trunk.color)}"/>`,
      `<text class="motif-fan-name" x="${labelX}" y="${y + 3.6}" fill="${escapeHtml(trunk.color)}">${escapeHtml(trunk.name)}</text>`,
    ].join("");
  }).join("");

  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="The nine trunks of the Library fanning out from a single root">
    <defs>
      <radialGradient id="libraryRootGlow">
        <stop offset="0%" stop-color="#e8b76a" stop-opacity=".32"/>
        <stop offset="55%" stop-color="#e8b76a" stop-opacity=".07"/>
        <stop offset="100%" stop-color="#e8b76a" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <circle cx="${rootPoint.x}" cy="${rootPoint.y}" r="58" fill="url(#libraryRootGlow)"/>
    ${arcs}
    <circle cx="${rootPoint.x}" cy="${rootPoint.y}" r="4.2" fill="#c69068"/>
    <text class="motif-root-label" x="${rootPoint.x + 11}" y="${rootPoint.y + 3.4}">root</text>
  </svg>`;
};

/* A route through the 40 Compass roadmaps. Each dot takes its colour from
   compass/dist/api/roadmaps.json and nothing else. */
const careerMotif = (roadmapsPayload) => {
  const roadmaps = roadmapsPayload.roadmaps;
  const width = 560;
  const height = 260;
  const left = 28;
  const right = width - 28;
  const span = right - left;
  const points = roadmaps.map((roadmap, index) => {
    const t = roadmaps.length === 1 ? 0 : index / (roadmaps.length - 1);
    return {
      x: left + span * t,
      y: 128 + Math.sin(index * 0.52) * 56 + Math.sin(index * 0.19) * 10,
      color: roadmap.color || "#f5c518",
    };
  });

  const smoothPath = (list) => {
    if (list.length === 0) return "";
    if (list.length === 1) return `M ${list[0].x} ${list[0].y}`;
    let d = `M ${list[0].x} ${list[0].y}`;
    for (let i = 0; i < list.length - 1; i += 1) {
      const p0 = list[i - 1] || list[i];
      const p1 = list[i];
      const p2 = list[i + 1];
      const p3 = list[i + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const dots = points.map((point, index) => {
    const milestone = index === 0 || index === points.length - 1 || index % 10 === 0;
    const ring = milestone
      ? `<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="5.4" fill="none" stroke="${escapeHtml(point.color)}" stroke-width=".9" opacity=".55"/>`
      : "";
    return `${ring}<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="${milestone ? 3.4 : 2.5}" fill="${escapeHtml(point.color)}" opacity=".94"/>`;
  }).join("");

  const start = points[0];
  const finish = points[points.length - 1];

  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="A route through forty career roadmaps">
    <path d="${smoothPath(points)}" fill="none" stroke="#f5c518" stroke-width="1" opacity=".26"/>
    ${dots}
    <text class="motif-route-label" x="${start.x}" y="${start.y + 30}">start</text>
    <text class="motif-route-label" x="${finish.x - 34}" y="${finish.y + 30}">forty routes</text>
  </svg>`;
};

/* ---------- build ---------- */

if (!skipBuild) {
  // Astro emits every asset and page URL under this base. Standalone builds
  // leave the env unset and keep their own /library/ and /compass/ roots.
  process.env.LIBRARY_BASE = appBase("library");
  process.env.COMPASS_BASE = appBase("compass");
  buildProject(libraryDir, "library");
  buildProject(compassDir, "compass");
} else {
  log("skipping framework builds (--skip-build)");
}

if (!fs.existsSync(path.join(libraryDir, "dist"))) fail("library/dist is missing. Run a full build.");
if (!fs.existsSync(path.join(compassDir, "dist"))) fail("compass/dist is missing. Run a full build.");

log("reading the two independent data sets…");
const structure = readJson(path.join(libraryDir, "public/data/artifacts/structure.json"));
const libraryRoadmaps = readJson(path.join(libraryDir, "public/data/artifacts/roadmaps.json"));
const careerRoadmaps = readJson(path.join(compassDir, "dist/api/roadmaps.json"));
const careerCareers = readJson(path.join(compassDir, "dist/api/careers.json"));
const careerFields = readJson(path.join(compassDir, "dist/api/fields.json"));

const libraryStats = {
  disciplines: structure.nodeCount,
  domains: structure.nodes.filter((node) => node.kind === "domain").length,
  subdomains: structure.nodes.filter((node) => node.kind === "subdomain").length,
  trunks: structure.trunks.length,
  paths: libraryRoadmaps.index.length,
};

const careerStats = {
  roadmaps: careerRoadmaps.roadmaps.length,
  topics: careerRoadmaps.roadmaps.reduce((total, roadmap) => total + roadmap.nodeCount, 0),
  occupations: careerCareers.families.reduce((total, family) => total + family.roles.length, 0),
  families: careerCareers.families.length,
  jelFields: careerFields.codes.filter((code) => code.level === "sub").length,
};

log(`library: ${number(libraryStats.disciplines)} disciplines, ${number(libraryStats.domains)} domains, ${number(libraryStats.paths)} paths`);
log(`careers: ${number(careerStats.roadmaps)} roadmaps, ${number(careerStats.topics)} topics, ${number(careerStats.occupations)} occupations`);

log("assembling site/…");
if (siteBase) log(`project Pages base: ${siteBase}/`);
fs.rmSync(siteDir, { recursive: true, force: true });
fs.mkdirSync(siteDir, { recursive: true });

copyDirectory(path.join(libraryDir, "dist"), path.join(siteDir, "library"), "library");
copyDirectory(path.join(compassDir, "dist"), path.join(siteDir, "compass"), "compass");

fs.mkdirSync(path.join(siteDir, "_shell"), { recursive: true });
fs.mkdirSync(path.join(siteDir, "_portal"), { recursive: true });

fs.copyFileSync(path.join(srcDir, "shell.js"), path.join(siteDir, "_shell/shell.js"));
fs.copyFileSync(path.join(srcDir, "portal.css"), path.join(siteDir, "_portal/portal.css"));
fs.copyFileSync(path.join(srcDir, "portal.js"), path.join(siteDir, "_portal/portal.js"));
fs.copyFileSync(path.join(srcDir, "favicon.svg"), path.join(siteDir, "favicon.svg"));

const buildStamp = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
}).format(new Date());

let portal = fs.readFileSync(path.join(srcDir, "index.html"), "utf8");
const replacements = {
  "{{ATLAS_FIELDS}}": number(libraryStats.disciplines),
  "{{ATLAS_DOMAINS}}": number(libraryStats.domains),
  "{{ATLAS_SUBDOMAINS}}": number(libraryStats.subdomains),
  "{{ATLAS_TRUNKS}}": number(libraryStats.trunks),
  "{{ATLAS_PATHS}}": number(libraryStats.paths),
  "{{CAREER_ROADMAPS}}": number(careerStats.roadmaps),
  "{{CAREER_TOPICS}}": number(careerStats.topics),
  "{{CAREER_OCCUPATIONS}}": number(careerStats.occupations),
  "{{CAREER_FAMILIES}}": number(careerStats.families),
  "{{CAREER_FIELDS}}": number(careerStats.jelFields),
  "{{ATLAS_MOTIF}}": libraryMotif(structure),
  "{{CAREER_MOTIF}}": careerMotif(careerRoadmaps),
  "{{BUILD_STAMP}}": buildStamp,
  "{{ASSET_VERSION}}": assetVersion,
  "{{SITE_BASE}}": siteBase,
};

for (const [token, value] of Object.entries(replacements)) {
  portal = portal.split(token).join(value);
}

// A project Pages site serves the artifact under /<repo>/, so the portal's
// root-absolute links need that prefix. The apps already emit their own base.
if (siteBase) {
  portal = portal.replace(/(\b(?:href|src)=")\/(?!\/)/g, `$1${siteBase}/`);
}

fs.writeFileSync(path.join(siteDir, "index.html"), portal);

log("injecting the map-room tab into both apps…");
let injected = 0;
for (const app of ["library", "compass"]) {
  const appDir = path.join(siteDir, app);
  walk(appDir, (file) => {
    if (!file.endsWith(".html")) return;
    const html = fs.readFileSync(file, "utf8");
    const next = injectShell(html, assetVersion);
    if (next !== html) {
      fs.writeFileSync(file, next);
      injected += 1;
    }
  });
}

/* ---------- isolation checks ---------- */

const failures = [];
const expect = (condition, message) => {
  if (!condition) failures.push(message);
};

expect(fs.existsSync(path.join(siteDir, "library/data/artifacts/structure.json")), "Library artifacts are not under /library");
expect(fs.existsSync(path.join(siteDir, "compass/api/roadmaps.json")), "Compass API is not under /compass");
expect(!fs.existsSync(path.join(siteDir, "library/api")), "Compass API leaked into the Library tree");
expect(!fs.existsSync(path.join(siteDir, "compass/data/artifacts")), "Library artifacts leaked into the Compass tree");

const careerBundle = fs.readFileSync(path.join(siteDir, "compass/js/app.js"), "utf8");
const libraryHome = fs.readFileSync(path.join(siteDir, "library/index.html"), "utf8");
expect(!careerBundle.includes("arbor-roadmap-"), "Library progress keys leaked into the Compass bundle");
expect(!libraryHome.includes("cm_done_"), "Compass progress keys leaked into the Library page");

if (failures.length) {
  for (const failure of failures) console.error(`[treehouse] isolation check failed: ${failure}`);
  process.exit(1);
}

log(`isolation checks passed: two trees, two indexes, two progress namespaces`);
log(`portal assembled: ${number(countFiles(path.join(siteDir, "library"), ".html"))} Library pages, 1 Compass shell, ${injected} pages with the map-room tab`);
log("run `npm start` and open http://127.0.0.1:4321");

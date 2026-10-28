#!/usr/bin/env node
/* Zero-dependency static server for the assembled Meridian site.
 * It only serves files from site/. There is no API and no proxy: both apps
 * are already static, and their data stays under their own URL prefixes.
 */

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const site = path.join(root, "site");
const port = Number(process.env.PORT || 4321);
const host = process.env.HOST || "127.0.0.1";

if (!fs.existsSync(path.join(site, "index.html"))) {
  console.error("site/ is missing. Run `npm run build` first.");
  process.exit(1);
}

const types = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".bin", "application/octet-stream"],
  [".txt", "text/plain; charset=utf-8"],
  [".xml", "application/xml; charset=utf-8"],
]);

const inside = (candidate) => {
  const relative = path.relative(site, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
};

const resolveFile = (urlPath) => {
  const clean = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  const safePath = path.normalize(clean).replace(/^(\.\.[/\\])+/, "");
  let candidate = path.join(site, safePath);

  if (!inside(candidate)) return null;

  if (clean.endsWith("/")) {
    candidate = path.join(candidate, "index.html");
    return fs.existsSync(candidate) && fs.statSync(candidate).isFile() ? candidate : null;
  }

  if (fs.existsSync(candidate)) {
    const stat = fs.statSync(candidate);
    if (stat.isFile()) return candidate;
    if (stat.isDirectory()) {
      const index = path.join(candidate, "index.html");
      return fs.existsSync(index) ? index : null;
    }
  }

  const directoryIndex = path.join(candidate, "index.html");
  if (fs.existsSync(directoryIndex)) return directoryIndex;

  if (!path.extname(candidate)) {
    const html = `${candidate}.html`;
    if (fs.existsSync(html)) return html;
  }

  return null;
};

const notFound = (res) => {
  const body = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Not found — Meridian</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#071011;color:#eee8d9;font:16px/1.6 ui-sans-serif,system-ui,sans-serif}
  main{max-width:34rem;padding:2rem}
  h1{font:400 3rem/1.05 Georgia,serif;margin:0 0 1rem}
  a{color:#c69068}
</style></head>
<body><main><h1>This page is off the map.</h1>
<p>The address does not belong to either collection. Try the <a href="/">map room</a>, the <a href="/memex/">Atlas</a>, or <a href="/careermap/">CareerMap</a>.</p>
</main></body></html>`;
  res.writeHead(404, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  res.end(body);
};

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    res.end("Method not allowed");
    return;
  }

  const urlPath = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`).pathname;

  if (urlPath === "/memex" || urlPath === "/careermap") {
    res.writeHead(301, { Location: `${urlPath}/` });
    res.end();
    return;
  }

  const file = resolveFile(urlPath);
  if (!file) {
    notFound(res);
    return;
  }

  const extension = path.extname(file).toLowerCase();
  const contentType = types.get(extension) || "application/octet-stream";
  const stat = fs.statSync(file);
  const headers = {
    "Content-Type": contentType,
    "Content-Length": stat.size,
    "Cache-Control": extension === ".html" ? "no-store" : "no-cache",
  };

  res.writeHead(200, headers);
  if (req.method === "HEAD") {
    res.end();
    return;
  }

  fs.createReadStream(file)
    .on("error", () => {
      res.destroy();
    })
    .pipe(res);
});

server.listen(port, host, () => {
  console.log(`[meridian] serving site/ at http://${host}:${port}`);
  console.log("[meridian] /  map room   /memex/  Atlas   /careermap/  CareerMap");
});

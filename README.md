# Meridian

A shared front door for two existing sites:

- **Memex / Arbor** — the knowledge atlas at `/memex/`
- **CareerMap** — the career atlas at `/careermap/`

The combination happens at the shell: one entrance, one visual system, one
address. The data does not move. Each app keeps its own build, its own content
directory, its own search index, its own API, and its own `localStorage`
namespace. Meridian never merges records from the two repositories.

## Repository layout

```
meridian/
├── memex/         ← submodule → adineo-cmd/memex
├── careermap/     ← submodule → adineo-cmd/careermap
├── scripts/
├── src/
└── README.md
```

Both sites are submodules, so they stay independent repositories with their
own content, history and data — that is where future data goes. This repo owns
the shell that presents them under one address.

## Build

Fetch both submodules, then build:

```bash
npm run bootstrap   # git submodule update --init --depth 1
npm run build       # installs each app's dependencies itself
```

`npm run build` can be narrowed: `--skip-build` assembles the site from
already-built `dist/` trees without running either app's build.

```bash
npm run build
```

What it does:

1. Builds Memex with its existing Astro config (`base: /memex/`).
2. Builds CareerMap with its existing Astro config (`base: /careermap/`),
   which also seeds SQLite and freezes the static API under `/careermap/api/`.
3. Copies both `dist/` trees into `site/memex` and `site/careermap`.
4. Generates the portal at `/` from each project's own artifacts.
5. Injects `/_shell/shell.js` into every page of both apps. That script only
   draws the floating **Switch map** button; it never reads either dataset.

## Run

```bash
npm start
```

Open http://127.0.0.1:4321.

## Data boundary

| Concern | Memex | CareerMap |
| --- | --- | --- |
| Content | `memex/public/data/artifacts` | `careermap/content` + frozen JSON API |
| Search | its own structure index | its own `search-index.json` |
| Progress | `arbor-roadmap-*` | `cm_done_*` |
| URL space | `/memex/` | `/careermap/` |

The portal only projects counts from each side into separate card templates.
There is no combined search index, no cross-referenced record, and no shared
progress store. The one shared thing is the doorway.

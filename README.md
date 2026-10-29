# Treehouse

A shared front door for two existing sites:

- **Library** — the knowledge map at `/library/`
- **Compass** — the career map at `/compass/`

The combination happens at the shell: one entrance, one visual system, one
address. The data does not move. Each app keeps its own build, its own content
directory, its own search index, its own API, and its own `localStorage`
namespace. Treehouse never merges records from the two repositories.

## Repository layout

```
treehouse/
├── library/     ← submodule → adineo-cmd/library
├── compass/     ← submodule → adineo-cmd/compass
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

1. Builds Library with its existing Astro config (`base: /library/`).
2. Builds Compass with its existing Astro config (`base: /compass/`),
   which also seeds SQLite and freezes the static API under `/compass/api/`.
3. Copies both `dist/` trees into `site/library` and `site/compass`.
4. Generates the portal at `/` from each project's own artifacts.
5. Injects `/_shell/shell.js` into every page of both apps. That script only
   draws the floating **Switch map** button; it never reads either dataset.

## Run

```bash
npm start
```

Open http://127.0.0.1:4321.

## Data boundary

| Concern | Library | Compass |
| --- | --- | --- |
| Content | `library/public/data/artifacts` | `compass/content` + frozen JSON API |
| Search | its own structure index | its own `search-index.json` |
| Progress | `arbor-roadmap-*` | `cm_done_*` |
| URL space | `/library/` | `/compass/` |

The portal only projects counts from each side into separate card templates.
There is no combined search index, no cross-referenced record, and no shared
progress store. The one shared thing is the doorway.

# Meridian

A shared front door for two existing sites:

- **Memex / Arbor** — the knowledge atlas at `/memex/`
- **CareerMap** — the career atlas at `/careermap/`

The combination happens at the shell: one entrance, one visual system, one
address. The data does not move. Each app keeps its own build, its own content
directory, its own search index, its own API, and its own `localStorage`
namespace. Meridian never merges records from the two repositories.

## Build

The build expects sibling `../memex` and `../careermap` checkouts. If they are
not there yet, fetch them first — the script only clones them, it never copies
one app's content into the other:

```bash
npm run bootstrap
```

Dependencies for both apps are installed by the build itself.

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

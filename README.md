# Treehouse

**One front door to two different maps of the same idea: what there is to learn, and what you can do with it.**

- **Library** — a field atlas of 28,649 disciplines, grown from twelve trunks.
- **Compass** — 40 career roadmaps, 928 topics and 143 occupations, linked back to fields of study.

Live at **https://adineo-cmd.github.io/treehouse/**

Both maps are complete, independent sites. Treehouse gives them one address, one
visual language and one way to move between them — without mixing a single record.

## The two maps

| | Library | Compass |
| --- | --- | --- |
| Answers | *What is there to learn?* | *Where can it take me?* |
| Shape | A tree: root → trunk → domain → subdomain | A route: field → roadmap → occupation |
| Size | 28,649 disciplines in 12 trunks | 40 roadmaps, 928 topics, 143 occupations |
| Lives at | [`/library/`](https://adineo-cmd.github.io/treehouse/library/) | [`/compass/`](https://adineo-cmd.github.io/treehouse/compass/) |
| Repo | [adineo-cmd/library](https://github.com/adineo-cmd/library) | [adineo-cmd/compass](https://github.com/adineo-cmd/compass) |

Each one also deploys on its own:

- https://adineo-cmd.github.io/library/
- https://adineo-cmd.github.io/compass/

## How the front door works

The portal at `/` is generated at build time from each app's own artifacts — the
counts, the trunk fan and the career route are drawn from Library's
`structure.json` and Compass's `roadmaps.json`, never hard-coded.

Once you are inside a map, the switch lives **in that map's own chrome**, not in
a floating overlay:

- **Library** — a *Switch map* tab in the main nav, an entry in the mobile
  sidebar, and a *Treehouse* link in the footer.
- **Compass** — the same three placements: main nav, sidebar, footer.

All three links share one theme preference (`treehouse-theme`), so light or dark
follows you from the portal into either map and back.

Standalone builds simply omit these links — the app repos stay usable on their
own, with no trace of the shell.

## Repository layout

```
treehouse/
├── library/     submodule → adineo-cmd/library
├── compass/     submodule → adineo-cmd/compass
├── scripts/
│   ├── build.mjs      builds both apps and assembles site/
│   ├── bootstrap.mjs  fetches the submodules
│   └── serve.mjs      static server for local preview
├── src/               the portal (index.html, portal.css, portal.js)
└── .github/workflows/pages.yml
```

The two apps are **submodules**, not copies. Their history, issues and data stay
in their own repositories; this repo only pins the commit it builds from.

## Running locally

```bash
npm run bootstrap   # git submodule update --init --depth 1
npm run build       # installs each app's deps, builds, assembles site/
npm start           # http://127.0.0.1:4321
```

Useful variations:

```bash
npm run build -- --skip-build   # re-assemble site/ from existing dist/ trees
SITE_BASE=/treehouse npm run build   # reproduce the GitHub Pages URLs locally
```

`SITE_BASE` is what makes the site portable: empty means "served at a domain
root", `/<repo>` means "served as a GitHub project site". The app builds receive
`LIBRARY_BASE` and `COMPASS_BASE` derived from it, so every asset, link and deep
route resolves under either one.

## Deployment

[`.github/workflows/pages.yml`](.github/workflows/pages.yml) runs on every push
to `main`:

1. Checks out this repo **with both submodules**.
2. Installs each app from its own lockfile (`npm ci --prefix …`).
3. Reads the Pages base path from `actions/configure-pages` and passes it as
   `SITE_BASE`.
4. Builds the combined site and publishes `site/` through the Pages artifact flow.

To ship a change to a map, push it to that map's repo, then bump the submodule
pointer here:

```bash
git -C library pull origin main     # or commit there first
git add library && git commit -m "Bump Library"
git push
```

The workflow picks up the new pinned commit and redeploys.

## Adding a third map

The shell is not hard-wired to two sites.

1. Add the repo as a submodule under its own folder.
2. In `scripts/build.mjs`, call `buildProject()` for it with its base and its
   `TREEHOUSE_*` link variables.
3. Add a copy step into `site/` and a card on the portal.
4. In the new app, print the same `TREEHOUSE_HOME` / `TREEHOUSE_SWITCH` links in
   its own header, sidebar and footer — the two existing apps show the pattern.

No data has to move, and the existing maps need no changes beyond their link
target.

## Data boundary

This is the part worth protecting.

| Concern | Library | Compass |
| --- | --- | --- |
| Content | `public/data/artifacts/` | `content/` + frozen JSON API |
| Search | its own structure index | its own `search-index.json` |
| Progress | `arbor-roadmap-*` keys | `cm_done_*` keys |
| URL space | `/library/` | `/compass/` |

The build fails if Compass's API appears inside the Library tree (or the
reverse), or if one side's progress keys leak into the other's bundle. There is
no combined search index, no cross-referenced record and no shared progress
store — only a shared doorway.

## Credits

Structure and field data are derived from [Wikidata](https://www.wikidata.org/),
released under CC0. Career families follow the JEL classification. Both are
built offline and committed as static artifacts; the deployed site makes no
third-party requests except web fonts.

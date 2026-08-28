# Nightcap Library

Nightcap Library is a tasting-first reference app for browsing a local drink-profile database. It is designed to feel like opening a premium physical archive: categories behave like filing tabs, profiles slide forward without losing the user's place, and research context stays available without competing with the tasting experience.

The project is deliberately **not** a store, recipe index, review feed, or image-led catalog. The product hierarchy is:

1. find the drink quickly;
2. understand what it tastes like;
3. understand what it pairs with and where it comes from;
4. expose accuracy, ambiguity, and sourcing when the user wants deeper context.

## Remastered experience

The v2 interface replaces the original dashboard/grid flow with a persistent library workspace:

- filing-cabinet family navigation instead of generic filter chips;
- instant local search across names, producers, origins, tasting notes, styles, tags, and pairings;
- category, confidence, pairing, and caveat filtering;
- comfortable and compact catalog densities;
- no page-number pagination — results extend in-place so browsing position stays coherent;
- full profile sheets that slide over the library rather than navigating away from it;
- saved profiles and recently viewed history stored locally on the device;
- related-profile discovery and random discovery;
- shareable URL state for filters and individual drink profiles;
- keyboard shortcuts (`/` to search, `R` for random, `Esc` to close a profile);
- offline shell/catalog caching through a small service worker;
- responsive behavior optimized for phone, tablet, and desktop.

## Architecture choice

The remaster keeps the application dependency-free and uses native ES modules rather than adding React/Vite.

That is intentional. The catalog already has a strong normalized JSON model, GitHub Pages is the deployment target, and the app does not need server rendering or a large component framework. Native modules provide separation of concerns while preserving zero-build deployment, fast startup, and easy maintenance.

### Front-end modules

- `js/app.js` — application state, routing, event handling, view rendering, profile interactions.
- `js/catalog.js` — normalization, faceting, filtering, sorting, catalog statistics, and related-profile scoring.
- `js/storage.js` — local favorites, recent history, and display preferences.
- `styles.css` — responsive design system and motion layer.
- `sw.js` — offline shell/catalog cache.

### Data

`data/drinks.json` remains the source of truth. The UI does not rewrite or flatten the research model.

Each profile can preserve:

- family, category, subtype, and varietal;
- producer and origin;
- exact or caveated ABV/proof data;
- aroma, flavor, body, and finish;
- food pairings and signature traits;
- whiskey-specific tags and search terminology;
- research confidence, ambiguity, conflicts, resolution, and caveats;
- normalization provenance through `sourceRecord`.

## Local development

Because the app loads local JSON with `fetch()`, serve the repository through HTTP:

```bash
python -m http.server 4173
```

Then open `http://localhost:4173`.

No package install or build step is required.

## GitHub Pages

Publish from the repository root of the default branch. All application assets use relative paths so the site works correctly from a GitHub Pages project subdirectory.

## Product principle

**Tasting first. Context second. Provenance never discarded.**

The visual shell can continue to evolve — including future photography or richer atmospheric scenes — without changing the normalized drink data or research methodology.

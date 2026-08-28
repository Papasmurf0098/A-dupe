# Nightcap Library — Remastered Architecture

## Original creative vision

Nightcap Library began with three unusually strong product constraints:

1. **Premium tasting reference, not a database dashboard.** The user should experience the collection as a curated library rather than a table of records.
2. **Tasting-first information hierarchy.** Aroma, flavor, body, finish, strength, origin, and pairings belong in the primary reading path. Research methodology belongs behind that layer.
3. **Uncertainty-aware data.** Product-level facts, family-level profiles, ambiguous menu names, batch variation, private barrels, and release-dependent strength must be represented honestly rather than normalized into false precision.

The first implementation solved the data problem well but expressed the experience as a conventional dashboard: hero metrics, filter chips, paginated cards, and a separate detail page. The remaster keeps the data contract and replaces the interaction contract.

---

## Remaster goals

### 1. Continuous browsing

The library and profile should feel like one space. Opening a drink does not destroy the current search/filter context. A profile sheet moves over the catalog and closes back to the exact browsing state.

### 2. Physical-library metaphor

Family navigation behaves like filing tabs rather than generic pills. Cards are intentionally restrained, slightly dimensional records rather than glossy ecommerce tiles. Motion should suggest a card or file being pulled forward.

### 3. Faster information retrieval

Search is local and immediate. Users can narrow by family, category, confidence, pairing availability, and caveats. Search includes tasting and pairing language, which means queries such as `blackberry`, `wheated`, `port`, or `brisket` can find useful profiles.

### 4. Personal utility without accounts

Saved drinks, recent history, density, and sorting preferences use browser storage. The app stays fully static and private by default.

### 5. Progressive capability

The application remains useful as a plain static site. Enhancements such as offline caching, Web Share, clipboard copy, and local preferences activate when the browser supports them.

---

## Why native ES modules instead of React

React was considered because the original single-file renderer had grown large. The remaster instead separates responsibilities with native ES modules.

For this project, that gives the relevant benefits of a framework without introducing a build toolchain:

- GitHub Pages still serves the repository directly;
- no dependency installation or version maintenance;
- no hydration/runtime framework overhead;
- catalog data stays external and independently editable;
- browser history and URL state remain explicit;
- modules can later be migrated into React, Preact, Vue, or another framework if application complexity actually requires it.

The decision is therefore not “never React”; it is “do not pay framework cost before the product needs framework semantics.”

---

## Application layers

### `data/drinks.json` — normalized content layer

The catalog remains a normalized master dataset. It owns truth and provenance, not presentation.

### `js/catalog.js` — query layer

Responsibilities:

- enrich records with a precomputed search surface;
- derive family/category facets;
- filter and sort locally;
- compute catalog statistics;
- score related profiles using family/category/producer/style/tasting overlap.

### `js/storage.js` — persistence layer

Responsibilities:

- saved profile IDs;
- recently viewed IDs;
- sort/density preferences;
- graceful fallback when local storage is unavailable.

### `js/app.js` — interaction/view layer

Responsibilities:

- application state;
- URL state and browser history;
- search/filter interactions;
- family/category navigation;
- catalog rendering;
- profile rendering;
- saved/recent state;
- random discovery;
- share behavior;
- keyboard controls.

### `styles.css` — experience layer

Responsibilities:

- family-reactive color tokens;
- filing-tab navigation;
- catalog deck/card depth;
- profile-sheet transitions;
- responsive layouts;
- reduced-motion support.

### `sw.js` — offline enhancement

Caches the application shell and drink catalog. The site remains a normal web app if service workers are unavailable.

---

## State model

Transient UI state:

```text
query
family
category
confidence
pairingsOnly
caveatsOnly
scope (all | favorites | recent)
sort
density
visible result count
selected drink id
```

Durable local state:

```text
favorites
recent profile history
sort preference
density preference
```

Shareable URL state:

```text
?q=
&family=
&category=
&confidence=
&scope=
&pairings=1
&caveats=1
&sort=
&drink=
```

The URL intentionally excludes purely presentational details such as visible-result count.

---

## Profile information hierarchy

1. family + category
2. name
3. subtype / varietal and key style badges
4. strength
5. producer / origin / proof / style facts
6. aroma and palate
7. body and finish
8. pairings
9. signature traits
10. related discovery
11. accuracy and source context

Research remains present, but it no longer visually competes with the drink itself.

---

## Accuracy and uncertainty rules

- Do not manufacture placeholders for missing fields.
- Prefer `strength.display`/`abvDisplay` when the source is caveated.
- Keep exact proof separate when available.
- Preserve batch, barrel, release, private-barrel, and market variation.
- Preserve source-name normalization through `sourceRecord`.
- Keep confidence and ambiguity visible in the accuracy panel.
- Search may use normalized tags, but display should favor human-readable values.

---

## Performance strategy

The catalog is loaded once and normalized in memory. Search uses a precomputed lowercase surface on every record. The UI initially renders a bounded result set and extends it in place with “Show more,” avoiding both heavy full-catalog DOM rendering and disruptive numbered pagination.

There is no framework runtime and no build artifact. The service worker caches the static shell after first load.

---

## Future-compatible extension points

The remaster intentionally leaves clean seams for:

- high-fidelity family/background photography;
- per-product bottle or glass imagery;
- richer faceted filtering;
- collections beyond a single saved list;
- PWA icons/install polish;
- source-link objects instead of source-type text;
- generated static profile pages for search indexing;
- import/research tooling that writes back into the normalized JSON schema.

These can be added without rewriting the catalog contract.

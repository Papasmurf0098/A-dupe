# Voodoo Drink Library II

A drink reference for Voodoo Bayou, Palm Beach Gardens: tasting profiles, qualified strength references, and pairings with named dishes from the location-linked menu.

## September 2026 revision

- 353 stored records, 352 distinct profiles after one duplicate is mapped to its canonical entry.
- Every record has a dated research review, scoped source links, and strength qualifications.
- 15 records added from the retrieved menu; these are additions to this catalog, not confirmed new restaurant offerings.
- 682 pairing suggestions across 341 visible profiles and 36 named dishes. Eleven unresolved bottles/flights remain unpaired.
- Dish-first discovery, ingredient and accent-insensitive search, flavor filters, and menu-status filters.
- Royal-purple textured surfaces, gold and emerald accents, glass filing tabs, real illustrative photography, and front-to-back profile motion.
- Saved profiles, recent history, deep links, sharing, random discovery, and compact/comfortable views.

Read [the research audit](RESEARCH_AUDIT.md) for verification limits and corrections. Read [photo credits](ASSET_CREDITS.md) for sources and licenses. The photography does not depict the restaurant or certify individual drinks.

## Run and validate

No package installation or build is required. Serve the repository root over HTTP; opening `index.html` directly with `file://` will not support the data fetches.

```sh
python -m http.server 4173
```

For dependency-free tests, use Node.js 22.7+ (validated with Node.js 24):

```sh
node --test tests/*.test.mjs
node --check js/app.js
node --check js/catalog.js
node --check js/storage.js
node --check sw.js
git diff --check
```

Tests cover data invariants, identity redirects, pairing references, qualified ABV, search and filtering, storage recovery, and service-worker behavior in a simulated environment. They do not substitute for browser layout, assistive-technology, touch, or installed-PWA testing. Those manual checks have not been performed in this revision.

## Files

- `data/drinks.json`: active catalog and archived prior values under `sourceRecord`.
- `drinks.json`: compatibility copy; keep byte-identical to `data/drinks.json`.
- `data/food.json`: named dishes, menu components, service labels, and source scope.
- `js/catalog.js`: duplicate normalization, search, filters, sorting, and related profiles.
- `js/app.js`: rendering, route state, interaction handling, profile modal, and food discovery.
- `js/storage.js`: device-local favorites, recent history, and preferences. Existing `nightcap:v2:*` keys are intentionally retained to preserve user data.
- `styles.css`: responsive theme, filing-tab motion, and reduced-motion support.
- `sw.js`: network-first app assets with offline fallback; cache cleanup is limited to this app's registration scope.
- `tests/`: dependency-free regression tests.

The old DOCX and parser are preserved as historical inputs. **Do not regenerate the current catalog with the legacy parser**: doing so would overwrite the reviewed profiles and pairings. Previous narrative values are provenance, not current evidence, and are not displayed as active tasting notes.

## Deployment

GitHub Pages can serve the repository root without a build step. Relative asset paths support the project subdirectory. This revision is delivered on a review branch; creating a pull request does not merge or deploy it.

Keyboard: `/` focuses search, `R` opens a random profile, and `Escape` closes an open profile. The modal traps keyboard focus and makes the background inert. Reduced-motion preferences disable animated transitions.

# V2 Remaster — implementation checklist

## Completed in this branch

- [x] Preserve normalized research-rich JSON catalog.
- [x] Replace single monolithic UI file with native ES modules.
- [x] Replace dashboard-style family controls with filing-tab navigation.
- [x] Replace numbered pagination with continuous in-place expansion.
- [x] Replace separate detail navigation with animated profile sheets.
- [x] Preserve filter/search state in shareable URLs.
- [x] Add saved profiles using local storage.
- [x] Add recent-view history using local storage.
- [x] Add category/confidence/pairing/caveat refinement controls.
- [x] Add compact/comfortable catalog density.
- [x] Add related-profile discovery.
- [x] Add random discovery.
- [x] Add native share/clipboard fallback.
- [x] Add keyboard shortcuts and reduced-motion support.
- [x] Add offline shell/catalog caching.
- [x] Rework the responsive phone/tablet experience.
- [x] Keep accuracy/source context available as a secondary layer.

## Deliberately deferred

- Product photography and family scene assets: the UI now has clear hooks for them, but the repository does not currently contain a curated rights-safe image set.
- Source hyperlinks: the data currently stores source-type summaries rather than normalized source URL objects.
- Account sync: saved/recent state remains local by design.
- Build framework: native ES modules are sufficient at current complexity and preserve zero-build GitHub Pages deployment.

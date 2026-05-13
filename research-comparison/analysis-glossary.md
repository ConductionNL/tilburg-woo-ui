# Analysis: Glossary system (ours only)

## Branches Compared
- Ours (tilburg-woo-ui): `softwarecatalogus-performance`
- Acato (tilburg-woo-ui_acato): `main`

## Scope

A small, self-contained feature that scans rendered content for glossary terms, wraps each first hit in a `<mark>` and exposes definitions through a side drawer. The terms are fetched from `/opencatalogi/api/glossary` once on app boot.

**Acato has nothing in this category.** No store, no drawer, no highlight component, no `con-glossary*` files anywhere in [tilburg-woo-ui_acato/src/](../../tilburg-woo-ui_acato/src/). The only glossary-shaped trace is one line in Acato's [src/utilities/ac-match-substring.js:20](../../tilburg-woo-ui_acato/src/utilities/ac-match-substring.js#L20) that still emits a `data-glossary-id='${id}'` attribute on its `<mark>` output — a dormant hook from a common ancestor with no consumer on their side.

This category is ours-only — the verdict is **keep**, no merge decision needed.

## Files inventoried

| File | LoC | Role |
|------|----:|------|
| [src/stores/glossary.store.js](../src/stores/glossary.store.js) | 123 | MobX store: term cache, drawer state, current-page term IDs |
| [src/utilities/con-glossary-highlight.js](../src/utilities/con-glossary-highlight.js) | 172 | Pure helpers: regex builder, term lookup, find + highlight functions |
| [src/components/con-glossary-highlight/con-glossary-highlight.js](../src/components/con-glossary-highlight/con-glossary-highlight.js) | 115 | React wrapper component — recursively walks children and replaces text nodes |
| [src/components/con-glossary-drawer/con-glossary-drawer.js](../src/components/con-glossary-drawer/con-glossary-drawer.js) | 177 | Side drawer with "Deze pagina" / "Alle begrippen" tabs |
| [src/styles/components/_con-glossary.scss](../src/styles/components/_con-glossary.scss) | 93 | Mark styling, drawer item styling, floating action button |

Total: **680 LoC**.

## How the pieces fit together

```
        App boot
           │
           ▼
  GlossaryStore.warmup()  ──► GET /opencatalogi/api/glossary?_limit=1000
           │                   stores 0..N terms in @observable terms[]
           │
           ├──► ConGlossaryHighlight (wraps content in views)
           │       │
           │       ├──► utilities/con-glossary-highlight.js
           │       │      ├── buildGlossaryRegex(terms)   (≥3 chars, longest first)
           │       │      ├── buildTermLookup(terms)      (lowercase title → term)
           │       │      ├── findGlossaryTerms(text)     → store.addPageTermIds()
           │       │      └── highlightGlossaryTerms()    → React <mark> nodes
           │       │             onClick → store.openDrawer(termId)
           │       │
           │       └── walkAndHighlight()  recurses React tree, skips
           │             <button|a|input|select|textarea|mark>
           │
           └──► ConGlossaryDrawer (rendered once in App.web.js)
                   ├── tab "Deze pagina"  → store.page_terms
                   ├── tab "Alle begrippen" → store.all_terms + AcSearchFilter
                   ├── opens via <dialog>.showModal()
                   └── on route change → store.resetPageTerms()
```

The store deliberately separates `terms` (everything) from `pageTermIds` (a `Set` that highlight components add to during render). The drawer reads `page_terms` for the contextual tab; route changes wipe it.

The utility module is pure — no React imports beyond `createElement` for the `<mark>` output — so its four exports (`buildGlossaryRegex`, `buildTermLookup`, `findGlossaryTerms`, `highlightGlossaryTerms`) are also re-exported through [src/utilities/index.js:155-159](../src/utilities/index.js#L155-L159) and could be reused outside the React layer.

## Where it's wired into the rest of the app

- [src/stores/store.js:22,45](../src/stores/store.js#L22) — instantiated as `store.glossary` on the root store.
- [src/App.web.js:24,101,307-319](../src/App.web.js#L24) — `store.glossary.warmup()` fires on app init; the drawer and a fixed-position trigger button render at the layout root; both are suppressed on `/beheer*` routes.
- [src/views/ac-home/ac-home.js:38-99](../src/views/ac-home/ac-home.js#L38), [src/views/ac-content/ac-content.js:55-60](../src/views/ac-content/ac-content.js#L55), [src/views/ac-publication/ac-publication.js:202-204](../src/views/ac-publication/ac-publication.js#L202) — three views that wrap their public content in `<ConGlossaryHighlight as='div'>`.
- [src/components/index.js:133-193](../src/components/index.js#L133) — both components exported via `loadable()`.
- [src/styles/components/index.scss:37](../src/styles/components/index.scss#L37) — SCSS partial registered.

The drawer self-hides via `location.pathname.startsWith('/beheer')`, and the floating button is gated by `!isBeheerPage` in `App.web.js`. So the glossary surface is public-portal only — admin views are intentionally exempt.

## Observations (no action required)

1. **Warmup is opportunistic.** `warmup()` exits early if `warmedUp || loading`. There is no retry on failure — a 5xx during boot means the feature stays dormant until the next reload. Acceptable for a non-essential overlay.
2. **First-occurrence-only highlighting** is implemented in two places: `walkAndHighlight` threads a shared `Set` across the React tree so the same term only marks once per `ConGlossaryHighlight` wrapper, while `highlightGlossaryTerms` keeps an internal `Set` for the string-only path. Both rely on the same `sharedHighlightedIds` parameter — consistent.
3. **Minimum term length is hard-coded at 3 characters** in both `buildGlossaryRegex` and `buildTermLookup`. Common-word noise (e.g. acronyms shorter than 3) is silently dropped.
4. **`ac-match-substring.js` emits `data-glossary-id`** ([src/utilities/ac-match-substring.js:20](../src/utilities/ac-match-substring.js#L20)) but is not part of this feature's flow — the attribute is unused by the new highlight component. Same line exists verbatim in Acato. Dead leftover on both sides; harmless.
5. **Hard-coded baseURL.** The store imports `BASE_URL` from `@views/ac-beheer/core/utils/constants` rather than going through the shared API layer — a minor layering wrinkle, but the glossary endpoint is a public OpenCatalogi route so it works either way.
6. **Drawer uses `<dialog>` native modal.** `drawerRef.current.showModal()` / `.close()` plus a `close` event listener that calls `glossary.closeDrawer()`. Clean approach, depends on the `AcDrawer` atom forwarding the ref.

## Recommendation

**Keep all five files — no merge decision needed.** Acato has no equivalent and the system is fully internal to our fork (admin-aware, OpenCatalogi-backed, public-portal-only).

No incidental debt worth raising as a follow-up — the surface is small, the utility module is pure, and the integration points are all `con-*` files that are clearly ours.

# Analysis: Search system

## Branches Compared
- Ours (tilburg-woo-ui): `softwarecatalogus-performance`
- Acato (tilburg-woo-ui_acato): `main`

## Files Compared

### Ours
- `src/views/ac-search/ac-search.js`
- `src/components/ac-search-box/ac-search-box.js`
- `src/components/ac-search-categories/ac-search-categories.js`
- `src/components/ac-search-date/ac-search-date.js`
- `src/components/ac-search-filter/ac-search-filter.js`
- `src/components/ac-search-sort/ac-search-sort.js`
- `src/components/ac-search-subjects/ac-search-subjects.js` *(ours only)*
- `src/components/con-pagination-limit-selector/con-pagination-limit-selector.js` *(ours only)*
- `src/molecules/ac-search-filters/ac-search-filters.js`
- `src/molecules/ac-search-result/ac-search-result.js`
- `src/molecules/con-facets-filters/con-facets-filters.js` *(ours only)*
- `src/molecules/con-active-filters/con-active-filters.js` *(ours only)*
- `src/hooks/con-use-debounced-input-hook.js` *(ours only)*
- `src/hooks/con-use-facet-name-resolution.js` *(ours only)*
- `src/styles/molecules/_ac-search-filters.scss`
- `src/styles/molecules/_ac-search-results.scss`
- `src/styles/molecules/_con-active-filters.scss` *(ours only)*
- `src/styles/components/_ac-search-box.scss`
- `src/styles/components/_ac-search-filter.scss`
- `src/styles/components/_con-pagination-limit-selector.scss` *(ours only, 3 lines)*

### Acato
- `src/views/ac-search/ac-search.js`
- `src/components/ac-search-box/ac-search-box.js`
- `src/components/ac-search-categories/ac-search-categories.js`
- `src/components/ac-search-date/ac-search-date.js`
- `src/components/ac-search-filter/ac-search-filter.js`
- `src/components/ac-search-sort/ac-search-sort.js`
- `src/components/ac-search-themes/ac-search-themes.js` *(Acato only)*
- `src/molecules/ac-search-filters/ac-search-filters.js`
- `src/molecules/ac-search-result/ac-search-result.js`
- `src/styles/molecules/_ac-search-filters.scss`
- `src/styles/molecules/_ac-search-results.scss`
- `src/styles/components/_ac-search-box.scss`
- `src/styles/components/_ac-search-filter.scss`

---

## What is the same

Both implementations share the same skeleton at the top level:
- `AcSearch` view: identical wrapper structure (`AcContainer` + `AcCard` containing `AcSearchBox`, then results column + filters column).
- `AcSearchBox`: same JSX shape — Utrecht `Textbox` + `PrimaryActionButton`, a "Filter" `SecondaryActionButton` shown only when `page === 'search'`, MobX `toggleMobileFilters` / `mobileFiltersOpen` binding.
- `AcSearchFilters` (mobile drawer): identical scroll-lock + `FocusLock` + ESC-to-close + backdrop-click-to-close mechanics. Both render `AcSearchSort` inside the drawer when open.
- `AcSearchSort`: same `FormField`/`Select` skeleton, identical `type='alt'` prop semantics, same `setSort` / `resetSort` / `get_order` store hook.
- `AcSearchResult` (skeleton state): both render `<AcSearchResult skeleton />` placeholders during loading, identical `AcCard searchResult` markup, same date formatting via `acFormatDate`, same theme badge + ellipse separators.
- `AcSearchCategories`, `AcSearchDate`, `AcSearchFilter` (begrip search): identical component contracts (same props and store wiring at the boundary), both backed by `publications` store.
- Search SCSS files (`_ac-search-filters.scss`, `_ac-search-box.scss`, `_ac-search-filter.scss`) are nearly identical structurally — differences are small token tweaks / responsive breakpoint choices listed below.

---

## What differs

### 1. URL handling vs MobX as source of truth

This is the biggest architectural divergence.

**Acato** — store is the source of truth. `setSearchQuery`, `setPage`, `setSort` mutate the store; a `useEffect` watches `search_query` and calls `navigate(getSearchPageURL())` to push state to the URL. Includes lifecycle resets (`resetSearchQuery`, `resetAggregations`) on unmount.

**Ours** — URL is the source of truth. `useSearchParams()` is used directly inside the view, the search-box callback writes to `URLSearchParams`, and the URL-change effect calls `updateQuery(...)` to feed the store. No unmount cleanup. `AcSearchSort` also writes `_order[...]` params directly to the URL.

Knock-on differences:
- `AcSearchSort` (ours) explicitly removes `_order[_created]` / `_order[_name]` / `_order[_relevance]` on every change and resets `_page=1`. Acato's sort calls `setSort(...value)` and lets the store-watching effect rewrite the URL.
- Sort options also differ: ours offers Relevance + Created + Name (six SelectOptions, `_relevance` / `_created` / `_name`); Acato offers Relevance + `@self.published` only (three options).

### 2. Facets API and filter rendering

**Acato** uses a fixed three-filter layout: `AcSearchDate`, `AcSearchCategories` (if `all_categories?.length > 0`), `AcSearchThemes` (if `all_themes?.length > 0`). Categories use a `categories_with_facets` getter that joins `all_categories` with bucket results; themes do the same with `all_theme_facets`.

**Ours** delegates almost all filter rendering to **`ConFacetsFilters`** — a ~920-line generic component that:
- Reads from `publications.all_facets` (a single aggregated API response keyed by facet name plus a special `@self` nested group).
- Renders each enabled facet as a `ConAccordion.Item` with optional in-facet text search (when bucket count > 20).
- Resolves UUID labels to human names via `useFacetNameResolution` hook + `objectStore.getNamesForMultipleIds` (UUIDs render first, names hydrate in).
- Has an `isFacetChecked` helper that understands both flat (`category=...`) and nested (`@self[schema]=...`) URL params.
- Auto-removes active filter values whose bucket count drops to 0 after facets re-fetch.
- Disables unchecked checkboxes while facets are loading (only when at least one filter is already active).
- Auto-rewrites schema-based labels: `Module` → `Applicatie`, `Module Versie` → `Applicatieversie`.
- Sorts facets by an `order` field, then alphabetically by `title`.
- Contains extensive `console.log` / `console.group` debug output (see *Code-quality flags* below).

Ours also adds **`ConActiveFilters`** (chips above the facet list) showing every active filter as a removable badge, plus a "Wis alle filters" button that preserves the `_search` term.

### 3. Search box behaviour

**Acato** — uncontrolled, submits only on form submit (button click or Enter).

**Ours** — debounced auto-search: a `useRef` debounce timer fires `onSubmitCallback` 300ms after the user stops typing, with logic to skip the initial render and skip when `searchQuery === defaultValue`. Adds a `disableAutoSearch` prop opt-out. Wraps the `<Heading>` title in an extra `__title-wrapper` div. Uses Utrecht `FormLabel` instead of a plain `<label for=>`.

### 4. Date filter

**Acato** — Utrecht `AcFormField` with `type='date'` (native HTML5 date pickers); requires an explicit "Apply" `SecondaryActionButton`. Uses `gte` / `lte` keys on `search_query['@self'].published`.

**Ours** — Amsterdam DS `DateInput` (free-form dd-mm-yyyy text); applies on blur or Enter (no explicit Apply button). Uses `after` / `before` keys on `search_query.published`. Adds a per-input `errors` state but never sets a non-empty error message.

### 5. Results layout & rendering

**Acato** — single `AcFlex` with `AcSearchFilters` on the left and the results column on the right. Includes a `SkipLink` ("Ga direct naar zoekresultaten"). Renders every result as a generic `<AcSearchResult {...publication} />`.

**Ours** — explicit grid layout via `.ac-search-layout` / `__main` / `__filters` CSS so filters can be visually-left but DOM-last for tab order. No SkipLink. Result rendering is a polymorphic switch over `selfData.schema.slug` (`product` / `module` / `organisatie` / `moduleversie` / `dienst` / `contactpersoon` / `gebruik` / `koppeling`), each picking a dedicated `Con*` card from `src/molecules/con-cards/`; the default branch still uses `AcSearchResult`. Pulls `extractTitle` / `extractSummary` / `getImageFromPublication` helpers for safe text extraction. Result count uses `ConFormatDutchNumber(pagination.total)` rather than `all_publications?.length`.

`AcSearchResult` (ours) also resolves UUIDs inside titles via `<ConUuidResolver>`, exposes a `navigateTo` prop with three modes (`publication` / `beheer` / `view`), and replaces the `published` field with `created`.

### 6. Sort field semantics

- Acato sorts only on `@self.published` (publication date).
- Ours sorts on `_created`, `_name`, `_relevance` metadata keys, suggesting a different (newer) API shape.

### 7. Themes / Subjects

- **Acato** `ac-search-themes.js`: reads `all_themes` + `all_theme_facets` from `publications` store, combines them, drives checkboxes via `toggleSearchArrayValue('themes', ...)`.
- **Ours** `ac-search-subjects.js`: reads `all_themes` from the `themes` store (separate store), calls `fetchThemes()` on mount. Note this component is rendered standalone and is **not** wired into `AcSearchFilters` (which uses `ConFacetsFilters` instead). It may be a leftover or used elsewhere — needs grep verification before any merge decision.

### 8. Search box modal content (`AcSearchCategories`)

The "About categories" modal text is wildly different:
- Acato: 11 long-form category explanations (Bestuursstukken, Raadsstukken, Jaarplannen, Woo-dossiers, etc.) — content tailored to the WOO public-portal use case.
- Ours: 5 short category blurbs (Convenant, Bestuursstuk, Woo-verzoek, Raadstuk, Organisatiegegevens), one of which links to `/contact`. Also includes a `AcCheckIfSpecificHostname()` branch to swap the VNG question-mark icon. Field source is `category._id` / `category.count` vs Acato's `category.key` / `category.results`.

### 9. SCSS differences

- `_ac-search-filters.scss`: ours dropped Acato's wider input/button sizing, swapped `:is(h3, h4, p:not(:has(...)))` for `:is(h3, h4)`, added "disabled checkbox while loading" styles, added a `__date-item-container > input` width fix, narrowed default inline-size to `360px` (Acato `265px`).
- `_ac-search-results.scss`: ours adds the `.ac-search-layout` two-column grid (flex with `order:1`/`order:2` swap) so filters can appear visually first while DOM-last.
- `_ac-search-box.scss`: ours drops the `__label` bold rule and a large stretched-button mobile block; adds a `__title-wrapper` rule and inlines a `.ams-date-input` token-driven block (looks like it belongs in the Amsterdam DS override stylesheet, not here).
- `_ac-search-filter.scss`: tiny — ours drops `label { font-weight: bold }` and an explicit input height.

### 10. Code-quality flags in our `ConFacetsFilters`

These should be cleaned up regardless of merge strategy:
- ~10 `console.log` / `console.group` / `console.info` calls left in production (lines 405, 411, 423, 432, 437, 524–538). Some include emoji-prefixed group headers.
- Several commented-out blocks (`relevanceScore`/`hasRelevance` block in `ac-search-result.js` lines 39–57, dead debug `SelectOption` for relevance asc).
- One always-false constant: `const shouldShowSkeleton = false;` with the dead branch still rendered above it (line 545–549).
- Multiple "Note: Facets fetch is triggered by URL change effect in AcSearch / No need to call fetchFacets() here" comments that pile up across functions.
- Inline styles for skeleton card sizing (`height: '750px'`) — looks copy-pasted.
- A test/dev `documentation` JSDoc block at the top of `ConActiveFilters` is wrong — it was copied from `ConFacetsFilters`.

### 11. Loading orchestration

- **Acato** fetches `fetchAggregations()` once on mount, then `fetchPublications()` on every URL change.
- **Ours** fires `fetchPublications()` first (fast path), then `fetchFacets()` second on every URL change, with a comment explaining the order. There is no aggregation reset on unmount.

### 12. Accessibility deltas

- Acato has a `SkipLink` jumping to the results region (`#search-results`). Ours doesn't.
- Acato adds `role='dialog'` to the filter drawer on mobile via a `useIsMobile` check; ours does not.
- Ours has a polite `aria-live` count region above results; Acato has the same.
- Both use `FocusLock` and ESC handlers in the drawer.

---

## Only in ours

- **`ConFacetsFilters`** — generic accordion-driven facet UI with in-facet text filter, UUID name resolution, nested `@self[...]` filter support, auto-prune of zero-result active filters, schema-id-to-slug fallback.
- **`ConActiveFilters`** — removable filter chips above the facet list.
- **`useFacetNameResolution`** hook — async resolution of UUID bucket labels to human-readable names via `objectStore.getNamesForMultipleIds`.
- **`useDebouncedInput`** hook — generic debounced-callback hook (used outside of search too).
- **`ConPaginationLimitSelector`** + `usePaginationLimit` hook — react-select-creatable page-size picker with custom-value support and per-objectType session-storage persistence. Used in beheer-style list views; not in `ac-search.js` itself.
- **`AcSearchSubjects`** — themes checkbox list, currently unused in the search view (uses the themes store, not publications).
- **Per-schema result cards** (`ConCardOrganisationApplication`, `ConCardDienst`, `ConCardContactpersoon`, `ConCardGebruik`, `ConCardModuleVersie`, `ConCardKoppeling`) selected via `schema.slug` switch in `ac-search.js`.
- `.ac-search-layout` two-column grid for DOM-order independent filter placement.
- Auto-search debouncing in `AcSearchBox`.
- `disableAutoSearch` prop.
- `AcCheckIfSpecificHostname()` hostname branch in `AcSearchCategories`.

## Only in Acato

- **`AcSearchThemes`** — bound to `publications.all_themes` + `all_theme_facets` (ours' equivalent lives in `ConFacetsFilters`).
- `SkipLink` to results region.
- `useIsMobile`-driven `role='dialog'` on the mobile filter drawer.
- `resetSearchQuery` / `resetAggregations` unmount cleanup.
- An "Apply" button on the date filter (ours applies on blur).
- A richer 11-section "About categories" modal.
- A separate (more aggressive) `_label { font-weight: bold }` style on inputs.

---

## Recommendation

| Area | Recommendation | Notes |
|---|---|---|
| `AcSearch` view shell (DOM layout, polymorphic result cards) | **Keep ours** | The per-schema card switch is core to our softwarecatalogus use case. |
| Source-of-truth for query state (URL vs store) | **Keep ours** | URL-as-truth survives back/forward, is shareable, and removes the navigate-vs-update double write Acato has. |
| `AcSearchSort` sort fields | **Needs decision** | Different API shapes (`_created` / `_name` / `_relevance` vs `@self.published`). Confirm with backend which sort keys are supported; if ours' API is the converged target, keep ours; otherwise consider exposing both. |
| `AcSearchBox` debounced auto-search | **Keep ours** | Better UX for fast APIs. |
| Date filter UX (DateInput on blur vs date input + Apply button) | **Take Acato's pattern, keep ours' component** | Apply-button pattern is clearer; native `<input type=date>` is more accessible. Suggest merging: keep ours' `setQueryDate` wiring but adopt Acato's HTML5 date input + explicit Apply button (cleaner than current "apply on blur with empty error state"). |
| Facet rendering (`ConFacetsFilters` vs `AcSearchCategories`+`AcSearchThemes`+`AcSearchDate`) | **Keep ours** | Generic facets are far more flexible for the dataset we actually have. But: **clean up debug logging** and the `shouldShowSkeleton=false` dead branch before any merge. |
| Active filter chips (`ConActiveFilters`) | **Keep ours** | Net UX win. |
| Result cards | **Keep ours** for the dispatch logic; default branch can adopt Acato's `hideCategory`/`hideThemes`/`hideEllipses` flags if we ever need the simpler card again. |
| `AcSearchResult` `published` vs `created` field | **Needs decision** | Backend convention; whichever the new API exposes wins. |
| `SkipLink` to results region | **Take from Acato** | Tiny a11y win; no downside. |
| `role='dialog'` on mobile drawer + `useIsMobile` | **Take from Acato** | Tiny a11y win. The `useIsMobile` utility likely belongs in `hooks/`, not `utilities/`. |
| `resetSearchQuery` / `resetAggregations` unmount cleanup | **Take from Acato** | Prevents stale facet state when navigating away mid-search. |
| `useDebouncedInput`, `useFacetNameResolution`, `ConPaginationLimitSelector`, `usePaginationLimit` | **Keep ours** | All used outside search too. |
| `AcSearchSubjects` (ours) | **Investigate then likely delete** | Appears orphaned — not wired into `AcSearchFilters`. Confirm via grep before removing. |
| "About categories" modal copy | **Take from Acato** | Acato's text is plain-language and tailored to the WOO portal audience; ours reads like placeholder content. **Business decision flag:** confirm whether our portal still wants these categories at all, or whether the softwarecatalogus pivot makes them irrelevant. |
| `AcCheckIfSpecificHostname()` VNG icon swap | **Keep ours** | Multi-tenant theming. |
| `.ams-date-input { ... }` block inside `_ac-search-box.scss` | **Move it** | Belongs in `src/styles/nlds/overrides/` (Amsterdam DS override). Doesn't change behavior but matters for the styling category. |
| Debug `console.*` calls + dead branches in `ConFacetsFilters` | **Clean up** | Independent of merge direction. See §10 — *Code-quality flags in our `ConFacetsFilters`*. |

### Items that need a human decision

1. **Backend convergence.** Sort key names (`_created` vs `@self.published`), date filter keys (`after`/`before` vs `gte`/`lte`), and facet payload shape (`all_facets` aggregated object vs separate `all_categories`/`all_themes`) all imply different backend versions. We can't merge code without knowing which API both sides will run against.
2. **Category model.** Acato's category list (Bestuursstukken, Raadsstukken, Woo-dossiers, …) is WOO-portal-shaped. Ours is softwarecatalogus-shaped. The list itself is a product/content decision, not a code decision.

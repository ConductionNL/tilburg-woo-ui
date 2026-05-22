# Analysis — Search system

**Scope:** the search experience end-to-end — the `views/ac-search/` page, the search-related `components/ac-search-*/`, the molecule shell `molecules/ac-search-filters/` plus our `con-facets-filters`/`con-active-filters`, the result card `molecules/ac-search-result/`, the `publications` + `themes` stores, the `publications` API layer, and the `ac-search-params-to-object` URL helper that ties them together.

Out of scope here: individual softwarecatalogus card variants (covered by **publication cards** category #4), the publication detail view (category #5), themes/subjects landing pages (category #6).

---

## 1. Files compared

### Shared (both sides have a file at this path)

| File | Ours (`tilburg-woo-ui/`) | Theirs (`openwoo-tilburg-ui/`) |
|---|---|---|
| Search view | [src/views/ac-search/ac-search.js](../src/views/ac-search/ac-search.js) (329 lines) | [src/views/ac-search/ac-search.js](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/views/ac-search/ac-search.js) (179 lines) |
| Search box | [src/components/ac-search-box/ac-search-box.js](../src/components/ac-search-box/ac-search-box.js) | [theirs](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/components/ac-search-box/ac-search-box.js) |
| Search sort | [src/components/ac-search-sort/ac-search-sort.js](../src/components/ac-search-sort/ac-search-sort.js) | [theirs](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/components/ac-search-sort/ac-search-sort.js) |
| Search date | [src/components/ac-search-date/ac-search-date.js](../src/components/ac-search-date/ac-search-date.js) | [theirs](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/components/ac-search-date/ac-search-date.js) |
| Search categories | [src/components/ac-search-categories/ac-search-categories.js](../src/components/ac-search-categories/ac-search-categories.js) | [theirs](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/components/ac-search-categories/ac-search-categories.js) |
| Search filter (inline component, used by glossary/themes pages — not the main filters panel) | [src/components/ac-search-filter/ac-search-filter.js](../src/components/ac-search-filter/ac-search-filter.js) | [theirs](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/components/ac-search-filter/ac-search-filter.js) |
| Search filters shell | [src/molecules/ac-search-filters/ac-search-filters.js](../src/molecules/ac-search-filters/ac-search-filters.js) | [theirs](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/molecules/ac-search-filters/ac-search-filters.js) |
| Search result card | [src/molecules/ac-search-result/ac-search-result.js](../src/molecules/ac-search-result/ac-search-result.js) | [theirs](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/molecules/ac-search-result/ac-search-result.js) |
| Publications store | [src/stores/publications.store.js](../src/stores/publications.store.js) (1032 lines) | [theirs](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/stores/publications.store.js) (542 lines) |
| Themes store | [src/stores/themes.store.js](../src/stores/themes.store.js) (160 lines) | [theirs](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/stores/themes.store.js) (84 lines) |
| Publications API | [src/api/publications.api.js](../src/api/publications.api.js) | [theirs](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/api/publications.api.js) |
| URL → object | [src/utilities/ac-search-params-to-object.js](../src/utilities/ac-search-params-to-object.js) | [theirs](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/utilities/ac-search-params-to-object.js) |
| Publications endpoint constant | [src/constants/endpoints.constants.js:19-26](../src/constants/endpoints.constants.js#L19-L26) | [theirs:17-23](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/constants/endpoints.constants.js#lines-17:23) |

### One side only

| File | Side | Notes |
|---|---|---|
| `src/components/ac-search-subjects/ac-search-subjects.js` | **Ours** | "Themes" filter renderer. |
| `src/components/ac-search-themes/ac-search-themes.js` | **Theirs** | Same role under a different name. |
| `src/molecules/con-facets-filters/con-facets-filters.js` (923 lines) | **Ours** | Dynamic facets-driven filter UI. |
| `src/molecules/con-active-filters/con-active-filters.js` | **Ours** | Active-filter chip row + "Wis alle filters" button. |
| `src/hooks/con-use-facet-name-resolution.js` | **Ours** | Resolves UUID bucket labels to human-readable names via the object store names cache. |
| `src/services/schemaCache.service.js` | **Ours** | Schema-id → slug map; primed during fetch. |
| `src/utilities/ac-map-publication.js` | **Theirs** | Result/single-publication shape normaliser. Wraps `get_single` and `all_publications` in their store. |

> **Correction to the CLAUDE.md initial recon.** The seed inventory has the names swapped: it lists `ac-search-subjects` as ours-only and `ac-search-themes` as ours-only, but the directories on disk are the opposite — **ours has `ac-search-subjects`, theirs has `ac-search-themes`**. Both are themes filters; only the directory/component name differs.

---

## 2. What's the same

The skeleton is the same — both render a `<AcSearchBox>` over a filters/results split, both use MobX (`withStore` + `observer`), both build the query from URL search params via `AcSearchParamsToObject`, both paginate with `<Pagination>` from `@amsterdam/design-system-react`.

- **`updateQuery` is called on every `location.search` change** ([ac-search.js:55-64](../src/views/ac-search/ac-search.js#L55-L64) | [theirs:64-67](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/views/ac-search/ac-search.js#lines-64:67)).
- **`searchAggregations` endpoint** is the same `Accept: application/json+aggregations` request against `PUBLICATIONS.SEARCH` ([publications.api.js:46-53](../src/api/publications.api.js#L46-L53) | [theirs:34-41](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/api/publications.api.js#lines-34:41)).
- **`PublicationsStore.toggleSearchArrayValue` / `setSort` / `resetSort` / `getSearchPageURL` / `category_checked` / `theme_checked` / `toggleMobileFilters` / `setQueryDate` / `resetSearchQuery`** have the same names and roles on both sides. Bodies have drifted (see §3).
- **Pagination component re-render trick** — both wrap `<Pagination>` in `useMemo([is_loading, pagination?.page])` for the same reason, with an identical inline comment ([ac-search.js:72-89](../src/views/ac-search/ac-search.js#L72-L89) | [theirs:73-90](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/views/ac-search/ac-search.js#lines-73:90)).
- **Mobile filter overlay shell** — `FocusLock`, escape-to-close, click-outside-to-close, `clsx('ac-search-filters', { open })`, "Filters" heading + close button + view-results button. Same shape on both sides ([ac-search-filters.js](../src/molecules/ac-search-filters/ac-search-filters.js) | [theirs](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/molecules/ac-search-filters/ac-search-filters.js)).
- **Search-results loading skeleton** — both render `Array.from({length: pagination?.limit || 15})` `<AcSearchResult skeleton />`s while `is_loading`.
- **No-results alert** — identical `<Alert type='info'>` block with `LABELS.NO_RESULTS` / `LABELS.REFINE_SEARCH`.

---

## 3. What differs

### 3.1 Backend contract — the deepest divergence

The two implementations talk to two different backends, and the entire search query, facet, and pagination shape follows from that.

| | Ours | Theirs |
|---|---|---|
| Endpoint | `/opencatalogi/api/publications` ([endpoints.constants.js:20](../src/constants/endpoints.constants.js#L20)) | `/api/publications` ([theirs:19](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/constants/endpoints.constants.js#lines-19)) |
| Backend | OpenCatalogi (Nextcloud app) | Conduction `${API_CONDUCTION}` (= `/api`) |
| Transport | `fetch()` with explicit `getAuthHeaders()` (Bearer → Basic fallback) + `credentials: 'include'` ([publications.store.js:32-64, 698-707](../src/stores/publications.store.js#L32-L707)) | Axios client via `Instance.Client.get` ([publications.api.js:10-13](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/api/publications.api.js#lines-10:13)) |
| Default query | `{ extend: 'themes', _limit: 20, _order: { _name: 'asc' } }` ([publications.store.js:11-17](../src/stores/publications.store.js#L11-L17)) | `{ _limit: 7 }` ([theirs:9-11](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/stores/publications.store.js#lines-9:11)) |
| Facets request | Separate `_facets=extend&_extend=_schema,_register&_limit=0` call in `fetchFacets` ([publications.store.js:464-604](../src/stores/publications.store.js#L464-L604)) | Folded into the main search via `aggregationsQuery = { _facets: { category: { type: 'terms' }, themes: { type: 'terms' } } }` ([theirs:64-73](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/stores/publications.store.js#lines-64:73)) |
| Result enrichment | `enrichPublications` swaps `@self.register/schema` IDs for full objects pulled from `response['@self'].registers/schemas` ([publications.store.js:606-661](../src/stores/publications.store.js#L606-L661)); names cache primed from `response['@self'].names` ([publications.store.js:716-740](../src/stores/publications.store.js#L716-L740)) | None — results passed through `acMapPublication` to alias `titel/beschrijving/samenvatting/tooiCategorieNaam` to `title/description/summary/category` ([ac-map-publication.js](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/utilities/ac-map-publication.js)) |
| Fuzzy / relevance | `_fuzzy=true` added automatically when `_search` is present, both in `fetchPublications` and `fetchFacets` ([publications.store.js:485-490, 684-687](../src/stores/publications.store.js#L485-L687)) | No fuzzy mode |
| Schema/register/names extends | `_extend=_schema,_register,_names` on every search ([publications.store.js:678-682](../src/stores/publications.store.js#L678-L682)) | None |
| Request cancellation | `publicationsAbortController` + `facetsAbortController`, cancelling in-flight requests on a new search ([publications.store.js:73-87, 466-474, 664-673](../src/stores/publications.store.js#L73-L673)) | None |
| `searchAggregations` query | `{ _queries: ['category', 'themes'] }` ([publications.store.js:131-133](../src/stores/publications.store.js#L131-L133)) | `_facets` object literal as above |

The two backends are not version-skew of the same API; they are different systems with different parameter conventions. Anything that talks to the wire layer (the store, the API class, the URL→object helper) follows.

### 3.2 URL ↔ store ownership

**Ours: URL is the source of truth.** Every filter mutation writes to `setSearchParams` directly inside the view/component, then a single `useEffect([location.search])` reads the URL back and calls `updateQuery(AcSearchParamsToObject(searchParams))` followed by `fetchPublications()` + `fetchFacets()` ([ac-search.js:54-64, 66-70, 91-100](../src/views/ac-search/ac-search.js#L54-L100)). `updateQuery` replaces the store query rather than merging:

```js
// publications.store.js:303-316
updateQuery = (query) => {
  const merged = { ...DEFAULT_SEARCH_QUERY, ...query };
  // Default to relevance sort when _search is present and no explicit order
  if (merged._search && !query._order) merged._order = { _relevance: 'desc' };
  this.query = merged;
};
```

**Theirs: store is the source of truth.** `setPage` / `setSearchQuery` / `setSort` mutate the store directly, and a `useEffect([search_query, ...published values])` then calls `navigate(getSearchPageURL())` to sync the URL ([theirs:55-61](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/views/ac-search/ac-search.js#lines-55:61)). Their `updateQuery` merges into the current store:

```js
// their publications.store.js:320-322
updateQuery = (query) => {
  this.query = { ...this.query, ...query };
};
```

Practical consequences:
- Ours: forward/back/bookmark/share fully roundtrip filter state, with no risk of store-vs-URL drift.
- Ours: filters added by users that don't appear in the URL parser get dropped on the next URL read — there's only one path in.
- Ours: every mutation does a full URL re-render. The `useMemo` on `<Pagination>` is the workaround.
- Theirs: simpler component code (just call setters), but two writers (URL and store) makes deep-linking and reset semantics fragile — note theirs unmounts the search view by calling `resetSearchQuery()` + `resetAggregations()` to avoid stale state on re-entry ([theirs:44-53](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/views/ac-search/ac-search.js#lines-44:53)). Ours doesn't need that.

### 3.3 Filter panel content

Both panels reuse the same shell (`<AcSearchFilters>` + `FocusLock` + mobile toggle), but **what is rendered inside** is different.

**Theirs** ([ac-search-filters.js:78-134](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/molecules/ac-search-filters/ac-search-filters.js#lines-78:134)): three hard-coded filter components — `<AcSearchDate />` always, `<AcSearchCategories />` if `all_categories?.length > 0`, `<AcSearchThemes />` if `all_themes?.length > 0`. That's the entire filter surface.

**Ours** ([ac-search-filters.js:96](../src/molecules/ac-search-filters/ac-search-filters.js#L96)): a single `<ConFacetsFilters />` ([molecules/con-facets-filters/con-facets-filters.js](../src/molecules/con-facets-filters/con-facets-filters.js), 923 lines) that builds the filter UI **from the API response**:

- Reads `all_facets` (set from the `fetchFacets` response) and `useFacetNameResolution(all_facets, object)` to resolve UUID labels to names.
- Each enabled facet (skip `enabled: false`, skip `date_histogram`) is rendered as a `<ConAccordion>` block with an internal `<Textbox>` filter and an `<AcCheckbox>` per bucket.
- Handles nested keys like `@self[schema]` and `@self[register]` via dedicated string-parse logic ([con-facets-filters.js:268-290](../src/molecules/con-facets-filters/con-facets-filters.js#L268-L290)).
- Implements **non-aggregated facets** that also toggle a `_schema` parameter alongside the value ([con-facets-filters.js:232-258](../src/molecules/con-facets-filters/con-facets-filters.js#L232-L258)).
- Adds **synthetic count-0 buckets** for active filters whose API bucket disappeared after another filter narrowed the result set ([con-facets-filters.js:292-346](../src/molecules/con-facets-filters/con-facets-filters.js#L292-L346)).
- Renders **active filter chips** via `<ConActiveFilters>` ([con-active-filters.js](../src/molecules/con-active-filters/con-active-filters.js)) — a chip per active value with a remove button, plus a "Wis alle filters" button that preserves `_search`.
- Disables unchecked facets while a new fetch is in flight ([con-facets-filters.js:66-67](../src/molecules/con-facets-filters/con-facets-filters.js#L66-L67)).

These are structurally different products. Ours is an OpenCatalogi facet renderer; theirs is a fixed Category+Theme+Date form. Adopting one for the other is not a small port.

### 3.4 Result-card switching

**Theirs** ([ac-search.js:131-133](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/views/ac-search/ac-search.js#lines-131:133)): every result is `<AcSearchResult {...publication} />`. One card variant.

**Ours** ([ac-search.js:133-282](../src/views/ac-search/ac-search.js#L133-L282)): switch on `publication['@self'].schema.slug` and render a softwarecatalogus-specific card per type — `product`/`module`/`organisatie` → `ConCardOrganisationApplication`, `moduleversie` → `ConCardModuleVersie`, `dienst` → `ConCardDienst`, `contactpersoon` → `ConCardContactpersoon`, `gebruik` → `ConCardGebruik`, `koppeling` → `ConCardKoppeling`. Unknown slug falls back to `AcSearchResult`. Titles/summaries pass through `extractTitle` / `extractSummary` / `ConUuidResolver` for inline UUID→name resolution.

This is **load-bearing for the softwarecatalogus surface**, which is on the in-flight `softwarecatalogus-performance` branch. Defer card-by-card analysis to the publication-cards category (#4).

### 3.5 Result card (`ac-search-result.js`)

Both implementations of the molecule render an `AcCard` with title/summary/badge/date/category meta and an arrow-right `AcLink`. Diffs:

| | Ours | Theirs |
|---|---|---|
| UUID resolution | Wraps title in `<ConUuidResolver>` ([ac-search-result.js:45-47, 79-81](../src/molecules/ac-search-result/ac-search-result.js#L45-L81)) | None |
| Text helpers | Title via `extractTitle()`, summary via `extractSummary()`, theme via `extractText()` ([ac-search-result.js:9-12, 58-75](../src/molecules/ac-search-result/ac-search-result.js#L9-L75)) | Plain `title` / `summary` / `themes[0]?.title` |
| Date field | `created` (and `acFormatDate(created, 'YYYY-MM-DD', 'DD MMMM YYYY', 'nl-NL')` with explicit locale) ([ac-search-result.js:67-71](../src/molecules/ac-search-result/ac-search-result.js#L67-L71)) | `published` (and `acFormatDate(published, 'YYYY-MM-DD', 'DD MMMM YYYY')` no locale) ([theirs:37-43](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/molecules/ac-search-result/ac-search-result.js#lines-37:43)) |
| Hide flags | `themes?.length > 0 ? StatusBadge + Ellipse` (always shown if present) | `hideCategory` / `hideThemes` / `hideEllipses` props for consumers that want a slimmer card ([theirs:14-19, 29-46](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/molecules/ac-search-result/ac-search-result.js#lines-14:46)) |
| Navigation target | `navigateTo` prop switches between `publication` / `beheer` / `view` via `NAVIGATE_TO` constants ([ac-search-result.js:26-37](../src/molecules/ac-search-result/ac-search-result.js#L26-L37)) | Hardcoded `NAVIGATE_TO.PUBLICATION(id)` |
| Layout | Flat `Heading` → `Paragraph` → `AcFlex meta` | Wrapped in `AcFlex column justifyContent='between' blockSize='full'` for fixed-height card behaviour ([theirs:22-54](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/molecules/ac-search-result/ac-search-result.js#lines-22:54)) |
| Commented-out feature | Relevance-score `StatusBadge` block left commented in source ([ac-search-result.js:39-57](../src/molecules/ac-search-result/ac-search-result.js#L39-L57)) | — |

### 3.6 `ac-search-box.js`

| | Ours | Theirs |
|---|---|---|
| State seed | `useState(defaultValue \|\| '')` ([ac-search-box.js:26](../src/components/ac-search-box/ac-search-box.js#L26)) | `useState('')` — ignores `defaultValue` for state ([theirs:24](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/components/ac-search-box/ac-search-box.js#lines-24)) |
| Auto-search | Debounced 300 ms `useEffect` triggers `onSubmitCallback` ([ac-search-box.js:32-68](../src/components/ac-search-box/ac-search-box.js#L32-L68)), with `disableAutoSearch` opt-out and first-render skip | None — submit-on-form-submit only |
| Label markup | `<FormLabel>` (Utrecht) ([ac-search-box.js:111](../src/components/ac-search-box/ac-search-box.js#L111)) | Raw `<label for=…>` ([theirs:62-64](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/components/ac-search-box/ac-search-box.js#lines-62:64)) — note `for=` in JSX is invalid; should be `htmlFor` |
| Heading wrapping | Title wrapped in `<div className='ac-search-box__title-wrapper'>` if present | Title rendered bare |
| Visual class | `<VISUALS.SEARCH className='ac-search-box__search-icon' />` | `<VISUALS.SEARCH />` |

### 3.7 `ac-search-sort.js`

Same component shape, but different sort options and a different URL/store write path.

| | Ours | Theirs |
|---|---|---|
| Options | `relevance` / `created asc` / `created desc` / `name asc` / `name desc` (5 active, debug `relevance asc` commented) ([ac-search-sort.js:66-96](../src/components/ac-search-sort/ac-search-sort.js#L66-L96)) | `default` (relevance — no `selected` flag) / `@self.published asc` / `@self.published desc` (3) ([theirs:44-58](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/components/ac-search-sort/ac-search-sort.js#lines-44:58)) |
| URL write | Writes `_order[_${key}]` directly to `searchParams`, also strips other `_order[*]` keys and resets `_page=1` ([ac-search-sort.js:28-55](../src/components/ac-search-sort/ac-search-sort.js#L28-L55)) | Calls `setSort(...value)` on the store and relies on the store→URL sync ([theirs:26-34](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/components/ac-search-sort/ac-search-sort.js#lines-26:34)) |
| Underscore prefix | Sort keys carry `_` (`_name`, `_created`, `_relevance`) reflecting the OpenCatalogi metadata convention | Plain key, plus the dotted `@self.published` |

### 3.8 `ac-search-date.js`

Both render two date inputs and bind to `setQueryDate` / `search_query.published`. Diffs:

| | Ours | Theirs |
|---|---|---|
| Date control | `<DateInput>` from `@amsterdam/design-system-react` ([ac-search-date.js:6, 62-69](../src/components/ac-search-date/ac-search-date.js#L6-L69)) | `<AcFormField type='date'>` (our own form-field molecule) with `checkValidity` ([theirs:54-78](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/components/ac-search-date/ac-search-date.js#lines-54:78)) |
| Apply pattern | Apply-on-`onBlur` + apply-on-Enter ([ac-search-date.js:67-78](../src/components/ac-search-date/ac-search-date.js#L67-L78)) | Apply via a `<SecondaryActionButton>` "Filter op datum" ([theirs:80-82](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/components/ac-search-date/ac-search-date.js#lines-80:82)) |
| Date format | `dd-mm-yyyy` (en suffix on Heading) | `dd-mm-jjjj` (Dutch — `jjjj` = `yyyy`) |
| Param shape (store) | `query.published[after]` / `query.published[before]` ([publications.store.js:286-300](../src/stores/publications.store.js#L286-L300)) | `query['@self'].published[gte]` / `query['@self'].published[lte]` ([theirs:308-317](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/stores/publications.store.js#lines-308:317)) |
| Validity feedback | Local `errors` state but no inline error text rendered | `invalidLabel` prop with descriptive validation message + `min`/`max` cross-bound between the two inputs |
| Default-value parsing | Inline `defaultValue(isoDate)` formatter to render `dd-mm-yyyy` | Reads ISO and slices to `YYYY-MM-DD` for the native date input |

The `after/before` vs `gte/lte` and `published` vs `@self.published` mismatches are visible in the URL — neither side has both, so this is a clean fork in URL conventions.

### 3.9 `ac-search-categories.js`

Both render a count list of category checkboxes plus an explainer modal. Diffs:

| | Ours | Theirs |
|---|---|---|
| Source data | `all_categories` (computed off `publications.categories`, populated by `fetchAggregations`) ([publications.store.js:153-156](../src/stores/publications.store.js#L153-L156)) | `categories_with_facets` (computed: aggregations × current facet counts) ([theirs:108-118](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/stores/publications.store.js#lines-108:118)) |
| Bucket fields | `category._id` / `category.count` ([ac-search-categories.js:76-80](../src/components/ac-search-categories/ac-search-categories.js#L76-L80)) | `category.key` / `category.results` ([theirs:107-115](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/components/ac-search-categories/ac-search-categories.js#lines-107:115)) |
| Modal content | 5 paragraphs (Convenant, Bestuursstuk, Woo-verzoek, Raadstuk, Organisatiegegevens) ([ac-search-categories.js:23-50](../src/components/ac-search-categories/ac-search-categories.js#L23-L50)) | 11 paragraphs (Bestuursstukken, Raadsstukken, Jaarplannen, Woo-dossiers, Organisatie-/bereikbaarheidsinformatie, Convenanten, Beschikkingen, Adviezen, Klachten, Onderzoeksrapporten, Wet- en regelgeving) ([theirs:23-94](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/components/ac-search-categories/ac-search-categories.js#lines-23:94)) |
| Modal heading level | `<strong>` + `<br/>` plain text | `<Heading5>` per item |
| Help icon | `AcCheckIfSpecificHostname()` swaps icon — VNG vs default ([ac-search-categories.js:61-68](../src/components/ac-search-categories/ac-search-categories.js#L61-L68)) | Static icon |
| Categories list element | Flat list, no `<ul>` wrapper | Wrapped in `<AcFlex as='ul' column>` ([theirs:106](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/components/ac-search-categories/ac-search-categories.js#lines-106)) |
| Last-item link | Last paragraph has `<AcLink to='/contact'>` | — |

Theirs' modal is more accurate to the official Woo categorisation; ours' is paraphrased Conduction-style.

### 3.10 Themes filter component (`ac-search-subjects.js` ours / `ac-search-themes.js` theirs)

Both render a list of `<AcCheckbox>` themes.

| | Ours (`ac-search-subjects`) | Theirs (`ac-search-themes`) |
|---|---|---|
| Source | `themes.all_themes` + `themes.fetchThemes()` on mount ([ac-search-subjects.js:10-16](../src/components/ac-search-subjects/ac-search-subjects.js#L10-L16)) | `publications.all_themes` + `publications.all_theme_facets` (no separate themes store call) ([theirs:10-13](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/components/ac-search-themes/ac-search-themes.js#lines-10:13)) |
| Result count | Not shown | `useMemo`-merges `all_theme_facets` to attach `results` count to each theme ([theirs:14-20](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/components/ac-search-themes/ac-search-themes.js#lines-14:20)), passes as `count` |
| Checkbox value | `theme.value`, but `theme_checked(theme.id)` and `toggleSearchArrayValue('themes', theme.id)` ([ac-search-subjects.js:22-29](../src/components/ac-search-subjects/ac-search-subjects.js#L22-L29)) — note `value` ≠ `id`, possibly a bug | `theme.key` for all three ([theirs:30-34](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/components/ac-search-themes/ac-search-themes.js#lines-30:34)) |
| Heading label | `LABELS.THEMES` | `LABELS.THEMES_BUTTON` |
| Component name | `AcSearchSubjects` (file: `ac-search-subjects`) | `AcSearchThemes` (file: `ac-search-themes`) |

**Heads-up on a probable ours-side bug**: in [ac-search-subjects.js:25-28](../src/components/ac-search-subjects/ac-search-subjects.js#L25-L28) the `<AcCheckbox>` `value={theme.value}` is passed for display but `theme_checked(theme.id)` and `toggleSearchArrayValue('themes', theme.id)` reference `theme.id`. If `theme.value` and `theme.id` aren't the same field on the theme object (and the themes store doesn't guarantee they are — see [themes.store.js:87-94](../src/stores/themes.store.js#L87-L94) which doesn't add `value`), the checkbox check state won't match the URL value. Worth confirming in code or runtime.

### 3.11 `ac-search-filter.js` (the unrelated inline filter, used by glossary/themes)

Same component, used as a free-form text filter on pages that aren't the main search (e.g. glossary). Diffs are surface only:

- Theirs uses `<label for=…>` (JSX invalid) vs ours' `<FormLabel htmlFor=…>` ([ac-search-filter.js:42](../src/components/ac-search-filter/ac-search-filter.js#L42) | [theirs:41](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/components/ac-search-filter/ac-search-filter.js#lines-41)).
- Theirs places the result-count message inside an `aria-live='polite'` container; ours places it outside the form with no live region ([theirs:55-69](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/components/ac-search-filter/ac-search-filter.js#lines-55:69) | [ac-search-filter.js:57-66](../src/components/ac-search-filter/ac-search-filter.js#L57-L66)).
- Ours' default placeholder uses formal "Waar bent u…" — theirs uses informal "Waar ben je…".
- Ours imports `React` (unused since the new JSX transform); theirs doesn't.

### 3.12 Single publication enrichment (publications.store.js)

The `fetchPublication` divergence is large because of the OpenCatalogi shape:

- **Ours** ([publications.store.js:787-944](../src/stores/publications.store.js#L787-L944)) does extensive normalisation:
  - Moves `@self.schemas[uuid] -> @self.schema` and `@self.registers[uuid] -> @self.register`, handling 4 different shapes (schema present as ID + schemas object; schema absent + schemas present; etc.).
  - Primes the `schemaCache` service with `id -> slug` mappings for fast facet-label resolution.
  - Calls `app.store.object.processRelatedNamesFromResponse(response)` to populate the names cache.
  - Normalises Axios errors into a `{ status, statusText, code, message, raw }` shape with 404/401/403/500 message defaults.
  - Logs every step under `console.group`.
- **Theirs** ([theirs:441-474](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/stores/publications.store.js#lines-441:474)) does one thing: HEAD-requests every attachment to populate `attachment.size`. No schema/register normalisation, no error shaping.

`extend` params also diverge: ours requests `_extend=_schema,_register,themes,contactpersoon,compliancy` ([endpoints.constants.js:21](../src/constants/endpoints.constants.js#L21)); theirs requests `extend[]=themes&extend[]=catalog` ([their endpoints.constants.js:20-21](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/constants/endpoints.constants.js#lines-20:21)).

### 3.13 Themes store

| | Ours | Theirs |
|---|---|---|
| Default query | `{}` ([themes.store.js:46](../src/stores/themes.store.js#L46)) | `{ extend: 'all' }` ([theirs:7-9](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/stores/themes.store.js#lines-7:9)) |
| Sort | `sort` field then `title.localeCompare` ([themes.store.js:81-86](../src/stores/themes.store.js#L81-L86)) | `title.localeCompare` only ([theirs:34-35](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/stores/themes.store.js#lines-34:35)) |
| Filter | `filter(theme && theme.title && typeof title === 'string')` — guards against missing titles ([themes.store.js:78-79](../src/stores/themes.store.js#L78-L79)) | `filter(theme.image !== null)` — drops themes without images ([theirs:41](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/stores/themes.store.js#lines-41)) |
| Mapping | Sets `paragraph`, `summary`, `linkTitle`, `linkUrl`, `isExternal` ([themes.store.js:87-94](../src/stores/themes.store.js#L87-L94)) | Sets `paragraph`, `linkTitle` ([theirs:36-39](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/stores/themes.store.js#lines-36:39)) |
| Mock data | `MOCK_THEMES` constant + feature-flag (`containerConfig.isFeatureEnabled('mock_themes')`) check before any API call + mock fallback on API error ([themes.store.js:17-42, 124-156](../src/stores/themes.store.js#L17-L156)) | None |

Ours' mock-themes machinery is wired to the runtime container-config layer (see dependencies analysis §3.7). The fallback-on-error path is also ours-only.

### 3.14 Side observations

- **Console logging.** Ours' `publications.store.js` is heavily instrumented with `console.group` / `console.info`: every `setQueryDate`, `setSort`, `toggleSearchArrayValue`, `fetchPublications`, `fetchFacets`, `fetchPublication`, `enrichPublications` writes a debug block ([publications.store.js:287-299, 340-347, 351-376, 498-501, 692-695, 793-906](../src/stores/publications.store.js#L287)). Theirs has none. These should be guarded behind a debug flag or stripped in production builds.
- **`con-facets-filters.js` debug log** at [con-facets-filters.js:524-539](../src/molecules/con-facets-filters/con-facets-filters.js#L524-L539) runs `console.group` every render whenever facets are populated — also a noise/perf concern.
- **Lodash dependency.** `con-facets-filters.js` imports the entire lodash bundle via `import _ from 'lodash'` ([con-facets-filters.js:11](../src/molecules/con-facets-filters/con-facets-filters.js#L11)). Worth checking if it's actually used (a `grep` inside this file is the right next step before drawing conclusions). Theirs has no lodash usage in the search system.
- **`<SkipLink>` accessibility helper.** Theirs adds `<SkipLink href='${pathname}#search-results'>Ga direct naar zoekresultaten</SkipLink>` ([theirs:149-151](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/views/ac-search/ac-search.js#lines-149:151)). Ours has no SkipLink. Note that ours reorders DOM so results come first in tab order anyway ([ac-search.js:298-322](../src/views/ac-search/ac-search.js#L298-L322)) — solves the same concern differently.
- **Mobile dialog role.** Theirs sets `role='dialog'` on the filter overlay when on mobile via `useIsMobile()` ([their ac-search-filters.js:64-71, 85](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/molecules/ac-search-filters/ac-search-filters.js#lines-64:85)). Ours doesn't. There's no `useIsMobile` hook in ours' `src/hooks/`.
- **Latest publications.** Theirs has `fetchLatestPublications` + `latest_items` + `latest_publications` (featured-first with recent fallback) — used by their home view. Ours has no such pathway in this store; if our home view shows latest items, it's via a different store/source.
- **Cleanup on unmount.** Theirs unmounts call `resetSearchQuery() + resetAggregations()`; ours does not. Tied to §3.2 ownership model.

---

## 4. Only in ours

Inventory of search-system additions on our side. All are tied to the OpenCatalogi/Conduction backend or the softwarecatalogus surface unless flagged otherwise.

- **`molecules/con-facets-filters/con-facets-filters.js`** (923 lines) — dynamic facets-driven filter UI. **Load-bearing for OpenCatalogi search.** Built around the `facets/facetable` response shape; can't run on theirs' aggregations response without rewrite.
- **`molecules/con-active-filters/con-active-filters.js`** — active-filter chip row + "Wis alle filters" button with UUID resolution via `ConUuidResolver`. Used by `ConFacetsFilters`.
- **`hooks/con-use-facet-name-resolution.js`** (`useFacetNameResolution`) — resolves UUID labels in facet buckets via the object store names cache. Used only by `ConFacetsFilters`.
- **`services/schemaCache.service.js`** — schema id → slug LRU/map; primed in `fetchPublication` and `fetchFacets`, read in `ConFacetsFilters.getBucketLabel`. **Load-bearing for fast facet-label render.**
- **Type-specific result cards** referenced in `ac-search.js`: `ConCardOrganisationApplication`, `ConCardModuleVersie`, `ConCardDienst`, `ConCardContactpersoon`, `ConCardGebruik`, `ConCardKoppeling`. **Load-bearing for softwarecatalogus.** Card analyses deferred to category #4.
- **`enrichPublications` + names-cache priming** in `publications.store.js` ([:606-661, 716-740](../src/stores/publications.store.js#L606-L740)) — pulls full register/schema objects out of the response's `@self.registers/schemas` map and inlines them on each result; populates the names cache from `@self.names` or by fallback `extractReferenceIdsFromCollection`.
- **`fetchRelations` + `fetchUsed`** + `get_relations` / `get_used_data` ([publications.store.js:946-974](../src/stores/publications.store.js#L946-L974)) — used by the softwarecatalogus card variants.
- **`getAuthHeaders()` helper** + `getCookie('nextcloud_access_token')` Bearer path + `window.app.store.user.basicAuthCredentials` Basic fallback ([publications.store.js:32-64](../src/stores/publications.store.js#L32-L64)). **Load-bearing for authenticated search** — cross-link the App-entry analysis §3.1 note about `window.app = { store }`.
- **`publicationsAbortController` / `facetsAbortController`** ([:73-87, 466-474, 664-673](../src/stores/publications.store.js#L73-L673)) — request cancellation. Worth keeping; no equivalent in theirs.
- **`is_facets_loading` / `facetsLoading` separate state** — facets fetch is independent of publications fetch, so loading skeletons can be independent.
- **`fetchPublication` schema/register normaliser** + Axios error normaliser ([:787-944](../src/stores/publications.store.js#L787-L944)). Tied to the OpenCatalogi response shape.
- **Mock-themes path** in themes store ([:17-42, 124-156](../src/stores/themes.store.js#L17-L156)) — feature-flag gated, with API-error fallback.
- **Debounced auto-search** in `AcSearchBox` ([:32-68](../src/components/ac-search-box/ac-search-box.js#L32-L68)). UX upgrade not tied to either backend.
- **`AcCheckIfSpecificHostname()` icon swap** in `AcSearchCategories` ([:63-67](../src/components/ac-search-categories/ac-search-categories.js#L63-L67)) — multi-tenant.
- **`MIJN_OMGEVING`, `AANGEBODEN_GEBRUIK`, `OPENCONNECTOR`** API surfaces in `endpoints.constants.js` ([:14-30, 60-71](../src/constants/endpoints.constants.js#L14-L71)) — adjacent endpoints, defer to API category.
- **DOM/tab-order reorder** in `ac-search.js` (results first, filters second) ([:298-322](../src/views/ac-search/ac-search.js#L298-L322)) — keyboard accessibility.

Searched theirs for equivalents of each of the above by reading the directory listing + `publications.store.js` / `themes.store.js` / `ac-search-filters.js`; none found except the placeholder `acMapPublication` for shape normalisation.

---

## 5. Only in theirs

- **`utilities/ac-map-publication.js`** — single-publication / search-result shape normaliser, aliases Dutch field names (`titel`/`beschrijving`/`samenvatting`/`tooiCategorieNaam`) to English. Wraps `get_single` and `all_publications`.
- **`<SkipLink>` to `#search-results`** in `ac-search.js` — accessibility.
- **`role='dialog'` + `useIsMobile()`** on the filter overlay.
- **`fetchLatestPublications` + `latest_items` + `latest_publications`** — featured-first home-page feed (used by their Home view, out of scope here).
- **`categories_with_facets` computed** — merges aggregation categories with current category-facet counts so the categories component can show live counts.
- **11-category explainer modal text** — accurate to the official Woo categorisation, with `<Heading5>` per item.
- **Apply-button date filter** — explicit "Filter op datum" button vs ours' apply-on-blur.
- **`@self.published.gte / lte`** URL convention for date filters.
- **Cleanup-on-unmount** (`resetSearchQuery() + resetAggregations()`).
- **`hideCategory` / `hideThemes` / `hideEllipses`** props on `AcSearchResult` — slimmer card for non-search consumers.
- **`AcFlex column blockSize='full'`** layout on the result card — even-height card grid.

---

## 6. Per-item recommendations

| # | Item | Recommendation | Notes |
|---|---|---|---|
| 1 | Backend / endpoint divergence (`/opencatalogi/api/publications` vs `/api/publications`) | **keep ours** | Theirs targets a different backend. No path to "merge". |
| 2 | URL-as-source-of-truth vs store-as-source-of-truth | **keep ours** | Ours' model is strictly better for deep-linking, sharing, back/forward — and removes the need for theirs' unmount-cleanup workaround. |
| 3 | `con-facets-filters.js` dynamic facets system | **keep ours** | Required by OpenCatalogi. Theirs' static Category+Theme+Date panel cannot express our schema/register/non-aggregated facets. |
| 4 | `con-active-filters.js` chip row | **keep ours** | Material UX upgrade over theirs' no-chips model. |
| 5 | Type-specific result-card switch in `ac-search.js` | **keep ours** | Load-bearing for softwarecatalogus. Deeper card-by-card review in category #4. |
| 6 | `ConUuidResolver` + `extractTitle/extractSummary` in `AcSearchResult` | **keep ours** | Required because backend returns UUIDs for related entities; theirs' API returns flat strings. |
| 7 | Debounced auto-search in `AcSearchBox` | **keep ours** | UX upgrade, backend-neutral. Theirs would benefit from it but porting up is out of scope. |
| 8 | `AcSearchBox` state seeded from `defaultValue` | **keep ours** | Theirs' `useState('')` ignoring `defaultValue` is a bug on their side; ours already handles it. |
| 9 | `enrichPublications` + names cache + schema cache | **keep ours** | Load-bearing for OpenCatalogi response shape. |
| 10 | `AbortController` cancellation for in-flight requests | **keep ours** | Prevents stale renders on rapid filter changes. No reason to drop. |
| 11 | `is_facets_loading` separate from `is_loading` | **keep ours** | Independent skeletons; ours fetches publications then facets, so a single flag would block the page on the slower call. |
| 12 | `getAuthHeaders()` Bearer→Basic fallback | **keep ours** | Cross-linked to App-entry §3.1 (`window.app`). Tied to our auth model — see [D-007](DECISIONS.md#d-007). |
| 13 | `_fuzzy=true` auto-injection when `_search` is set | **keep ours** | Backend-specific feature; toggling off would silently degrade relevance. |
| 14 | `_extend=_schema,_register,_names` on every search | **keep ours** | Required by ours' result-card switch and active-filter UUID resolution. |
| 15 | Default sort `_name:asc` vs theirs' nothing | **keep ours** | Stable default sort prevents an "every refresh re-orders" UX bug. Defaulting to relevance when `_search` is present is good. |
| 16 | URL convention: `published[after/before]` (ours) vs `@self.published[gte/lte]` (theirs) | **keep ours** | Tied to the OpenCatalogi backend. Note: ours' convention should be confirmed against the OpenCatalogi `facetable` config — see [D-008](DECISIONS.md#d-008). |
| 17 | Mock-themes feature-flag path + API-error fallback in `themes.store.js` | **keep ours** | Used by local-dev / preview builds. |
| 18 | Multi-tenant icon swap (`AcCheckIfSpecificHostname`) in categories modal | **keep ours** | Same multi-tenant rationale as App-entry analysis §3.5. |
| 19 | DOM/tab-order reorder (results first) in `ac-search.js` | **keep ours** | A11y improvement; better than theirs' SkipLink hack because it also benefits non-screen-reader keyboard users. |
| 20 | Theirs' `<SkipLink>` to `#search-results` | **adopt theirs (additive)** | DOM reorder helps tab users, but a SkipLink also helps screen-reader users who can't see the layout. Adopt the SkipLink **alongside** our DOM order, anchored at the same `<AcFlex id='search-results'>` target. Low risk, ~5 lines. |
| 21 | Theirs' apply-button date filter | **adopt theirs (UX call)** | Apply-on-blur is fast but easy to fire accidentally when the user tabs through. Explicit "Filter op datum" is clearer. → [D-009](DECISIONS.md#d-009). |
| 22 | Theirs' `min`/`max` cross-binding on the two date inputs | **adopt theirs** | Prevents users entering a `before` date earlier than `after`. Self-contained UI improvement. |
| 23 | Theirs' 11-paragraph categories modal text | **adopt theirs** *(content)* | Theirs' text is closer to the official Woo categorisation. The Conduction-paraphrased version in ours predates the upstream rewrite. Content change only — no API impact. → [D-010](DECISIONS.md#d-010). |
| 24 | Theirs' `categories_with_facets` computed | **consider merging** | Our `all_categories` is computed off `searchAggregations`, not the live facet response. Adding a `categories_with_facets`-style merge would let the UI show **how many results each category currently has under the active filters**, like theirs does. Low-risk computed property. → [D-011](DECISIONS.md#d-011). |
| 25 | Theirs' result-card flex layout (`blockSize='full'`) | **consider adopting** | Even-height result cards look better when summaries vary in length. Pure CSS, low-risk. |
| 26 | Theirs' `hideCategory` / `hideThemes` / `hideEllipses` props | **consider adopting** | Useful for the type-specific card fallbacks ours does — saves a `flag` prop on each. Defer until a concrete need emerges. |
| 27 | Heavy `console.group` / `console.info` instrumentation in `publications.store.js` | **clean up** | Guard behind a debug flag or strip in prod. Currently logs on every keystroke through the debounced auto-search. Same applies to `con-facets-filters.js:524-539`. → [D-012](DECISIONS.md#d-012). |
| 28 | `import _ from 'lodash'` in `con-facets-filters.js` | **clean up** | Confirm with `grep "_\." con-facets-filters.js` whether lodash is actually used. If not, drop. If yes, swap to a named import (`import { foo } from 'lodash'`) to avoid a 70 KB bundle hit. |
| 29 | `commented-out` relevance-score badge in `ac-search-result.js` | **clean up** | Either ship it (with the rank %) or delete the block. Dead-comment rot. |
| 30 | Possible `theme.id` / `theme.value` mismatch in `ac-search-subjects.js` | **investigate, fix if real** | See §3.10 — `<AcCheckbox value={theme.value}>` paired with `theme_checked(theme.id)` is suspicious. Test that checking a theme actually re-renders as checked. If buggy, normalise on `theme.id`. → [D-013](DECISIONS.md#d-013). |
| 31 | `LABELS.THEMES` (ours) vs `LABELS.THEMES_BUTTON` (theirs) | **defer to constants/labels category** | Naming-only; resolve when that category gets a sweep. |
| 32 | Component file naming — ours' `ac-search-subjects` vs theirs' `ac-search-themes` | **needs decision** | Behaviour and store keys both call this "themes" (the filter writes to `query.themes`). Filename should match. Either rename ours' file/component back to `ac-search-themes` for clarity, or keep `subjects` if there's a real domain distinction in our model. → [D-014](DECISIONS.md#d-014). |
| 33 | Theirs' `<Route path='*'>` 404 (cross-link App-entry §3.2) | n/a | Out of scope for search; noted because the catch-all decides what happens if `/zoeken` is mistyped. |
| 34 | Cleanup-on-unmount (`resetSearchQuery()`) in theirs | **adopt nothing** | We don't need it (URL is source of truth) and pulling it in would clear the URL state on every back-button. |
| 35 | `fetchLatestPublications` (theirs) | **defer to home/public views category** | Used by their home, not their search; cross-link there. |
| 36 | `acMapPublication` Dutch→English alias mapper (theirs) | **adopt nothing** | OpenCatalogi returns English field names already; the mapper would be a no-op in our world. |
| 37 | `useIsMobile` + `role='dialog'` on filter overlay (theirs) | **adopt theirs** | A11y improvement. `useIsMobile` is small (likely 5 lines, matchMedia-based); port it as a hook in our `src/hooks/`. |
| 38 | Theirs' `<Heading5>` per-paragraph in modal vs ours' `<strong>` | **adopt theirs** | NLDS-aligned. Tied to the modal text change in #23. |
| 39 | Theirs' raw `<label for=…>` (invalid JSX) | **adopt nothing** | Theirs has a bug here. Ours' `<FormLabel htmlFor=…>` is correct. |
| 40 | Theirs' `<AcFlex as='ul' column>` wrapper around checkbox list | **adopt theirs** | Trivially better semantically — a list of checkboxes is a list. Apply across `AcSearchCategories` and `AcSearchSubjects`. |

---

## 7. Category verdict

**`mixed`** — overwhelmingly **`keep-ours`** for everything tied to the OpenCatalogi backend, dynamic facets, URL-as-source-of-truth, request cancellation, type-specific result cards, name resolution, and the softwarecatalogus card flows. A handful of **`adopt-theirs`** items, all additive and bounded:

- **A11y:** SkipLink (#20), `useIsMobile` + `role='dialog'` (#37), `<ul>` wrapper on checkbox lists (#40).
- **UX polish:** explicit apply-button date filter + min/max cross-binding (#21–22), `categories_with_facets`-style live counts (#24), even-height card layout (#25).
- **Content:** the 11-paragraph categories explainer (#23, #38).

Plus **internal cleanups** independent of theirs: debug-log noise (#27), lodash bundle audit (#28), commented-out relevance badge (#29), `theme.id`/`theme.value` mismatch (#30).

Nothing here merits a category-wide "merge" verdict — the architecture has diverged too far. But a small set of polish items (~6 of the 40) can be lifted cleanly from theirs without disturbing ours' backend contract.

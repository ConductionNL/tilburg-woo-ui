# Analysis: State Management / Stores

## Branches Compared
- Ours (tilburg-woo-ui): `softwarecatalogus-performance`
- Acato (tilburg-woo-ui_acato): `main`

## Files Compared

**Both:**
- `src/stores/index.js`
- `src/stores/store.js`
- `src/stores/faqs.store.js`
- `src/stores/pages.store.js`
- `src/stores/publications.store.js`
- `src/stores/themes.store.js`

**Ours only:**
- `src/stores/auth.store.js`
- `src/stores/authentication.store.js`
- `src/stores/chat.store.js`
- `src/stores/gemma.store.js`
- `src/stores/glossary.store.js`
- `src/stores/menu.store.js`
- `src/stores/mijnOmgeving.store.js`
- `src/stores/object.store.js`
- `src/stores/toasters.store.js`
- `src/stores/user.store.js`

**Acato only:**
- `src/stores/categories.store.js`
- `src/stores/terms.store.js`

Detailed analysis of stores that belong primarily to other feature categories (auth, beheer, chat/gemma, glossary, user account, navigation) is deferred to those category analysis files. This file focuses on the shared MobX architecture, the diverged shared stores, and the Acato-only stores.

---

## What is the same

### `faqs.store.js` — byte-for-byte identical
Same imports, same observables (`items`, `loading`), same `is_loading` / `all_faqs` computeds (with `AcSanitizeHtml`), same `fetchFaqs` action. No action needed.

### Overall MobX architecture
Both repos share the same architectural pattern across all stores (with a couple of minor exceptions noted below):

- Class-based stores with `@observable` / `@computed` / `@action` decorators via `makeObservable(this)`
- A `let app = {}` module-level variable used to stash a reference to the root store inside `constructor(store)` (so non-action methods can call `app.store.api.<x>`)
- Composition via a single root `Store` class in `store.js` that instantiates each child store with `this`
- React integration via `StoreContext` + `useStore()` + `withStore(Component)` HOC in `index.js`

Acato's `terms.store.js` is the only outlier — it uses the modern `makeAutoObservable` pattern with bound methods (no decorators). Worth noting if we ever adopt it.

### `index.js` — near identical
Both export the same `StoreContext`, `useStore`, `withStore` HOC, and a default factory `(config) => new Store(config)`.

The only differences in ours:
1. Imports `React` explicitly (Acato relies on the JSX transform).
2. Assigns the forwardRef to a named `WrappedComponent` and sets `WrappedComponent.displayName` for better React DevTools output.

This is a small improvement worth keeping in ours; not worth backporting.

---

## What differs (shared files)

### `store.js` — root store

| Stores wired up | Ours | Acato |
|---|---|---|
| `publications` | ✅ | ✅ |
| `faqs` | ✅ | ✅ |
| `pages` | ✅ | ✅ |
| `themes` | ✅ | ✅ |
| `auth`, `user`, `toasters`, `menu`, `authentication`, `mijnOmgeving`, `gemma`, `object`, `chat`, `glossary` | ✅ | — |
| `categories`, `terms` | — | ✅ |

Other differences:
- Acato wraps `new TermsStore(this)` in a `try/catch` (defensive — suggests the terms API may not always be available).
- Acato's `handleSWCacheReady` is a no-op; ours fires a `toasters.add(...)` info toast announcing cache readiness in Dutch.

**Recommendation:** Keep our wiring. If we adopt Acato's `terms` concept (see "Only in Acato's" below), we'd add it here.

---

### `pages.store.js` — pages store

Acato is the minimal baseline (~90 lines): observables for `items` / `single` / `loading`, computeds for `all_pages` and `get_single`, and `fetchPage` / `fetchPages` actions that simply call the API and set `response.data`.

Ours (~280 lines) adds three things on top of the same skeleton:

1. **Authentication-aware page filtering** — `getFilteredPages(userIsAuthenticated)` computed + `shouldShowPage(page, userIsAuthenticated)` action. Filters out pages with `hideBeforeLogin` / `hideAfterLogin` flags. Tied to our auth system (which Acato lacks).
2. **HTML-instead-of-JSON detection** — checks every response body for `<!doctype html>` / `<html`; if found, treats it as a server misconfiguration and falls back to a hardcoded "Home" page object. Catch block also returns the fallback on any error.
3. **Hardcoded fallback page data** — full `@self`-shaped objects with a fixed UUID (`e4b0c8f2-...`) and "Fallback gods" owner, used both in `fetchPage` and `fetchPages`.

**Recommendation:** Keep ours. Acato has no auth system to filter against, and the fallback behaviour is specific to our deployment. Acato has nothing to backport here.

---

### `publications.store.js` — publications store (heavily diverged)

This is the most diverged file in the entire repo comparison done so far. The skeleton (observables for `items` / `single` / `pagination` / `query`, `toggleSearchArrayValue` / `setPage` / `setSort` etc.) is recognisably the same, but the data flow underneath is very different.

#### Ours

- `LIMIT = 20`, default `_order: { _name: 'asc' }`, default `extend: 'themes'`.
- **Custom `fetch()` calls, not the `api.publications.search()` axios wrapper.** `fetchPublications` and `fetchFacets` build URLs directly against `commongroundApiUrl()/opencatalogi/api/publications`, supply auth headers via a local `getAuthHeaders()` helper (Bearer token from `nextcloud_access_token` cookie, fallback to basic auth from `user.basicAuthCredentials`).
- **`AbortController` for both publications and facets fetches.** Cancels in-flight requests when a new one starts (search-as-you-type race-condition prevention).
- **New facets API model** — `fetchFacets` requests `_facets=extend` and `_extend=_schema,_register`, then walks `response.facets` (object keyed by facet name with `{ enabled, type, title, queryParameter, data: { buckets } }`). Skips disabled facets and `date_histogram` facets. Groups `_`-prefixed facets under an `@self` namespace.
- **Schema/register normalization** — `fetchPublication` rewrites `@self.schemas[uuid]` → `@self.schema` and `@self.registers[uuid]` → `@self.register`, caching slugs in `schemaCache.service` for later lookup. Falls back to first schema in the map if no explicit schema id present.
- **Names cache integration** — extracts `response['@self'].names` / `response.relatedNames` and pushes into `object.store`'s `namesCache` for UUID → label resolution across the app. Falls back to scanning result objects with `extractReferenceIdsFromCollection` if the names payload is missing.
- **Fuzzy search** — adds `_fuzzy=true` whenever `_search` is present, and switches default sort to `_relevance` desc on first search.
- **Normalized error object on single fetch** — `setError({ status, statusText, code, message, raw })` with Dutch messages for 401/403/404/500 (consumed by the error-handling category for fallback pages).
- **`runInAction` batching** — wraps the final state update in `fetchPublications` so observers re-render once.
- Extensive `console.group` / `console.info` debug logging throughout.

#### Acato

- `LIMIT = 7`, no default sort, empty `defaultQuery`.
- **Uses `api.publications.search()`** (the axios wrapper) and the older facets shape — `response.facets.category.buckets` / `response.facets.themes.buckets`, with `_facets: { category: { type: 'terms' }, themes: { type: 'terms' } }` in `aggregationsQuery`.
- **No `AbortController`.** No race-condition protection.
- **Has `latest_items` / `fetchLatestPublications`** — fetches a `featured: true` batch + a recent batch (each `_limit: 100`), merges them and slices to the requested limit. Used by the home view for the "latest" card row. **We do not have this.**
- **Has `acMapPublication`** — both `get_single` and `all_publications` run results through a mapping helper (lives in `src/utilities/ac-map-publication.js`, Acato-only). Suggests Acato shapes results client-side rather than relying on the new `@self` server-side projection we use.
- **Has `setQueryDate` on `query['@self'].published`** — newer `@self`-namespaced query shape. Ours mutates `query.published` directly (older flat shape).
- **No fuzzy search, no abort logic, no schema/register normalization, no names cache.**
- **Attaches file sizes manually** in `fetchPublication` via `fetch(downloadUrl, { method: 'HEAD' })` per attachment. Ours does not (file sizes come from the new API directly).

#### Differences worth flagging

| Behaviour | Ours | Acato | Note |
|---|---|---|---|
| `latest_items` / featured + recent merge | — | ✅ | Acato pattern for home view "latest" row |
| `acMapPublication` mapping | — | ✅ | Acato remaps publications client-side |
| HEAD-fetch attachment size | — | ✅ | Workaround; ours gets size from server response |
| `AbortController` cancellation | ✅ | — | Critical for search-as-you-type UX |
| New facets API (`_facets=extend`) | ✅ | — | Requires backend support |
| Schema/register normalization + caching | ✅ | — | Tied to our extended object schema |
| Names cache integration | ✅ | — | Tied to our UUID resolution system |
| Fuzzy search + relevance sort | ✅ | — | UX improvement |
| Normalized error object with NL messages | ✅ | — | Tied to our error fallback view |
| Default sort + new query shape | `_name: 'asc'`, `query.published.{from,to}` | none, `query['@self'].published.{from,to}` | Schema diverged |

**Recommendation:** **Keep ours.** Almost every divergence is tied to backend capabilities we have (extended object model with `@self`, names cache, schema cache, new facets API) that Acato does not. The two pieces of Acato logic worth considering for adoption are:

- **`fetchLatestPublications` (featured + recent merge)** — could be adapted if our home view ever needs a "featured / latest publications" row. Decision belongs to the Home views category, not this one.
- **`@self.published` query namespace** in `setQueryDate` — if our backend already accepts `@self`-namespaced date queries (the rest of our code suggests it does), our store is using an older shape. Worth verifying with the API team. **Needs decision.**

The `acMapPublication` shaping and HEAD-fetch for sizes are workarounds for an older API shape and should not be backported.

---

### `themes.store.js` — themes store

Acato (~85 lines): straightforward — fetches with `extend: 'all'`, sorts alphabetically by `title`, maps to `{ paragraph: description, linkTitle: LABELS.VIEW_ALL_THEMES }`, filters out items where `image === null`.

Ours (~160 lines) adds:
- **Mock themes for dev** — `MOCK_THEMES` array (4 hardcoded themes in Dutch) used when `container.constants.isFeatureEnabled('mock_themes')` returns true. Also used as fallback on API error.
- **Container config integration** — `require('@constants/container.constants')` wrapped in try/catch with `console.warn` if missing.
- **Defensive guards** in `all_themes` — early return on non-array `items`; pre-sort filter rejecting themes with missing/non-string `title` to prevent `localeCompare` crashes.
- **Richer mapping** — `paragraph: content || description`, `summary: summary || description`, plus pass-through of `linkUrl`, `isExternal`.
- **Secondary sort key** — sorts by a `sort` field first (default 999), then alphabetically. Acato sorts alphabetically only.
- **Drops `extend: 'all'`** — uses empty `DEFAULT_QUERY`.
- **No `image !== null` filter** — Acato hides imageless themes; ours shows them.

**Recommendation:** Keep ours. The defensive guards and dev-mode mock are useful and tied to our container config system. Acato has no useful improvements here.

---

## Only in ours (cross-reference list)

These stores belong primarily to other feature categories — they are listed here for completeness but full analysis lives elsewhere.

| Store | LOC | Primary category |
|---|---|---|
| `auth.store.js` | 349 | 14 Authentication system |
| `authentication.store.js` | 346 | 14 Authentication system |
| `user.store.js` | 721 | 26 User account & Mijn Omgeving |
| `mijnOmgeving.store.js` | 346 | 26 User account & Mijn Omgeving |
| `menu.store.js` | 276 | 7 Navigation & menu |
| `chat.store.js` | 543 | 16 Chat & GEMMA |
| `gemma.store.js` | 309 | 16 Chat & GEMMA |
| `glossary.store.js` | 123 | 17 Glossary system |
| `object.store.js` | 4686 | 15 Beheer panel (also feeds names cache used by publications) |
| `toasters.store.js` | 149 | 15 Beheer (used app-wide for notifications) |

Two have no full analysis category dedicated to them on the index and warrant a brief inventory here:

### `glossary.store.js`
123 lines. Manages a glossary of terms with `warmup()` (fetches up to 1000 terms in one call against `/opencatalogi/api/glossary`), a `drawerOpen` / `activeTermId` UI state pair, and a `pageTermIds: Set<string>` for tracking which terms appear on the current page. **Functionally overlaps with Acato's `terms.store.js`** — see below.

### `toasters.store.js`
149 lines. A toast queue (`collection`) with `add` / `update` / `remove` / `clear_queue`. Toasts have `{ variant, title, description, delay, id, time, expires }`. UUID-based IDs via `AcUUID`. Used by `store.js` itself (`handleSWCacheReady`) and many other places. Acato has no toast system.

---

## Only in Acato's

### `categories.store.js` (~55 lines)
Acato treats "categories" as a separate top-level concept from "themes". Structure mirrors `faqs.store.js`: simple `items` + `loading`, fetches via `api.categories.list()`, exposes `all_categories` with `{ icon, title, summary, linkUrl, linkTitle, isExternal }` mapping (using `AcSanitizeHtml` on `content`).

**Where it's used in Acato:** likely in the home view as category cards (cross-reference with `analysis-home-views.md` when written) and in `ac-search-themes` / `con-card-category`. Our themes store has overlapping shape (`linkUrl`, `linkTitle`, `isExternal`) which suggests our code merged these two concepts into one when we forked. **Worth a business decision** — do we want a separate "categories" browse axis distinct from "themes"?

### `terms.store.js` (~165 lines)
Acato's glossary equivalent. Manages a flat list of `terms` plus a `publicationTerms: Map<publicationId, Term[]>` for terms that appear in a specific publication's summary. Includes `findTermsInText(terms, text)` that does case-insensitive substring matching. `fetchTermsForPublication(publicationId)` pulls all terms then filters them to those appearing in `publications.get_single.summary`.

**This is essentially the same feature as our `glossary.store.js`** — both expose a set of terms with descriptions to surface inline within publication content. Differences:

| Aspect | Ours (glossary) | Acato (terms) |
|---|---|---|
| API endpoint | `/opencatalogi/api/glossary` (axios instance with auth) | `api.terms.list()` (axios wrapper) |
| Per-publication filtering | `pageTermIds: Set` populated by frontend highlight scanner | `findTermsInText` server-side-ish: filters terms by substring match against `publication.summary` |
| MobX style | Decorators (`@observable`, `@action`) | `makeAutoObservable` |
| UI state | `drawerOpen`, `activeTermId` for slide-out drawer | None — store is data-only; UI lives in Acato's term components |
| Warmup pattern | Single `warmup()` that fetches 1000 in one call | `fetchTerms()` no limit specified |

**Recommendation: needs decision.** The two implementations solve the same problem with different trade-offs. Acato's `findTermsInText` is simpler and avoids the warmup / scanner coupling we have. Ours has a richer UI integration (drawer). If we wanted to clean up our glossary system, Acato's `terms.store.js` is a smaller, more focused starting point — but the full glossary category analysis (#17) should make this call.

---

## Recommendation summary

| Item | Decision |
|---|---|
| `faqs.store.js` identical | No action |
| `index.js` (React import + displayName) | Keep ours |
| `store.js` wiring | Keep ours (we have many more stores) |
| `pages.store.js` (auth filtering + HTML fallback) | Keep ours |
| `themes.store.js` (mock themes + safety guards) | Keep ours |
| `publications.store.js` core (AbortController, new facets API, schema/register normalization, names cache, fuzzy) | Keep ours |
| `publications.store.js` — Acato's `fetchLatestPublications` | Consider adapting if home view needs it — defer to home-views analysis |
| `publications.store.js` — `setQueryDate` query shape (`@self.published` vs flat `published`) | Needs decision — verify with API team which shape backend prefers |
| `publications.store.js` — Acato's HEAD-fetch attachment size | Do not adopt (workaround for older API) |
| `publications.store.js` — Acato's `acMapPublication` mapping | Do not adopt (workaround for older API shape) |
| `categories.store.js` (Acato only) | Needs business decision — do we want a categories axis distinct from themes? |
| `terms.store.js` (Acato only) vs our `glossary.store.js` | Needs decision in the Glossary category analysis (#17) — same feature, different implementations |
| Auth / user / chat / gemma / menu / object / mijnOmgeving / toasters stores | Out of scope here — analyse in their respective category files |

# Analysis: App entry point & routing

## Branches Compared
- Ours (tilburg-woo-ui): `softwarecatalogus-performance`
- Acato (tilburg-woo-ui_acato): `main`

## Files Compared

**Both repos:**
- `src/App.web.js`
- `src/index.web.js`
- `src/service-worker.js`
- `src/views/index.js`
- `src/constants/routes.constants.js` *(routing config — formally in category 23, but inseparable from this analysis)*

**Ours only:**
- `src/setupProxy.js`
- `src/registerServiceWorker.js`

**Acato only:**
- *(none in this category)*

---

## What is the same

- **`src/service-worker.js`** — byte-for-byte equivalent (whitespace/indentation aside: Acato uses 2-space, ours uses tabs in this one file). Both use Workbox: `precacheAndRoute`, an app-shell navigation handler, and a `StaleWhileRevalidate` cache for `.png` assets with a 50-entry `ExpirationPlugin`. **No functional difference.**
- **`src/index.web.js`** core shape is identical: `preact/debug`, `preact` render, `mobx-react-router` `RouterStore` + `syncHistoryWithStore`, `BrowserRouter`, `StoreContext.Provider` wrapping `<App />`. Same bootstrapping pattern.
- **`src/App.web.js`** core shape is identical: MobX-injected `withStore(observer(App))`, `react-router-dom` `<Routes>`, lazy-loaded `AcHeader`/`AcFooter` via `@loadable/component`, `useAutoFocus()` ref for accessibility focus reset, same `getView(page)` helper that returns `<AcHome>` for the `home` slug and `<AcContent>` otherwise.
- **`PATHS.HOME`, `PATHS.PUBLICATION`, `PATHS.SEARCH`, `PATHS.SEARCH_STATIC`** — identical path strings (`/`, `/publicatie/:id`, `/zoeken/:query?`, `/zoeken`).
- **`NAVIGATE_TO.PUBLICATION`, `DEFAULT_ROUTE`, `REDIRECT_ROUTE`, `NAVIGATION_ITEMS`** — same shape (both point to `ROUTES.HOME`).
- **`src/views/index.js`** — Acato's 4 lazy view exports (`AcHome`, `AcSearch`, `AcThemes`, `AcPublication`) all exist in our barrel too, with identical `loadable(() => import(...))` syntax and identical relative paths.

## What differs

### `App.web.js` — significant divergence

| Concern | Ours | Acato |
|---|---|---|
| Routing source of truth | `ROUTES` constants drive everything. CMS-driven page routes have been **removed** ("CMS-driven routes removed" comment). | CMS pages drive routing: `fetchPages()` on mount, returns `null` until pages load, then renders one `<Route>` per CMS page on top of static `ROUTES`. |
| Catch-all behavior | `*` → `<AcContent>` (treats unknown paths as CMS pages, fetched on demand). | `*` → `<AcHome>` (everything unknown falls back to home). |
| Theme | Dynamic via `getTheme()` switch on `containerConfig.getThemeVariant()` then hostname fallback — 8 themes (`vng`, `dimpact`, `tilburg`, `rotterdam`, `migrato`, `opencatalogi`, `horst-aan-de-maas`, `venray`). Applied by adding a class to `<body>`. | Hardcoded `<div className='tilburg-theme'>`. |
| Favicon | `setIcon()` reads `containerConfig.getFaviconUrl()` then hostname fallback, mutating `#favicon` and `#faviconMeta` href. | None — uses whatever's in `public/`. |
| Auth gating | Imports `AUTHENTICATION_REQUIRED_ROUTES`; routes in that list are wrapped in `<AcProtectedRoute fallbackPath='/login'>`. Also supports `route.redirectTo` for redirect routes. Dedicated `/logout` route component. | None. |
| Cache warmup | Two warmups gated on `user.isAuthenticated` for non-`/beheer`/`/forms` pages: `store.object.warmupSchemaCache()` and `store.object.warmupRegisterCache()`. Always-on `store.glossary.warmup()`. | None. |
| Glossary button | Conditionally renders a floating "concepts list" button + `ConGlossaryDrawer` when `glossary.is_warmed_up && all_terms.length > 0` and not on `/beheer`. | None. |
| Document title | `useDocumentTitleFromPath()` hook. | None — title comes from the static `<head>`. |
| Container shell | `<main id='main' className='ac-app-main'>` | `<main id='main'>` (no class) |

### `index.web.js` — minor divergence

- Ours additionally imports `register`/`unregister` from `./registerServiceWorker` and registers the SW only in `production`; Acato does **not** register the service worker at all (the file exists but nothing wires it up).
- Ours adds a global `<Tooltip>` (`react-tooltip`) with `TOOLTIP_ID` used by GEMMA tooltips.
- Ours assigns `window.app = { store }` for "basic auth fallback".
- Otherwise identical.

### `routes.constants.js` — large surface difference, expected per repo charter

- **Ours**: ~30 `PATHS` entries, ~30 `ROUTES` entries. Components imported include all admin/forms/views/auth/chat/gemma/directory views. Includes `AUTHENTICATION_REQUIRED_ROUTES` array. Title helper `getTitle()` reads `containerConfig` then falls back to hostname switch covering 9 hosts. Adds VNG/DIMPACT footer route groups for theming.
- **Acato**: 15 active `PATHS` and 15 active `ROUTES` (plus `THEMES` commented out in both maps), most of which are CMS-page placeholders (`ABOUT`, `ACCESSIBILITY`, `CONTACT`, `COOKIES`, `FAQ`, `ORGANIZATION`, `PRIVACY`, `PROCLAIMER`, `WEBSITE`, `WOO`, `REACH_OUT`). Only `HOME`, `PUBLICATION`, `SEARCH`, `SITEMAP` have a `component`; rest are external `href` or expected to be matched by the CMS-page loop in `App.web.js`. Titles use static `TITLES.BASE` constant.
- `THEMES` route exists in ours as a real route; in Acato's it is commented out.
- `SITEMAP` route exists in Acato's but **not** in ours.
- Acato's `FOOTER_PRIMARY_*` and `FOOTER_SECONDARY` are populated with real entries; ours have been emptied (`EXTERNAL_LINKS = []`, `FOOTER_PRIMARY_QUICK = []`, `FOOTER_SECONDARY = []`, `SUB_NAVIGATION_ITEMS = []`) with comments noting that CMS-driven external links were "removed - now managed by OpenCatalogi".

### `views/index.js` — superset

Ours re-exports the same 4 views as Acato plus 23 more (forms, beheer, auth, chat, directory, etc.).

## Only in ours

- **`src/setupProxy.js`** — webpack-dev-server proxy used during local development. Forwards `/api/openconnector`, `/api/apps`, and `/api` to `API_TARGET_URL` (default `http://localhost:8080`) with `Host` header override (`NEXTCLOUD_HOST`). Three separate `createProxyMiddleware` instances with debug logging. Specific to running the app against a local Nextcloud backend.
- **`src/registerServiceWorker.js`** — standard CRA-style SW registration script with `register()`/`unregister()` exports, localhost detection, `swFreshContentReady`/`swCacheReady` custom events, and `unregister()` cleanup. Imported by ours' `index.web.js`.

## Only in Acato's

- *Nothing structurally unique* — Acato's `App.web.js` is essentially a strict subset of ours minus all the features we added. The one functional pattern they have that we don't is the **CMS-page-driven routing** (mapping over `all_pages` from `store.pages.fetchPages()` to register a `<Route>` per page), which we explicitly removed (per comments) in favor of a catch-all `<AcContent>` route.
- The 11 CMS-page routes (`ABOUT`, `ACCESSIBILITY`, `CONTACT`, etc.) and the `SITEMAP` route in `routes.constants.js` exist only in Acato's.

## Recommendation

| Item | Decision | Notes |
|---|---|---|
| `service-worker.js` | **Keep ours** | Functionally identical; no action needed. |
| `index.web.js` | **Keep ours** | Our additions (`<Tooltip>`, SW register/unregister, `window.app`) are load-bearing for downstream features. Acato has nothing to backport here. |
| `App.web.js` core shell (header/footer/Routes scaffolding) | **Keep ours** | Same shape, ours is a superset. |
| `App.web.js` — CMS-page route loop | **Needs business decision** | This is the most meaningful difference. Ours deliberately deleted the per-page `<Route>` mapping in favor of a `*` catch-all that renders `<AcContent>` and lets `AcContent` resolve the page on demand. Acato's version blocks render until `fetchPages()` resolves (returns `null`), which is worse for TTFB but gives explicit per-route registration. **The "OpenCatalogi-managed" comments suggest a deliberate architectural decision** — confirm with team that we should not reintroduce the page-route loop. |
| Theme/favicon dynamic dispatch | **Keep ours** | Acato is hardcoded to `tilburg-theme`. Ours has to handle 8 deployments. Cannot drop this. |
| Auth gating (`AcProtectedRoute`, `/logout` route) | **Keep ours** | No Acato equivalent. Required by our auth system (category 14). |
| Cache warmups + glossary button | **Keep ours** | Tied to features Acato doesn't have. |
| `useDocumentTitleFromPath` | **Keep ours** | Ours has dynamic titles; Acato leans on static `<head>`. |
| `setupProxy.js` | **Keep ours** | Local-dev affordance for our Nextcloud-backed development. Acato doesn't need it (different backend architecture). |
| `registerServiceWorker.js` | **Keep ours** | Required to register the SW that both repos still ship. Acato's `service-worker.js` is dead code without something to register it — possibly an oversight on their side, but not our problem to fix. |
| `routes.constants.js` — CMS-page routes (`ABOUT`, `FAQ`, `CONTACT`, ...) | **Needs decision** | Currently removed in ours with the note "now managed by OpenCatalogi". Verify that the OpenCatalogi backend really does serve these as CMS pages via the `*` → `<AcContent>` catch-all. If yes, no action. If the team intended to keep dedicated routes for these (e.g., for SEO / sitemap purposes), backport from Acato. |
| `routes.constants.js` — `SITEMAP` route | **Consider adopting** | Acato has `/sitemap` → `AcSitemap`. We have no sitemap view at all. Worth checking whether sitemap generation is now handled server-side; if not, this is a small but valuable accessibility/SEO feature to backport. Also see category 22 (Home & general public views). |
| `routes.constants.js` — `THEMES` route | **Keep ours** | We re-enabled it; Acato has it commented out. |
| `views/index.js` | **Keep ours** | Superset of Acato's; no conflict. |

### Items flagged for human decision

1. **Should we restore Acato's CMS-page route loop in `App.web.js`?** Current ours uses a `*` catch-all to `<AcContent>`. The trade-off is TTFB (ours wins) vs. explicit route table (Acato wins). Likely no change needed, but confirm.
2. **Should we re-add a dedicated sitemap view?** Acato's `/sitemap` → `AcSitemap` has no counterpart on our side. Possibly worth a small backport.
3. **Has the OpenCatalogi-managed routing for `ABOUT`/`FAQ`/`CONTACT`/etc. been verified end-to-end?** The removal comments suggest yes, but worth a sanity check that those URLs still resolve.

# Analysis — App Entry & Routing

**Scope:** the bootstrap files (`src/index.web.js`, `src/App.web.js`) and the routing surface they consume from `src/constants/routes.constants.js` (`PATHS`, `ROUTES`, `DEFAULT_ROUTE`, `AUTHENTICATION_REQUIRED_ROUTES`). The route *table* itself is in scope as far as it shapes what the App renders; the individual view components mounted by each route are deferred to their own category analyses (search, publication, beheer, forms, GEMMA, etc.).

---

## 1. Files compared

| File | Ours (`tilburg-woo-ui/`) | Theirs (`openwoo-tilburg-ui/`) |
|---|---|---|
| Bootstrap | [src/index.web.js](../src/index.web.js) | [src/index.web.js](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/index.web.js) |
| App shell + router | [src/App.web.js](../src/App.web.js) | [src/App.web.js](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/App.web.js) |
| Route table | [src/constants/routes.constants.js](../src/constants/routes.constants.js) | [src/constants/routes.constants.js](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/constants/routes.constants.js) |

Supporting (referenced, not the primary diff target):
- [src/components/ac-protected-route/ac-protected-route.js](../src/components/ac-protected-route/ac-protected-route.js) — ours-only.
- [src/components/con-glossary-drawer/con-glossary-drawer.js](../src/components/con-glossary-drawer/con-glossary-drawer.js) — ours-only.
- [src/registerServiceWorker.js](../src/registerServiceWorker.js) — ours-only.
- [src/hooks/use-document-title-from-path.hook.js](../src/hooks/use-document-title-from-path.hook.js) — ours-only.
- [src/views/ac-fallback-error-page/](../src/views/ac-fallback-error-page/) — ours-only.

---

## 2. What's the same

Both files share the same skeleton — neither has been rewritten, ours has accreted features on top of a still-recognisable Acato base.

- **Render target.** Both use `preact` + `import 'preact/debug'` and call `render(...)` against `document.getElementById('root')` ([index.web.js:1-2](../src/index.web.js#L1-L2) | [theirs:1-2](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/index.web.js#lines-1:2)).
- **Routing stack.** Both compose `createBrowserHistory` → `RouterStore` (mobx-react-router) → `syncHistoryWithStore` → `<BrowserRouter as Router>` from react-router-dom ([index.web.js:6-8, 18-25](../src/index.web.js#L6-L25) | [theirs:4-17](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/index.web.js#lines-4:17)).
- **Store wiring.** Both `createStore(config)` and wrap the tree in `<StoreContext.Provider value={store}>`.
- **App-shell shape.** Both wrap the routes in a focusable `<div>` with `useAutoFocus()`, render `AcHeader` + `<main id="main">` + `AcFooter`, and lazy-load Header/Footer via `@loadable/component`.
- **Route rendering pattern.** Both iterate `Object.values(ROUTES).filter(route => route.component).map(...)` to produce `<Route key path element>` entries ([App.web.js:256-290](../src/App.web.js#L256-L290) | [theirs:50-58](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/App.web.js#lines-50:58)).
- **`getView(page)` helper.** Both define an identical `slug === 'home' ? AcHome : AcContent` helper. (See note 3.4 — ours' helper is dead code now.)
- **`@styles/index.scss` import.** Both pull the global stylesheet from the App entry.
- **HOC composition.** Both export `withStore(observer(App))`.

`PATHS` overlaps on: `HOME`, `PUBLICATION`, `SEARCH`, `SEARCH_STATIC`. Ours has dropped `ABOUT`/`ACCESSIBILITY`/`CONTACT`/`FAQ`/`PRIVACY`/etc. (CMS-driven now); theirs still declares them. See 3.5.

---

## 3. What differs

### 3.1 `index.web.js` — provider stack additions (ours only)

Three additions in our bootstrap that theirs doesn't have:

1. **Service-worker registration** — ours imports `register` / `unregister` from `./registerServiceWorker` and calls one of them based on `NODE_ENV` ([index.web.js:4, 39-43](../src/index.web.js#L4-L43)). Theirs has no service worker (file is absent from `openwoo-tilburg-ui/src/`).
2. **Global `window.app = { store }`** at [index.web.js:23](../src/index.web.js#L23). Comment says "for basic auth fallback." Theirs does not expose the store on `window`.
3. **`<Tooltip>` provider** — ours mounts a single `react-tooltip` provider via `TOOLTIP_ID` at [index.web.js:16, 32](../src/index.web.js#L16-L32). Multiple Conduction-side fields consume it via `data-tooltip-id={TOOLTIP_ID}`: [molecules/ac-form-field/ac-form-field.js:136](../src/molecules/ac-form-field/ac-form-field.js#L136), `con-dynamic-schema-form/inputs/markdown-html-field.js`, `con-lightweight-markdown-editor.js`, `con-wysiwyg-markdown-field.js`. Theirs has no Tooltip provider and no `react-tooltip` dependency.

### 3.2 `App.web.js` — CMS-page resolution model

Architecturally the biggest diff in this category.

**Theirs (eager, route-per-page):**

```jsx
// theirs/App.web.js:19-49
const { fetchPages, all_pages } = store.pages;
useEffect(() => { fetchPages(); }, []);
// ...
if (!all_pages?.length) { return null; }   // BLOCK whole app until CMS list resolves
// ...
{all_pages.map((page) => (
  <Route key={`route-${page.id}`} path={page.slug} element={getView(page)} />
))}
```

Theirs lists every CMS page at boot ([their pages.store.js:74-87](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/stores/pages.store.js#lines-74:87)), holds the entire UI in a `return null` until the list resolves, and registers a `<Route>` per page. Unknown paths fall through to the catch-all `<Route path='*' element={<AcHome>}>` at [their App.web.js:59-63](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/App.web.js#lines-59:63) — i.e. **theirs renders Home, not 404, for unknown URLs.**

**Ours (lazy, catch-all):**

```jsx
// ours/App.web.js:299-304
<Route key='cms-pages-catchall' path='*' element={<AcContent store={store} />} />
```

Ours has no `fetchPages()` boot call and no `return null` gate. The catch-all `*` mounts `AcContent`, which then calls `pages.fetchPage(location.pathname)` inside its own `useEffect` ([views/ac-content/ac-content.js:18-22](../src/views/ac-content/ac-content.js#L18-L22)). If the fetched page is `null`, AcContent shows a "Pagina niet gevonden" 404 panel inline; permission denial routes to `/login?redirect_url=…` or shows a 403 panel ([ac-content.js:32-54](../src/views/ac-content/ac-content.js#L32-L54)).

**Practical consequences:**
- First paint: ours doesn't block on `/pages` list; theirs does.
- New CMS pages: ours picks them up without reboot; theirs needs the page list re-fetched.
- Unknown URLs: ours shows a proper 404; theirs silently shows Home.
- Per-page auth: ours has it (`shouldShowPage` + redirect); theirs has none.

### 3.3 `App.web.js` — auth gating layer (ours only)

Ours adds an entire authentication layer that theirs has no equivalent for.

- **`AUTHENTICATION_REQUIRED_ROUTES`** — declared in [routes.constants.js:664-671](../src/constants/routes.constants.js#L664-L671); listed: `/beheer`, `/beheer/:type`, `/beheer/:type/:id`, `/beheer/views`, `/beheer/views/:id`, `/beheer/view/:id`. Theirs has `AUTHENTICATION_ROUTES = []` and no `AUTHENTICATION_REQUIRED_ROUTES` at all ([their routes.constants.js:182](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/constants/routes.constants.js#lines-182)).
- **`AcProtectedRoute` wrapper** — ours wraps protected route components inline at [App.web.js:279-287](../src/App.web.js#L279-L287):

  ```jsx
  requiresAuth ? (
    <AcProtectedRoute requireAuth={true} fallbackPath='/login'>
      <route.component store={store} />
    </AcProtectedRoute>
  ) : (
    <route.component store={store} />
  )
  ```
- **`<AcLogout>` inline component** — [App.web.js:30-62](../src/App.web.js#L30-L62) defines a small inline view that calls `store.user.logout()` then `navigate('/')` and mounts at `/logout` ([App.web.js:293-297](../src/App.web.js#L293-L297)). Theirs has no logout route.
- **Redirect support** — our route mapper handles `route.redirectTo` ([App.web.js:259-268](../src/App.web.js#L259-L268)). Currently used by `FORMS_GEBRUIK` (`/forms/gebruik` → `/beheer/gebruik`, [routes.constants.js:326](../src/constants/routes.constants.js#L326)). Theirs has no redirect-route handling because no route in theirs declares `redirectTo`.

### 3.4 `App.web.js` — boot-time side effects (ours only)

Ours runs four extra effects at mount that theirs doesn't have:

| Effect | Location | What |
|---|---|---|
| Schema-cache warmup | [App.web.js:75-97](../src/App.web.js#L75-L97) | When `user.isAuthenticated` and *not* on `/beheer` or `/forms`, fires `store.object.warmupSchemaCache()` + `warmupRegisterCache()`. |
| Glossary warmup | [App.web.js:100-104](../src/App.web.js#L100-L104) | `store.glossary.warmup()` on every mount, public API. |
| Document title from path | [App.web.js:106](../src/App.web.js#L106) | `useDocumentTitleFromPath()` (ours-only hook — theirs' [hooks/index.js](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/hooks/index.js) exports only `use-auto-focus`). |
| Theme + favicon | [App.web.js:245-248](../src/App.web.js#L245-L248) | `setIcon()` + `setTheme()`. |

The two `getView` helper functions at [App.web.js:108-114](../src/App.web.js#L108-L114) (ours) and [theirs:26-32](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/App.web.js#lines-26:32) are byte-identical, but **ours' copy is dead code** — it isn't called anywhere in our App.web.js now that CMS pages go through the catch-all. Worth deleting on a cleanup pass.

### 3.5 `App.web.js` — multi-tenant theming & favicon

Ours computes a theme and favicon at boot from container-config / hostname; theirs hardcodes Tilburg.

**Theirs:** the wrapper `<div>` has a literal `className='tilburg-theme'` at [their App.web.js:39](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/App.web.js#lines-39). No favicon manipulation.

**Ours:** the wrapper `<div>` has the generic `className='ac-app-container'` ([App.web.js:251](../src/App.web.js#L251)) and the theme class is added to `<body>` by `setTheme()`. `getTheme()` first tries `containerConfig.getThemeVariant()` (from `@constants/container.constants`, runtime-generated — see dependencies analysis §3.7), then falls back to a hostname switch covering 8 tenants: `vng-theme`, `dimpact-theme`, `tilburg-theme`, `rotterdam-theme`, `migrato-theme`, `opencatalogi-theme`, `horst-aan-de-maas-theme`, `venray-theme` ([App.web.js:129-189](../src/App.web.js#L129-L189)). `getFaviconUrl()` mirrors the same switch ([App.web.js:195-234](../src/App.web.js#L195-L234)).

Note: ours' `getTheme()` `default` falls back to `tilburg-theme` ([App.web.js:187](../src/App.web.js#L187)), so an unknown hostname behaves the same as theirs.

### 3.6 `App.web.js` — glossary surface (ours only)

Ours injects a floating button + drawer at the bottom of the app shell ([App.web.js:307-319](../src/App.web.js#L307-L319)):

```jsx
{!isBeheerPage && glossary.is_warmed_up && glossary.all_terms.length > 0 && (
  <div className='con-glossary-button-container'>
    <button onClick={() => glossary.openDrawer()} aria-label={LABELS.CONCEPTS_LIST}>
      <VISUALS.LIST_ALT /> <span>{LABELS.CONCEPTS_LIST}</span>
    </button>
  </div>
)}
<ConGlossaryDrawer />
```

`isBeheerPage` derives from `useLocation()` ([App.web.js:67-68](../src/App.web.js#L67-L68)) so the glossary button is hidden in `/beheer/*`. Theirs has no glossary store, no drawer, no button — the entire surface is absent.

### 3.7 `routes.constants.js` — route table size and shape

| | Ours | Theirs |
|---|---|---|
| Routes with `component` (mounted to a `<Route>`) | 28 | 6 (`HOME`, `PUBLICATION`, `SEARCH`, `SITEMAP`, plus implicit `ABOUT/ACCESSIBILITY/CONTACT/FAQ` — see below) |
| Routes that are `href`-only (rendered in footer/menu, no `<Route>`) | 0 | 9 (`COOKIES`, `ORGANIZATION`, `PRIVACY`, `PROCLAIMER`, `WEBSITE`, `WOO`, `REACH_OUT`, …) |
| `redirectTo` routes | 1 (`FORMS_GEBRUIK`) | 0 |
| `AUTHENTICATION_REQUIRED_ROUTES` | 6 | undeclared |
| `id` generation | `AcUUID()` per route (regenerates every load) | static string `'route-home'`, `'route-publication'`, … |

The `id` difference is a small wart on ours: route keys aren't stable across reloads. Theirs' static strings are cleaner.

**Theirs' "extra" routes that ours doesn't declare:** `ABOUT`, `ACCESSIBILITY`, `CONTACT`, `FAQ` (declared `path` + `component: AcHome` *not* set — they have `path` only, no `component`, so they don't mount as `<Route>`s either; they only exist as footer/menu entries). They're effectively dead path declarations; theirs relies on the catch-all `<Route path='*' element={<AcHome>}>` to handle them. **Practically, theirs has 4 routes that map to `<AcHome>` via fallback** when a user navigates to `/over-ons` etc., because theirs' catch-all returns Home rather than 404. We removed them when we moved page content to the CMS — comments at [routes.constants.js:43, 148, 159, 226](../src/constants/routes.constants.js#L43) call this out explicitly.

**Theirs has `SITEMAP`** ([their routes.constants.js:113-121](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/constants/routes.constants.js#lines-113:121)) and the matching [views/ac-sitemap/](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/views/ac-sitemap/) — ours has neither. See §5 and the routes recon in CLAUDE.md (item 17 of the working list). This belongs primarily to the "Home & public views" category but is flagged here because it shows up in their route table.

**Ours' `THEMES` route** ([routes.constants.js:216-225](../src/constants/routes.constants.js#L216-L225)) is active (component: `AcThemes`); theirs has the matching block commented out ([their routes.constants.js:122-129](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/constants/routes.constants.js#lines-122:129)). Acato has clearly *had* the feature and removed/deferred it; we kept it. Theirs has `subjects` instead (separate category — search subjects).

### 3.8 `routes.constants.js` — title computation

Theirs builds titles with a static literal `TITLES.BASE` ([their routes.constants.js:37](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/constants/routes.constants.js#lines-37)):

```js
title: `${TITLES.BASE} | ${TITLES.ABOUT}`,
```

Ours templates the title with a hostname-aware `getTitle()` wrapped in `AcCheckIfSpecificHostname()` ([routes.constants.js:106-145, 154](../src/constants/routes.constants.js#L106-L154)):

```js
title: `${AcCheckIfSpecificHostname() ? getTitle() : 'Open Tilburg'} | ${TITLES.HOME}`,
```

Same multi-tenant rationale as §3.5. The `AcCheckIfSpecificHostname` service is part of the ours-only `src/services/` layer; deferred to its own category but noted here as a routing-table dependency.

### 3.9 `routes.constants.js` — tenant-specific footer/sitemap exports

Theirs exports a single `FOOTER_PRIMARY_ABOUT` / `FOOTER_PRIMARY_QUICK` / `FOOTER_SECONDARY` ([their routes.constants.js:158-178](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/constants/routes.constants.js#lines-158:178)) — straightforward Tilburg links.

Ours exports the same names *plus* `VNG_ROUTES_SITEMAP`, `VNG_ROUTES_INFORMATIE`, `VNG_ROUTES_BEDRIJVEN`, `DIMPACT_ROUTES_WHAT_WE_DO`, `DIMPACT_ROUTES_WHO_WE_ARE`, `DIMPACT_ROUTES_INFORMATION`, and the per-tenant footer arrays `VNG_FOOTER_ITEMS_*`, `DIMPACT_FOOTER_ITEMS_*` ([routes.constants.js:480-649](../src/constants/routes.constants.js#L480-L649)). Most of ours' shared exports are `[]` ([routes.constants.js:652-659](../src/constants/routes.constants.js#L652-L659)) because the live data lives in the per-tenant arrays. Footer rendering is a separate category (organisms / layout) — flagged here because the exports live in the same file.

### 3.10 Unused import (ours)

[App.web.js:18](../src/App.web.js#L18) imports `AcFallbackErrorPage` but never references it in the JSX (grep confirms). Either dead since some prior refactor, or the catch-all was meant to use it instead of `AcContent`. Cleanup or wire-up, but not a behaviour diff with theirs.

---

## 4. Only in ours

Inventory (load-bearing flagged):

- **Service worker** ([index.web.js:4, 39-43](../src/index.web.js#L4-L43), [src/registerServiceWorker.js](../src/registerServiceWorker.js), [src/service-worker.js](../src/service-worker.js)) — Workbox InjectManifest pipeline is wired in webpack prod; this is the registration call-site. **Load-bearing for offline support / cache strategy.**
- **`window.app = { store }`** ([index.web.js:23](../src/index.web.js#L23)) — "basic auth fallback" per the comment. **Load-bearing for whatever consumer reads `window.app` from non-React code** (likely the basic-auth interceptor in the api layer; verify when analysing the API category).
- **`<Tooltip>` provider** ([index.web.js:16, 32](../src/index.web.js#L16-L32), `TOOLTIP_ID`) — **load-bearing**: consumed by 4 form/markdown components.
- **`<AcLogout>` inline component + `/logout` route** ([App.web.js:30-62, 293-297](../src/App.web.js#L30-L62)) — **load-bearing for auth.**
- **`AcProtectedRoute` wrapper** + `AUTHENTICATION_REQUIRED_ROUTES` constant ([App.web.js:271-287](../src/App.web.js#L271-L287), [routes.constants.js:664-671](../src/constants/routes.constants.js#L664-L671)) — **load-bearing for beheer access control.**
- **`redirectTo` route mapping** ([App.web.js:259-268](../src/App.web.js#L259-L268)) — used by `FORMS_GEBRUIK`. **Load-bearing for the forms area.** Searched theirs for redirect-route handling — none.
- **Schema/register-cache warmup** ([App.web.js:75-97](../src/App.web.js#L75-L97)) — perf, dependent on the OpenRegister object store. Belongs to API/store category for deeper diff; called from boot here.
- **Glossary warmup + floating button + drawer** ([App.web.js:99-104, 307-319](../src/App.web.js#L99-L104)) — **load-bearing for the Begrippenlijst feature.** Searched theirs for any glossary store/component — none.
- **`useDocumentTitleFromPath` hook** ([App.web.js:106](../src/App.web.js#L106), [hooks/use-document-title-from-path.hook.js](../src/hooks/use-document-title-from-path.hook.js)) — keeps `<title>` synced to route. Searched theirs' hooks dir — only `use-auto-focus`.
- **`AcFallbackErrorPage` view** ([views/ac-fallback-error-page/](../src/views/ac-fallback-error-page/)) — imported but unused in App.web.js. Verify whether anything else mounts it (likely an error boundary).
- **Container-config-driven theme/favicon switching** ([App.web.js:116-243](../src/App.web.js#L116-L243), [constants/container.constants.js](../src/constants/container.constants.js)) — **load-bearing for multi-tenant deploys**, tied to runtime-config injection (see dependencies analysis §3.7).
- **Hostname-aware route titles** (`AcCheckIfSpecificHostname` + `getTitle()` in [routes.constants.js:39, 96-145](../src/constants/routes.constants.js#L39)) — same multi-tenant story applied to `<title>` strings.
- **Per-tenant footer/sitemap arrays** (`VNG_*`, `DIMPACT_*` exports) — flagged for the organisms/layout category; lives in this file.
- **`/setupProxy.js`** (not in this analysis' files but referenced from CLAUDE.md recon) — ours-only, dev-server CORS proxy. Outside scope here.

---

## 5. Only in theirs

- **`<Route path='*' element={<AcHome>}>` catch-all** ([their App.web.js:59-63](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/App.web.js#lines-59:63)) — i.e. Home is the 404 fallback. We removed this in favour of an `AcContent` catch-all with proper 404 handling.
- **Eager `fetchPages()` boot call + `return null` gate** ([their App.web.js:19-36](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/App.web.js#lines-19:36)) — blocks first paint on the CMS page list. We dropped it.
- **Route registration per CMS page** (`{all_pages.map(...)}` block, [their App.web.js:43-49](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/App.web.js#lines-43:49)) — see §3.2.
- **`SITEMAP` route** ([their routes.constants.js:113-121](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/constants/routes.constants.js#lines-113:121)) + [views/ac-sitemap/ac-sitemap.js](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/views/ac-sitemap/ac-sitemap.js). Cross-link: home/public views category.
- **Static page-id strings** for routes (`'route-home'` etc.) — minor but cleaner than ours' `AcUUID()`.
- **CMS-driven hrefs declared as routes** — `COOKIES`, `ORGANIZATION`, `PRIVACY`, `PROCLAIMER`, `WEBSITE`, `WOO`, `REACH_OUT` ([their routes.constants.js:52-152](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/constants/routes.constants.js#lines-52:152)). These are `href`-only entries surfaced in the footer; ours has cleared them out because the footer is now driven by `EXTERNAL_LINKS = []` and OpenCatalogi-managed content. (Footer rendering is a separate category.)

---

## 6. Per-item recommendations

| # | Item | Recommendation | Notes |
|---|---|---|---|
| 1 | `<Tooltip>` provider in `index.web.js` | **keep ours** | Load-bearing for our form fields; theirs has nothing equivalent and no consumers. |
| 2 | `window.app = { store }` global | **keep ours, document** | Add a one-line comment naming the actual consumer (find the basic-auth fallback site and reference it). Global state on `window` is a smell but it's a deliberate fallback — make it obvious *why* so a future cleanup doesn't drop it. |
| 3 | Service-worker register/unregister | **keep ours** | The full Workbox/InjectManifest pipeline is already in webpack prod. Removing the runtime registration would silently break offline. |
| 4 | `<AcLogout>` inline component | **keep ours, extract** | Functionality is load-bearing for auth; the inline definition inside `App.web.js` is fine but moving it to `src/views/ac-logout/` would match the rest of our view layout. Cosmetic, not blocking. |
| 5 | `AcProtectedRoute` + `AUTHENTICATION_REQUIRED_ROUTES` | **keep ours** | Theirs has no auth at all — adopting theirs would mean removing all gating. |
| 6 | `redirectTo` route mapper | **keep ours** | Used in production by `FORMS_GEBRUIK`. |
| 7 | CMS catch-all model (ours) vs. eager `fetchPages` (theirs) | **keep ours** | Ours is strictly better: no boot-time block, picks up new CMS pages without reboot, real 404s. Theirs' model also can't express auth-gated pages. |
| 8 | Theirs' Home-as-404 fallback | **adopt nothing** | The dropped behaviour is a regression we already fixed; don't re-import it. |
| 9 | Schema/register-cache warmup effects | **keep ours** | Verify the conditions (post-auth + not-beheer/forms) are still right — see [D-005](DECISIONS.md#d-005). |
| 10 | Glossary warmup + button + drawer | **keep ours** | Whole feature is ours-only. |
| 11 | `useDocumentTitleFromPath` hook | **keep ours** | Trivial, no reason to drop. |
| 12 | Multi-tenant theme + favicon (`getTheme`, `getFaviconUrl`, `setIcon`) | **keep ours** | Required by our multi-tenant deploys. Default branch already falls through to `tilburg-theme`, so behaviour for an Acato-style single-tenant build matches theirs. |
| 13 | Hostname-aware route titles in `routes.constants.js` | **keep ours** | Same multi-tenant requirement as #12. |
| 14 | Per-tenant footer arrays (`VNG_*`, `DIMPACT_*`) | **defer to organisms/layout category** | They live in this file but the rendering decision belongs with the footer analysis. |
| 15 | Theirs' `SITEMAP` route + `AcSitemap` view | **adopt theirs** *(provisional)* — needs check | The route is small, isolated, and a public-good feature. Verify there's no SEO reason we explicitly *removed* it during multi-tenant rework. Cross-link: home/public views category. → [D-006](DECISIONS.md#d-006). |
| 16 | Theirs' `'route-home'`-style static IDs vs. ours' `AcUUID()` | **adopt theirs' pattern** | Trivial change in `routes.constants.js`. Stable keys help React reconcile and make logs easier to read. Low priority. |
| 17 | Theirs' dead `ABOUT/ACCESSIBILITY/CONTACT/FAQ` route declarations | **adopt nothing** | They're path-only entries with no `component`, surfacing on theirs' Home-fallback only. We correctly removed them. |
| 18 | Unused `AcFallbackErrorPage` import in our `App.web.js` | **clean up** | Either wire it up (route-level error boundary) or drop the import. Not a diff with theirs — internal cleanliness. |
| 19 | Dead `getView(page)` helper in our `App.web.js` | **clean up** | Unreferenced since the CMS catch-all rewrite. Drop. |
| 20 | `THEMES` route active in ours, commented out in theirs | **keep ours** | The feature is wired through `AcThemes` and the search system; theirs deferred it. |

---

## 7. Category verdict

**`mixed`** — overwhelmingly **`keep-ours`** (CMS model, auth gating, multi-tenant theming, service worker, tooltip provider, glossary surface are all ours-only and load-bearing), with one **`adopt-theirs`** candidate (`SITEMAP` route + view, pending decision) and a handful of low-priority cleanups inside our files (dead `getView`, unused `AcFallbackErrorPage` import, switch route IDs from `AcUUID()` to static strings).

No category-wide merge: the two App shells are no longer the same shape, and that's by design — ours has grown an auth/CMS/multi-tenant story that theirs doesn't have and isn't going to grow.

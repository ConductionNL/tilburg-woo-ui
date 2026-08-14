# Analysis: Error handling & fallbacks (ours only)

## Branches Compared
- Ours (tilburg-woo-ui): `softwarecatalogus-performance`
- Acato (tilburg-woo-ui_acato): `main`

## Scope

Four files from category 27 — the bits that catch, format, and surface error state:

- [src/views/ac-fallback-error-page/ac-fallback-error-page.js](../src/views/ac-fallback-error-page/ac-fallback-error-page.js) (32 LoC) — Dutch "Oeps!" page.
- [src/api/interceptors.api.js](../src/api/interceptors.api.js) (76 LoC) — `AcTokenRefresher` for axios.
- [src/utilities/ac-format-error.js](../src/utilities/ac-format-error.js) (72 LoC) — `AcFormatErrorMessage`, `AcFormatErrorCode`, `AcHasErrors`.
- [src/styles/global/_fallback-error-page.scss](../src/styles/global/_fallback-error-page.scss) (12 LoC) — two flex rules for the page.

**Acato has nothing in this category.** No interceptors, no fallback view, no error formatter. Their portal lets axios errors bubble; failed requests just leave their MobX stores in their default loading/empty state. This category is ours-only — the verdict is **keep**, no merge decision needed.

## How the pieces compose

```
HTTP error → axios response interceptor (api/index.js)
              ├─ 401 → CustomEvent 'cancelRequests' + 'unAuthenticate'
              └─ Promise.reject → caller catch()
                       │
                       └→ AcFormatErrorMessage(error) → toasters / inline form errors
```

The interceptor lives in [api/index.js#L52-L82](../src/api/index.js#L52-L82), not in the `interceptors.api.js` file itself — that file only exports `AcTokenRefresher`, which the **request** interceptor calls before every outbound call (refreshes the OAuth token if `expires_in < expires_at`, otherwise resolves immediately). The **response** interceptor is inline in `api/index.js`, vibrates the device on any error (`navigator.vibrate(400)`), and dispatches the global `cancelRequests` / `unAuthenticate` events on 401. The class `API` in `api/index.js` attaches the same interceptor pair to all three axios clients (`Client`, `DownloadClient`, `UploadClient`).

`AcFormatErrorMessage` (used in [stores/auth.store.js](../src/stores/auth.store.js), [stores/user.store.js](../src/stores/user.store.js), [stores/object.store.js](../src/stores/object.store.js), and 2 others — 25 references total) normalizes the resulting error into Dutch UI strings. Lookup order: `error.response.data.errors` (array, joined with `<br/>` or returned as `[{line,key}]` when `list=true`) → `.message` → `.error` → raw string body. Anything unknown or HTTP 500 returns a hard-coded apology with a `mailto:` to `getSupportEmailAddress()` (resolved from [container.constants.js](../src/constants/container.constants.js)).

## Where the fallback page is mounted

**Nowhere.** `AcFallbackErrorPage` is exported from [views/index.js#L17-L19,L71](../src/views/index.js#L17-L19) and imported in [App.web.js#L18](../src/App.web.js#L18), but no `<Route>` references it, no `ErrorBoundary` wraps it, and no other component renders it. It's dead at the route layer.

The route tree in [App.web.js#L254-L305](../src/App.web.js#L254-L305) has only:
- the static routes from `ROUTES`,
- a `/logout` route,
- a `path='*'` catch-all → `AcContent` (CMS-page lookup, not the fallback page).

Runtime errors that React doesn't catch surface as a blank screen; route misses surface as the CMS catch-all's own empty/loading state. The "Oeps!" view exists as a component but isn't reachable through normal app navigation.

## Rollbar

Rollbar error tracking is listed as an ours-only feature in the project overview. In this category's files: **not visible**. The package is in `package.json` (`rollbar`, `rollbar-sourcemap-webpack-plugin`), `process.env.ROLLBAR_KEY` / `ROLLBAR_ENVIRONMENT` are read into [config/index.js#L79-L84](../src/config/index.js#L79-L84), and `ENABLE_ROLLBAR` is a container constant — but no `new Rollbar(...)`, no `Provider`, no `errorHandler` exists in `src/`. The integration is **scaffolded but not wired**, same status as the fallback page.

## Observations

1. **Fallback page is dead code.** Imported but never rendered. Either wire it to a React `ErrorBoundary` (around `<Routes>` in `App.web.js`) and/or a 404 route, or delete it. Currently it pulls its own bundle for nothing.
2. **No React ErrorBoundary anywhere.** Component-level render errors blank the page. The fallback view is shaped to be a perfect boundary fallback — pairing them is the obvious cleanup.
3. **Rollbar config without integration.** Three env-vars and a feature flag exist, but nothing instantiates the SDK. Either wire it (likely inside the ErrorBoundary mentioned above) or strip the config + dependency. Worth confirming with the team before deleting — may be intentionally left for production-only injection.
4. **Token refresher's `expires_in` math is suspect.** `interceptors.api.js#L19` builds `expires_in` as `dayjs().add(2, 'minutes')` but the docstring on L18 says "10 minutes". Cosmetic; the value compared against `expires_at` is consistent. Flagging only because the comment is misleading.
5. **Response interceptor lives in `api/index.js`, not `interceptors.api.js`.** Name is misleading — the file only contains the request-side refresh logic. If anyone goes looking for the 401 handler by filename, they'll miss it.

## Recommendation

**Keep all four files** — Acato has no equivalents, this is purely an inventory.

Local debt notes (not part of the Acato merge):
- Wire `AcFallbackErrorPage` into a React `ErrorBoundary` around `<Routes>` in `App.web.js`, **or** delete it together with its SCSS and the `views/index.js` export.
- Decide whether to finish the Rollbar wiring (init in `index.web.js`, hand the instance to the ErrorBoundary) or drop the dependency + env-vars.
- Rename `interceptors.api.js` to `token-refresher.api.js` or move the response interceptor in from `api/index.js` so the filename matches its contents.

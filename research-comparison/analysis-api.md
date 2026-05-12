# Analysis: API layer

## Branches Compared
- Ours (tilburg-woo-ui): `softwarecatalogus-performance`
- Acato (tilburg-woo-ui_acato): `main`

## Files Compared

**Both (5 files):**
- `src/api/index.js`
- `src/api/faqs.api.js`
- `src/api/pages.api.js`
- `src/api/publications.api.js`
- `src/api/themes.api.js`

**Ours only (7 files):**
- `src/api/auth.api.js`
- `src/api/authentication.api.js`
- `src/api/gemma.api.js`
- `src/api/interceptors.api.js`
- `src/api/menu.api.js`
- `src/api/mijnOmgeving.api.js`
- `src/api/aangebodenGebruik.api.js`

**Acato only (2 files — already covered cross-cutting in `analysis-themes-categories.md`):**
- `src/api/categories.api.js`
- `src/api/terms.api.js`

---

## What is the same

The four lightweight resource clients all follow the same constructor + thenable shape:

```js
constructor(Instance) {
  this.Store = Instance.Store;
  this.Client = Instance.Client;
}

method(...) {
  return this.Client.get(ENDPOINTS.X).then((response) => response.data);
}
```

Identical or near-identical files:

- **`src/api/pages.api.js`** — byte-identical (`list()`, `single(id)`).
- **`src/api/themes.api.js`** — byte-identical (`list()`).
- **`src/api/faqs.api.js`** — functionally identical (`list()`, `single(id)`). Only diff: import path — ours uses `@constants` (barrel), Acato uses `@constants/endpoints.constants` (direct).
- **`src/api/publications.api.js`** — shared methods (`search`, `attachments`, `single`, `themes`, `searchAggregations`) are line-for-line identical. Ours adds two extra methods (see below).

Both repos build their root `API` class identically at the top level: `axios.create(config)` + per-resource sub-API instances exposed on `this`.

---

## What differs

### 1. `src/api/index.js` — substantial architectural divergence

**Acato (38 lines, lean):**
- Three separate axios clients: `Client` (default), `PublicationsClient`, `ThemesClient` — each built from a distinct `config.api` / `config.publications` / `config.themes` section.
- No interceptors. No token refresh. No request cancellation. No upload/download progress hooks.
- Wires 6 sub-APIs: `publications`, `faqs`, `pages`, `themes`, `categories`, `terms`.

**Ours (126 lines, heavy):**
- **One** shared `Client` for all resource APIs (publications and themes ride on it too), plus a separate `DownloadClient` (with `onDownloadProgress`) and `UploadClient` (with `onUploadProgress`).
- Wires interceptors on *every* client (`addInterceptors(Client)`):
  - **Response interceptor**: vibrates the device on error, treats HTTP 401 as a global unauthenticated event (`window.dispatchEvent(new CustomEvent('unAuthenticate'))`) and cancels outstanding requests.
  - **Request interceptor**: pre-flights an `AcTokenRefresher` (see `interceptors.api.js`) before each request, attaches a `CancelToken`, and registers it in a module-level `_errorTokens` list so a `cancelRequests` custom event can abort all in-flight requests.
- Wires 10 sub-APIs: `auth`, `publications`, `faqs`, `pages`, `themes`, `menu`, `authentication`, `mijnOmgeving`, `gemma`, `aangebodenGebruik`.

Implications:
- Acato is a read-only public portal — no auth, no global unauth handling, no request lifecycle plumbing needed.
- Our axios layer is doing real session work: silent refresh, mass-cancel on 401, upload/download progress. Hard to delete.
- The split-clients pattern in Acato (`PublicationsClient` vs `ThemesClient`) suggests their backend hosts publications and themes on different bases. Ours collapses everything onto a single `config.api` base — likely because the OpenCatalogi backend serves all endpoints uniformly.

### 2. `src/api/publications.api.js` — two extra methods in ours

Ours adds:

```js
relations(uri) {
  return this.Client.get(ENDPOINTS.PUBLICATIONS.RELATIONS(uri))
    .then((response) => response.data.results);
}

used(id) {
  return this.Client.get(ENDPOINTS.PUBLICATIONS.USED(id))
    .then((response) => response.data);
}
```

- `relations(uri)` — fetches related publications for a given URI. Note: returns `.data.results` (not `.data`) — implies a wrapped envelope on that endpoint.
- `used(id)` — fetches a "where is this used" inverse-reference list for a publication.

Both feed our richer publication detail view (per `analysis-publication-detail.md`) — Acato's simpler portal has no need for "related" or "used by" tabs.

---

## Only in ours

Seven additional resource clients. Quick map of what each does and which feature uses it:

| File | Purpose | Owner category |
|------|---------|----------------|
| `auth.api.js` | OAuth password grant (`login`, `register`, `logout`, `forgot_password`, `reset_password`) **and** OpenConnector session endpoints (`sessionLogin`, `sessionLogout`, `getUserProfile`, `updateUserProfile`). Pulls `client_id`/`client_secret`/`grant_type` from `AUTH_KEYS`. | 14 Auth |
| `authentication.api.js` | Read API mirroring `publications.api.js` shape (`search`, `single`, `themes`, `searchAggregations`) but hitting `ENDPOINTS.AUTHENTICATION.*`. Despite the name it's **not** about logging in — it queries an "authentication-protected" publication search (likely auth-required content variants). | 14 Auth |
| `gemma.api.js` | GEMMA / Archimate viewer endpoints: `views`, `view(id)`, `modules`, `allVoorzieningGebruik`, `elementReferences`. Note `view()` builds its own querystring manually with `URLSearchParams` — inconsistent with the `{ params }` pattern everywhere else. | 16 Chat & GEMMA |
| `interceptors.api.js` | `AcTokenRefresher` + `AcRefreshIfRequired`. Reads `expires_at`/`refresh_token` from storage via `AcGetState`, refreshes 2 minutes before expiry, posts to `ENDPOINTS.OAUTH.REFRESH`, persists new `access_token`/`refresh_token`/`expires_at`/`expires_in`. Has a module-level `busy` flag to dedupe concurrent refresh attempts. | 14 Auth / 27 Error handling |
| `menu.api.js` | `list()` (with hard-coded `_limit: 100`), `single(id)`. Drives the dynamic menu store. | 7 Navigation |
| `mijnOmgeving.api.js` | Same shape as `publications.api.js` (`search`, `single`, `themes`, `searchAggregations`) but hitting `ENDPOINTS.MIJN_OMGEVING.*`. Used by the "my environment" personal dashboard view. | 26 User account |
| `aangebodenGebruik.api.js` | Per-organization gebruik suggestions: `getAfnemerGebruiks`, `getDeelnemersGebruiks`, `claimGebruik`, `denyGebruik`, `getKoppelingenGebruiks`, `getAanbod`, `acceptAanbod`, `denyAanbod`, `getDocs`. Only file in the API folder with JSDoc on every method. | 24 Forms & wizards |

### Observations on internal consistency (within our API layer)

- **Three different file naming styles**: `auth.api.js`, `authentication.api.js`, `mijnOmgeving.api.js`, `aangebodenGebruik.api.js`. Camel-case vs. flat lowercase isn't harmonised.
- **Two near-duplicate "search-style" clients**: `publications.api.js`, `authentication.api.js`, `mijnOmgeving.api.js` all expose the same four methods (`search`/`single`/`themes`/`searchAggregations`) hitting different endpoint roots. A small `createSearchAPI(endpointRoot)` factory would collapse three files into one.
- **One outlier query-string builder**: `gemma.api.js → view()` builds its own `URLSearchParams` instead of using axios `{ params }`. No reason given.
- **`Store` is captured but never used**: every sub-API does `this.Store = Instance.Store` and then never reads it. Dead constructor argument. Same pattern in Acato — inherited convention.

---

## Only in Acato

- **`categories.api.js`** + **`terms.api.js`** — already covered in `analysis-themes-categories.md` §"Only in Acato". Restating briefly:
  - `categories`: `list()` and `single(id)` for `/api/public/categories`. Drives the home-page category cards and the `ac-sections-handler` section variant.
  - `terms`: `list()`, `single(id)`, `getForPublication()` for `/api/public/terms`. Acato's glossary precursor — see category 17 analysis for the merge story.

Both follow the same lean class shape as `pages.api.js`/`themes.api.js`. There is nothing API-layer-specific to decide here that wasn't already handled in the themes/categories analysis.

---

## Recommendation

For each difference:

1. **Faqs import path (`@constants` vs `@constants/endpoints.constants`)** — **Keep ours**. Barrel import is consistent with how every other file in our `src/api/` does it. Acato's direct import is fine but not worth a churn.

2. **Extra `relations()` and `used()` methods on `PublicationsAPI` (ours)** — **Keep ours**. They're feature-required by our publication detail view and have no upstream equivalent.

3. **Single shared `Client` vs Acato's split `PublicationsClient`/`ThemesClient`** — **Needs decision tied to backend.** Acato's split exists because their backend serves publications/themes at different bases. Our single client works because OpenCatalogi serves uniformly. *Do not adopt Acato's split unless our backend topology changes.*

4. **Interceptor stack (token refresh, mass-cancel-on-401, vibrate-on-error, upload/download progress)** — **Keep ours**. These are required by features Acato doesn't have (auth, uploads, file downloads). Non-negotiable.

5. **Auth/authentication/menu/mijnOmgeving/gemma/aangebodenGebruik APIs** — **Keep ours**, no upstream analogue. Each is bound to a category-tracked feature (auth, navigation, user account, GEMMA, forms).

6. **Internal cleanup candidates (independent of Acato merge)** — flag for follow-up, **not** merge decisions:
   - Factor `search` / `single` / `themes` / `searchAggregations` into a shared helper or base class — three near-duplicate files (`publications`, `authentication`, `mijnOmgeving`).
   - Make `gemma.view()` use axios `{ params }` like everywhere else.
   - Drop the unused `this.Store = Instance.Store` from every sub-API constructor (Acato shares this inheritance — could be done upstream too).
   - Decide on a single file-naming convention (`mijn-omgeving.api.js` vs `mijnOmgeving.api.js`, etc.).

7. **Acato's `categories` and `terms` APIs** — **Defer to themes/categories and glossary analyses**. No API-layer-only action needed.

### Items that warrant a human decision (not just technical)

- Whether to adopt Acato's `categories` data layer (covered in `analysis-themes-categories.md` §10a) — relevant here only because it adds a new sub-API.
- Whether the proposed `createSearchAPI(endpointRoot)` refactor in §6 is in scope for the merge phase or a separate cleanup pass.

# Analysis: Constants & app configuration

## Branches Compared
- Ours (tilburg-woo-ui): `softwarecatalogus-performance`
- Acato (tilburg-woo-ui_acato): `main`

## Files Compared

**Both — `src/constants/` (18 files):**
- `auth.constants.js`
- `breadcrumbs.constants.js`
- `datetime.constants.js`
- `endpoints.constants.js`
- `environments.constants.js`
- `icons.constants.js`
- `index.js`
- `keys.constants.js`
- `labels.constants.js`
- `messages.constants.js`
- `mimetypes.constants.js`
- `risks.constants.js`
- `roles.constants.js`
- `routes.constants.js`
- `themes.constants.js`
- `titles.constants.js`
- `toasters.constants.js`
- `visuals.constants.js`

**Both — `src/config/` (3 files):**
- `index.js`
- `locale.js`
- `moment.js`

**Ours only — `src/constants/` (4 files):**
- `container.constants.js`
- `languages.js`
- `mock.data.constants.js`
- `wizards.constants.js`

**Ours only — `src/config/` (2 files):**
- `currencymap.js`
- `i18n.js`

**Acato only:** none.

---

## What is the same

### Byte-identical files (8)

These files are line-for-line identical across the two repos:

- `src/constants/auth.constants.js` — `AUTH_KEYS` (access/refresh/userdata) + `AUTH_MODES` (login/register/forgot/recover).
- `src/constants/datetime.constants.js` — `DATETIME_FORMATS` (ISO_8601, EU date/time formats).
- `src/constants/environments.constants.js` — `ENVIRONMENTS` enum (`development`, `staging`, `production`).
- `src/constants/messages.constants.js` — `LOADING_MESSAGES` + `ADDITIONAL_ERROR_MESSAGE`.
- `src/constants/mimetypes.constants.js` — file MIME type map.
- `src/constants/risks.constants.js` — `RISKS` / `RISK_LEVEL` enums.
- `src/constants/roles.constants.js` — single `ROLES.USER` entry.
- `src/constants/toasters.constants.js` — `TOASTER_TYPES` (success/info/warning/error).

### Whitespace-only differences (2)

The contents are semantically identical; only indentation differs (Acato uses tabs, ours uses 2 spaces — likely from a prettier reformat on our side):

- `src/constants/themes.constants.js` — `POSITIONS`, `SIZES`, `THEMES`, `TYPES`, `VARIANTS`.
- `src/constants/icons.constants.js` — full ICONS map (~150 Material Design Icons keys).

### Mostly the same

- `src/constants/keys.constants.js` — same 108-line key map; two changes (see below).
- `src/constants/index.js` — same barrel; ours adds 2 extra exports.

---

## What differs

### 1. `src/constants/keys.constants.js` — two changes

- `SUPPORT_EMAIL_ADDRESS`: `'contact@acato.nl.nl'` (Acato — has a double `.nl.nl` typo) → `'contact@tilburg.nl'` (ours).
- Adds `USER_GROUP: 'user_group'` (ours) alongside the existing `USER_ROLE: 'user_role'` (kept with a `// Kept for backward compatibility` comment).

### 2. `src/constants/index.js` — two extra exports

Ours adds:
- `AUTHENTICATION_REQUIRED_ROUTES` from `routes.constants` (route guards list).
- `LANGUAGES` from `./languages` (the new locale list, see "Only in ours").

### 3. `src/constants/breadcrumbs.constants.js` — Acato has the minimal portal trail; ours adds the full app

**Acato (19 lines):** 3 items (`HOME`, `SEARCH`, `THEMES`) + 5 breadcrumb builders (`HOME`, `SEARCH`, `CONTENT`, `THEMES`, `PUBLICATION`).

**Ours (123 lines):** Adds breadcrumb items for `LOGIN`, `FORGOT_PASSWORD`, `MIJN_OMGEVING`, `GEMMA`, `NEXTCLOUD_LOGIN`, `BEHEER`, `BEHEER_MY_ACCOUNT`, `BEHEER_MODULE`, `BEHEER_MY_ORGANISATION`, `BEHEER_LIST(type)` (dynamic), `REGISTER`, `VIEWS`, `VIEWS_LIST`, `BEHEER_VIEWS`, `DIRECTORY`, `PUBLICATIE`. Adds matching `BREADCRUMBS.*` builders, plus a `PUBLICATION(label, schema)` builder that resolves a schema slug to a friendly Dutch label via `normalizeSchemaName`.

One subtle diff in the shared `BREADCRUMBS.SEARCH(label)` builder:
- Acato: appends `{ label, href: '/zoeken' }` — the inner label is a clickable link back to search.
- Ours: appends `{ label }` only — the inner label is plain text (not clickable).

### 4. `src/constants/endpoints.constants.js` — completely different API shape

**Acato (45 lines):** 5 resource groups (`PUBLICATIONS`, `THEMES`, `FAQS`, `PAGES`, `CATEGORIES`, `TERMS`) built from string constants (`API`, `PUBLIC`, `API_CONDUCTION` = `/api`, etc.). Publication detail: `${API_CONDUCTION}${PUBLICATIONS}/${_id}?extend%5B%5D=themes&extend%5B%5D=catalog`.

**Ours (73 lines):** 11 resource groups: `OAUTH`, `OPENCONNECTOR`, `PUBLICATIONS`, `MIJN_OMGEVING`, `AUTHENTICATION`, `FAQS`, `PAGES`, `THEMES`, `GEMMA`, `MENU`, `AANGEBODEN_GEBRUIK`. Endpoints are hard-coded relative paths instead of being built from base constants:
- `PUBLICATIONS.SEARCH` = `/opencatalogi/api/publications`
- `PUBLICATIONS.SINGLE(id)` = `/opencatalogi/api/publications/${_id}?_extend=_schema,_register,themes,contactpersoon,compliancy`
- `PUBLICATIONS.RELATIONS(uri)`, `PUBLICATIONS.USED(id)` — new
- `THEMES.INDEX` = `/opencatalogi/api/themes` (no `${SEARCH}` prefix as in Acato)
- Adds `GEMMA.*` (views, elements, relationships, voorzieningen, modules), `MENU.*`, `AANGEBODEN_GEBRUIK.*`, `OAUTH.*`, `OPENCONNECTOR.*`.

Ours drops `CATEGORIES` and `TERMS` (Acato uses them via separate `categories.api.js` / `terms.api.js`; we replaced this with the unified `publications` + `themes` flow per [analysis-themes-categories.md](./analysis-themes-categories.md)).

### 5. `src/constants/labels.constants.js` — branding + bugs + Beheer/auth labels

**App-wide branding diffs:**
- `APP_NAME`: `'Publicaties Gemeente Tilburg'` (Acato) → `'Open Tilburg'` (ours).
- `ENTER_QUERY`: `'Vul je zoekterm in'` → `'Zoek op naam of trefwoord'`.
- `CATEGORIES`: `'Welke documenten vind je hier?'` → `'Categorieën'`.
- `CATEGORIES_EXPLAIN`: `'Op deze website zijn alle openbare documenten van de gemeente Tilburg te vinden.'` → `'Bekijk de verschillende categorieën'` (generic; Tilburg-specific text removed).
- `WHAT_ARE_YOU_LOOKING_FOR`: `'Waar ben je naar op zoek?'` (informal "je") → `'Waar bent u naar op zoek?'` (formal "u").
- `VIEW_ALL_THEMES`: `'Toon alle onderwerpen'` → `'Bekijk alle onderwerpen'`.
- `THEMES`: `'Zoeken op onderwerp'` → `'Onderwerpen'`.

**Likely-unintentional regressions in ours:**
- `SEARCH_RESULTS_LOADED`: `'Zoekresultaten geladen'` (Acato, correct) → `'Zoekresulten geladen'` (ours — typo, missing `ta`). Worth fixing.
- Removed (only in Acato): `SOURCE: 'Bron'`, `SEARCH_DATE_FILTER: 'Zoek op gekozen datum'`, `SEARCH_DATE: 'Publicatiedatum'`, `THEMES_BUTTON: 'Onderwerpen'`. The date-related ones may have been collateral when the WOO date facet was dropped; confirm with the search view code before deciding.

**Added in ours (new feature surface):**
- `AUTHENTICATION: 'Login'`, `MIJN_OMGEVING: 'Mijn omgeving'`, `GEMMA: 'GEMMA'`, `MIJN_ACCOUNT: 'Mijn account'`
- `BEHEER: 'Beheer'`, `BEHEER_TYPE: 'Beheer Type'`, `BEHEER_TYPE_DETAILS: 'Beheer Type Details'`
- `REGISTER: 'Aanmelden'`, `DIRECTORY: 'Directory'`, `FORGOT_PASSWORD: 'Wachtwoord vergeten'`
- `NEXTCLOUD_LOGIN`, `NEXTCLOUD_AUTHORIZATION`
- `WRONG_PAGE: '404 | Deze pagina bestaat niet'`

### 6. `src/constants/titles.constants.js` — runtime hostname-aware title in ours

**Acato (21 lines):** `TITLES.BASE = 'Open Tilburg'` as a fixed string, plus the standard label set.

**Ours (79 lines):** `TITLES.BASE` is computed at module load time:
1. Reads from `container.constants` (`getTitle()`) when generated config is present.
2. Otherwise falls back to a hostname `switch` matching ~15 known deployment domains (`vng.opencatalogi.nl`, `open-tilburg.accept.commonground.nu`, `dimpact.opencatalogi.nl`, `horstadmaas.accept.opencatalogi.nl`, etc.) — each returns its own brand string.
3. Guarded by `AcCheckIfSpecificHostname()` (so localhost dev keeps a static default).

Also adds: `ACTIVATE`, `CONVERSATIONS`, `DOCUMENTS`, `NEWS`, `NEW_CONVERSATION`, `PROFILE`, `TERMS_CONDITIONS`, `DIRECTORY`.

Drops `SITEMAP` (Acato has a sitemap view we don't carry over).

**Two probable regressions:**
- `REACH_OUT`: `'Bereikbaarheidsgegevens'` (reachability, Acato) → `'Beschikbaarheidsgegevens'` (availability, ours). Either a typo or a deliberate term change — semantic shift either way.
- The same hostname `getTitle()` block is duplicated verbatim in `routes.constants.js` (see below).

### 7. `src/constants/routes.constants.js` — order-of-magnitude divergence (185 → 674 lines)

**Acato (185 lines):**
- `PATHS`: 13 paths, mostly external CMS links (`COOKIES`, `PRIVACY`, `PROCLAIMER`, `WEBSITE`, `WOO`, `REACH_OUT`, `ORGANIZATION`, `FAQ`, `CONTACT`, `ABOUT`, `ACCESSIBILITY`) + `HOME`, `PUBLICATION`, `SEARCH`/`SEARCH_STATIC`, `SITEMAP`.
- `NAVIGATE_TO`: just `PUBLICATION(id)`.
- `ROUTES`: 14 entries with stable string IDs (`'route-home'`, `'route-publication'`, etc.), most pointing at external CMS URLs via `href` + `isExternal`.
- `NAVIGATION_ITEMS = [ROUTES.HOME]`.
- Footer groups: `FOOTER_PRIMARY_ABOUT`, `FOOTER_PRIMARY_QUICK`, `FOOTER_SECONDARY` — all wired to CMS external URLs.
- `THEMES` route is commented out.

**Ours (674 lines):**
- `PATHS`: ~30 paths. All CMS external URLs are gone (`ABOUT`, `ACCESSIBILITY`, `CONTACT`, `FAQ`, `ORGANIZATION`, `COOKIES`, `PRIVACY`, `PROCLAIMER`, `WEBSITE`, `WOO`, `REACH_OUT`, `SITEMAP` removed — replaced by `// CMS-driven routes removed: ...` comments). New paths: `AUTHENTICATION_STATIC`, `PASSWORD_REMINDER_STATIC`, `MIJN_OMGEVING_STATIC`, `GEMMA_STATIC`, `THEMES` (uncommented), `NEXTCLOUD_LOGIN`, `NEXTCLOUD_AUTHORIZATION`, `BEHEER` + `BEHEER_VIEW` + `BEHEER_TYPE` + `BEHEER_TYPE_DETAILS` + `BEHEER_VIEWS` + `BEHEER_VIEWS_DETAIL` + `BEHEER_VIEW_DETAIL`, `OBJECTS`, `REGISTER` + `AANMELDEN`, `FORMS` (+ `FORMS_REGISTER`, `FORMS_GEBRUIK`, `FORMS_GEBRUIK_APPLICATIE`/`KOPPELING`/`DIENST`, `FORMS_PRODUCT`, `FORMS_APPLICATIE`, `FORMS_KOPPELING`, `FORMS_DIENST`), `VIEWS` + `VIEWS_LIST` + `EXTENDEDVIEW`, `DIRECTORY`, `CHAT`.
- `NAVIGATE_TO`: ~10 builders for beheer/view detail routes.
- `ROUTES`: ~30 entries. Components wired in (`AcRegister`, `ConFormsIndex`, `AcBeheer`, etc.).
- Tenant-specific footer config: `VNG_ROUTES_SITEMAP/INFORMATIE/BEDRIJVEN` + matching `VNG_FOOTER_ITEMS_*` arrays, plus `DIMPACT_ROUTES_WHAT_WE_DO/WHO_WE_ARE/INFORMATION` + matching `DIMPACT_FOOTER_ITEMS_*` arrays.
- `FOOTER_PRIMARY_ABOUT = [ROUTES.SEARCH, ROUTES.THEMES]` (no CMS routes); `FOOTER_PRIMARY_QUICK = []`; `FOOTER_SECONDARY = []`; `EXTERNAL_LINKS = []` — all CMS-driven external links left empty for OpenCatalogi to populate.
- Adds `AUTHENTICATION_REQUIRED_ROUTES = [PATHS.BEHEER, PATHS.BEHEER_TYPE, PATHS.BEHEER_TYPE_DETAILS, PATHS.BEHEER_VIEWS, PATHS.BEHEER_VIEWS_DETAIL, PATHS.BEHEER_VIEW_DETAIL]` — used by `ac-protected-route`.

**Notable behavioural change in ours:**
- All route IDs are now `AcUUID()` (generated at module load) instead of stable strings like `'route-home'`. Each entry produces a new ID per page-load. This breaks any code that compares routes by ID across reloads (e.g., serialized state, deep links, route-keyed caches). Worth grepping for any `route.id` consumers before relying on this — and worth considering whether the stable string IDs should be restored.
- Every `title` uses the duplicated hostname switch `AcCheckIfSpecificHostname() ? getTitle() : 'Open Tilburg'` instead of `TITLES.BASE`. The same `getTitle()` block appears in both `routes.constants.js` and `titles.constants.js`. This is duplicated logic.

### 8. `src/constants/visuals.constants.js` — WOO icon set replaced with the softwarecatalogus icon set

**Removed in ours (Acato-only WOO document type icons):**
- `CONVENANT`, `GOVERNANCE_DOCUMENT` (`bestuursstuk.svg`), `ORGANIZATION` (`organisatie.svg`), `REACHABILITY` (`bereikbaarheidsgegevens.svg`), `COUNCIL_DOCUMENT` (`raadsstuk.svg`), `WOO_REQUEST` (`woo-verzoek.svg`).

**Added in ours (~55 icons for admin/auth/softwarecatalogus features):** `ARROW_LEFT`, `CHEVRON_LEFT`, `QUESTION_MARK_VNG`, `GITHUB`, `COMMON_GROUND`, `KEY`, `PERSON_ADD`, `WORLD`, `USER`, `USERS`, `USER_PLUS`, `USER_XMARK`, `USER_CHECK`, `BUILDING`, `TRUCK`, `CUBE`, `CUBES`, `HAND_HOLDING`, `HOUSE`, `PHONE`, `DOWNLOAD`, `UPLOAD`, `CLOUD`, `CIRCLE_CHECK`, `CIRCLE_EXCLAMATION`, `HAND_SHAKE`, `SAVE`, `TRASHCAN`, `TRIANGLE_EXCLAMATION`, `RIGHT_FROM_BRACKET`, `PLUS`, `PENCIL`, `CHART_LINE`, `SPINNER`, `CIRCLE_XMARK`, `EYE`, `EYE_SLASH`, `ELLIPSIS`, `SORT`, `SORT_UP`, `SORT_DOWN`, `CLIPBOARD_CHECK`, `PAPER_PLANE`, `XMARK`, `PUBLISH`, `PUBLISH_OFF`, `LINK`, `MINUS`, `ENVELOPE`, `ENVELOPES_BULK`, `WAND_SPARKLES_SOLID`, `ROTATE_RIGHT` (aliased to `RELOAD`), `USER_CIRCLE`, `ENVELOPE_OUTLINE` (aliased to `EMAIL_OUTLINE`), `SCROLL`, `NETWORK_STRENGTH_4_COG`, `GEAR`. Several entries carry `EMAIL`/`EMAIL_OUTLINE`/`RELOAD` aliases for backwards-compatible callsite naming.

Also notable: a comment in ours reads `// this is some weird stuff that Acato made, and I have no clue how it works, but it works...` — kept verbatim. Harmless but informal.

### 9. `src/config/index.js` — runtime container config + auth headers

**Acato (~121 lines):** Two base URLs read from `process.env.API_URL` and `process.env.API_URL_COMMONGROUND` at build time. Adds an `Authorization: ${API_URL_COMMONGROUND_TOKEN}` header only when the URL is not HTTPS. Six axios sub-configs: `api`, `publications`, `themes`, `faqs`, `pages`, `upload`. Sets `credentials: true` (note: this is **not** an axios option — should be `withCredentials`; a latent bug in Acato that we fixed).

**Ours (~258 lines):**
- `baseURL` for every sub-config is a **getter** that calls `apiUrl()` / `commongroundApiUrl()`, which read from `@constants/container.constants` (`getApiUrl()` / `getCommongroundApiUrl()`). Both fall back to `/api/apps` and log a warning if the runtime container constants module is missing. This is the runtime-config pattern that lets the same image be deployed to multiple tenants.
- Replaces Acato's broken `credentials: true` with the correct `withCredentials: true` for the `api` and `upload` sub-configs.
- The `api.transformRequest` array now attaches an `Authorization: Bearer <token>` header via `AcGetAccessToken()` on every request, with a `Basic <base64(user:pass)>` fallback pulled from `window.app.store.user.basicAuthCredentials` (a `// TODO: Implement Bearer token endpoint in OpenConnector to replace basic auth` is left in place).
- Adds 5 new axios sub-configs: `authentication`, `mijnOmgeving`, `menus`, `gemma`, `download` (the last with `onDownloadProgress` plumbing).

This is a fairly invasive change to a shared file. Tied to our auth + multi-tenant deployment model.

### 10. `src/config/locale.js` — IE-compatibility shim

One line added in ours:

```js
return window.navigator.userLanguage || window.navigator.language || 'nl-NL';
```

`userLanguage` is the legacy IE-only property. Harmless backwards-compat fallback; modern browsers ignore it.

### 11. `src/config/moment.js` — pull locale from state, not constant

- Acato: `getLocale() => 'nl-NL'` (hard-coded).
- Ours: `getLocale() => AcGetState(KEYS.LOCALE) || 'nl-NL'`. Reads the user's saved locale from `AcStorage` (set by `i18n.js`, see "Only in ours"). Indentation is also reverted to tabs in ours — minor cosmetic inconsistency with the project's 2-space convention.

---

## Only in ours

### `src/constants/container.constants.js` (118 lines)

Auto-generated module dropped into the repo at container startup by `scripts/generate-container-constants.js` (the file's own header says *"DO NOT EDIT MANUALLY"*). Wraps `CONTAINER_CONFIG` with `AcLockObject` and exposes ~25 helper getters consumed by `titles.constants.js`, `routes.constants.js`, `config/index.js`, etc.

Categories of config it surfaces:
- **Site identity**: `SITE_TITLE`, `SITE_DESCRIPTION`, `SITE`, `MODE`, `THEME_VARIANT`, `FAVICON_URL`, `ENVIRONMENT_NAME`.
- **API**: `BASE_URL`, `BASE_URL_COMMONGROUND` (in practice unified to one URL — both `getApiUrl()` and `getCommongroundApiUrl()` read from `BASE_URL`).
- **Auth**: `GRANT_TYPE`, `CLIENT_ID`, `CLIENT_SECRET`, `PROVIDER` (`'nextcloud'`), `REGISTER_URL`, `AUTO_LOGOUT`, `AUTO_LOGOUT_TIME`, `SESSION_TIMEOUT`, `ACTIVITY_PING`.
- **Feature flags**: `ENABLE_AUTHENTICATION`, `ENABLE_GEMMA`, `ENABLE_DIRECTORY`, `ENABLE_ROLLBAR`, `ENABLE_MOCK_THEMES`, `ENABLE_BREADCRUMBS`.
- **External CMS URLs**: `EXTERNAL_WEBSITE_URL`, `EXTERNAL_PRIVACY_URL`, `EXTERNAL_COOKIES_URL`, `EXTERNAL_PROCLAIMER_URL`.
- **Branding & footer**: `HERO_IMAGE_URL`, `FOOTER_STYLE`, `FOOTER_LOGO_TITLE`, `FOOTER_LOGO_SUBTITLE`, `SUPPORT_EMAIL_ADDRESS`.
- **Search/Chat**: `DEFAULT_SEARCH_SCHEMA`, `CHAT_ENDPOINT`, `CHAT_TITLE`, `CHAT_DESCRIPTION`.
- **Rollbar**: `ROLLBAR_KEY`, `ROLLBAR_ENVIRONMENT`.
- **Nginx-side proxy config** (curious — these are baked into the JS bundle even though they only matter to nginx): `NGINX_ROOT_DIR`, `NGINX_OPENCONNECTOR_UPSTREAM`, `NGINX_NEXTCLOUD_UPSTREAM`, `NGINX_NEXTCLOUD_DOMAIN`, `NGINX_TARGET_HOST`.

This is the linchpin of our multi-tenant runtime-config strategy and is depended on by `titles.constants.js`, `routes.constants.js`, `config/index.js`, and (per the file-category index) Helm + nginx templates.

### `src/constants/languages.js` (125 lines)

Single `LANGUAGES` export listing ~120 ISO `{ name, code }` entries (e.g. `{ name: 'Nederlands', code: 'NL-nl' }`). File header: `// TODO: this might change depending on how Nextcloud handles languages`. Used by the Nextcloud auth / register flows. Project-specific to the auth feature; no Acato equivalent.

### `src/constants/mock.data.constants.js` (76 lines)

`MOCK_CONCEPTS` with Dutch ecology / sustainability terms — fixture data for the glossary feature, used while the real backend was being wired up. Dev artifact; should probably be cleaned up post-launch, but harmless to keep for now.

### `src/constants/wizards.constants.js` (245 lines)

`DASHBOARD_WIZARDS` config object that drives the homepage wizard tiles (`EIGEN_APPLICATIE`, `EIGEN_KOPPELING`, etc.). Each entry combines a `VISUALS.*` icon with a `PATHS.FORMS_*` route, plus `requiresAuth` / `requiresOrganization` / `groupTypes` access flags. Specific to the registration-wizard feature we built on top of Acato's portal; no Acato equivalent.

### `src/config/currencymap.js` (31 lines)

`SYMBOLS` map for `EUR`, `GBP`, `USD` with native symbol, decimal/thousand separators and `decimal_digits`. Consumed by `ac-format-currency` / `ac-format-local-currency` utilities. Dead code in this project: nothing in the portal renders prices. Likely carried over from a parent template.

### `src/config/i18n.js` (47 lines)

Sets up `i18next` + `react-i18next` with `en` and `nl` translation bundles loaded from `@assets/locales/{en,nl}/translation`. Picks the language from `AcGetState(KEYS.LOCALE)`, defaulting to `nl` and persisting back via `AcSaveState`. Imports `reactI18nextModule` from the legacy `react-i18next` API — this is from before the hook API existed and is a candidate for a small modernization. No Acato equivalent (Acato is Dutch-only and uses hard-coded label strings).

---

## Only in Acato

None — every file present in Acato's `src/constants/` and `src/config/` also exists in ours (with the differences described above).

The only conceptual things Acato has that we don't:
- `TITLES.SITEMAP` + `PATHS.SITEMAP` + `ROUTES.SITEMAP` (covered in the sitemap view, see [analysis-home-views.md TODO](./analysis-home-views.md)).
- A few search-related labels (`SOURCE`, `SEARCH_DATE_FILTER`, `SEARCH_DATE`, `THEMES_BUTTON`) — see Recommendation below.

---

## Recommendation

| Concern | Action |
|---|---|
| `keys.constants.js` typo fix `contact@acato.nl.nl` → `contact@tilburg.nl` | **Keep ours.** Bug fix. (Strictly, `SUPPORT_EMAIL_ADDRESS` should come from `CONTAINER_CONFIG.SUPPORT_EMAIL_ADDRESS` per-tenant — there is already a `getSupportEmailAddress()` helper. Worth wiring up so we stop hard-coding `tilburg.nl` in the multi-tenant code path.) |
| `keys.constants.js` `USER_GROUP` added | **Keep ours.** Used by the auth/organization-permissions flow. |
| `breadcrumbs.constants.js` expansion | **Keep ours.** Needed for the additional views we ship. |
| `breadcrumbs.constants.js` `SEARCH(label)` lost the inner href | **Decision needed.** Looks accidental — confirm whether the inner search label should still be a clickable link. If unintentional, take the `href: '/zoeken'` line back from Acato. |
| `endpoints.constants.js` rewrite | **Keep ours.** Required for the OpenCatalogi backend layout. Consider re-introducing some shared base constants (`OPENCATALOGI = '/opencatalogi/api'`, `OPENREGISTER = '/openregister/api'`) to reduce string duplication and make per-tenant overrides easier. |
| `labels.constants.js` typo `Zoekresulten` | **Fix.** Restore Acato's `Zoekresultaten geladen` — almost certainly an accidental regression. |
| `labels.constants.js` removed `SOURCE` / `SEARCH_DATE_FILTER` / `SEARCH_DATE` / `THEMES_BUTTON` | **Needs decision.** Cross-reference [analysis-search.md](./analysis-search.md) — if the date facet and "Bron" label are no longer rendered anywhere, the removal is fine. If they were removed only because the facet wasn't wired up yet, consider restoring. |
| `titles.constants.js` `REACH_OUT: Beschikbaarheidsgegevens` (was `Bereikbaarheidsgegevens`) | **Verify.** "Beschikbaarheid" (availability) vs "Bereikbaarheid" (reachability) have different meanings. The dropped routes mean it isn't user-visible right now, but if it ever comes back, the original Acato wording is more likely the intent. |
| Duplicated hostname `getTitle()` block in `titles.constants.js` and `routes.constants.js` | **Refactor.** Move the switch into `services/ac-check-if-specific-hostname.js` (or a new `services/get-site-title.js`) and have both files import it. This is a maintenance hazard — the two copies will drift. |
| Route IDs changed from stable strings to `AcUUID()` | **Verify and likely revert.** Stable IDs are normally useful for caching, deep links and equality checks. If nothing depends on them being unique-per-load, restore Acato's stable string IDs. |
| `visuals.constants.js` icon expansion | **Keep ours.** The WOO icons can stay removed (the WOO publication type is no longer the portal's focus) and the admin icons are needed by Beheer/forms. |
| `config/index.js` runtime container baseURL + auth `transformRequest` | **Keep ours.** Required for multi-tenant deployment and auth. Bonus: ours also fixes Acato's `credentials: true` → `withCredentials: true` axios option bug — worth flagging upstream to Acato. |
| `config/locale.js` `userLanguage` fallback | **Keep ours.** Trivial and harmless; targets legacy IE only. |
| `config/moment.js` reads locale from `AcStorage` | **Keep ours.** Necessary for the i18n flow. (Re-format with 2 spaces to match the project convention.) |
| `container.constants.js`, `languages.js`, `wizards.constants.js`, `i18n.js` | **Keep ours.** Required by features unique to our fork (multi-tenant config, auth/i18n, wizards). |
| `mock.data.constants.js` | **Verify usage.** If the glossary feature is fully backed by a real API now, delete. Otherwise leave for now. |
| `currencymap.js` | **Verify usage.** Grep for `SYMBOLS`/`AcFormatCurrency`/`AcFormatLocalCurrency` — if unused by the portal, delete to keep the bundle clean. |
| Indentation drift (tabs in Acato → 2 spaces in ours) for `icons.constants.js`, `themes.constants.js`, and the reverse in `config/moment.js` | **Run prettier across the tree.** Pure formatting; do it as a single cleanup pass once the substantive merges are decided so the diff stays readable. |

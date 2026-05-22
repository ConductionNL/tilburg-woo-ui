# Decisions Register

Items flagged by category analyses as needing human (business/product/architecture) judgment rather than a unilateral technical call.

**How this file works:**
- Each open question gets a stable `D-NNN` ID. Analyses reference decisions by ID (e.g. `→ [D-002](DECISIONS.md#d-002)`).
- When a decision is made, move it from **Open** to **Decided** and record the call + date + brief rationale. Don't delete — superseded entries stay for audit.
- New IDs are append-only. Don't renumber.

---

## Open

### D-001
**Title:** Canonical homepage hostname
**Source:** [analysis-dependencies-build.md §6 #2](analysis-dependencies-build.md#6-per-item-recommendations)
**Raised:** 2026-05-22

Ours pins `homepage: "https://open-tilburg.nl"` ([package.json:6](../package.json#L6)); Acato pins `homepage: "https://open.tilburg.nl"` ([their package.json:6](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/package.json#lines-6)).

`homepage` flows into webpack's `publicPath` / `publicUrlOrPath` and into `InterpolateHtmlPlugin` substitutions — it should match the actual production hostname. The two hostnames imply different DNS setups (a registered second-level domain vs a Tilburg subdomain).

**Needed from product:** Which hostname is the live (or intended-live) domain for Open Tilburg?

---

### D-002
**Title:** `@utrecht/component-library-react` major version divergence
**Source:** [analysis-dependencies-build.md §6 #5](analysis-dependencies-build.md#6-per-item-recommendations)
**Raised:** 2026-05-22

| | Ours | Theirs |
|---|---|---|
| Version | `9.0.3` (exact pin) | `^3.0.1-alpha.41` |

This is the React layer of NLDS Utrecht — a major API divergence, not a bump. The `3.0.1-alpha` line on theirs is suspicious (looks like a pre-release of a downgrade), but ours' pin on `9.0.3` may equally be off the NLDS-published current.

Decoupled from the per-component CSS packages ([D-003](#d-003)) — those version independently of this React library.

**Needed:**
- Confirm which version line is canonical against the upstream NLDS publication.
- Decide whether we follow Acato's pin or keep ours.
- If we move, plan the API migration: every site in `src/` importing from `@utrecht/component-library-react` needs to be audited.

---

### D-003
**Title:** `webpack-dev-server` 4 → 5 major bump (timing)
**Source:** [analysis-dependencies-build.md §6 #9](analysis-dependencies-build.md#6-per-item-recommendations)
**Raised:** 2026-05-22

Ours runs `webpack-dev-server ^4.15.1`; theirs is on `^5.2.2`. WDS 5 removed `onBeforeSetupMiddleware` / `onAfterSetupMiddleware` in favor of a unified `setupMiddlewares` API. Our [config/webpackDevServer.config.js:104-125](../config/webpackDevServer.config.js#L104-L125) uses both removed hooks (for `evalSourceMapMiddleware`, `proxySetup`, `redirectServedPath`, `noopServiceWorkerMiddleware`).

**Trade-off:**
- WDS 4.x is still maintained — no urgent security or feature reason to bump.
- The longer we drift, the larger the eventual refactor.

**Recommendation if no objection:** defer until there's a concrete reason (security advisory, missing feature, alignment milestone). Adopt at that point as a single tracked refactor.

**Needed:** confirm the defer is acceptable, or schedule the upgrade.

---

### D-004
**Title:** Retire `bitbucket-pipelines.yml`?
**Source:** [analysis-dependencies-build.md §6 #31](analysis-dependencies-build.md#6-per-item-recommendations)
**Raised:** 2026-05-22

We carry two CI configs:
- [.github/workflows/build-and-deploy.yml](../.github/workflows/build-and-deploy.yml) — active, pushes images to `ghcr.io`.
- [bitbucket-pipelines.yml](../bitbucket-pipelines.yml) — pushes to `$DOCKER_DOMAIN/acato/tilburg-woo-ui` (Acato's registry, from before the fork to Conduction).

The Bitbucket pipeline looks dormant given the registry path, but "looks dormant" is not "is dormant."

**Needed:**
- Verify nothing live still pulls images from `$DOCKER_DOMAIN/acato/tilburg-woo-ui`.
- If confirmed dead, delete the file.

---

### D-005
**Title:** Schema/register-cache warmup guard conditions
**Source:** [analysis-app-entry-routing.md §6 #9](analysis-app-entry-routing.md#6-per-item-recommendations)
**Raised:** 2026-05-22

[App.web.js:75-97](../src/App.web.js#L75-L97) fires `store.object.warmupSchemaCache()` + `warmupRegisterCache()` only when `user.isAuthenticated` is true **and** the current path doesn't start with `/beheer` or `/forms`. The carve-out exists because beheer/forms views already fetch the schemas they need, so warming them at the root would be redundant work.

**Needed:**
- Confirm the carve-out is still accurate as new auth-only paths land (e.g. `/views`, `/chat`, `/objects/*` aren't in the skip-list and *will* trigger the warmup).
- Decide whether the skip-list should be derived from `AUTHENTICATION_REQUIRED_ROUTES` (single source of truth) rather than two hand-maintained `startsWith` calls.

Low-impact (perf, not correctness), but the divergence between the warmup skip-list and the auth-required list is a maintenance trap.

---

### D-006
**Title:** Adopt Acato's `SITEMAP` route + `AcSitemap` view?
**Source:** [analysis-app-entry-routing.md §6 #15](analysis-app-entry-routing.md#6-per-item-recommendations)
**Raised:** 2026-05-22

Theirs declares a `SITEMAP` route at [their routes.constants.js:113-121](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/constants/routes.constants.js#lines-113:121) backed by [views/ac-sitemap/ac-sitemap.js](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/views/ac-sitemap/ac-sitemap.js). Ours has neither.

CLAUDE.md's initial recon hypothesised we removed it during the multi-tenant rework. That needs confirming — there's a SEO/accessibility argument for keeping a public sitemap, and the view itself looks small and self-contained.

**Needed:**
- Was the removal deliberate (and why), or a side-effect of the multi-tenant rebuild?
- If incidental: read [their ac-sitemap.js](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/views/ac-sitemap/ac-sitemap.js), check it doesn't depend on theirs' CMS-route model (it likely renders our `ROUTES` + CMS page list), and adopt.

Cross-link: home/public views category (item 17 of the working list).

---

### D-007
**Title:** `window.app` global as the basic-auth fallback site
**Source:** [analysis-search.md §6 #12](analysis-search.md#6-per-item-recommendations)
**Raised:** 2026-05-22

`publications.store.js`'s `getAuthHeaders()` first tries `getCookie('nextcloud_access_token')` for a Bearer token, then falls back to `window.app.store.user.basicAuthCredentials` for Basic auth ([publications.store.js:32-64](../src/stores/publications.store.js#L32-L64)). The `window.app = { store }` global is set in [index.web.js:23](../src/index.web.js#L23) precisely for this kind of consumer that runs outside the React tree (here, the store itself reaching back to the user store).

This pattern works but couples two stores via a global, and the call site is invisible to anyone reading either store in isolation. It also means the store can't be unit-tested without mocking `window.app`.

**Needed from architecture:**
- Confirm whether the Bearer→Basic fallback is still a live requirement (e.g. for the softwarecatalogus admin flows that don't go through Nextcloud SSO), or a vestige we can drop now.
- If live: decide whether to refactor `getAuthHeaders()` to take the user store as a constructor arg, removing the `window.app` dependency.

Low-impact (works today), but the global is a smell that compounds with `[D-005](#d-005)`-style hidden coupling. Cross-link: [analysis-app-entry-routing.md §4](analysis-app-entry-routing.md#4-only-in-ours) (item #2, `window.app = { store }`).

---

### D-008
**Title:** Verify URL date-filter convention against OpenCatalogi `facetable` config
**Source:** [analysis-search.md §6 #16](analysis-search.md#6-per-item-recommendations)
**Raised:** 2026-05-22

Ours writes date filters as `published[after]=...&published[before]=...` ([publications.store.js:286-300](../src/stores/publications.store.js#L286-L300) and [ac-search-date.js:29-34](../src/components/ac-search-date/ac-search-date.js#L29-L34)). Theirs writes `@self[published][gte]=...&@self[published][lte]=...`.

The OpenCatalogi `facetable` response is the authoritative source for which parameter shape the backend expects. The publications store has comments referencing `@self.published` (e.g. [con-facets-filters.js:573-588](../src/molecules/con-facets-filters/con-facets-filters.js#L573-L588)) so there's a chance the URL parameter shape and the facets-response shape are inconsistent on our side.

**Needed:**
- Inspect a live `fetchFacets` response from our OpenCatalogi backend (`_facets=extend`) and confirm whether the date facet's `queryParameter` is `published[after/before]`, `@self[published][gte/lte]`, or something else.
- If our URL shape doesn't match the backend's expected shape, date filters may be silently ignored on the wire. Worth a runtime check.

Low-effort, potentially significant correctness fix if the URL shape is wrong.

---

### D-009
**Title:** Date-filter UX — apply-on-blur vs apply-button
**Source:** [analysis-search.md §6 #21](analysis-search.md#6-per-item-recommendations)
**Raised:** 2026-05-22

Ours applies the date filter on `onBlur` (and on Enter) of each date input ([ac-search-date.js:67-78](../src/components/ac-search-date/ac-search-date.js#L67-L78)). Theirs gates application behind an explicit "Filter op datum" button ([their ac-search-date.js:80-82](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/components/ac-search-date/ac-search-date.js#lines-80:82)).

Apply-on-blur is faster but fires when the user tabs through the input or clicks elsewhere — potentially before they've finished entering both `after` and `before`. Apply-button is one extra click but makes the filter atomic.

**Needed from product/UX:**
- Is the current apply-on-blur a deliberate choice, or did it ride along from an earlier design?
- If no strong preference, prefer the apply-button pattern for consistency with the rest of our form-field interactions (which submit on explicit action).

---

### D-010
**Title:** Adopt theirs' 11-paragraph categories explainer modal text
**Source:** [analysis-search.md §6 #23](analysis-search.md#6-per-item-recommendations)
**Raised:** 2026-05-22

Ours' [ac-search-categories.js:23-50](../src/components/ac-search-categories/ac-search-categories.js#L23-L50) modal lists 5 categories (Convenant, Bestuursstuk, Woo-verzoek, Raadstuk, Organisatiegegevens) with Conduction-paraphrased descriptions. Theirs' [ac-search-categories.js:23-94](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/components/ac-search-categories/ac-search-categories.js#lines-23:94) lists 11 categories aligned with the official Woo categorisation.

If the categories we actually surface in the filter (from the backend) include more than 5 types, the modal is incomplete and confusing for users. Adopting theirs' text is a content-only change.

**Needed from product/content:**
- Confirm the canonical category list matches theirs' 11 entries (or supply ours).
- Approve the copy.

---

### D-011
**Title:** Add `categories_with_facets`-style live counts
**Source:** [analysis-search.md §6 #24](analysis-search.md#6-per-item-recommendations)
**Raised:** 2026-05-22

Ours' `AcSearchCategories` shows static counts from `searchAggregations` ([publications.store.js:1008-1023](../src/stores/publications.store.js#L1008-L1023)); theirs' shows counts that reflect the currently-active filters via a `categories_with_facets` computed that merges aggregations with the live facet counts ([their publications.store.js:108-118](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/src/stores/publications.store.js#lines-108:118)).

Live counts are more accurate ("X results for *category A* given the current selection") and prevent users from selecting a filter that yields zero results.

**Needed:**
- Verify the OpenCatalogi `facets` response exposes category counts in a per-bucket form (likely yes, given the dynamic facets pipeline already consumes them).
- Implement a similar computed in our `publications.store.js` and switch `AcSearchCategories` to read from it.

Low-risk pure-computed change.

---

### D-012
**Title:** Strip or gate `console.group` / `console.info` debug logging
**Source:** [analysis-search.md §6 #27](analysis-search.md#6-per-item-recommendations)
**Raised:** 2026-05-22

[publications.store.js](../src/stores/publications.store.js) and [con-facets-filters.js](../src/molecules/con-facets-filters/con-facets-filters.js) log heavily under `console.group` on every search-state change. Examples: [publications.store.js:287-299, 340-347, 351-376, 498-501, 692-695, 793-906](../src/stores/publications.store.js#L287); [con-facets-filters.js:524-539](../src/molecules/con-facets-filters/con-facets-filters.js#L524-L539).

In production this means every keystroke into the debounced search box produces a console block, plus full facet-label tables on every render. Noisy for users with DevTools open, and `console.group` keeps state in the inspector which can slow large object inspection.

**Recommendation if no objection:**
- Add a `DEBUG_SEARCH` flag (env var or container-config feature flag) and gate the logging.
- Alternative: a Babel/webpack plugin that strips `console.*` in production builds — cleaner but more global.

**Needed:** confirm we're OK losing the inline debug output in prod (it's not used by any QA tool I can see).

---

### D-013
**Title:** Possible `theme.id` / `theme.value` mismatch in `ac-search-subjects.js`
**Source:** [analysis-search.md §6 #30](analysis-search.md#6-per-item-recommendations)
**Raised:** 2026-05-22

[ac-search-subjects.js:22-29](../src/components/ac-search-subjects/ac-search-subjects.js#L22-L29) renders each checkbox with `value={theme.value}` but tracks check-state via `theme_checked(theme.id)` and toggles via `toggleSearchArrayValue('themes', theme.id)`. The themes store's `all_themes` mapping ([themes.store.js:75-95](../src/stores/themes.store.js#L75-L95)) doesn't introduce a `value` field, so `theme.value` is `undefined` unless the API itself includes one.

If `theme.value !== theme.id` (or `theme.value === undefined`), the URL state will not match the checkbox's `value` attribute, which can cause form-submit serialisation bugs in some scenarios — and at minimum, makes the source confusing.

**Needed:**
- Test in the running app: select a theme filter, verify the checkbox remains visually checked, verify the URL contains the theme id, verify reloading the page restores the check state.
- If the answer is "all good," the discrepancy is harmless naming drift — but normalise to `theme.id` everywhere for clarity.
- If anything fails, fix by replacing `value={theme.value}` with `value={theme.id}`.

---

### D-014
**Title:** Reconcile filename — `ac-search-subjects` (ours) vs `ac-search-themes` (theirs)
**Source:** [analysis-search.md §6 #32](analysis-search.md#6-per-item-recommendations)
**Raised:** 2026-05-22

Ours' filter component lives at `src/components/ac-search-subjects/ac-search-subjects.js` and exports `AcSearchSubjects`; theirs lives at `src/components/ac-search-themes/ac-search-themes.js` and exports `AcSearchThemes`. Both write to `query.themes` and read from a themes data source. So in practice both are "themes filters" — only ours' filename and component name say "subjects".

Worth noting: `routes.constants.js` in ours has an active `THEMES` route (see [analysis-app-entry-routing.md §3.7](analysis-app-entry-routing.md#37-routes-constants-js-route-table-size-and-shape)), and `LABELS.THEMES` / `LABELS.THEMES_BUTTON` are used as the heading text. There doesn't appear to be a separate "subjects" concept in the data.

**Needed:**
- Is there a real domain distinction in our model between "subjects" and "themes" — or did the file just get renamed at some point and the new name stuck?
- If no distinction: rename the file/component to `ac-search-themes` / `AcSearchThemes` to match the store key, the route, and the labels. Removes a paper cut.
- If there *is* a distinction (e.g. ours surfaces something different on the softwarecatalogus side): document it in a comment at the top of the file and in CLAUDE.md's recon so future analyses stop tripping on it.

CLAUDE.md's initial recon also got this swap wrong (see [analysis-search.md §1](analysis-search.md#1-files-compared) correction note) — resolving the naming will also un-confuse the recon.

---

## Decided

*(none yet)*

---

## Superseded

*(none yet)*

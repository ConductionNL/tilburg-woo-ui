# Analysis: Authentication system (ours only)

## Branches Compared
- Ours (tilburg-woo-ui): `softwarecatalogus-performance`
- Acato (tilburg-woo-ui_acato): `main`

## Scope

Login, registration, password reminder, Nextcloud OAuth handoff, route protection, the auth/user stores and APIs, role/key constants, and auth-adjacent utilities (token storage, redirect-URI sanitisation, content visibility filtering by auth state, field/organisation authorisation).

**Acato has nothing in this category.** No `/login`, `/register`, `/reminder`, or `/authorization` routes; no `AuthStore`/`AuthAPI`; no protected-route wrapper; no role or authorisation utilities. Acato's portal is fully anonymous public WOO and never authenticates a visitor.

This category is ours-only — the verdict is **keep**, no merge decision needed. This file is an inventory to make the surface area legible and to flag the dead/duplicated code that has accumulated alongside the live flow.

## Files Inventoried

23 files, 4 363 LoC total. From the file-category-index "## 14. Authentication system" list:

| Area | Files | LoC |
|------|------:|----:|
| Views | 5 | 2 354 |
| Components | 2 | 97 |
| API | 2 | 105 |
| Stores | 2 | 695 |
| Utilities | 5 | 533 |
| Constants | 2 | 31 |
| Styles | 5 | 548 |

Wiring into the rest of the app:

- Routes wired in [routes.constants.js](../src/constants/routes.constants.js): `/login` → `AcLogin`, `/reminder` → `ConPasswordReminder`, `/aanmelden` + `/register` + `/forms/register` → `AcRegister` (all three resolve to the same component), `/authorization` → `AcNextcloudAuthorization`.
- `AUTHENTICATION_REQUIRED_ROUTES` ([routes.constants.js:664-671](../src/constants/routes.constants.js#L664-L671)) lists the 6 `/beheer/*` paths only; that array is consumed by [App.web.js:271-289](../src/App.web.js#L271-L289) to wrap matching routes with `AcProtectedRoute`. No other route family is gated by this mechanism.
- `AcLogout` is **not** a file in this category — it is inlined inside [App.web.js:31-62](../src/App.web.js#L31-L62) and reached via `/logout`.

## Top-level structure

```
src/views/ac-login/ac-login.js                          # /login — session login form
src/views/ac-register/ac-register.js                    # /aanmelden + /register + /forms/register
src/views/ac-register/con-logo-preview.js               # logo display helper (see observation 8)
src/views/ac-password-reminder/ac-password-reminder.js  # /reminder — email + 6-digit code stub
src/views/ac-nextcloud-authorization/                   # /authorization — OAuth2 authcode exchange
src/components/ac-protected-route/                      # AUTHENTICATION_REQUIRED_ROUTES wrapper
src/components/con-register-resolver/                   # NOT auth — see observation 7
src/api/auth.api.js                                     # OAuth + OpenConnector session endpoints
src/api/authentication.api.js                           # NOT auth — see observation 2
src/stores/auth.store.js                                # legacy OAuth-token store (largely dead)
src/stores/authentication.store.js                      # NOT auth — see observation 2
src/utilities/ac-accesstoken.js                         # Bearer token helpers
src/utilities/ac-safe-parse-redirect-uri.js             # unused (observation 5)
src/utilities/con-authentication-filters.js             # content visibility by auth state
src/utilities/field-authorization.js                    # per-field group-based ACL
src/utilities/organization-permissions.js               # per-object org-match ACL
src/constants/auth.constants.js                         # AUTH_KEYS, AUTH_MODES
src/constants/roles.constants.js                        # ROLES (unused — observation 5)
src/styles/views/ac-login.scss                          # 57 LoC
src/styles/views/ac-register.scss                       # 329 LoC
src/styles/views/ac-password-reminder.scss              # 148 LoC
src/styles/views/ac-authentication.scss                 # 7 LoC — single class only
src/styles/molecules/_ac-authentication.scss            # 7 LoC — orphaned (observation 9)
```

## Views inventory

| File | LoC | Purpose | Backend wired? |
|------|----:|---------|----------------|
| [ac-login.js](../src/views/ac-login/ac-login.js) | 259 | Username/password form; on submit calls `user.sessionLogin` → `app.store.api.auth.sessionLogin`; redirects to `redirect_url` query param or `user.getOrganizationDashboardUrl()` | Yes — `/openregister/api/user/login` |
| [ac-register.js](../src/views/ac-register/ac-register.js) | 1 350 | 4-step organisation registration wizard (verplichte/optionele gegevens, contactpersoon, controleren); uses `ProcessSteps`, NLDS components, debounced inputs; submits multipart `FormData` directly with `fetch()` | Yes — POST `${BASE_URL}/openregister/api/objects/voorzieningen/organisatie` |
| [ac-password-reminder.js](../src/views/ac-password-reminder/ac-password-reminder.js) | 285 | Two-step UI (email request → 6-digit code), code split as 3-dash-3 | **No** — both `handleEmailSubmit` and `handleCodeSubmit` are `setTimeout` stubs with `// TODO: Implement backend call when available` |
| [ac-nextcloud-authorization.js](../src/views/ac-nextcloud-authorization/ac-nextcloud-authorization.js) | 198 | OAuth2 authcode exchange landing; reads `code` from query, `nextcloud_client_id`/`nextcloud_secret_key` from cookies, POSTs to `${BASE_URL}/oauth2/api/v1/token`, writes `nextcloud_access_token`/`nextcloud_refresh_token`/`nextcloud_user_id` cookies, redirects to `sessionStorage.redirect_url` | Yes — Nextcloud OAuth2 endpoint |
| [con-logo-preview.js](../src/views/ac-register/con-logo-preview.js) | 262 | Generic logo renderer (handles base64/URL/file-ID inputs) — see observation 8 | n/a |

## Stores inventory

| File | LoC | Status | Notes |
|------|----:|--------|-------|
| [auth.store.js](../src/stores/auth.store.js) | 349 | Largely dead | `AuthStore` — OAuth token store. `login`, `forgot_password`, `reset_password` actions exist but nothing calls them (grep below). Only `is_authorized`, `logout`/`unAuthenticate`, and `AcAutoLoad` of the access/refresh token keys are still referenced — from [user.store.js:440](../src/stores/user.store.js#L440) (fallback `is_authorized` check) and [user.store.js:546-548](../src/stores/user.store.js#L546-L548) (logout cleanup). The actual `oauthLogin` in `user.store.js:510` has its `app.store.auth.login` call commented out. |
| [authentication.store.js](../src/stores/authentication.store.js) | 346 | Misnamed — not auth | A verbatim near-clone of `publications.store.js`: `items`, `single`, `categories`, `themes`, `themesFacets`, `pagination`, `attachmentPagination`, plus `fetchPublications`/`fetchPublication`/`fetchAggregations` calling `app.store.api.authentication.search/single/searchAggregations`. Wired into the central store at [stores/store.js:40](../src/stores/store.js#L40) but no consumer references `store.authentication` anywhere. See observation 2. |

The **real** auth store is `UserStore` ([src/stores/user.store.js](../src/stores/user.store.js), 721 LoC, category 26): `sessionLogin`, `checkAuthStatus`, `logout`, `fetchUserProfile`, `updateUser`, `getOrganizationDashboardUrl`, `isAuthenticated`, `userGroups`, `activeOrganization`. The auth views in this category all hit `UserStore` via `store.user`, not `AuthStore` via `store.auth`.

## API inventory

| File | LoC | Methods | Live methods |
|------|----:|---------|--------------|
| [auth.api.js](../src/api/auth.api.js) | 67 | `forgot_password`, `reset_password`, `login`, `register`, `logout` (OAuth) + `sessionLogin`, `sessionLogout`, `getUserProfile`, `updateUserProfile` (OpenConnector session) | Only the 4 OpenConnector session methods are reached. The 5 OAuth methods have zero callers — `forgot_password`/`reset_password`/`register` are referenced only inside `auth.store.js` which itself is dead; `login`/`logout` on `AuthStore` are not invoked. |
| [authentication.api.js](../src/api/authentication.api.js) | 38 | `search`, `single`, `themes`, `searchAggregations` — hitting `ENDPOINTS.AUTHENTICATION.SEARCH`/`SINGLE` (`/publications` + `/publications/:id`) | Not auth — a publications-search API clone. Only `AuthenticationStore` consumes it, and `AuthenticationStore` itself has no consumers. See observation 2. |

Endpoint constants confirm the misnomer: [endpoints.constants.js:31-34](../src/constants/endpoints.constants.js#L31-L34) defines `AUTHENTICATION: { SEARCH: '/publications', SINGLE: (_id) => '/publications/${_id}' }` — generic publications endpoints, not auth endpoints.

## Components inventory

| File | LoC | Purpose |
|------|----:|---------|
| [ac-protected-route.js](../src/components/ac-protected-route/ac-protected-route.js) | 41 | Wraps children in a `useEffect` that calls `user.checkAuthStatus()`; on failure navigates to `fallbackPath?redirect_url=<current>`; renders `<AcLoader/>` while checking. Only consumed by [App.web.js:281](../src/App.web.js#L281) for `AUTHENTICATION_REQUIRED_ROUTES`. |
| [con-register-resolver.js](../src/components/con-register-resolver/con-register-resolver.js) | 56 | Resolves OpenRegister register IDs to slugs from `registerCache`. **Not** about user registration — see observation 7. |

## Utilities inventory

| File | LoC | Exports | Consumers |
|------|----:|---------|-----------|
| [ac-accesstoken.js](../src/utilities/ac-accesstoken.js) | 37 | `AcGetAccessToken`, `AcSetAccessToken`, `AcGetXUSRToken`, `AcSetXUSRToken`, `AcRequestTransformer` | Only `AcGetAccessToken` has an outside caller ([config/index.js:101,252](../src/config/index.js#L101)). The other four are re-exported by `utilities/index.js` but no module imports them. See observation 4. |
| [ac-safe-parse-redirect-uri.js](../src/utilities/ac-safe-parse-redirect-uri.js) | 24 | `acSafeParseRedirectUri` | Zero consumers. Re-exported only. See observation 5. |
| [con-authentication-filters.js](../src/utilities/con-authentication-filters.js) | 166 | 8 helpers (`shouldShowContent`, `filterContentItems`, `shouldShowFormField`, `filterFormFieldConfigs`, `shouldShowSection`, `filterPageSections`, `shouldShowProperty`, `filterEntityData`) | Only 2 used: `filterPageSections` ([ac-sections-handler.js:34](../src/components/ac-sections-handler/ac-sections-handler.js#L34)) and `shouldShowFormField` ([field-utilities.js:6](../src/components/con-dynamic-schema-form/utils/field-utilities.js#L6)). Six exports unused. |
| [field-authorization.js](../src/utilities/field-authorization.js) | 179 | `canReadField`, `canEditField`, `getFieldAuthorizationState`, `filterFormDataByAuthorization` | Used by 5 modules (con-dynamic-schema-form, con-generic-beheer-page, con-generic-beheer-details-page, con-beheer-table, ac-publication-default, con-generic-form-modal). Group-based field ACL, evaluated against `user.userGroups`. |
| [organization-permissions.js](../src/utilities/organization-permissions.js) | 127 | `checkOrganizationPermissions`, `getDisabledActionTooltip` | Used by `con-details-actions-menu` and `con-card-organisation-application`. Matches `user.activeOrganization` against `object['@self'].organisation`/`organization`. |

## Constants inventory

| File | LoC | Exports | Live keys |
|------|----:|---------|-----------|
| [auth.constants.js](../src/constants/auth.constants.js) | 24 | `AUTH_KEYS` (`GRANT_TYPE`, `CLIENT_ID`, `CLIENT_SECRET`, `PROVIDER`), `AUTH_MODES` (8 string constants) | `AUTH_KEYS.{GRANT_TYPE, CLIENT_ID, CLIENT_SECRET}` are read by `auth.api.js:24-26` (inside the dead `login` method). `AUTH_KEYS.PROVIDER` and the entire `AUTH_MODES` object have zero consumers. |
| [roles.constants.js](../src/constants/roles.constants.js) | 7 | `ROLES` (`USER`, `MANAGER`, `ADMIN`) | Zero consumers. Re-exported from `constants/index.js` but no module imports the symbol. |

## Styles inventory

| File | LoC | Status |
|------|----:|--------|
| [ac-register.scss](../src/styles/views/ac-register.scss) | 329 | Live — register-page-specific layout, ProcessSteps overrides, error styles |
| [ac-password-reminder.scss](../src/styles/views/ac-password-reminder.scss) | 148 | Live — mirrors `ac-login.scss` plus 6-digit code-input grid |
| [ac-login.scss](../src/styles/views/ac-login.scss) | 57 | Live |
| [ac-authentication.scss](../src/styles/views/ac-authentication.scss) | 7 | One class — `.ac-nextcloud-login__redirect-uri`. The class is not referenced from any JS file in this category. See observation 9. |
| [_ac-authentication.scss](../src/styles/molecules/_ac-authentication.scss) | 7 | Orphaned — `.ac-authentication-form` / `.ac-authentication-form > :not(:last-child)`. Not in `src/styles/molecules/index.scss`, never imported, no JS uses the class. See observation 9. |

## Observations worth flagging (no action required)

1. **Two parallel auth implementations.** OAuth token-flow (`AuthStore` + `auth.api`'s OAuth methods + `AcAutoLoad` of `KEYS.ACCESS_TOKEN`/`REFRESH_TOKEN`/`EXPIRES_*`) coexists with session-cookie flow (`UserStore` + `auth.api`'s OpenConnector methods, hitting `/openregister/api/user/login`). The session flow is the only one actually wired into the views in this category. `AuthStore.login` is never called; the line that would call it is commented out at [user.store.js:510](../src/stores/user.store.js#L510). `AuthStore` survives because `user.store` still queries `app.store.auth?.is_authorized` as a fallback during `checkAuthStatus` and calls `app.store.auth.logout()` during cleanup.

2. **`authentication.store.js` + `authentication.api.js` are not authentication.** Both files are near-verbatim clones of the publications store/api (`search`/`single`/`themes`/`searchAggregations`, the same observable shape, the same `setItems`/`setPagination`/`toggleSearchArrayValue` actions). They are instantiated by the central store at [stores/store.js:40](../src/stores/store.js#L40) and [api/index.js:115](../src/api/index.js#L115), but no code reads `store.authentication` or `store.api.authentication` from outside these files. The endpoints constants confirm: `ENDPOINTS.AUTHENTICATION.SEARCH = '/publications'`. The name is a red herring — these are dead copies, probably created during a copy-paste of the publications store.

3. **`AcPasswordReminder` is a UI-only stub.** [ac-password-reminder.js:80-89,134-139](../src/views/ac-password-reminder/ac-password-reminder.js#L80-L89) — `handleEmailSubmit` and `handleCodeSubmit` both wrap `setTimeout(..., 1000)` with `// TODO: Implement backend call when available`. The component is reachable from [ac-login.js:241](../src/views/ac-login/ac-login.js#L241) ("Wachtwoord vergeten?" button) and from `routes.constants.js`, but submitting either step does nothing. `AuthAPI.forgot_password` / `AuthStore.forgot_password` would be the obvious targets, but neither is wired in.

4. **Token utilities are mostly dead.** `AcSetAccessToken`, `AcGetXUSRToken`, `AcSetXUSRToken`, `AcRequestTransformer` are exported (and re-exported via the utilities barrel) but no module imports them. Only `AcGetAccessToken` survives, reading `KEYS.IMPERSONATED_ACCESS_TOKEN` / `KEYS.ACCESS_TOKEN` from local storage for the axios interceptor at [config/index.js:101,252](../src/config/index.js#L101). The `XUSR` token concept appears to have been removed except for these two helpers.

5. **Single-consumer-or-fewer exports.** `acSafeParseRedirectUri` (0 consumers), `AUTH_MODES` (0), `AUTH_KEYS.PROVIDER` (0), `ROLES` (0). All are re-exported via `utilities/index.js` / `constants/index.js` and look like they were retained for backwards compatibility with code that no longer exists.

6. **`con-authentication-filters` has 6-of-8 exports unused.** Of the 8 helpers in [con-authentication-filters.js](../src/utilities/con-authentication-filters.js), only `filterPageSections` (used by ac-sections-handler) and `shouldShowFormField` (used by con-dynamic-schema-form's field-utilities) are actually called. `filterContentItems`, `shouldShowContent`, `shouldShowSection`, `shouldShowProperty`, `filterEntityData`, `filterFormFieldConfigs` are exported and bundled but not used anywhere.

7. **`con-register-resolver` is misfiled under auth.** The name suggests user-registration, but reading the file ([con-register-resolver.js:1-6](../src/components/con-register-resolver/con-register-resolver.js#L1-L6)): *"Resolves register IDs to slugs. Works like ConUuidResolver but for register IDs."* It reads from `registerCache.service` and maps openregister catalog register IDs (e.g. `'vng-gemma'`) to display names. Belongs in the Stores (register cache) or Beheer (schema resolver) category, not auth. Should be re-categorised.

8. **`con-logo-preview` is hosted under `views/ac-register/` but is not auth-specific.** Despite living next to the register view, it has 5+ deep-import consumers outside the auth flow: `con-module-version-detail-page-content`, `ac-publication-default`, `con-generic-beheer-details-page`, `con-dienst-details-page-content`, `ac-publication-organisation`. Belongs under `atoms/` or `components/` — currently every consumer reaches through `@views/ac-register/con-logo-preview`, coupling unrelated modules to the auth view's path.

9. **Two near-empty stylesheets carry orphaned classes.**
   - [ac-authentication.scss](../src/styles/views/ac-authentication.scss) defines only `.ac-nextcloud-login__redirect-uri` — a class not used in any JS file in this category. The nextcloud-authorization view doesn't render anything with that class.
   - [_ac-authentication.scss](../src/styles/molecules/_ac-authentication.scss) defines `.ac-authentication-form` rules, isn't imported by `src/styles/molecules/index.scss`, and no JS uses the class.
   Both look like leftovers from an older authentication-form pattern that has since moved to the `.ac-login-form` / `.ac-password-reminder-form` class families.

10. **`AcRegister` is wired to three routes.** `/aanmelden`, `/register`, and `/forms/register` all resolve to the same component ([routes.constants.js:278-317](../src/constants/routes.constants.js#L278-L317)) with subtly different `label`/`title`/`name` metadata. The `FORMS_REGISTER` route is also referenced from the forms-wizards category. Either the three-way wiring is intentional alias-routing or two of the three are dead.

11. **`AcProtectedRoute` only protects `/beheer/*`.** `AUTHENTICATION_REQUIRED_ROUTES` ([routes.constants.js:664-671](../src/constants/routes.constants.js#L664-L671)) lists 6 beheer paths. Other authenticated areas (`/mijn-omgeving`, `/forms/*`, `/chat`, `/gemma`) rely on each view doing its own `user.isAuthenticated` check (or on the backend rejecting the request). Not a bug — just worth knowing that route-level gating is not exhaustive.

12. **`AcLogout` is inlined in App.web.js, not a view file.** Routed at `/logout`, defined as an anonymous `withStore(observer(...))` inside [App.web.js:31-62](../src/App.web.js#L31-L62) that calls `user.logout()` then navigates to `/`. Not visible from this category's file list but worth knowing when tracing the logout flow.

13. **`AcRegister` POSTs directly with raw `fetch`, bypassing `AuthAPI.register`.** Submission at [ac-register.js:177-183](../src/views/ac-register/ac-register.js#L177-L183) does `fetch('${BASE_URL}/openregister/api/objects/voorzieningen/organisatie', { method: 'POST', body: formData })`. The unused `AuthAPI.register` endpoint (`/oauth/register`) likely targets a different concept entirely (account creation vs. organisation submission). The two register paths in the codebase ("create an organisation" vs. "create a user account") have not converged.

## Recommendation

**Keep all auth files — no merge decision needed.** None of these flows exist in Acato; the entire authentication category is additive on top of the fork.

If we ever decide to tidy this category as separate hygiene work (not part of the Acato merge), the candidates flagged above in priority order:

1. **Delete `authentication.store.js` + `authentication.api.js` + `ENDPOINTS.AUTHENTICATION`.** Pure dead clones of the publications store/api (observation 2). Verify by grepping `store.authentication` and `api.authentication` — currently no external consumers.
2. **Decide whether to finish or rip out the OAuth/`AuthStore` path** (observation 1). It's been in fallback-only mode long enough that `oauthLogin` has its body commented out. If the OpenConnector session flow is the permanent answer, `AuthStore`, the 5 OAuth methods in `auth.api.js`, and the OAuth-token utilities in `ac-accesstoken.js` can all go.
3. **Either implement `AcPasswordReminder` or hide the entry point** (observation 3). Today the "Wachtwoord vergeten?" button leads to a UI that silently does nothing.
4. **Move `con-register-resolver` out of the auth category** (observation 7).
5. **Move `con-logo-preview` to `components/` or `atoms/`** (observation 8) so the 5+ non-auth consumers don't deep-import from a views directory.
6. **Drop unused exports**: `AUTH_MODES`, `ROLES`, `AUTH_KEYS.PROVIDER`, `acSafeParseRedirectUri`, the six unused helpers in `con-authentication-filters`, the four unused token helpers in `ac-accesstoken.js`.
7. **Resolve the duplicate register routes** (observation 10) — pick one of `/aanmelden`, `/register`, `/forms/register` and remove the others, or document them as intentional aliases.
8. **Delete or merge the two orphaned auth stylesheets** (observation 9).

None of these affect the Acato comparison; they are local debt notes only.

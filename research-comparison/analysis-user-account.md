# Analysis: User account & Mijn Omgeving (ours only)

## Branches Compared
- Ours (tilburg-woo-ui): `softwarecatalogus-performance`
- Acato (tilburg-woo-ui_acato): `main`

## Scope

The signed-in user's self-service surface area: the "Mijn Account" view, the four modals that mutate user / organisation data from that view, the `/mijn-omgeving` placeholder route, and the supporting `user` and `mijnOmgeving` stores + API.

**Acato has nothing in this category.** No `ac-my-account/`, no `ac-mijn-omgeving/`, no `user.store.js`, no `mijnOmgeving.api.js`. Acato's portal is read-only public WOO with no concept of an authenticated end-user — there is nothing to compare against. This category is ours-only — the verdict is **keep**, no merge decision needed.

## Files Inventoried

10 files, 4 232 LoC total.

| File | LoC | Role |
|------|----:|------|
| [src/views/ac-my-account/ac-my-account.js](../src/views/ac-my-account/ac-my-account.js) | 1 115 | "Mijn Account" view — org card + gebruikersgegevens + contactgegevens, hosts all 4 modals |
| [src/views/ac-my-account/ac-my-account-modal.js](../src/views/ac-my-account/ac-my-account-modal.js) | 233 | Simple form modal — edits email + name fields via `user.updateUser` |
| [src/views/ac-my-account/ac-my-account-dynamic-modal.js](../src/views/ac-my-account/ac-my-account-dynamic-modal.js) | 811 | Generic JSON-schema-driven create/edit modal — wraps `ConDynamicSchemaForm` |
| [src/views/ac-my-account/ac-my-account-publish-modal.js](../src/views/ac-my-account/ac-my-account-publish-modal.js) | 192 | Publish/depublish confirmation modal — calls `object.massPublishObjects` |
| [src/views/ac-my-account/ac-my-account-deelnames-modal.js](../src/views/ac-my-account/ac-my-account-deelnames-modal.js) | 348 | Deelnames editor — checkboxes for Communities + Samenwerkingsverbanden, PATCH per toggle |
| [src/views/ac-mijn-omgeving/ac-mijn-omgeving.js](../src/views/ac-mijn-omgeving/ac-mijn-omgeving.js) | 230 | `/mijn-omgeving` route — currently a stub (marked `TODO: do something with this file`) |
| [src/api/mijnOmgeving.api.js](../src/api/mijnOmgeving.api.js) | 38 | 4-method API client (`search`, `single`, `themes`, `searchAggregations`) |
| [src/stores/mijnOmgeving.store.js](../src/stores/mijnOmgeving.store.js) | 346 | MobX store for paginated/facetted search of the user's own publications |
| [src/stores/user.store.js](../src/stores/user.store.js) | 721 | Cross-cutting auth + profile + organisation + role store |
| [src/styles/views/ac-my-account.scss](../src/styles/views/ac-my-account.scss) | 198 | Styles for `.ac-register-review__*`, `.ac-mijn-omgeving-section`, `.con-my-account-deelnames-modal__*` |

## How the two top-level views fit together

There are two routes nominally in this category but they serve different purposes:

| Route | View file | State |
|-------|-----------|-------|
| `/beheer/my-account` | [ac-beheer/core/components/custom/con-my-account.js](../src/views/ac-beheer/core/components/custom/con-my-account.js) (cat 15) | Wired and live — this is the user's profile page |
| `/mijn-omgeving` | [ac-mijn-omgeving/ac-mijn-omgeving.js](../src/views/ac-mijn-omgeving/ac-mijn-omgeving.js) | Wired but stub — `TODO` header, hardcoded `localhost:8080` URLs |

So in practice **"My Account"** = the user's profile + organisation editor at `/beheer/my-account`; **"Mijn Omgeving"** = nothing yet, despite a full store + API + route slot waiting for it. The two are not parallel — they're a live page and an unfinished one.

`AcMyAccount` (the 1 115-LoC view in this folder) is exported from [src/views/index.js#L74](../src/views/index.js#L74) but **is not bound to any route** in [routes.constants.js](../src/constants/routes.constants.js). The live `/beheer/my-account` page uses the shorter `ConMyAccountPage` in beheer category 15, which is essentially `AcMyAccount` minus the organisation card, contact card and the tabs — only the "Gebruikersgegevens" block + edit modal. The big `AcMyAccount` view appears to be either (a) a richer variant kept around for future re-mounting, or (b) the file the beheer page was forked from and hasn't been deleted. Worth a human decision; flagged below.

## The 4-modal pattern around My Account

[ac-my-account.js](../src/views/ac-my-account/ac-my-account.js) owns five `showXModal` boolean flags and renders one modal of each type. Each is triggered by a specific button on the page:

| Modal | Trigger | What submits |
|-------|---------|--------------|
| `AcMyAccountModal` | "Bewerken" next to **Gebruikersgegevens** | `user.updateUser({ email, firstName, middleName, lastName, functie })` — plain form |
| `AcMyAccountDynamicModal` — `type='organisatie'` | "Bewerken" next to the **org name/logo** | `object.updateObject('voorzieningen', 'organisatie', id, …)` — schema-driven form built from `ConDynamicSchemaForm` + `FormModalConfigFactory` |
| `AcMyAccountDynamicModal` — `type='contactpersonen'` | "Bewerken" next to the **Contactpersoon block** | Same as above but with `contactpersonen` schema and seeded with the user's current name/email/phone |
| `AcMyAccountPublishModal` | "Publiceren" / "Depubliceren" (currently legacy-commented out in `ac-my-account.js`) | `object.massPublishObjects([orgData])` or `massDepublishObjects` |
| `AcMyAccountDeelnamesModal` | "Deelnames" | `object.patchObject('voorzieningen', 'organisatie', orgId, { deelnames: [...] })` — one PATCH per checkbox toggle (optimistic UI + revert on error) |

### Modal sharing with the Beheer module

Despite living in `ac-my-account/`, these modals are **not exclusive to this view**:

- `AcMyAccountModal` → also imported by [ConMyAccountPage](../src/views/ac-beheer/core/components/custom/con-my-account.js) (the live `/beheer/my-account`).
- `AcMyAccountDynamicModal` / `AcMyAccountPublishModal` / `AcMyAccountDeelnamesModal` → also imported by [con-my-organisation.js](../src/views/ac-beheer/core/components/custom/con-my-organisation.js) at `/beheer/my-organisation`.

So `ac-my-account/` is functionally a *shared modal pack* that the user-account-related Beheer pages reuse, plus a 1 115-LoC view that the active routes don't currently mount. The naming is misleading — these modals are general organisation editors, not "my account" widgets.

## AcMijnOmgeving — the stub

[ac-mijn-omgeving.js](../src/views/ac-mijn-omgeving/ac-mijn-omgeving.js) starts with a literal `// TODO: do something with this file` and a redirect-to-login if no `nextcloud_user_id` cookie. The rendered UI is three buttons:

1. **Voorziening aanmaken** — opens an empty `AcModal` whose submit handler is `() => {}` (`// Here you can make your POST request with the formData`).
2. **Archimate inlezen** — `fetch('http://localhost:8080/apps/openregister/api/objects/vng-gemma/synchronize-model')` — hardcoded localhost, will not work in any deployed environment.
3. **GEMMA downloaden** — `fetch('http://localhost:8080/apps/.../vng-gemma/model')` with `Accept: application/xml` and a Blob download — same hardcoded localhost.

It does **not** import `mijnOmgeving.store` or `mijnOmgeving.api`, despite both being fully implemented and registered in [stores/store.js#L41](../src/stores/store.js#L41) and [api/index.js#L119](../src/api/index.js#L119) respectively. The endpoint constants (`ENDPOINTS.MIJN_OMGEVING.SEARCH = '/mijn-omgeving'`, …) are defined but never hit at runtime through the store either.

In other words: there's a complete search/facet/pagination plumbing for a "user's own publications" feature, but the only view that would consume it (`/mijn-omgeving`) is a stub for unrelated GEMMA tooling. Worth a product decision before the merge — see Observations.

## How Mijn Omgeving differs from My Account (intent vs. reality)

In intent the split looks like:

- **My Account** (`/beheer/my-account`) — profile/settings: who you are, which org you act for, how to edit your contact details. Read/write on `user` + a single `organisatie` object.
- **Mijn Omgeving** (`/mijn-omgeving`) — content workspace: the list/search of publications the user owns or can edit. Read on `MIJN_OMGEVING.SEARCH` with facets.

In reality:

- My Account is implemented at `/beheer/my-account` (a lean beheer page) and `ac-my-account.js` is an unmounted, richer variant of the same screen.
- Mijn Omgeving's store and API are complete but unused; the route shows GEMMA buttons against a localhost URL.

The two halves of the category were probably designed in parallel and only the My Account half landed.

## The `user.store.js` cross-cutting role

`user.store.js` is filed under this category but is referenced from at least **26 files** across the codebase — auth gates, header/footer, organisation selector, all forms wizards that filter steps by role, beheer dashboard, login view, and three other stores (chat, object, publications). Highlights of its surface:

- **Auth lifecycle** — `sessionLogin`, `oauthLogin`, `checkAuthStatus`, `logout`, `login` (convenience wrapper). Stores `access_token` as a cookie + replays it on every request.
- **Profile** — `fetchUserProfile`, `updateUser`, `user`, `currentUser`, `userDisplayName`, `userFullName`, `userInitials`, `userEmail`, `userPhone`.
- **Groups / roles** — `userGroups`, `isAdmin`, `hasGroup(name)`, `hasRole(name)` (alias), `hasAnyGroup([])`, `hasAllGroups([])`.
- **Organisations** — `userOrganizations`, `activeOrganization`, `totalOrganizations`, `hasOrganization(id)`, `isOwnerOfOrganization(id)`, `getOrganizationDashboardUrl()` (always returns `/beheer`).
- **Route gating** — `canAccessRoute(path)` lazy-requires `AUTHENTICATION_REQUIRED_ROUTES` from `routes.constants.js` and checks `isAuthenticated`.
- **Persistence** — `saveToStorage / initializeFromStorage / clearStorage` keep auth state in `localStorage['woo-user-state']`. `clearNextcloudCookies` knows about ~15 named cookies plus dynamic `oc*` / `nc_*` patterns.

Cross-references: also relevant to the **Authentication** category (where it's the actual login state holder for [ac-login.js](../src/views/ac-login/ac-login.js) and [ac-protected-route.js](../src/components/ac-protected-route/ac-protected-route.js)) and the **Beheer** category (where org-switching, role gating and `getOrganizationDashboardUrl()` drive the admin layout). Treat this file as the shared user-state hub, not a "my account" detail.

## Observations worth flagging

1. **`ac-my-account.js` is exported but not routed.** The 1 115-LoC view is listed in [views/index.js#L74](../src/views/index.js#L74), but no entry in [routes.constants.js](../src/constants/routes.constants.js) names `AcMyAccount` as its `component`. The live `/beheer/my-account` route is rendered by `ConMyAccountPage` in [con-my-account.js](../src/views/ac-beheer/core/components/custom/con-my-account.js) (cat 15), which is the same skeleton without the organisation block, contact block, tabs and three of the modals. Either `AcMyAccount` is a richer planned replacement that hasn't been wired up, or it's stale code from before the beheer page was extracted. Worth a human decision — but it's local hygiene, not an Acato-merge concern.

2. **`/mijn-omgeving` is a stub.** The view has a `TODO: do something with this file` comment, two hardcoded `http://localhost:8080/apps/...` URLs (GEMMA sync + download), and a "Voorziening aanmaken" modal whose submit is `() => {}` (no API call). Will fail silently or visibly in any deployed environment.

3. **A full Mijn Omgeving search stack exists but is dead code.** [mijnOmgeving.store.js](../src/stores/mijnOmgeving.store.js) (346 LoC) implements the standard search/facet/pagination MobX pattern (`fetchPublications`, `fetchAggregations`, `setQueryDate`, `toggleSearchArrayValue`, `setSort`, `getSearchPageURL → '/mijn-omgeving?…'`) — it's a near-copy of `publications.store`. None of its actions are called outside the file itself. Same for [mijnOmgeving.api.js](../src/api/mijnOmgeving.api.js) — all 4 methods are wired through the store but the store's callers don't exist. Either remove or finish wiring; pick one before the merge.

4. **The modals are misnamed.** Three of the four `ac-my-account-*-modal.js` files are used **outside** ac-my-account (by [con-my-organisation.js](../src/views/ac-beheer/core/components/custom/con-my-organisation.js)) and have no my-account-specific behaviour. They're generic organisation/contact editors. A future cleanup pass could rename and move them to `src/components/` so beheer's dependency on `@views/ac-my-account/…` doesn't look like a layering violation.

5. **Publish/depublish actions are commented out in `ac-my-account.js`.** The "Publiceren" / "Depubliceren" buttons are wrapped in a `/* LEGACY: No longer needed */` block ([ac-my-account.js#L494-L532](../src/views/ac-my-account/ac-my-account.js#L494-L532)) but the modal (`AcMyAccountPublishModal`) is still rendered and `handlePublishOrganization` / `handleDepublishOrganization` handlers still exist. The modal has dead-code callers in this view; con-my-organisation.js is what keeps the publish modal alive.

6. **`.ac-mijn-omgeving-section` is a layout class, not a view-specific style.** Defined in [ac-my-account.scss](../src/styles/views/ac-my-account.scss#L55) but applied as a wrapper class on at least **15 beheer pages** (dashboard, details pages, error/loading screens). It's effectively the standard "section + sidenav" layout token for the whole admin module. Renaming it for clarity would be a wide blast radius.

7. **Two flavours of org image-fit detection.** [ac-my-account.js#L173-L220](../src/views/ac-my-account/ac-my-account.js#L173-L220) (`handleContactImageLoad`) draws the contact image into a canvas, samples corner alpha, and switches between `object-fit: cover` and `object-fit: contain` to guess whether the source is already round. Will silently fall back to `cover` on any cross-origin image (canvas taint catch). Useful pattern but unique to this view.

8. **Hardcoded register/schema slugs.** `ac-my-account.js`, `ac-my-account-deelnames-modal.js` and `ac-my-account-publish-modal.js` all hardcode `('voorzieningen', 'organisatie', …)` register + schema strings into `object.fetchObject`, `object.patchObject`, `object.massPublishObjects` etc. Same string pair appears in con-my-organisation.js. Likely fine — this *is* a fixed-type page — but worth a constants extraction if it ever changes.

9. **`UserStore` reads container constants at runtime.** [user.store.js#L7-L16](../src/stores/user.store.js#L7-L16) does `try { require('@constants/container.constants') } catch …`. The same defensive pattern shows up in `routes.constants.js`. That file is generated at deploy time by [scripts/generate-container-constants.js](../scripts/generate-container-constants.js) — see [analysis-dependencies-build-tooling.md](analysis-dependencies-build-tooling.md). Mention here only because if a future Acato merge ever drops the container-constants build step, `sessionLogin` and `checkAuthStatus` both error out with "OpenConnector API URL not configured".

## Recommendation

**Keep all files — no merge decision needed.** Acato has no equivalent surface area.

If hygiene work happens later as a separate workstream (not part of the Acato merge), in priority order:

1. Decide what to do with `ac-my-account.js` — wire it to a route, or delete it in favour of `ConMyAccountPage` in beheer. Right now it's 1 115 LoC of unmounted view code that confuses the category.
2. Decide what `/mijn-omgeving` should be — either finish the search view (the store + API + endpoints are already there), or delete the stub view, the `MijnOmgevingStore` registration in `stores/store.js`, and the `MijnOmgevingAPI` registration in `api/index.js`.
3. Rename + move the four shared modals out of `ac-my-account/` into `src/components/` since three of them are general-purpose organisation editors used by Beheer.
4. Strip the legacy-commented publish/depublish block and the unused `AcMyAccountPublishModal` mount in `ac-my-account.js` (only if that view is kept).

None of these affect the Acato comparison; they're local debt notes only.

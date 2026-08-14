# Analysis: Beheer — core & shared (ours only)

## Branches Compared
- Ours (tilburg-woo-ui): `softwarecatalogus-performance`
- Acato (tilburg-woo-ui_acato): `main`

## Scope

The Conduction-built admin panel ("Beheer") — a CRUD console for ~12 OpenRegister/Nextcloud-backed object types (applicaties, diensten, gebruiken, koppelingen, organisaties, contactpersonen, moduleversies, producten, GEMMA views/extendviews, plus dynamic catch-all). This file covers the **framework layer** that powers every domain page:

- The router entry [src/views/ac-beheer/ac-objects.js](../src/views/ac-beheer/ac-objects.js) + barrel [src/views/ac-beheer/index.js](../src/views/ac-beheer/index.js)
- All of [src/views/ac-beheer/core/](../src/views/ac-beheer/core/) — generic page, generic details page, dashboard, factories, modals, hooks, helpers
- All of [src/views/ac-beheer/shared/](../src/views/ac-beheer/shared/) — table, action menu, filter drawer, logo upload, file upload, editable description/standards, import modal
- The custom GEMMA-view beheer surfaces [src/views/con-beheer-views/](../src/views/con-beheer-views/), [src/views/con-beheer-views-list/](../src/views/con-beheer-views-list/), [src/views/ac-views/ac-views.js](../src/views/ac-views/ac-views.js)
- The schema-driven form engine [src/components/con-dynamic-schema-form/](../src/components/con-dynamic-schema-form/) and its satellite components ([con-api-select-field](../src/components/con-api-select-field/), [con-schema-enhanced-field](../src/components/con-schema-enhanced-field/), [con-uuid-resolver](../src/components/con-uuid-resolver/), [con-template-text](../src/components/con-template-text/), [con-debug-viewer](../src/components/con-debug-viewer/), [con-organization-selector](../src/components/con-organization-selector/), [con-details-actions-menu](../src/components/con-details-actions-menu/), [con-table-search](../src/components/con-table-search/), [con-aangeboden-gebruik-table](../src/components/con-aangeboden-gebruik-table/), [con-unsaved-changes-alert-modal](../src/components/con-unsaved-changes-alert-modal/), [con-existing-modules-info-box](../src/components/con-existing-modules-info-box/), [con-modules-choice-switch](../src/components/con-modules-choice-switch/))
- Beheer-only stores [src/stores/object.store.js](../src/stores/object.store.js) and [src/stores/toasters.store.js](../src/stores/toasters.store.js)
- Beheer-only schema/data utilities under [src/utilities/](../src/utilities/) (`con-collapse-extended-objects`, `con-detect-object-references`, `con-format-by-json-schema`, `con-normalize-link-to-schema-slug`, `con-normalize-schema-name`, `con-resolve-schema`, `con-resolve-uuids-in-text`, `con-schema-tab-display-helpers`, `con-smart-split`, `con-sort-properties-by-order`, `schema-object-factory`)
- Beheer-specific stylesheets under [src/styles/views/](../src/styles/views/) and [src/styles/components/](../src/styles/components/)

**Excluded** (covered separately):
- The per-domain detail pages under `src/views/ac-beheer/domains/**` → `analysis-beheer-domains.md`
- The wizard flows under `src/views/ac-forms/**` → `analysis-forms-wizards.md` (done)

**Acato has nothing in this category.** No `/beheer` route, no admin views, no `ConDynamicSchemaForm`, no `ObjectStore`, no `ToastersStore`, no OpenRegister-backed CRUD plumbing of any kind. Their portal is read-only WOO publications. Every file inventoried here was built on top of the fork.

This category is ours-only — the verdict is **keep**, no merge decision needed. This file is an inventory to make the surface area legible.

## Files Inventoried

**~25 200 LoC** across 70 JS files + ~2 200 LoC SCSS:

| Group | Files | LoC | Notes |
|------|------:|----:|-------|
| `ac-beheer/` shells | 2 | 66 | router entry + barrel |
| `ac-beheer/core/components/` | 8 | 3 213 | generic pages, dashboard, standard pages, my-account/org |
| `ac-beheer/core/factories/` | 5 | 2 437 | page-config, details-config, modal, form-modal, filter-drawer |
| `ac-beheer/core/modals/` | 4 | 1 830 | delete, publish/depublish, addAccount, generic form |
| `ac-beheer/core/hooks/` | 1 | 465 | `useRelatedCreateActions` |
| `ac-beheer/core/utils/` | 4 | 72 | constants, beheer-renames, sorters, barrel |
| `ac-beheer/shared/components/` | 12 | 4 003 | table, action menu, file/logo upload, editable description/standards, import modal, filter-headers drawer |
| `con-beheer-views*`, `ac-views` | 3 | 2 225 | GEMMA-view beheer + viewer (joint.js + archimate-diagram-engine) |
| `con-dynamic-schema-form/` | 14 | 3 524 | form engine + 7 field components + 5 utility modules |
| Standalone beheer-tied components | 12 | 2 433 | api-select, schema-enhanced, uuid-resolver, template-text, debug-viewer, etc. |
| `stores/` (beheer-only) | 2 | 4 835 | `object.store.js` is the giant — 4 686 LoC, ~50 actions |
| `utilities/` (schema/data, beheer-tied) | 11 | 1 497 | schema/UUID/format helpers used across beheer & forms |
| Beheer SCSS | 16 files | 2 221 | views + components |
| **Total** | **94** | **~28 800** | |

## Top-level structure

```
src/views/ac-beheer/
├── index.js                       # loadable() exports: AcDashboard, AcBeheerError, AcBeheerLoading
├── ac-objects.js                  # /objects/:register/:schema router — maps vng-gemma/view to beheer config
├── core/
│   ├── index.js                   # barrel: re-exports components, factories, utils
│   ├── components/
│   │   ├── ac-beheer.js           # /beheer/* dispatcher — picks generic page or domain detail page
│   │   ├── ac-dashboard.js        # /beheer landing tile grid + suggesties widget + org selector
│   │   ├── con-beheer-page-wrapper.js     # thin wrapper around ConGenericBeheerPage
│   │   ├── con-generic-beheer-page.js     # ⭐ the list-view engine (1 567 LoC)
│   │   ├── con-generic-beheer-details-page.js  # ⭐ the detail-view engine (778 LoC)
│   │   ├── ac-standard-pages/             # error + loading boilerplate
│   │   └── custom/
│   │       ├── con-my-account.js         # /beheer/my-account (calls UserStore)
│   │       └── con-my-organisation.js    # /beheer/my-organisation (721 LoC, deep org CRUD)
│   ├── factories/
│   │   ├── con-beheer-page-config-factory.js   # ⭐ type → list config (737 LoC, 7 explicit cases + default)
│   │   ├── con-details-page-config-factory.js  # type → detail config (delegates to above, then overrides)
│   │   ├── con-form-modal-config-factory.js    # ⭐ type → form config + options providers (888 LoC, 12 cases)
│   │   ├── con-beheer-modal-factory.js          # type → which modal components to load
│   │   └── con-filter-drawer-factory.js         # type → filter drawer component (default vs organisatie)
│   ├── modals/
│   │   ├── ac-generic-beheer-delete-modal/             # bulk-aware delete with type-aware copy
│   │   ├── ac-generic-beheer-publish-depublish-modal/  # bulk publish/depublish (marked LEGACY in callers)
│   │   ├── con-addAccount-modal/                       # contactpersoon → account onboarding
│   │   └── con-generic-form-modal/                     # ⭐ the create/edit modal (984 LoC)
│   ├── hooks/
│   │   └── use-related-create-actions.js        # builds "Toevoegen X" buttons from schema relations + Keycloak groups
│   └── utils/
│       ├── beheer-renames.js                    # voorziening → applicaties, contract → overeenkomsten, …
│       ├── constants.js                         # BASE_URL via container-constants fallback
│       ├── sorters.js                           # byNested() helper over ConSorterLogic
│       └── index.js
└── shared/
    ├── index.js
    └── components/
        ├── con-action-menu.js                   # ⭐ 567 LoC compound component (preact/compat) used everywhere
        ├── con-table.js                         # ⭐ 882 LoC universal data table
        ├── con-beheer-table/                    # 439 LoC adapter that wires ConTable to BeheerPageConfigFactory
        ├── con-filter-headers-drawer.js
        ├── con-logo-upload-field.js             # 459 LoC, dataURL preview + crop
        ├── con-editable-description/            # markdown inline editor (366 LoC)
        ├── con-editable-standards/              # standards row picker (134 LoC)
        ├── con-object-upload-files/             # 3-file folder for attachments (file + confirm-delete + publish/depublish)
        └── import-modal/                        # bulk import w/ dropzone

src/views/
├── ac-views/ac-views.js                         # legacy public GEMMA-view renderer (Jointjs)
├── con-beheer-views/con-beheer-views.js         # ⭐ admin AMEF/GEMMA-view detail (1 214 LoC)
└── con-beheer-views-list/con-beheer-views-list.js   # admin AMEF/GEMMA-view list
```

The `con-beheer-views*` files sit outside the `ac-beheer/` directory tree but are wired into the same `/beheer/views*` routes via [routes.constants.js](../src/constants/routes.constants.js#L408-L436) — the GEMMA-view beheer was built bespoke rather than going through `ConGenericBeheerPage`, because it needs JointJS + archimate-diagram-engine rendering.

## The framework pattern

Every list page in Beheer follows the same flow:

1. URL hits `/beheer/:type` → `ac-beheer.js` dispatches to `ConBeheerPageWrapper` (or a domain detail page for `/beheer/:type/:id`).
2. `ConBeheerPageWrapper` → `ConGenericBeheerPage` (the 1 567 LoC engine).
3. `BeheerPageConfigFactory.createConfig(type)` returns the per-type config (registerSlug, schemaSlug, paginationKey, defaultHeaders, customHeaders, dynamicActionFilter, modals, …). Unknown types fall through to a `isDynamicEntry: true` default that assumes `schemaSlug = paginationKey = routeType = type`.
4. The engine fetches via `store.object.fetchCollection(register, schema, params)` and renders into `ConTable`.
5. `BeheerModalFactory` lazy-loads the right `loadable()` modal (add/edit/delete/publish/depublish/import/dynamicCreate + a few activate/role ones for organisaties).
6. `FilterDrawerFactory` picks the filter drawer (default vs organisatie-specific).
7. `useRelatedCreateActions(...)` introspects the schema's relations + the user's Keycloak groups to render "+ Toevoegen X" buttons that either open a wizard (via `DASHBOARD_WIZARDS` lookup) or the generic dynamicCreate modal.
8. Edit/add submit through `ConGenericFormModal`, which uses `FormModalConfigFactory.createConfig(type)` to determine fields, options-providers, validation, and visibility rules; the actual fields are rendered by `ConDynamicSchemaForm` driven by the live JSON schema from `object.store`.

The detail page (`ConGenericBeheerDetailsPage`) follows the same pattern but with `DetailsPageConfigFactory` and per-domain content components from `domains/` (covered in the companion file).

## Factories — config catalogue

| Factory | LoC | Explicit cases (type strings) | Default behaviour |
|---------|-----:|------|-------------------|
| `con-beheer-page-config-factory.js` | 737 | `view`, `extendview`, `module` (+aliases `applicaties`/`applications`/`modules`), `moduleversie` (+aliases `applicatieversie`/`applicatiesversie`), `dienst`/`diensten`, `gebruik`/`gebruiken`, `koppeling`/`koppelingen`, `contactpersoon`/`contactpersonen` | Dynamic fall-through: assumes `schemaSlug=paginationKey=routeType=type`; marked `isDynamicEntry: true` |
| `con-details-page-config-factory.js` | 284 | `module`/`applicaties`, plus inherits from page-config-factory | `_.pick` from page-config + per-type `excludedProperties` + `formatBySchemaOptions` |
| `con-form-modal-config-factory.js` | 888 | `module`/`applicaties`, `moduleversion`/`moduleversie`/`applicatieversie`/`applicatiesversie`, `diensten`, `organisaties`/`organisatie`, `contactpersonen`/`contactpersoon`, `gebruiken`, `overeenkomsten`, `voorzieningen-versie`, `kwetsbaarheden` | `getSchemaDefaults(schema)` + simple `initialData: {}` |
| `con-beheer-modal-factory.js` | 440 | `applicaties`, `diensten`, `voorzieningen-versie`, `organisaties` (+activate/role modals), `contactpersonen`, `gebruiken`, `overeenkomsten`, `koppelingen` | Returns `baseModalConfig` (add/edit/delete/publish/depublish/import/dynamicCreate) |
| `con-filter-drawer-factory.js` | 83 | `organisatie`/`organisaties` | `ConFilterHeadersDrawer` |

Aliasing is consistent across factories but every factory does it by hand — the `beheer-renames.js` map exists but is only used by the publication-detail rendering (per its `TODO`), not by these factories.

## The data layer

[src/stores/object.store.js](../src/stores/object.store.js) is the central MobX store for all Beheer CRUD — **4 686 LoC**, **~60 actions**, 22 observable collections. It is responsible for:

- Talking to Nextcloud's `openregister` and `voorzieningen` apps via an Axios instance configured with both OAuth-token (`nextcloud_access_token` cookie) and Basic-auth fallback (read from `window.app.store.user.basicAuthCredentials`).
- `fetchCollection(register, schema, params)` / `fetchObject(...)` / `createObject(...)` / `updateObject(...)` / `deleteObject(...)` / `publishObject(...)` / `depublishObject(...)` / `massDelete...` / `massDepublish...`.
- Maintaining `*_pagination` per-type, request cancellation per operation, an `activeObject` slot per type.
- `warmupBeheerData()` (called once from `AcBeheer` on mount, fire-and-forget) — pre-loads schemas, registers, names cache.
- Driving the `schemaCache` and `registerCache` services (see services-layer category 25).
- Generating default form values from JSON Schema (`createDefaultObjectFromSchema`, `createDefaultObjectsFromSchemas` — used by `schema-object-factory.js` and a couple of wizards).

[src/stores/toasters.store.js](../src/stores/toasters.store.js) (149 LoC) is a small notification queue (`add({ variant, message, … })` returns a Promise). Used by every CRUD action in `object.store` to surface success/failure.

## The form engine

[src/components/con-dynamic-schema-form/con-dynamic-schema-form.js](../src/components/con-dynamic-schema-form/con-dynamic-schema-form.js) (638 LoC) auto-generates form fields from a JSON Schema. Field-type detection: arrays → multi-select, enums → single-select, objects → recursive nested fields, strings with `format: date|date-time` → HTML5 date input, the rest → text. Authorisation is enforced field-by-field via `getFieldAuthorizationState`.

Helpers (split out of the main file for reuse):

| File | LoC | Purpose |
|------|----:|---------|
| `utils/field-renderers.js` | 720 | renders one field of any type; consumed by both `ConDynamicSchemaForm` and the standalone `ConSchemaEnhancedField` |
| `utils/field-utilities.js` | 640 | `getNestedValue`/`setNestedValue`, visibility, options, validation, ref-schema resolution |
| `utils/validation.js` | 73 | `validateString`/`validateNumber`/`validateArray` |
| `utils/format-validators.js` | 159 | `isValidUrl`, `isValidEmail`, `isValidHostname`, `isValidUUID`, `isValidIPv4`, plus `libphonenumber-js` |
| `utils/defaults.js` | 21 | `getDefaultValue(propSchema)` |

Custom field components in `inputs/`:

| File | LoC | Purpose |
|------|----:|---------|
| `boolean-field.js` | 17 | tri-state checkbox |
| `number-field.js` | 52 | numeric input w/ min/max |
| `array-comma-list-field.js` | 59 | tag-style comma-separated list |
| `json-object-field.js` | 63 | JSON textarea w/ live validation |
| `markdown-html-field.js` | 115 | rendered markdown preview |
| `con-lightweight-markdown-editor.js` | 233 | minimal MDX toolbar |
| `con-wysiwyg-markdown-field.js` | 162 | `@uiw/react-md-editor` wrapper with remark/rehype pipeline |
| `color-field.js` | 572 | the heavy one — picker + presets + a11y contrast checking |

Satellite components in `src/components/`:

| File | LoC | Purpose |
|------|----:|---------|
| `con-schema-enhanced-field.js` | 459 | one schema-driven field outside a full form — primarily consumed by the wizards (35 imports across `ac-forms/`) |
| `con-api-select-field.js` | 380 | declarative `<select>` whose options come from a configurable API endpoint |
| `con-uuid-resolver.js` | 60 | wraps text/children, swaps any UUID for a human-readable name from the names cache |
| `con-template-text.js` | 54 | substitutes `{{ user.displayName }}` template vars and optionally renders HTML |
| `con-debug-viewer.js` | 46 | dev-only `<details>` JSON dump (renders nothing in prod) |
| `con-organization-selector.js` | 109 | dashboard org-switcher dropdown |
| `con-details-actions-menu.js` | 326 | the menu shown at the top of every detail page |
| `con-table-search.js` | 341 | header search input above `ConTable` |
| `con-aangeboden-gebruik-table.js` | 387 | dashboard widget listing "suggesties" for aanbod-beheerders |
| `con-unsaved-changes-alert-modal.js` | 127 | generic warning modal used by wizards (5 wizards) — listed here because it lives next to the other beheer modals |
| `con-modules-choice-switch.js` | 60 | "same for all applicaties" toggle — only consumed by product wizard |
| `con-existing-modules-info-box.js` | 84 | info banner shown when a product wizard detects duplicate modules — only consumed by product wizard |

## Beheer-tied utilities

| File | LoC | Used for |
|------|----:|----------|
| `con-format-by-json-schema.js` | 473 | turns a domain object + its JSON Schema into a list of label/value pairs for the details page |
| `con-detect-object-references.js` | 269 | walks an object's tree and surfaces all schema-typed reference fields |
| `con-resolve-uuids-in-text.js` | 225 | `useResolvedText` hook — replaces inline UUIDs with names, used by `ConUuidResolver` and `ConTable` |
| `schema-object-factory.js` | 206 | wizard-side wrappers around `object.store.createDefaultObjectsFromSchemas` (also touched in forms-wizards category — kept here because the source is beheer's store) |
| `con-resolve-schema.js` | 68 | `useResolvedSchema` hook — schema ID → slug via `schemaCache` |
| `con-schema-tab-display-helpers.js` | 56 | tab labelling/ordering on the details page |
| `con-sort-properties-by-order.js` | 53 | honours `x-order` on schema properties |
| `con-normalize-link-to-schema-slug.js` | 51 | normalises `$ref` link → slug |
| `con-normalize-schema-name.js` | 48 | strips trailing version markers from schema names |
| `con-smart-split.js` | 25 | parses comma-separated values with quoted-string awareness |
| `con-collapse-extended-objects.js` | 21 | replaces fully-expanded `_extend`ed objects with their IDs before POST/PUT |

## Routing wiring

[routes.constants.js](../src/constants/routes.constants.js) entries for this surface:

| Path constant | Path | Component |
|---|---|---|
| `BEHEER` | `/beheer` | `AcBeheer` → `AcDashboard` |
| `BEHEER_TYPE` | `/beheer/:type` | `AcBeheer` → `ConBeheerPageWrapper` |
| `BEHEER_TYPE_DETAILS` | `/beheer/:type/:id` | `AcBeheer` → domain detail page or `ConGenericBeheerDetailsPage` |
| `BEHEER_VIEW` | `/beheer/view` | `ConBeheerViewsList` |
| `BEHEER_VIEWS` | `/beheer/views` | `ConBeheerViews` |
| `BEHEER_VIEWS_DETAIL` | `/beheer/views/:id` | `ConBeheerViews` |
| `BEHEER_VIEW_DETAIL` | `/beheer/view/:id` | `ConBeheerViews` |
| `VIEWS` | (public) | `AcViews` |
| `EXTENDEDVIEW` | (public) | `AcViews` |
| `OBJECTS` | (configurable) | `AcObjects` |

`AcBeheer` (the `/beheer/:type*` dispatcher) reads `type` and `id` from the route, validates `type` against the menu store's `getAdminDashboardMenu`, and then hard-branches on `type` to pick the right detail-page component (organisaties, product, module/applicaties, moduleversie, dienst, gebruik, koppeling, contactpersoon) or falls through to `ConGenericBeheerDetailsPage`.

## Styles

| File | LoC | Notes |
|------|----:|-------|
| `views/ac-beheer.scss` | 208 | list-view layout |
| `views/ac-beheer-details.scss` | 155 | detail-view layout |
| `views/_con-beheer-views.scss` | 237 | AMEF view canvas |
| `views/_con-beheer-views-list.scss` | 84 | view list cards |
| `views/ac-organisatie.scss` | 64 | organisatie list |
| `views/ac-organisatie-details.scss` | 187 | organisatie detail |
| `views/ac-applicaties.scss` | 10 | trivial |
| `components/_ac-dashboard.scss` | 141 | tile grid |
| `components/_con-action-menu.scss` | 236 | the dropdown menu |
| `components/_con-dynamic-schema-form.scss` | 52 | minimal — almost all styling is inherited from NLDS |
| `components/_con-dynamic-form-layout.scss` | 199 | grid layout for nested objects |
| `components/_con-aangeboden-gebruik-table.scss` | 70 | dashboard widget |
| `components/_con-organization-selector.scss` | 41 | org switcher |
| `components/_con-table.scss` | 83 | beheer table |
| `components/_con-table-search.scss` | 146 | header search bar |
| `components/_con-wysiwyg-markdown-field.scss` | 308 | MD editor overrides |

## Observations worth flagging (no action required)

1. **Two tables ship together.** [con-table.js](../src/views/ac-beheer/shared/components/con-table.js) (882 LoC) is the underlying universal data table — used by ConGenericBeheerPage, con-directory, the file-upload modal, and the dashboard suggesties widget. [con-beheer-table.js](../src/views/ac-beheer/shared/components/con-beheer-table/con-beheer-table.js) (439 LoC) is a thin adapter over it that wires headers/sort/actions from `BeheerPageConfigFactory`, and is **only used by `con-generic-beheer-details-page`**. The list-view engine doesn't use the adapter — it imports `ConTable` directly and assembles the config inline. Consistency candidate but harmless.

2. **`con-action-menu.js` is the only file in the tree on preact/compat.** Lines 1–11 import compound primitives from `preact/compat` (`createContext`, `createPortal`, etc.). Webpack aliases react→preact in production, so this is a portability hedge — but it stands out next to the rest of the codebase which imports from `react` directly. Two molecules (`con-accordion`, the molecules barrel) do the same thing.

3. **`con-debug-viewer` is a dev-only escape hatch.** It returns `null` if `NODE_ENV !== 'development'`, so production bundles still ship it but render nothing. Live in the generic form modal (`con-generic-form-modal.js:926`) and in four wizards' submit screens. Not technically dead code, but worth knowing it exists.

4. **`BEHEER_RENAMES` is documented as transitional.** [beheer-renames.js](../src/views/ac-beheer/core/utils/beheer-renames.js) has a `TODO` saying it should go away once the codebase routes consistently via slugs. It's only consumed by [ac-publication-default.js](../src/views/ac-publication/ac-publication-default.js); the beheer factories duplicate the alias work themselves via `case` aliases. Cleanup candidate, low priority.

5. **A lot of the publish/depublish wiring is marked LEGACY.** [con-generic-beheer-details-page.js:384,440,456,462](../src/views/ac-beheer/core/components/con-generic-beheer-details-page.js#L384) and [con-generic-beheer-page.js:919,953,1316](../src/views/ac-beheer/core/components/con-generic-beheer-page.js#L919) explicitly comment-out or short-circuit publish actions, and `con-my-organisation.js:472` notes the buttons were removed. The publish/depublish *modal* (`ac-generic-beheer-publish-depublish-modal/`, 200 LoC) is still loaded by `BeheerModalFactory` but the UI no longer triggers it. Live dead code — safe candidate to delete after one more sweep.

6. **`AcBeheer` has a TEMPORARILY DISABLED auth check.** [ac-beheer.js:37-46](../src/views/ac-beheer/core/components/ac-beheer.js#L37-L46) — the `await user.checkAuthStatus()` + redirect-to-login block is commented out with `TODO: Re-enable after fixing the auth timing issue`. As a result, anyone can land on `/beheer/*`; the real gate is whatever middleware (or lack thereof) sits in front of `/api/apps/voorzieningen`. Worth confirming this matches intended behaviour before merging.

7. **`ConApiSelectField` is exported but unused in our app code.** Lazy-loaded in [components/index.js:59-60](../src/components/index.js#L59-L60) and re-exported on line 172, but no view imports it. Either staging dead code or a public-facing escape hatch for downstream consumers.

8. **`ConTemplateText` is exported but unused in our app code.** Same situation — exported, no callers. Probably abandoned after the `processUserTemplate` flow was inlined elsewhere.

9. **`ConModulesChoiceSwitch` and `ConExistingModulesInfoBox` are technically forms-only.** They sit in `src/components/` (so they were grouped under the Beheer category) but are only imported by `ac-forms-product/**`. Cross-reference for the wizard analysis.

10. **`AcObjects` is a tiny shim for a single hostname/route case.** [ac-objects.js](../src/views/ac-beheer/ac-objects.js) only maps the `vng-gemma/view` and `vng-gemma/extendview` registers into `ConBeheerPageWrapper`; everything else redirects to `/beheer`. Wired through `routes.constants.js:OBJECTS`. Could fold into `AcBeheer`'s dispatch but standalone is clearer for the VNG-specific path.

11. **`ac-views.js` is the public-facing GEMMA view renderer.** [ac-views/ac-views.js](../src/views/ac-views/ac-views.js) (784 LoC) lives outside `ac-beheer/` but is grouped under this category because it's part of the same archimate/JointJS bundle. It uses `@conduction/archimate-diagram-engine` + `svg-pan-zoom` and contains a hard-coded hostname switch ([line 60-64](../src/views/ac-views/ac-views.js#L60-L64)) between `vng.test.opencatalogi.nl` and `vng.accept.commonground.nu`. Cross-references with category 16 (Chat & GEMMA) where the rest of `gemma.store` / `gemma.api` live — this view, the list view, and the beheer-views detail were built together but currently overlap with each other.

12. **`con-beheer-views*` did *not* go through `ConGenericBeheerPage`.** Both files re-implement loading/filters/canvas state from scratch. Reason is obvious (the JointJS + archimate-diagram-engine canvas is incompatible with a generic table), but it leaves the GEMMA-view admin pages as a parallel implementation rather than a config-driven type. Acceptable but flag as not-pluggable.

13. **`object.store.js` is large enough to warrant splitting.** 4 686 LoC, ~60 actions, 22 observables. The doc comment block at the top is itself ~350 LoC. Hygiene candidate, no functional issue.

14. **Form-engine `HACK:` markers.** [field-renderers.js:37-58](../src/components/con-dynamic-schema-form/utils/field-renderers.js#L37-L58) and [con-dynamic-schema-form.js:326-330,626](../src/components/con-dynamic-schema-form/con-dynamic-schema-form.js#L326-L330) — a global `window.FORCE_DROPDOWN_UPDATE` Map is used to broadcast option updates between dynamically-loaded selects. Comments call out that the underlying re-render loop should be fixed. Working but fragile.

15. **`@TODO: applicaties and voorzieningversie's technically don't exist anymore`** at [con-generic-form-modal.js:586](../src/views/ac-beheer/core/modals/con-generic-form-modal/con-generic-form-modal.js#L586) — there's a runtime branch for two type aliases that may no longer route here. Worth confirming during cleanup.

16. **`con-generic-beheer-page.js` has 1 567 LoC in one file.** It contains both the page-engine and an inline `useLimitWithBackwardsCompat` hook + an inline `PaginatedDataObserver` render-prop component. Splitting these out would shrink the main file but isn't required.

## Recommendation

**Keep everything in this category — no merge decision needed.** None of it exists in Acato; their portal has no admin surface and no schema-driven CRUD.

If we ever decide to tidy up this area as separate hygiene work (not part of the Acato merge), candidates in priority order:

1. Re-enable or delete the commented-out auth check in [ac-beheer.js:37-46](../src/views/ac-beheer/core/components/ac-beheer.js#L37) — this is a real authorisation gap.
2. Delete the publish/depublish modal and its factory registration, since every call site is now commented out (see observation 5).
3. Verify and delete `ConApiSelectField` + `ConTemplateText` if confirmed unused.
4. Split [object.store.js](../src/stores/object.store.js) by concern (collection vs single-object vs publishing vs warmup).
5. Drop `BEHEER_RENAMES` once the publication detail view is updated to route by slug.
6. Move `ConModulesChoiceSwitch` and `ConExistingModulesInfoBox` into `src/views/ac-forms/ac-forms-product/components/` to match their actual usage.
7. Consider unifying `ConTable` and `ConBeheerTable` once their feature sets re-converge.

None of these affect the Acato comparison; they are local debt notes only.

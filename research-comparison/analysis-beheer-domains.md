# Analysis: Beheer — domain detail pages (ours only)

## Branches Compared
- Ours (tilburg-woo-ui): `softwarecatalogus-performance`
- Acato (tilburg-woo-ui_acato): `main`

## Scope

The per-domain detail pages of the Conduction Beheer admin panel — bespoke `/beheer/:type/:id` views for 8 entity types that opt out of the generic `ConGenericBeheerDetailsPage` rendering path. Each domain ships a wrapper component (page-level state, fetch, modal-factory glue) and a content component (header, action menu, sections, related tabs).

This file covers **only** the files under [src/views/ac-beheer/domains/](../src/views/ac-beheer/domains/) — including their `modals/` subfolders and the organisatie filter-headers drawer.

**Excluded** (covered in companion files):
- The list/detail engines, factories, `ConDynamicSchemaForm`, generic modals, shared table, `ObjectStore`, `ToastersStore`, schema utilities → [analysis-beheer-core.md](analysis-beheer-core.md).
- The wizard flows that domain pages link to from "Bewerken" → [analysis-forms-wizards.md](analysis-forms-wizards.md).

**Acato has nothing here.** No `/beheer` route, no admin panel, no per-domain pages. Every file inventoried is built on top of the fork.

This category is ours-only — the verdict is **keep**, no merge decision needed. This file is an inventory to make the surface area legible.

## Files Inventoried

**~5 944 LoC** across 20 JS files in 8 domain folders:

| Domain | Wrapper (LoC) | Content (LoC) | Extras | Total |
|--------|--------------:|--------------:|--------|------:|
| `ac-contactpersoon/` | 187 | 346 | — | 533 |
| `ac-dienst/` | 168 | 503 | — | 671 |
| `ac-gebruiken/` | 167 | 506 | `modals/ac-gebruik-koppelen.js` (153) | 826 |
| `ac-koppeling/` | 159 | 513 | — | 672 |
| `ac-module/` | 199 | 653 | — | 852 |
| `ac-organisatie/` | 196 | 270 | `organisatie-filter-headers-drawer.js` (215), `modals/ac-accept-organisation.js` (126), `modals/ac-add-remove-deelname.js` (263) | 1 070 |
| `ac-product/` | 188 | 585 | — | 773 |
| `con-module-version/` | 183 | 364 | — | 547 |
| **Total** | **1 447** | **3 740** | **757** | **5 944** |

## Top-level structure

```
src/views/ac-beheer/domains/
├── ac-contactpersoon/
│   ├── con-contactpersoon-details-page.js              # wrapper (pageType: 'contactpersonen')
│   └── con-contactpersoon-details-page-content.js
├── ac-dienst/
│   ├── con-dienst-details-page.js                      # wrapper (pageType: 'dienst')
│   └── con-dienst-details-page-content.js
├── ac-gebruiken/
│   ├── con-gebruik-details-page.js                     # wrapper (pageType: 'gebruik')
│   ├── con-gebruik-details-page-content.js
│   └── modals/ac-gebruik-koppelen.js                   # gebruik-to-gebruik link modal
├── ac-koppeling/
│   ├── con-koppeling-details-page.js                   # wrapper (pageType: 'koppeling')
│   └── con-koppeling-details-page-content.js
├── ac-module/
│   ├── con-module-details-page.js                      # wrapper (pageType: 'module')
│   └── con-module-details-page-content.js
├── ac-organisatie/
│   ├── con-organisatie-details-page.js                 # wrapper (pageType: 'organisatie')
│   ├── con-organisatie-details-page-content.js
│   ├── organisatie-filter-headers-drawer.js            # wired into FilterDrawerFactory
│   └── modals/
│       ├── ac-accept-organisation.js                   # used as `activate` and `deactivate`
│       └── ac-add-remove-deelname.js                   # used as `addDeelname` and `removeDeelname`
├── ac-product/
│   ├── con-product-details-page.js                     # wrapper (pageType: 'product')
│   └── con-product-details-page-content.js
└── con-module-version/
    ├── con-module-version-detail-page.js               # wrapper (pageType: 'moduleversie') — note `detail` (singular)
    └── con-module-version-detail-page-content.js
```

## How they plug in

Routing dispatch lives in [ac-beheer.js:161-188](../src/views/ac-beheer/core/components/ac-beheer.js#L161-L188): when `/beheer/:type/:id` resolves with one of the 8 type strings (or their aliases), `AcBeheer` returns the bespoke domain page instead of `ConGenericBeheerDetailsPage`. Each wrapper is `withStore(observer(...))` and pulls `object` and `user` stores from the MobX root.

Modals are loaded via [BeheerModalFactory](../src/views/ac-beheer/core/factories/con-beheer-modal-factory.js) — `renderModals(pageType, …)` produces the right set of `loadable()` components per type. The three domain-local modals are wired in there:

- `gebruiken.koppelen` → `ac-gebruik-koppelen.js`
- `organisaties.activate` and `organisaties.deactivate` → `ac-accept-organisation.js` (same module, `activate` prop flips behaviour)
- `organisaties.addDeelname` and `organisaties.removeDeelname` → `ac-add-remove-deelname.js` (same module, `remove` prop flips behaviour)

The filter drawer is loaded via [FilterDrawerFactory](../src/views/ac-beheer/core/factories/con-filter-drawer-factory.js) — `organisatie`/`organisaties` resolve to `OrganisatieFilterHeadersDrawer`; everything else falls back to the generic `ConFilterHeadersDrawer`.

The list page for these types (`/beheer/:type`) goes through `ConGenericBeheerPage` as usual; the bespoke pages only kick in on the `/:id` detail route.

## Shared wrapper skeleton

7 of the 8 wrappers (all except `ac-koppeling`) are 99% identical — ~190 LoC each containing the same blocks in the same order:

1. `pageType = '<literal>'`, `config = DetailsPageConfigFactory.createConfig(pageType)` memoised once.
2. Local state: `openModal`, `dynamicCreateTargetType`, `dynamicCreatePreSelected`, `dynamicCreateMetadata`.
3. Derived: `objectType = object.getTypeFromParams(registerSlug, schemaSlug)`, `schemaType = object.getSchemaType(schemaSlug)`.
4. Live data: `object.getObject(objectType, id) ?? object.getActiveObject(objectType)`.
5. `error`, `loading` derivations from the store.
6. `useEffect` → `object.fetchObject(register, schema, id, { _extend, _related: true, _relatedNames: true, _published: 'false' })` + `object.fetchSchema(schemaSlug)`.
7. `useEffect` → `object.setActiveObject(register, schema, data)`.
8. `modalConfig` memo strips `add`/`import`, ensures `dynamicCreate` is present.
9. Render: `AcSection` → `AcFlex` → `ConDynamicSidenav` + (loader | error | content) → `BeheerModalFactory.renderModals(pageType, { … })`.

The differences are all parameter tweaks (see per-domain table below).

`ac-koppeling`'s wrapper is the structural outlier — it omits the four `dynamicCreate*` state slots and doesn't pass them to `renderModals`. The "Toevoegen X" action menu plumbing that the other 7 carry is absent here.

## Per-domain divergences

| Domain | pageType | Wrapper extras | Content highlights | Bewerken edit destination |
|--------|----------|----------------|--------------------|---------------------------|
| `contactpersoon` | `'contactpersonen'` *(plural — only outlier)* | Function name still `ConProductDetailsPage` (copy-paste leftover) | Resolves `fullName` from `voornaam`/`tussenvoegsel`/`achternaam`; `ConLogoPreview` from `@self.image`; `ConUuidResolver` for organisatie | Wizard via `wizards.find(w => w.schema === config.schemaSlug)`; modal fallback |
| `dienst` | `'dienst'` | — | Inline MDEditor markdown render for `beschrijvingLang`; manual contact extraction (object \| array \| UUID); JSON-parsed type list | Wizard via hard-coded `w.schema === 'dienst'`; modal fallback |
| `gebruik` | `'gebruik'` | — | 3-way edit routing on click: koppeling-wizard / dienst-wizard / applicatie-wizard, *and* organisation-type branch for `Leverancier`/`Community` → `ontbrekend-organisatie` variant. Fetches full active org via `object.fetchObject('voorzieningen','organisatie',…)` to read `type`. Resolves and alphabetises referentiecomponenten via `object.getNamesForMultipleIds` | Manual URL builder, no modal fallback |
| `koppeling` | `'koppeling'` | Slim wrapper — no `dynamicCreate*` state | Resolves `moduleA`/`moduleB` from `@self.relations` fallback; `buitengemeentelijkVoorziening` aliasing; direction icon (→ / ← / ↔); `getAllDatesWithValues` helper at module top | Wizard via `w.schema === config.schemaSlug`; modal fallback |
| `module` | `'module'` | Hard-coded extra `_extend[]: ['@self.schema', 'compliancy', …]` on initial fetch and refresh | `ConEditableStandards` panel with `compliancy` + `standaardVersies`; `SuitableForSection` inner component resolving `referentieComponenten` via `referentieComponentenWithStandards`; tracks `editingStandards`/`standardsCount` state | Wizard via hard-coded `w.schema === 'applicatie'`; modal fallback |
| `organisatie` | `'organisatie'` | Uses `'_extend[]'` array param form everywhere (others use `_extend` scalar); passes `onDataUpdate` callback into `actionMenuProps` | **No action menu rendered** — block commented out. Inline `ConEditableDescription` for `beschrijvingKort` + `beschrijvingLang` (live PATCH editing) | N/A — no edit button on this page |
| `product` | `'product'` | Skips `object.fetchSchema('product')` because the schema no longer exists; refresh fetch omits `_published: 'false'` | Only domain that uses `useRelatedCreateActions` hook → renders "Toevoegen X" buttons in action menu; `uniqueActions` from `config.uniqueActions` filter; inline `ConEditableDescription` (live editing); `SuitableForSection` over flattened `modules[].referentieComponenten` | Wizard via `w.schema === config.schemaSlug`; modal fallback |
| `moduleversie` | `'moduleversie'` | Folder named `con-module-version/`, files `con-module-version-detail-page*` (singular `detail`, where others use `details`) | Simplest content — `ConEditableDescription` x2, status→date mapping for "in ontwikkeling"/"in gebruik"/"teruggetrokken"/"einde ondersteuning", localized release date | **Modal only** — no DASHBOARD_WIZARDS lookup |

## Content component shape

Every content component (across all 8 domains) follows this skeleton:

1. State: `uses`, `used`, `usesLoading`, `usedLoading`, `relatedTabIndex`.
2. `fetchUses` and `fetchUsed` callbacks — each does a hand-rolled `fetch(`${commongroundApiUrl()}/opencatalogi/api/publications/${id}/uses`)` (and `/used`). Same fetch shape, 8 copies.
3. `checkOrganizationPermissions(user, data)` → `{ canEdit: hasEditPermission, reason }`; `actualCanEdit = canEdit && hasEditPermission`. Drives `disabled` + `getDisabledActionTooltip` on every menu item.
4. `useEffect(fetchUses + fetchUsed, …)`.
5. Render: header div (`con-beheer-details--header-container`) with `ConLogoPreview` + `Heading` + `ConActionMenu` (preact/compat) on the right. Action menu has **Bewerken**, an inline commented-out **Publiceren**/**Depubliceren** pair, and **Verwijderen**.
6. Sections of label/value rows.
7. `RelatedTabs` (the `con-related-tabs.js` from the publication-detail category) at the bottom, fed `uses`/`used` and routed with `navigateTo='beheer'`.

The commented-out Publish/Depublish block is line-for-line identical across all 8 files (~30 LoC each) — matches the LEGACY markers noted in the core analysis.

## Domain-local modals & drawer

### `ac-gebruik-koppelen.js` (153 LoC)
Pairs two `voorzieninggebruik` objects via `object.linkGebruik(fromId, toId)`. Loads the gebruik collection (limit 500), filters to other gebruiken, renders two `ReactSelect` dropdowns (van / naar). One-off feature — not in any base modal set.

### `ac-accept-organisation.js` (126 LoC)
PATCHes `organisatie.beoordeling` to `'Actief'` or `'Deactief'` depending on `activate` prop. Same component used for both `activate` and `deactivate` modal slots — opposite confirm copy. Uses inline error styling from Utrecht CSS custom properties (no shared error component).

### `ac-add-remove-deelname.js` (263 LoC)
Manages `organisatie.deelnames` array. `remove` prop flips between add and remove. Add-flow fetches public-index organisations of type `Samenwerking`/`Community` (uses `_source: 'index'` — comment explains tenant boundary), then filters out existing deelnames. Remove-flow lists current deelnames (including any whose org has been deleted, as raw UUIDs). Submits via `object.patchObject('voorzieningen','organisatie',id,{ deelnames })`.

### `organisatie-filter-headers-drawer.js` (215 LoC)
Override of the generic `ConFilterHeadersDrawer` for the organisatie list. Adds a "Beoordeling" `ReactSelect` (Concept / Actief) on top of the standard header-checkbox list. Persists checked-IDs to `sessionStorage` keyed by `filter-headers-${type}`; reloads on type change. Wired via [FilterDrawerFactory:16-17](../src/views/ac-beheer/core/factories/con-filter-drawer-factory.js#L16-L17).

## Observations worth flagging (no action required)

1. **The 8 wrappers are textbook copy-paste.** Diffing `contactpersoon` vs `dienst` wrappers yields ~5 substantive lines: the `pageType` literal, the content-component name, comment edits, and (in dienst) a missing inline comment. The fetch params, modal config, render JSX, and `BeheerModalFactory.renderModals(...)` arguments are byte-equivalent across all but `ac-koppeling`. **Consolidation candidate**: a generic `ConDomainDetailsPage` taking `{ pageType, ContentComponent, extraExtend?, useExtendArrayForm? }` props could replace 7 of the 8 wrappers, saving ~1 200 LoC.

2. **`contactpersoon` wrapper's `pageType = 'contactpersonen'` (plural)** while every other wrapper uses the singular form and while the routing dispatch in `ac-beheer.js:186` matches against the singular `'contactpersoon'`. `BeheerModalFactory.modalComponents` defines *both* `contactpersonen` and `contactpersoon` keys to compensate. Naming-cleanup candidate; not a bug.

3. **`con-module-version/` folder uses singular `detail`** in both its directory name and file names (`con-module-version-detail-page*`) while every other domain uses plural `details` (`con-*-details-page*`). Cosmetic; flagged for the eventual rename pass.

4. **Function name leak in `con-contactpersoon-details-page.js:22`** — the exported component is declared as `const ConProductDetailsPage = ({ store }) => …` (copy-paste leftover from the product wrapper). Since the default export is `withStore(observer(...))`, runtime behaviour is unaffected; React DevTools just shows the wrong name. One-line fix.

5. **`fetchUses`/`fetchUsed` duplication.** Each content file rolls its own `fetch('${commongroundApiUrl()}/opencatalogi/api/publications/${id}/uses')` — 8 identical copies, ~30 LoC each. The publication-detail category does the same in its public counterparts. Consolidation candidate: a `useRelatedFetch(id)` hook returning `{ uses, used, loading, … }`.

6. **MDEditor.Markdown plugin pipeline is repeated verbatim in 4 files** (`ac-dienst`, `ac-koppeling`, `ac-module`, plus matches the wizard usage). Same 5 remark plugins + 3 rehype plugins, same `data-color-mode='light'` wrapper. Hoist to a shared component.

7. **The commented-out Publish/Depublish block is repeated 8 times.** Lines 200–235 (give or take) of every content file are byte-identical commented JSX of the publish + depublish menu items, plus a commented `UnpublishedWarning` helper at the bottom. ~240 LoC of dead code preserved as documentation. Matches the LEGACY flag in the core analysis — same one-pass cleanup applies here.

8. **`dynamicCreate*` plumbing is mostly inert.** 7 of 8 wrappers carry the four `dynamicCreate*` state slots and pass them into `actionMenuProps`, but **only `ac-product`'s content component consumes them** via `useRelatedCreateActions`. Everyone else routes only edit/delete/(publish/depublish) through `setOpenModal`. The plumbing was added for the "Toevoegen X" pattern but never adopted by 6 of the domains. Either delete the unused state or wire the hook into every content component.

9. **"Bewerken" edit-button logic forks three ways across domains.**
   - `contactpersoon`, `koppeling`, `product`: wizard found via `(w) => w.schema === config.schemaSlug` (the principled lookup).
   - `dienst`: hard-codes `w.schema === 'dienst'`.
   - `module`: hard-codes `w.schema === 'applicatie'` (deliberate — modules now map to the applicatie wizard).
   - `gebruik`: skips the lookup entirely and builds wizard URLs based on `koppelingen`/`diensten` array contents + `Leverancier`/`Community` org-type branch (the most complex of the 8).
   - `moduleversie`: no wizard lookup at all — `Bewerken` always opens the modal.
   The two hard-coded `(w) => w.schema === '<literal>'` cases should probably converge on `config.schemaSlug` once schemaSlug values stabilise.

10. **`organisatie` content has no action menu.** Lines 7, 13, and the entire trigger/menu block are commented out (`// import { VISUALS }`, `// import ConActionMenu`). The wrapper *does* pass `actionMenuProps` but the content never uses them — actions for organisatie pages must live on a different surface (likely `ConDetailsActionsMenu` from the core layout). Imports `Alert` and `Paragraph` that are only used in the commented `UnpublishedWarning`. Worth verifying nothing relies on the absent menu before pruning.

11. **`organisatie` uses `'_extend[]'` array-form params**; the other 7 wrappers use `_extend` (scalar). Both forms hit Nextcloud's openregister API but the array form is semantically explicit. Likely intentional for the relation-heavy organisatie fetch; flag for confirmation during any consolidation pass.

12. **`module` wrapper carries hard-coded extra extends** — `['@self.schema', 'compliancy']` prepended to `config.extend`. Lives in the wrapper rather than `DetailsPageConfigFactory.createConfig('module')`. Moving the literal into the factory config would let the wrapper match the others byte-for-byte.

13. **`product` wrapper has a "schema doesn't exist" guard.** [con-product-details-page.js:88-91](../src/views/ac-beheer/domains/ac-product/con-product-details-page.js#L88-L91) — `if (config.schemaSlug !== 'product') { object.fetchSchema(config.schemaSlug); }` skips the schema fetch outright. Matches the `'product'` schema being retired upstream; once the slug renames to something else this branch dies.

14. **`ac-gebruik-koppelen.js` is the only domain modal that calls a custom store action** (`object.linkGebruik(fromId, toId)`). The two organisatie modals both use generic `patchObject`. Fine — `linkGebruik` is the gebruik-linking endpoint — but worth knowing it adds a hard dependency from this modal back into `object.store.js`.

15. **`organisatie-filter-headers-drawer.js` re-implements `ConFilterHeadersDrawer` rather than wrapping it.** Same `forwardRef`/checkbox state shape and same sessionStorage pattern as the generic drawer in `shared/components/`, with the Beoordeling select added on top. Could probably be expressed as `<ConFilterHeadersDrawer extraTopSlot={<BeoordelingSelect />} />` if the generic drawer learned to accept a slot.

## Recommendation

**Keep all domain pages — no merge decision needed.** None of these views exist in Acato.

If we ever decide to "tidy up" this category as separate hygiene work (not part of the Acato merge), the candidates flagged above in priority order:

1. Collapse the 7 near-identical wrappers (all but `ac-koppeling`) into a single `ConDomainDetailsPage` taking `{ pageType, ContentComponent, extras }`. Largest LoC win; mechanical refactor.
2. Move the `module` wrapper's hard-coded `['@self.schema','compliancy']` extends into `DetailsPageConfigFactory.createConfig('module')` so step 1 doesn't need a special case for it.
3. Either wire `useRelatedCreateActions` into the other 6 content components or remove the inert `dynamicCreate*` state from their wrappers.
4. Extract `useRelatedFetch(id)` so 8 copies of the same `/uses` / `/used` fetch shrink to one hook call.
5. Hoist the MDEditor remark/rehype plugin pipeline into a shared `<ConMarkdownView />` (re-uses the existing `con-markdown` component if compatible).
6. Sweep the commented-out Publish/Depublish + `UnpublishedWarning` blocks together with the same sweep done in core (matches the LEGACY pattern flagged in [analysis-beheer-core.md](analysis-beheer-core.md) §5).
7. Rename `contactpersoon`'s `pageType = 'contactpersonen'` → `'contactpersoon'`; rename `con-module-version/` → `con-moduleversie/` and `*-detail-page*` → `*-details-page*` for consistency.
8. Fix the `ConProductDetailsPage` function-name leak in `con-contactpersoon-details-page.js:22`.
9. Verify the absent action menu in `organisatie` content is intentional (probably yes — actions live on `ConDetailsActionsMenu` in the generic layout) and prune the dead `Alert`/`Paragraph` imports + commented helper.

None of these affect the Acato comparison; they are local debt notes only.

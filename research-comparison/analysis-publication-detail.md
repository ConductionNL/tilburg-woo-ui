# Analysis: Publication Detail / Content View

## Branches Compared
- Ours (tilburg-woo-ui): `softwarecatalogus-performance`
- Acato (tilburg-woo-ui_acato): `main`

## Files Compared

**Shared (exist in both repos):**
- [src/views/ac-publication/ac-publication.js](../src/views/ac-publication/ac-publication.js)
- [src/views/ac-content/ac-content.js](../src/views/ac-content/ac-content.js)
- [src/styles/views/ac-publication.scss](../src/styles/views/ac-publication.scss)

**Ours only — variant components:**
- [src/views/ac-publication/ac-publication-default.js](../src/views/ac-publication/ac-publication-default.js)
- [src/views/ac-publication/ac-publication-default1.js](../src/views/ac-publication/ac-publication-default1.js)
- [src/views/ac-publication/ac-publication-default-old.js](../src/views/ac-publication/ac-publication-default-old.js)
- [src/views/ac-publication/ac-publication-woo-verzoek.js](../src/views/ac-publication/ac-publication-woo-verzoek.js)
- [src/views/ac-publication/ac-publication-softwarecatalogus.js](../src/views/ac-publication/ac-publication-softwarecatalogus.js)
- [src/views/ac-publication/ac-publication-formulier.js](../src/views/ac-publication/ac-publication-formulier.js)
- [src/views/ac-publication/ac-publication-organisation.js](../src/views/ac-publication/ac-publication-organisation.js)
- [src/views/ac-publication/ac-publication-product.js](../src/views/ac-publication/ac-publication-product.js)
- [src/views/ac-publication/ac-publication-module.js](../src/views/ac-publication/ac-publication-module.js)
- [src/views/ac-publication/ac-publication-moduleversie.js](../src/views/ac-publication/ac-publication-moduleversie.js)
- [src/views/ac-publication/ac-publication-koppeling.js](../src/views/ac-publication/ac-publication-koppeling.js)
- [src/views/ac-publication/ac-publication-gebruik.js](../src/views/ac-publication/ac-publication-gebruik.js)
- [src/views/ac-publication/ac-publication-dienst.js](../src/views/ac-publication/ac-publication-dienst.js)
- [src/views/ac-publication/ac-publication-contactperson.js](../src/views/ac-publication/ac-publication-contactperson.js)

**Ours only — supporting files:**
- [src/views/ac-publication/con-related-tabs.js](../src/views/ac-publication/con-related-tabs.js) (613 lines, older)
- [src/views/ac-publication/con-related-tabs-new.js](../src/views/ac-publication/con-related-tabs-new.js) (439 lines, current)
- [src/views/ac-publication/helpers/beschrijving-tab.helper.js](../src/views/ac-publication/helpers/beschrijving-tab.helper.js)
- [src/components/con-publication-actions/con-publication-actions.js](../src/components/con-publication-actions/con-publication-actions.js)
- [src/components/con-publication-type-badge/con-publication-type-badge.js](../src/components/con-publication-type-badge/con-publication-type-badge.js)
- [src/components/con-related-objects-links/con-related-objects-links.js](../src/components/con-related-objects-links/con-related-objects-links.js)
- [src/styles/views/con-publication-details.scss](../src/styles/views/con-publication-details.scss)
- [src/styles/views/con-module-publication.scss](../src/styles/views/con-module-publication.scss)
- [src/styles/components/_con-related-objects-links.scss](../src/styles/components/_con-related-objects-links.scss)

---

## What is the same

- **`ac-publication.scss`** copy-button block: the `.copy-button` rule, `data-status='copied'` overrides, `pop-in` keyframes and `particle-burst` keyframes are byte-identical between the two repos. Both files originated from the same starting point.
- **`ac-content.js`** core flow is identical in both: `withStore` → `observer`, `fetchPage(location.pathname)` on mount, `resetPage` on unmount, `AcLoader` while loading, then `<AcContainer compact><Heading level={1}>{name}</Heading><AcSectionsHandler /></AcContainer>`.
- Both `ac-publication.js` files use the same store contract (`publications.fetchPublication`, `get_single`, `loading`, `attachmentPagination`, `getFilteredAttachments`, `setAttachmentsPage`, `resetPublication`).
- Both rely on the same Utrecht/Amsterdam design-system components (`Heading`, `Paragraph`, `DataList`, `Pagination`, `SecondaryActionButton`, `Alert`, `Textbox`).

## What differs

### `ac-publication.js` — architecturally inverted

| Aspect | Ours (209 lines) | Acato (450 lines) |
|---|---|---|
| Role | **Dispatcher / router.** Inspects `get_single?.catalog?.title`, `publicationType?.title`, and `@self.schema.slug` and renders one of 13 type-specific variants (`AcPublicationProduct`, `AcPublicationModule`, `AcPublicationWooVerzoek`, `AcPublicationFormulier`, …, `AcPublicationDefault` as fallback). | **Single monolithic view.** Renders one layout for every publication: title → blue summary card → primary/secondary attachments tables → additional-info DataList → share modal + concepts drawer. |
| Stores consumed | `publications` only. Each variant pulls its own additional stores. | `publications` + `terms`. |
| Data fetched on mount | `fetchPublications()` (search list), `fetchPublication(id)`. Then in separate effects: `fetchRelations(uri)` and `fetchAttachments(id)` (only for schemas that need them; skipped for `organisatie`/`product`/`module`/`koppeling`/`gebruik`/`dienst`). | `fetchPublication(id)`, `fetchAttachments(id)`, `fetchTerms()`. A second effect calls `fetchTermsForPublication(id)` once `get_single` is loaded. |
| Loading gate | Custom `initialDataLoaded` flag waits for `get_single` + (conditionally) `all_attachments` before rendering. | Single `loading.status` check. |
| Error state | Dedicated UI when `publications.get_error` is set: "Kon publicatie niet laden" + foutcode/message + "Ga terug" button (`navigate(-1)`). | "Publicatie niet gevonden" inline message with a link back to the search page (`getSearchPageURL()`). |
| Glossary integration | Wraps render in `<ConGlossaryHighlight as='div'>` — **but this wrapper is unreachable.** Lines 201-205 sit after an if/else block where both branches return, so the JSX is dead code. (See "Bugs" below.) | Has a glossary drawer driven by the `terms` store with two tabs ("Deze pagina" / "Alle begrippen") and an in-drawer search filter. |
| Share modal | Not present in this file. Some variants (e.g. `ac-publication-woo-verzoek.js`) also omit it. | Present: opens an `AcModal` with a read-only `Textbox` showing the publication URL and a `PrimaryActionButton` that copies via `navigator.clipboard.writeText` and animates with the particle burst. Has an `aria-live='polite'` sr-only status region. |
| Attachment search | Not present in dispatcher; variants pass through `getFilteredAttachments` directly without an `AcSearchFilter`. | Inline `AcSearchFilter` above the secondary-documents table, with empty-state `Alert` when no matches. |
| Concepts/terms drawer | Not in this file. Ours has a separate `con-glossary-drawer` component (see [glossary analysis](analysis-glossary.md) — not yet written). | Built-in: `AcDrawer` + `AcTabList` showing per-publication terms ("Deze pagina") and a searchable full glossary ("Alle begrippen"). |

### `ac-content.js` — auth-gated

Ours adds two things Acato does not have:

1. **Permission check.** Reads `user.isAuthenticated` from the store and calls `pages.shouldShowPage(get_single, user.isAuthenticated)`. If the page is restricted:
   - Unauthenticated → `navigate('/login?redirect_url=...')` (returns `AcLoader` while the navigation happens).
   - Authenticated but unauthorized → renders a "Geen toegang" message.
2. **Page-not-found state.** If `get_single` is null after loading, renders "Pagina niet gevonden". Acato silently renders an empty `<Heading>` + `AcSectionsHandler`.

Ours also wraps the render in `<ConGlossaryHighlight as='div'>`.

### `ac-publication.scss`

Ours adds (on top of the shared copy-button animations):
- `.ac-publication-details--actions { margin-block-end: var(--tilburg-space-block-cat); }`
- `.ac-publication-logo-container` (height: 100px, width: 100% by default, width: 160px when the image is square — uses `:has()` selectors to detect 1×1 or empty width/height attributes).
- `.ellipsis-cell` — truncates table cells past 50ch with ellipsis (used in the attachment / related-objects tables).
- `.ac-publication-container .ac-tabs [class*='react-tabs__tab-panel--selected'] { padding-inline-start: 0; padding-inline-end: 0; }` — zeroes out the side padding on the active tab panel in publication details.
- `.con-publication-uses-used-loader { height: 200px; }`

Acato has none of these; their publication detail does not use tabs, ellipsis cells, or logo containers.

### Bugs / dead code in ours

- **Unreachable JSX in [ac-publication.js:201-205](../src/views/ac-publication/ac-publication.js#L201-L205).** The `if (get_single?.catalog?.title === 'Softwarecatalogus') { return … } else { switch … return … }` block exits on every branch (including the `default` case which returns `<AcPublicationDefault schema={schema} />`), so the trailing `return ( <ConGlossaryHighlight>…</ConGlossaryHighlight> )` and the `renderPublicationView()` call inside it never execute. `renderPublicationView` is also undefined — this would throw if reached. Safe to delete; or, if `ConGlossaryHighlight` was *meant* to wrap the variants, the dispatcher should be refactored.
- **Pagination total in `ac-publication-woo-verzoek.js:125`** (and the same pattern in `ac-publication-default.js:458`): `totalPages={getFilteredAttachments().length}` — passes the item count where `Math.ceil(length / perPage)` is expected. Acato's equivalent in `ac-publication.js:309` does it correctly: `totalPages={Math.ceil(totalItems / attachmentPagination.perPage)}`. `page` is also hardcoded to `1` in our version.
- **Stale-closure on attachments in `ac-publication.js:108`** (Acato): `useMemo` for `renderAttachments` depends on `attachments` but reads through `getFilteredAttachments` which depends on `attachmentSearch` and `attachmentPagination.page`; pagination clicks/search input won't trigger re-memo. Not a fatal bug because the `setAttachmentsPage` state setter forces a re-render of the parent observer, but the dependency list is misleading. Ours has the same shape with its own variants.

## Only in ours

### Type-specific variant pages (14 files)

A family of large component files, each rendering one Open Catalogi schema type:

- **`ac-publication-woo-verzoek.js`** (183 lines) — closest analog to Acato's monolithic publication view: title + blue summary card + attachment tables + additional-info table (case number / category / themes). No drawer, no share modal, no terms.
- **`ac-publication-softwarecatalogus.js`** (371 lines) — softwarecatalogus-specific. Groups `get_relations` by `publicationType.title` into custom tabs.
- **`ac-publication-formulier.js`** (315 lines) — form publications with tabs.
- **`ac-publication-organisation.js`** (288 lines) — organisation page with `ConLogoPreview`, side-column contact info (e-mailadres / telefoonnummer / website via `ConExternalLink`), `RelatedTabs`, `ConPublicationTypeBadge`.
- **`ac-publication-product.js`** (398 lines), **`ac-publication-module.js`** (776 lines), **`ac-publication-moduleversie.js`** (333 lines), **`ac-publication-koppeling.js`** (456 lines), **`ac-publication-gebruik.js`** (368 lines), **`ac-publication-dienst.js`** (456 lines), **`ac-publication-contactperson.js`** (355 lines) — softwarecatalogus-domain detail pages. All seven follow an identical scaffold: resolve `schemaSlug` via `schemaCache.get(schemaId)` with a `useMemo`, hold local `uses`/`used`/`*Loading`/`relatedTabIndex` state, fetch via `${commongroundApiUrl()}/opencatalogi/api/publications/{id}/{uses|used}?_extend[]=_schema`, feed into `useResolveSchemaIds` then hand off to `RelatedTabs` (`con-related-tabs-new`). The differences are domain-specific render blocks above the tabs:
  - **`module.js`** — embeds `ConStandardsTable` for the standards list (only variant that does).
  - **`moduleversie.js`** — renders a status-date trail (`getAllDatesWithValues` walks `datumInOntwikkeling`, `datumInGebruik`, etc. via `AcFormatDate`).
  - **`organisation.js`** and **`product.js`** — show a contact side-column (`AcColumn` / inline flex) with `e-mailadres` / `telefoonnummer` / `website` via `ConExternalLink`.
  - **`gebruik.js`** / **`dienst.js`** / **`koppeling.js`** — minimal header + summary + `RelatedTabs`, no extra side-column.
  - **`contactperson.js`** — uses `useRelatedCreateActions` (the only related variant that does).
- **`ac-publication-default.js`** (663 lines) — schema-driven generic fallback: walks `@self.schema.properties`, sorts via `sortPropertiesByOrder`, filters by `excludedProperties` / `visible` / `hideOnView` / `canReadField`, and renders each via `formatBySchema` with async `resolveUUIDsInText`/`Array`/`Object` resolution. Fetches `/publications/:id/uses` and `/publications/:id/used` directly via REST.
- **`ac-publication-default1.js`** (165 lines) — earlier alternate iteration that still references `MOCK_CONCEPTS`. Looks orphaned.
- **`ac-publication-default-old.js`** (369 lines) — previous version. Almost certainly dead — kept around for reference.

Shared patterns across all variants:

- `ConDetailsActionsMenu` for edit/delete/publish actions (auth-gated).
- `AcGenericBeheerDeleteModal` for delete confirmation.
- Edit handler: look up matching wizard in `DASHBOARD_WIZARDS` via `normalizeSchemaName(schemaSlug)`; if found, navigate to the wizard with `?id=<id>` set; otherwise fall back to `/beheer/<schemaSlug>/<id>?showEditModal=true`.
- `MDEditor.Markdown` with the same plugin stack (`remarkGfm`, `remarkDefinitionList`, `remarkEmoji`, `remarkSupersub`, `remarkMark`, `rehypeSlug`, `rehypeSanitize`) for `beschrijvingLang`.

### Supporting components

- **`con-related-tabs-new.js`** (439 lines) — "current" related-tabs implementation used by all softwarecatalogus-family variants. Auto-generates tabs by inspecting the schema slug of each item in `uses`/`used`/`gebruik` arrays, looks up the matching schema in `useResolveSchemaIds`'s `aggregatedSchemas`, and picks the appropriate card from `con-cards/*` (per the [publication-cards analysis](analysis-publication-cards.md)). Hard-coded tab order: `product → module → dienst → gebruik → contactpersoon → koppeling → moduleversie`. Schema-slug → icon map.
- **`con-related-tabs.js`** (613 lines, older) — earlier related-tabs implementation. Still imported by some variants (`ac-publication-softwarecatalogus.js`). Two implementations coexist.
- **`helpers/beschrijving-tab.helper.js`** — factory returning a `{ id, label, icon, render }` tab config that renders `publication.beschrijvingLang` (or `@self.description`) via the shared Markdown plugin stack, with a "Nog geen beschrijving opgegeven" empty state.
- **`con-publication-type-badge`** — small atom that maps a schema slug to a `VISUALS.*` icon + Dutch display name (e.g. `module` → `<CUBE>` + `'Applicatie'`, `gebruik` → `<CURSOR_CLICK>` + `'Gebruik'`). `index.js` is a one-line default re-export.
- **`con-publication-actions.js`** (196 lines) — older publication-action menu with wizard-aware create handlers (`attemptWizard`). Largely superseded by `ConDetailsActionsMenu`; appears unused inside this category's files but is still exported.
- **`con-related-objects-links.js`** — inline comma-separated list of `<Link to="/beheer/<schema>/<id>">{name}</Link>` for arrays of related extended objects; renders `-` for empty/invalid input.

### Supporting styles

- **`con-publication-details.scss`** — layout primitives for the organisation and product variants: `.con-publication-detail__organisation_*` (actions/header/info/contact) and `.con-product-publication--header-{container,actions,type}` (with svg sizing keyed to `--utrecht-heading-1-font-size`).
- **`con-module-publication.scss`** — same primitives renamed for the module variant. Likely duplicated from `con-publication-details.scss` for visual tweaks.
- **`_con-related-objects-links.scss`** — forces inline display on the comma-list links (overrides utrecht-link's default).

## Only in Acato's

- **Glossary terms drawer** inside `ac-publication.js`. Driven by the `terms` store (not present in ours — see [stores analysis](analysis-stores.md), pending). Two tabs:
  - "Deze pagina" — `publication_terms(id)`, sorted alphabetically, each term shown as heading + description.
  - "Alle begrippen" — `filtered_terms`, with `AcSearchFilter` that calls `setSearchQuery` and returns the live match count.
- **Share-this-page modal** with a copy-to-clipboard button, particle/pop-in animation, and an `aria-live='polite'` sr-only status region announcing "De link is gekopieerd…" / "Het kopiëren is mislukt".
- **Inline attachment search** (`AcSearchFilter` above the secondary-documents table) with an empty-state `Alert` showing "Geen resultaten gevonden". Ours' analogue paginates but doesn't search within attachments.
- **Correct pagination math** (`Math.ceil(totalItems / perPage)`) — ours regressed this in the variant pages.
- **Cleaner inline "publicatie niet gevonden"** empty state linking back to the search page.

## Recommendation

### Architectural — needs decision

The two repos solved the same problem in opposite directions:

- **Acato** chose one monolithic publication view that handles any document. Adding a new attribute is one place.
- **Ours** chose a dispatcher + 13 type-specific variants. Each Open Catalogi schema (product/module/dienst/…) gets its own bespoke layout, which is what the softwarecatalogus product line requires.

There is no clean merge: the dispatcher pattern is fundamental to the softwarecatalogus features. **Keep ours' architecture.** The Acato monolith does not fit our domain.

### Adopt from Acato (target: `ac-publication-woo-verzoek.js`)

These are pure-functional improvements that fit the WOO portal use case and have no domain conflict:

| Item | Action | Notes |
|---|---|---|
| Inline attachment search (`AcSearchFilter` + `Alert` empty state) | **Take from Acato.** | Pure UX improvement for the secondary-documents table in [ac-publication-woo-verzoek.js](../src/views/ac-publication/ac-publication-woo-verzoek.js). |
| Pagination math fix (`Math.ceil(total / perPage)` instead of `total`) | **Take from Acato.** Apply to every variant. | Real bug in ours — clicking page 2 of attachments produces wrong page-count. |
| Share-this-page modal with copy-link + a11y live region | **Take from Acato** for the WOO-verzoek variant. | Currently we have no share UI on WOO publications. The CSS is already in our `ac-publication.scss`, just unused. |
| `aria-live='polite'` sr-only status region pattern | **Adopt as a convention.** | Generally improves accessibility for clipboard interactions across the app. |
| "Publicatie niet gevonden" empty state with link to search | **Take from Acato.** | Cleaner than our error block; could supplement (not replace) the `get_error` UI. |

### Decision needed — terms / glossary

Acato's drawer is driven by a backend `terms` store with per-publication term filtering (`fetchTermsForPublication(id)`). Ours has a different glossary system (`ConGlossaryHighlight` + `con-glossary-drawer`) that highlights matching terms in-page. These solve overlapping but different problems:

- **Acato's:** a curated "what concepts appear on this page" list, plus a full searchable glossary.
- **Ours':** in-text highlighting of glossary entries with on-hover/click drawer.

Both are valid. If business wants the explicit "concepts on this page" panel in the WOO portal, Acato's approach can coexist with our highlighter (different surfaces). Flag for product decision.

### Keep ours

- The dispatcher in `ac-publication.js`.
- All type-specific variant components (they encode product/module/dienst/koppeling/etc. business logic).
- `con-related-tabs-new.js`, `con-cards/*`, `con-publication-type-badge`.
- The schema-driven `ac-publication-default.js` (it's our generic fallback for any new schema).
- `ConDetailsActionsMenu` integration and the wizard-redirect edit flow.

### Clean up in ours (no Acato dependency)

These are housekeeping items the comparison surfaced; they don't depend on adopting anything from Acato:

- Delete the unreachable JSX at [ac-publication.js:201-205](../src/views/ac-publication/ac-publication.js#L201-L205) (and the dangling `renderPublicationView()` reference).
- Remove `ac-publication-default1.js` and `ac-publication-default-old.js` once confirmed unused.
- Pick one related-tabs implementation: either complete the migration to `con-related-tabs-new.js` and delete `con-related-tabs.js`, or revert to the old one. Two versions in tree is confusing.
- Decide whether `con-publication-actions.js` is still needed alongside `ConDetailsActionsMenu`.
- Consider merging `con-module-publication.scss` into `con-publication-details.scss` — they are near-duplicates.

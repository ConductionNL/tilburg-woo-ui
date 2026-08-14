# Analysis: Standards / Standaardversies (ours only)

## Branches Compared
- Ours (tilburg-woo-ui): `softwarecatalogus-performance`
- Acato (tilburg-woo-ui_acato): `main`

## Scope

Compliance-tracking surface for VNG-GEMMA **standaarden** (standards) and **standaardversies** (standard versions) against the **referentiecomponenten** that an applicatie/module implements. Three React components plus one hook, all loaded lazily through the components barrel.

**Acato has nothing in this category.** No standards table, no schema resolver, no `vng-gemma/element` calls, no `referentieComponenten`/`compliancy` data model. Acato's portal is read-only public WOO; the entire softwarecatalogus standards-tracking domain is built on top of the fork.

This category is ours-only — the verdict is **keep**, no merge decision needed. This file inventories the surface so the dependency graph is legible.

## Files Inventoried

4 files, ~1 660 LoC total:

| File | LoC | Role |
|------|----:|------|
| [src/components/con-standards-table/con-standards-table.js](../src/components/con-standards-table/con-standards-table.js) | 1 449 | Display + edit table for standaardversies, grouped by VERPLICHT/AANBEVOLEN/TOEGEVOEGD |
| [src/components/con-schema-resolver/con-schema-resolver.js](../src/components/con-schema-resolver/con-schema-resolver.js) | 72 | Resolves a schema ID → slug via the global `schemaCache` |
| [src/components/con-standards-resolver/con-standards-resolver.js](../src/components/con-standards-resolver/con-standards-resolver.js) | 71 | Resolves a single standard UUID → name against a pre-fetched standards array |
| [src/hooks/use-resolve-schema-ids.hook.js](../src/hooks/use-resolve-schema-ids.hook.js) | 66 | Hook: fetches all schemas once and populates `schemaCache` + a local `aggregatedSchemas` map |

Indirect dependencies (not in this category, but load-bearing for the four files above):
- [src/utilities/con-resolve-schema.js](../src/utilities/con-resolve-schema.js) — exports `useResolvedSchema`, used by `con-schema-resolver`.
- [src/services/schemaCache.service.js](../src/services/schemaCache.service.js) — the global `schemaCache` (`get`/`set`/`waitFor`/`isReady`/`waitUntilReady`).
- [src/views/ac-beheer/shared/components/con-editable-standards/con-editable-standards.js](../src/views/ac-beheer/shared/components/con-editable-standards/con-editable-standards.js) — wraps `ConStandardsTable` in beheer with PATCH-on-save (category 15 Beheer).

Barrel exports: all three components are registered in [src/components/index.js](../src/components/index.js) as `loadable()`-wrapped imports (`ConSchemaResolver` at L87–88, `ConStandardsResolver` at L95–96, `ConStandardsTable` at L99–100). The hook is **not** in `src/hooks/index.js` — consumers import it by deep path.

## What each piece does

### `ConSchemaResolver` (component)
Thin render-wrapper around the `useResolvedSchema` hook. Given a schema ID as `children`, it looks the ID up in the global `schemaCache` (with a Suspense-style "Loading..." fallback while the cache warms) and renders the slug. Has a hardcoded `DISPLAY_NAME_OVERRIDES` map (`module → Applicatie`, `moduleversie → Applicatieversie`) for friendlier display names.

Props: `children` (the ID), `as` (HTML element, default `span`), `capitalize`, `loadingPlaceholder`.

### `ConStandardsResolver` (component)
Pure single-record lookup. Takes a `standardId` and a `standards` array, finds the matching entry (matching by `identifier`/`id`/`value`/`uuid`), and returns the standard's name (from `xml.name._value` / `naam` / `name` / `title` / `label`). If `returnStandardData` is set, it returns the full match object instead of rendering JSX — i.e. it doubles as a callable helper.

### `ConStandardsTable` (component)
The heavy hitter. 1 449 LoC, the only non-trivial UI in this category.

Inputs:
- `referentieComponenten` — list of refcomp IDs the object implements.
- `complianceStandards` — `compliancy` array (per-version evidence/bewijs entries).
- `compliantVersieIds` — `standaardVersies` array (supported version IDs).
- Optional pre-fetched data (`standards`, `standaardversies`, `referentieComponentenWithStandards`) — when omitted, the table fetches them itself from `openregister/api/objects/vng-gemma/element?gemmaType=Referentiecomponent|Standaard|Standaardversie`.

Behaviour (per the header docblock, reproduced because the rules below are not obvious from a glance):
- **VERPLICHT / AANBEVOLEN rows**: only standaardversies with active status (`in gebruik` or `in ontwikkeling`).
- **TOEGEVOEGD rows**: versions manually added (in `compliantVersieIds` but not reachable through `referentieComponenten`), plus inactive versions from refcomp that are still in `compliantVersieIds`.
- **HIDDEN**: inactive versions not in `compliantVersieIds`.
- IDs are normalised on the `id-` prefix to keep "UUID" and "id-UUID" from double-counting.

Edit mode (`isEditing` + `onComplianceChange`): per-row inputs for the compliance checkbox, bewijs URL (with `validateWebsite` from the forms validation module), logo upload (via `LogoUploadField` from beheer), and notes. Emits a new `compliancy` array up to the parent on every change.

401/403 from the GEMMA endpoint flips an `isAuthenticated` flag and silently degrades — the component is designed to be embedded in public publication views as well as authenticated beheer pages.

### `useResolveSchemaIds` (hook)
Targeted backfill: the `/uses` and `/used` endpoints return items where `@self.schema` is a numeric string (e.g. `"15"`) without including `@self.schemas` metadata. The hook scans an `items` array for unresolved schema IDs and — if any are missing from `schemaCache` — fetches **all** schemas in one call (`/openregister/api/schemas?_limit=100`), then populates both the global `schemaCache` and a local `aggregatedSchemas` map (so a consumer can attach the resolved schema to each item synchronously after the fetch).

Guards against re-fetching via a local `fetched` flag.

## How they compose

```
ac-publication-module.js  ──┐
ac-publication-product.js   │  ┌─ useResolveSchemaIds() ─→ schemaCache.set(id, slug)
ac-publication-koppeling.js │  │
... (8 publication views) ──┴──┘
                                       ▼ populates
con-aangeboden-gebruik-table.js ──→ ConSchemaResolver ──→ useResolvedSchema ──→ schemaCache.get(id)

ac-publication-module.js ──────────┐
con-editable-standards.js (beheer) ┼─→ ConStandardsTable ──→ fetch GEMMA elements
con-form-applicatie-controleren-   ┘                          (refcomp + standaard + versie)
   stage.js (forms review step)
```

The hook + resolver are a **two-step deferred-resolution pattern**: the hook bulk-loads schemas into a singleton cache on view mount, then any `ConSchemaResolver` rendered anywhere in the tree reads from that cache reactively (re-rendering when its specific ID is set via `schemaCache.waitFor`).

`ConStandardsTable` is independent of the schema-resolver pair — it does its own fetching against the vng-gemma element endpoints, not the `/schemas` endpoint.

## Where these are consumed

**`ConStandardsTable`** (3 sites):
- [src/views/ac-publication/ac-publication-module.js#L721](../src/views/ac-publication/ac-publication-module.js#L721) — public module/applicatie publication detail.
- [src/views/ac-beheer/shared/components/con-editable-standards/con-editable-standards.js#L88](../src/views/ac-beheer/shared/components/con-editable-standards/con-editable-standards.js#L88) — beheer inline-edit wrapper (PATCH-on-save).
- [src/views/ac-forms/ac-forms-applicatie/components/con-form-applicatie-controleren-stage.js#L440](../src/views/ac-forms/ac-forms-applicatie/components/con-form-applicatie-controleren-stage.js#L440) — applicatie-wizard "review" step.

**`ConSchemaResolver`** (1 site):
- [src/components/con-aangeboden-gebruik-table/con-aangeboden-gebruik-table.js#L257](../src/components/con-aangeboden-gebruik-table/con-aangeboden-gebruik-table.js#L257) — beheer "aangeboden gebruik" table renders the schema column via this resolver.

**`useResolveSchemaIds`** (8 sites, all publication-type variants):
- `ac-publication-module`, `ac-publication-moduleversie`, `ac-publication-product`, `ac-publication-organisation`, `ac-publication-koppeling`, `ac-publication-gebruik`, `ac-publication-dienst`, `ac-publication-contactperson`.

**`ConStandardsResolver`** — **no consumers**. Defined, registered in the components barrel, but not imported by any view, component, store, or hook. Dead code on the live branch (confirmed by `grep -rn ConStandardsResolver src/`).

## Cross-reference with forms-wizards

[analysis-forms-wizards.md](analysis-forms-wizards.md) flags two product-wizard files as a "two-implementations question":

- `src/views/ac-forms/ac-forms-product/components/con-form-standaarden-stage.js` (1 649 LoC)
- `src/views/ac-forms/ac-forms-product/components/standaarden-form-new.js` (662 LoC)

Both are **separate from `ConStandardsTable`**. They render their own per-module compliance-input UI (driven by the `referentieComponentenWithStandards` shape, multi-module aware). They share the same data model — `compliancy[]` + `standaardVersies[]` + `referentieComponenten[]` — so what they collect on input is what `ConStandardsTable` re-displays in the wizard's review step ([con-form-applicatie-controleren-stage.js](../src/views/ac-forms/ac-forms-applicatie/components/con-form-applicatie-controleren-stage.js) for applicatie; the product-wizard review step is `con-form-controleren-stage.js`).

In other words: the input wizard stages produce the data, `ConStandardsTable` reads and edits that same data downstream. The "which standaarden-stage is live?" question from analysis-forms-wizards.md is orthogonal to this category — both end up writing the same `compliancy`/`standaardVersies` shape on the object.

## Observations worth flagging (no action required)

1. **`ConStandardsResolver` is dead code.** Defined and exported via the barrel but no consumer imports it. The standards-array lookup logic it embeds is duplicated inline in `ConStandardsTable` (and in the product/applicatie standaarden stages). Safe-to-delete candidate for a future hygiene pass.

2. **`useResolveSchemaIds` is not in the hooks barrel.** All 8 consumers import via the deep path `@src/hooks/use-resolve-schema-ids.hook`. The other ours-only hooks (e.g. `use-window-size`, `use-document-title-from-path`) are exported through `src/hooks/index.js`. Inconsistency, minor.

3. **`ConStandardsTable` does triple-fetch on every mount when no pre-fetched data is passed.** Three separate `fetch()` calls to `/openregister/api/objects/vng-gemma/element` (refcomp / standaard / standaardversie), each `_limit=500`. Publication-module and beheer-details pages pass pre-fetched arrays in (`externalStandards`, `externalStandaardversies`, `externalReferentieComponentenWithStandards`) to skip this; the applicatie-wizard review step does not (it relies on the internal fetch). On the public publication view this means up to 1 500 records pulled per render of the module detail unless the parent supplies them.

4. **401/403 silently disables data**, with a state flag (`isAuthenticated`) but no visible message. By design — the component is reused on anonymous public pages where the vng-gemma element endpoint may require auth. Behaviour worth knowing if the component appears to render empty for a logged-out user.

5. **Hardcoded display-name overrides in `con-schema-resolver.js`** (`module → Applicatie`, `moduleversie → Applicatieversie`). Same renames live elsewhere in beheer (`src/views/ac-beheer/core/utils/beheer-renames.js`, per the file-category index). If those renames are ever centralised, this map should pick up from the same source.

6. **The hook re-fetches the entire schema list, not just unresolved IDs.** Acceptable because the schema set is small (~dozens, fits in one `_limit=100` call), but a per-ID `GET /schemas/{id}` would scale better. Not worth fixing unless schema count grows.

## Recommendation

**Keep all four files — no merge decision needed.** None of this surface exists in Acato.

If we ever do a hygiene pass independent of the Acato merge, candidates in priority order:

1. Delete `con-standards-resolver/` — dead code; no consumers.
2. Add `useResolveSchemaIds` to `src/hooks/index.js` to match the convention used by the other ours-only hooks.
3. Have the applicatie-wizard review step pass pre-fetched standards/standaardversies/refcomp arrays into `ConStandardsTable` to remove the per-render triple-fetch.

None of these affect the Acato comparison; they are local debt notes only.

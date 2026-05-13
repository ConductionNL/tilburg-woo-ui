# Analysis: Forms & Wizards (ours only)

## Branches Compared
- Ours (tilburg-woo-ui): `softwarecatalogus-performance`
- Acato (tilburg-woo-ui_acato): `main`

## Scope

Multi-step registration wizards under [src/views/ac-forms/](../src/views/ac-forms/) — the softwarecatalogus' "Aanmelden" flows for product, applicatie, koppeling, dienst and gebruik objects.

**Acato has nothing in this category.** No `ac-forms/`, no stage components, no stepper, no wizard constants, no `/forms` routes. Acato's portal is read-only public WOO. The entire submission funnel is built on top of the fork.

This category is ours-only — the verdict is **keep**, no merge decision needed. This file is an inventory to make the surface area legible.

## Files Inventoried

73 JS files across `src/views/ac-forms/` plus the integration files that feed into them:
- [src/utilities/schema-object-factory.js](../src/utilities/schema-object-factory.js) (206 LoC) — `createWizardFormState`, `createDefaultFormObject`
- [src/constants/wizards.constants.js](../src/constants/wizards.constants.js) (245 LoC) — `DASHBOARD_WIZARDS`, `getDashboardWizards`, `getWizardUrl`, `getActiveWizard`
- [src/constants/routes.constants.js#L60-L70](../src/constants/routes.constants.js#L60-L70) — `FORMS_*` path constants and 8 route entries
- [src/views/index.js#L40-L59](../src/views/index.js#L40-L59) — loadable() wrappers for the 7 wizard components

Routes wired in [routes.constants.js](../src/constants/routes.constants.js): `/forms`, `/forms/register`, `/forms/gebruik`, `/forms/gebruik/applicatie`, `/forms/gebruik/koppeling`, `/forms/gebruik/dienst`, `/forms/product`, `/forms/applicatie`, `/forms/koppeling`, `/forms/dienst`.

## Top-level structure

```
src/views/ac-forms/
├── index.js                       # barrel export (5 wizards)
├── con-stepper.js                 # useStepper hook (flavor-based step tracking)
├── validation/form-validations.js # email / website / phone regexes + libphonenumber-js
├── con-forms-index/               # /forms — tile picker that dispatches to wizards
├── ac-forms-applicatie/           # /forms/applicatie — Applicatie wizard
├── ac-forms-product/              # /forms/product — Product wizard
├── ac-forms-koppeling/            # /forms/koppeling — Koppeling wizard (aanbod flow)
├── ac-forms-gebruik/
│   ├── gebruik-application/       # /forms/gebruik/applicatie — Gebruik wizard
│   ├── gebruik-koppeling/         # /forms/gebruik/koppeling — Koppeling wizard (gebruik flow)
│   └── gebruik-dienst/            # /forms/gebruik/dienst — Dienst wizard (gebruik flow)
└── con-forms-dienst/              # /forms/dienst — Dienst wizard (aanbod flow)
```

## Wizard inventory

Each wizard has a **shell** file (top-level state, step routing, submission, prefill for edit mode) and a **components/** folder with one file per step (stage).

| Wizard | Shell file (LoC) | Stages | Total stage LoC | Step engine |
|--------|-----------------:|-------:|----------------:|-------------|
| `ac-forms-applicatie` | 3001 | 9 + 1 type-select | ~4 920 | `useState(0)` + `utils/steps.utils.js` |
| `ac-forms-product` | 2311 | 12 (incl. `standaarden-form-new`) | ~6 670 | `useState(0)` + `utils/steps.utils.js` + `utils/validation.utils.js` |
| `ac-forms-koppeling` (aanbod) | 2801 | 6 | ~3 080 | `useStepper` hook |
| `ac-forms-gebruik/gebruik-application` | 2670 | 8 | ~2 690 | `useStepper` hook |
| `ac-forms-gebruik/gebruik-koppeling` | 2508 | 5 | ~2 050 | `useStepper` hook |
| `ac-forms-gebruik/gebruik-dienst` | 2253 | 9 | ~2 380 | `useStepper` hook |
| `con-forms-dienst` (aanbod) | 1750 | 6 | ~1 920 | `useStepper` hook |
| `con-forms-index` | 68 | — | — | (picker, not a wizard) |

**Total**: ~17 300 LoC of wizard shells + ~23 700 LoC of stage components ≈ **41k LoC**, all ours-only.

### Shared shell pattern

Every wizard shell follows the same skeleton (with variations):

- Reads `id`, `type`, `applicatie` from `useSearchParams` → toggles edit-mode and pre-fill.
- Local state for the wizard data object, `loading`, `error`, `registerCallBack`, `prefillLoading`.
- `useDebouncedInput` for live name/URL lookups (e.g. existing-applicatie detection).
- Renders [@gemeente-denhaag/components-react](https://www.npmjs.com/package/@gemeente-denhaag/components-react) `ProcessSteps` with refs + DOM click-handler injection on the `.denhaag-process-steps__step-header` nodes.
- `renderStep(currentStep)` switch dispatches to memoized stage components.
- Stage components receive setters back to the shell so all state lives at the top.
- Submit step calls `commongroundApiUrl` endpoints via the api layer; `stripLocalIds` cleans `_localId`/UI-only fields before POST/PUT.
- Most shells import `ConUnsavedChangesAlertModal` and the `ConDebugViewer`.

### Stage component shape

Stage files name themselves `con-form-*-stage.js` or `con-*-step-*.js`. They're memoized, receive `{ formState, setFormState, stepper, ... }` props, and use:

- Utrecht NLDS form components (`Heading1`, `Paragraph`, `Alert`, `UnorderedList`, …) for layout.
- `ConDynamicSchemaForm` (from `src/components/con-dynamic-schema-form/`, category 15 Beheer) for schema-driven inputs.
- `con-api-select-field`, `con-organization-selector`, `con-template-text`, `con-uuid-resolver` (all `con-*` components from category 15).
- `validateWebsite` / `validateEmail` / `validatePhone` from `ac-forms/validation/form-validations.js`.

## Per-wizard utility files

Only `ac-forms-product` and `ac-forms-applicatie` have a `utils/` subdir:

| File | Product | Applicatie | Purpose |
|------|--------:|-----------:|---------|
| `steps.utils.js` | 217 | 217 | `shouldShow*Step`, `getAdjustedStepIndex`, `getLogicalStepFromIndex`, `getStatus`, `getStatusMultiStep`, `getNext/PrevStepIndex`, `currentStepName` |
| `serialization.utils.js` | 49 | 65 | `stripLocalIds` — recursive cleaner for UI-only fields before API submit |
| `texts.utils.js` | 35 | 35 | `getPageTitle`, `getPageDescription` per `formType` (eigen / ontbrekend) |
| `validation.utils.js` | 341 | — | `getDisabledStatus`, `getDisabledTooltip` — per-step Next-button gating |

The koppeling/gebruik/dienst wizards inline their equivalent logic into the shell file rather than splitting into utils.

## Validation module

[validation/form-validations.js](../src/views/ac-forms/validation/form-validations.js) (78 LoC) exports three pure validators used across every wizard:

- `validateEmail` — basic RFC-shaped regex
- `validateWebsite` — strict domain regex that explicitly rejects `www.tld` and single-part labels
- `validatePhone` — wraps `libphonenumber-js`, accepts `+`-prefixed or `06`-prefixed NL numbers

## Stepper hook

[con-stepper.js](../src/views/ac-forms/con-stepper.js) (275 LoC) is a flavor-keyed step counter. Steps are *declared* via `defineStep(flavor, label?)` during render so optional steps automatically renumber; current step is tracked separately and navigated via `next()` / `previous()` / `setCurrentStepByLabel(label)`.

## Wizard dispatch flow

1. Authenticated user hits `/forms` → `ConFormsIndex` lists `getDashboardWizards(user)` as `AcTile`s.
2. `DASHBOARD_WIZARDS` (8 entries) maps each tile to a `PATHS.FORMS_*` + a `params: { type: … }` payload that becomes the wizard's `?type=` query string.
3. `getDashboardWizards` filters by Keycloak groups — `aanbod-beheerder` sees 4 wizards, `gebruik-beheerder` sees 3, dual-group sees all 7.
4. Wizard shell reads `type` and `id` from query string and branches between "create" and "edit" plus between sub-flows (e.g. `eigen` vs `ontbrekend` vs `aanbieden-koppeling` vs `eigen-organisatie`).
5. `getActiveWizard()` lets stage components retrieve their own wizard metadata (title, color, schema) at any depth.

`/forms/register` reuses [AcRegister](../src/views/ac-register/ac-register.js) (auth category) — listed in `routes.constants.js` but unrelated to this wizard family.

## Observations worth flagging (no action required)

1. **Two step-engine patterns coexist.** The two oldest wizards (`ac-forms-applicatie`, `ac-forms-product`) drive steps with `useState(0)` plus per-wizard `utils/steps.utils.js` helpers. The five newer wizards use the `useStepper` flavor-based hook. Both work; they're just not consistent. Consolidating onto `useStepper` would let the older `utils/steps.utils.js` files be deleted.

2. **Structural duplication between koppeling/dienst wizards.**
   - `ac-forms-koppeling/` (2801 LoC shell) vs `ac-forms-gebruik/gebruik-koppeling/` (2508 LoC shell) — different routes (aanbod vs gebruik flow), but the shells share most of their state shape and almost-identical `con-koppeling-stage-zoeken/toevoegen/controleren` stage files. The aanbod variant is `/forms/koppeling?type=eigen-organisatie`; the gebruik variant is `/forms/gebruik/koppeling?type=aanbieden-koppeling`.
   - `con-forms-dienst/` (1750 LoC) vs `ac-forms-gebruik/gebruik-dienst/con-forms-dienst.js` (2253 LoC) — mirror split for dienst.
   The original wizards had a "soort koppeling" first step (still present as `con-koppeling-step-soort.js` in both koppeling trees, both 92 LoC — a "LEGACY NOTE" header marks them as removed). Splitting into two wizards happened to bake the flow into the URL instead of into a runtime branch.

3. **Two `standaarden` stage implementations in ac-forms-product/components/.** `con-form-standaarden-stage.js` (1649 LoC) and `standaarden-form-new.js` (662 LoC) coexist. Worth confirming which is wired up by the product shell and whether the other is dead code.

4. **Commented-out imports in shells.** `ac-forms-applicatie` shell has `// import ConFormApplicatieDienstenStage` and `ac-forms-gebruik/gebruik-dienst/con-forms-dienst.js` has `// import ConFormProductenStage` — the stage files exist on disk (`con-form-applicatie-diensten-stage.js` 306 LoC, `con-form-producten-stage.js` 77 LoC) but are not imported. Either dead code or feature-flagged for later.

5. **Two koppeling/dienst step files are still on disk but disabled.** `con-koppeling-step-soort.js` is present in both koppeling trees (92 LoC each, identical purpose) despite the "LEGACY NOTE" in both shells stating the type-select step has been removed.

6. **DOM-side click-handler injection on ProcessSteps.** Each shell uses `processStepsRef.current.querySelectorAll('.denhaag-process-steps__step-header')` and attaches click handlers in a `useEffect`. This is a workaround for the Den Haag component library not exposing per-step click props. Fragile to upstream class-name changes but matches what's in the library at this point.

7. **`ac-forms-gebruik/gebruik-application/` uses `createDefaultFormObject` from `schema-object-factory.js`.** The other wizards build initial state inline. Useful pattern to backport if consistency becomes a priority.

8. **The `index.js` barrel undersells the exports.** `src/views/ac-forms/index.js` re-exports 5 wizards but the 2 nested gebruik wizards (`gebruik-koppeling`, `gebruik-dienst`) are imported directly by `src/views/index.js` via deep paths instead of through the barrel. Cleanup candidate.

## Recommendation

**Keep all wizard files — no merge decision needed.** None of these flows exist in Acato.

If we ever decide to "tidy up" this category as separate hygiene work (not part of the Acato merge), the candidates flagged above (in priority order):

1. Verify and delete dead stages: `con-koppeling-step-soort.js` ×2, `con-form-applicatie-diensten-stage.js`, `con-form-producten-stage.js`, `standaarden-form-new.js` (if the older one is the live one) or vice versa.
2. Consolidate the four duplicated koppeling/dienst trees into shared stage components parameterised by flow.
3. Migrate `ac-forms-applicatie` and `ac-forms-product` to `useStepper` and delete `utils/steps.utils.js`.
4. Export the gebruik-nested wizards through `ac-forms/index.js` to remove the deep-import in `views/index.js`.

None of these affect the Acato comparison; they are local debt notes only.

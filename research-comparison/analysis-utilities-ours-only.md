# Analysis: Utilities — Ours-only Inventory

## Branches Compared
- Ours (tilburg-woo-ui): `softwarecatalogus-performance`
- Acato (tilburg-woo-ui_acato): `main`

## Scope

This file inventories the ~73 utility files in `src/utilities/` that exist **only in our fork**. They are not candidates for adoption from Acato — they back features we built on top of the fork (auth, beheer, dynamic schema forms, glossary, templating, softwarecatalogus, etc.).

The purpose of this file is not to recommend changes but to make the surface area legible for future "should we extract / consolidate / merge this?" decisions. No action is required.

Companion files:
- `analysis-utilities-shared.md` — the 15 utilities shared with Acato (where divergence matters)
- `analysis-hooks.md` — all hooks

## Inventory

### `ac-*` utilities (50 files) — Conduction-flavoured "AC kit" helpers

These follow the legacy `Ac…` naming convention. Many are generic JS/DOM helpers that didn't make it into Acato's pruned codebase.

#### Auth / session

| File | LoC | Exports |
|------|----:|---------|
| `ac-accesstoken.js` | 37 | `AcGetAccessToken`, `AcSetAccessToken`, `AcGetXUSRToken`, `AcSetXUSRToken`, `AcRequestTransformer` |
| `ac-cookie.js` | 37 | `getCookie`, `setCookie` |
| `ac-safe-parse-redirect-uri.js` | 24 | `acSafeParseRedirectUri` |
| `ac-get-permissions.js` | 38 | `AcCreateUser`, `User` |
| `ac-generate-advanced-password.js` | 25 | `AcGenerateAdvancedPassword` |
| `ac-generate-basic-password.js` | 22 | `AcGenerateBasicPassword` |
| `ac-get-password-strength.js` | 43 | `AcIsLongEnough`, `AcHas{Numeric,Mixed,Upper,Lower,Special}Characters`, `AcGetPasswordStrength` |

#### Formatting (input/output strings, numbers, dates)

| File | LoC | Exports |
|------|----:|---------|
| `ac-format-currency.js` | 20 | `AcGetCurrencySymbol`, `AcFormatCurrency` |
| `ac-format-error.js` | 72 | `AcFormatErrorMessage`, `AcHasErrors` |
| `ac-format-iban.js` | 27 | `AcFormatIban` |
| `ac-format-initials.js` | 9 | `AcFormatInitials` |
| `ac-format-internal-uri.js` | 90 | `AcFormatInternalURI` |
| `ac-format-local-currency.js` | 30 | `AcFormatLocalCurrency` |
| `ac-format-map-url.js` | 19 | `AcFormatMapURL` |
| `ac-format-number.js` | 30 | `AcFormatNumber` |
| `ac-format-percentage.js` | 19 | `AcFormatPercentage` |
| `ac-format-phonenumber.js` | 17 | `AcFormatPhonenumber` |
| `ac-format-raw-data-as-list.js` | 98 | `AcFormatRawDataAsList` |
| `ac-format-role.js` | 65 | `getRole`, `AcFormatGroup`, `AcFormatRole` |
| `ac-format-seconds-to-hm.js` | 15 | `AcFormatSecondsToHms` |
| `ac-format-string.js` | 23 | `AcCapitalize`, `AcToUpperCase`, … (duplicates of `ac-capitalize`, scoped differently) |

#### DOM / browser

| File | LoC | Exports |
|------|----:|---------|
| `ac-after-transition-end.js` | 124 | `getAnimationEndEvent`, `AcAfterTransitionEnd` |
| `ac-classes.js` | 26 | `AcClasses` (DOM class manipulation helper) |
| `ac-copy-to-clipboard.js` | 27 | `AcCopyToClipboard` |
| `ac-download-file.js` | 9 | `AcDownloadFile` |
| `ac-focus-open-keyboard.js` | 52 | `AcFocusAndOpenKeyboard` (mobile keyboard focus) |
| `ac-get-closest-element.js` | 29 | `AcGetClosestElement` |
| `ac-get-set-hash.js` | 30 | `AcSetHash`, `AcGetHash`, `AcRemoveHash` |
| `ac-handle-overflow.js` | 17 | `AcDisableScroll`, `AcEnableScroll` |
| `ac-mutation-observer.js` | 20 | `AcMutationObserver` |
| `ac-navigator.js` | 82 | `AcNavigator` (programmatic navigation wrapper) |
| `ac-ripple.js` | 109 | `AcRippleEffect` (material-style ripple) |
| `ac-scroll-into-view.js` | 5 | `AcScrollIntoView` |
| `ac-scroll-to.js` | 42 | `AcScrollTo` |
| `ac-storage.js` | 118 | `AcAutoSave`, `AcAutoLoad`, … (localStorage wrapper) |
| `ac-supports-webp.js` | 20 | `AcSupportsWEBP` |
| `ac-aside-navigation.js` | 303 | `AcAsideNavigation` class — heavy sidenav controller |
| `ac-slider-input.js` | 234 | `AcSliderInputInstance` class — slider/range input controller |
| `ac-indicator.js` | 158 | `AcIndicator` class — animated nav indicator |

#### Generic data helpers

| File | LoC | Exports |
|------|----:|---------|
| `ac-array-helpers.js` | 13 | Side-effect: adds `Array.prototype.chunk` (⚠ prototype pollution) |
| `ac-compare-deep.js` | 69 | `AcCompareDeep` |
| `ac-convert-color-codes.js` | 34 | `AcHexToRgb`, `AcRgbToHex` |
| `ac-generate-theme-classnames.js` | 136 | `AcGenerateThemeClassNames`, `AcGenerateThemeKeys` |
| `ac-get-equipment-icon.js` | 33 | `AcGetEquipmentIcon` |
| `ac-get-humanized-bytes-display.js` | 25 | `AcGetHumanizedBytesDisplay` |
| `ac-get-humanized-greeting.js` | 31 | `AcGetHumanizedGreeting` (time-of-day greeting) |
| `ac-join-array.js` | 10 | `AcJoinArray` |
| `ac-prettify-json.js` | 54 | `AcJSONReplacer`, `AcPrettifyJSON` |
| `ac-remove-empty-properties.js` | 9 | `AcRemoveEmptyProperties` |
| `ac-shuffle-array.js` | 10 | `AcShuffleArray` |
| `ac-sort-by.js` | 29 | `AcSortBy` |
| `ac-uuid.js` | 13 | `AcUUID` |

### `con-*` utilities (20 files) — Conduction feature-specific

These are clearly tied to features we built on top of the fork (templating, schema forms, glossary, reference resolution, etc.) and are unambiguous "keep, no decision".

| File | LoC | Exports / purpose |
|------|----:|-------------------|
| `con-authentication-filters.js` | 166 | `shouldShowContent`, `filterContentItems` — auth-gated content visibility |
| `con-collapse-extended-objects.js` | 21 | `collapseExtendedObjects` — flatten extended schema objects |
| `con-data-url-utils.js` | 218 | `isDataUrl`, `isUrl`, `getDataUrlDisplayName`, `handleFileClick` |
| `con-detect-object-references.js` | 269 | `isUUID`, `extractReferenceIds`, `resolveObjectReferencesToNames`, … — UUID → name resolution |
| `con-extract-text.js` | 73 | `extractText`, `extractTitle`, `extractSummary` |
| `con-format-by-json-schema.js` | 473 | `formatBySchema` (default export) — drives display formatting from JSON Schema |
| `con-format-dutch-number.js` | 18 | `ConFormatDutchNumber` |
| `con-getImageFromPublication.js` | 10 | `getImageFromPublication` |
| `con-glossary-highlight.js` | 172 | `buildGlossaryRegex`, `buildTermLookup`, `findGlossaryTerms`, `highlightGlossaryTerms` *(primary category: 17 Glossary)* |
| `con-is-json-string.js` | 8 | `isJsonString` |
| `con-normalize-link-to-schema-slug.js` | 51 | `normalizeLinkToSchemaSlug` |
| `con-normalize-schema-name.js` | 48 | `normalizeSchemaName` |
| `con-resolve-schema.js` | 68 | `useResolvedSchema` (despite the file naming, this is a hook — sits in utilities) |
| `con-resolve-uuids-in-text.js` | 225 | `extractUUIDs`, `resolveUUIDsInText`, `useResolvedText`, `useResolvedArray` |
| `con-schema-tab-display-helpers.js` | 56 | `getTabHeaderIcon`, `getTabHeaderName` |
| `con-smart-split.js` | 25 | `smartSplit` |
| `con-sorter.js` | 73 | `ConSorter` (default export) |
| `con-sort-properties-by-order.js` | 53 | `sortPropertiesByOrder` |
| `con-template-processor.js` | 197 | `TemplateProcessor` class, `createUserTemplateProcessor`, `processUserTemplate` |
| `con-with-template-processing.js` | 76 | `withTemplateProcessing`, `createTemplateComponents` — HOC for template-aware components |

### Bare-named utilities (3 files)

| File | LoC | Exports |
|------|----:|---------|
| `field-authorization.js` | 179 | `canReadField`, `canEditField`, … — field-level RBAC |
| `organization-permissions.js` | 127 | `checkOrganizationPermissions`, `getDisabledActionTooltip` |
| `schema-object-factory.js` | 206 | `createWizardFormState`, `createDefaultFormObject` — factories used by `ac-forms/` wizards |

## Observations worth noting (no action required)

A few things stood out while inventorying these files; flagging them here so they aren't lost.

1. **`ac-array-helpers.js` pollutes `Array.prototype`** by defining `Array.prototype.chunk`. This is a global side effect of importing the file (which it doesn't re-export — the `utilities/index.js` barrel does not include it). Pure import-for-side-effect is brittle; worth a future cleanup ticket but not in scope here.
2. **`con-resolve-schema.js` exports a React hook** (`useResolvedSchema`) but lives under `utilities/`, not `hooks/`. Same misplacement we noted about Acato's `use-is-mobile.js`, just on our side. Several hooks exported from `con-detect-object-references.js`, `con-resolve-uuids-in-text.js`, and `use-ref-options.js` have the same shape (caching hooks bundled into utility files).
3. **`ac-format-string.js` duplicates `AcCapitalize`** which is already its own file (`ac-capitalize.js`, shared with Acato). Minor — both forms are exported from the barrel.
4. **Auth-specific files** (`ac-accesstoken`, `ac-cookie`, `ac-safe-parse-redirect-uri`, `ac-get-permissions`, password helpers, `field-authorization`, `organization-permissions`) cross-reference category 14 (Authentication system).
5. **Wizard / form-specific files** (`schema-object-factory`, `con-format-by-json-schema`, `con-template-processor`, `con-with-template-processing`) cross-reference category 24 (Forms & wizards) and category 15 (Beheer).

## Recommendation

**Keep everything in this file.** Per the project rules in `CLAUDE.md`, ours-only files are "keep, no decision needed". The observations above are non-blocking cleanup candidates for separate hygiene work, not merge decisions.

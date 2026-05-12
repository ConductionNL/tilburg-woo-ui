# Analysis: Utilities — Shared & Acato-only

## Branches Compared
- Ours (tilburg-woo-ui): `softwarecatalogus-performance`
- Acato (tilburg-woo-ui_acato): `main`

## Scope

This file analyses the utility files that **exist in both repos** and the **utilities present only in Acato's repo**. The much larger set of ours-only utilities is inventoried separately in `analysis-utilities-ours-only.md`.

## Files Compared

**Both (15 files in `src/utilities/`):**
- `ac-build-url-search-params.js`
- `ac-capitalize.js`
- `ac-format-date.js`
- `ac-format-request-parameters.js`
- `ac-get-pagination.js`
- `ac-get-type-of.js`
- `ac-lock-object.js`
- `ac-match-substring.js`
- `ac-remove-tags.js`
- `ac-sanitize-html.js`
- `ac-sanitize.js`
- `ac-search-params-to-object.js`
- `ac-set-document-title.js`
- `ac-validate-date.js`
- `index.js` *(barrel)*

**Acato only:**
- `src/utilities/ac-map-publication.js`
- `src/utilities/use-is-mobile.js` *(a hook, covered in `analysis-hooks.md`)*

## What is the same

The following files are **byte-identical** in both repos and require no decision:

- `ac-capitalize.js`
- `ac-get-pagination.js`
- `ac-lock-object.js`
- `ac-match-substring.js`
- `ac-remove-tags.js`
- `ac-sanitize-html.js`
- `ac-sanitize.js`

That's 7 of the 15 shared files in lock-step.

## What differs

### 1. `ac-build-url-search-params.js` — significantly diverged

Both versions take an object and turn it into a query string, but the implementations are now meaningfully different:

| Aspect | Acato | Ours |
|--------|-------|------|
| Backing API | native `URLSearchParams` | manual `paramPairs.push(...)` joined with `&` |
| Key encoding | `URLSearchParams` percent-encodes keys (so `key[sub]` becomes `key%5Bsub%5D`) | Only values are encoded; brackets in keys are preserved literally |
| Nested arrays (`key[sub][]=…`) | Not supported — falls through to a `key[sub][subSub]` shape | Supported as a first-class case |
| `@self` key | Treated the same as any nested key | Has a special case: `@self[sub]=…` without `[]` brackets |
| `DEFAULT_SEARCH_QUERY` skip | Skips any key listed in defaults, regardless of value | Only skips when value equals the default |
| `_limit = 0` | Dropped by the `if (!value)` short-circuit | Explicitly preserved |

**Interpretation:** ours was rewritten to interoperate with a backend that expects PHP-style bracket-array syntax (`key[sub][]=a&key[sub][]=b`) **without** the brackets being percent-encoded. This pairs with our diverged `ac-search-params-to-object.js` (below), which does the inverse parse. The Acato implementation is fine for a simpler query model and is closer to "standards-compliant", but it cannot reproduce our backend's expected syntax.

### 2. `ac-search-params-to-object.js` — significantly diverged

Both parse a `URLSearchParams` instance into a plain object. The shape is similar; the cases are not.

- **Acato** hard-codes two cases for `@self[published][gte|lte]`, plus generic `key[]=` (single-level arrays) and `key[sub]=` (single-level nested object).
- **Ours** is regex-driven: it matches `parent[child][]=` (nested array), `parent[]=` (top-level array), and `parent[child]=` (nested single). It has a special case for `@self`: a repeated `@self[child]=` collapses into an array, allowing multi-value filters.

Pairs directly with our build-url-search-params changes — the two are a matched read/write pair.

### 3. `ac-get-type-of.js` — Acato is a stripped-down subset

Acato keeps only the bare minimum:

```js
AcGetTypeOf, AcIsNull, AcIsUndefined, AcIsSet, ACIsHttps
```

Ours adds the full type-guard family:

```
AcIsBoolean, AcIsFunction, AcIsObject, AcIsArray, AcIsString,
AcIsEmptyString, AcIsNumeric, AcIsAlphaNumeric, AcIsAlphabetical,
AcIsEmail, AcIsPhoneNumber, AcIsPostalCode, AcIsSlimPostalCode
```

plus the `patterns` regex bundle. This is the original "AC kit" style; Acato pruned it down to what their slimmer codebase actually consumes. Every dropped export is still in our re-export from `utilities/index.js`.

### 4. `ac-format-request-parameters.js` — Acato file is empty

The file exists in both repos. Ours contains a working `AcFormatRequestParameters` (34 lines, builds `{ q, orderBy, orderByDirection, per_page, page, …options }`). **Acato's file is 0 bytes**, yet their `src/utilities/index.js` still does `export * from './ac-format-request-parameters'`. Net effect: a dead export in Acato.

This is almost certainly an unintentional artifact of an Acato cleanup pass — they removed the implementation but left both the empty file and the barrel re-export.

### 5. `ac-format-date.js` — trivially different

The only differences are (a) a leading `// Imports => DayJS` comment and (b) an additional commented-out `// locale = null` parameter slot. **Functionally identical.**

### 6. `ac-set-document-title.js` — same behaviour, different style

Acato uses `config && config.appName && config.appName !== ''` and `if (title)`. Ours uses the `AcIsSet` / `AcIsEmptyString` guards from `ac-get-type-of`, and indents with tabs instead of spaces. Same outcome at runtime; ours is consistent with the rest of the AC-kit style.

### 7. `ac-validate-date.js` — one character

Only the regex literal differs: Acato has `^\d\d\-\d\d\-\d\d\d\d$` (unnecessary escapes on the hyphens), ours has `^\d\d-\d\d-\d\d\d\d$`. Functionally identical.

### 8. `utilities/index.js` — barrel grew with our utilities

Acato's barrel is 20 lines; ours is 161. The shared exports are still present in both; ours additionally re-exports every ours-only utility. No merge conflict — purely additive.

## Only in Acato's

### `src/utilities/ac-map-publication.js` (14 lines)

```js
export const acMapPublication = (publication) => {
  if (!publication) return null;
  return {
    ...publication,
    title:       publication.title       || publication.titel,
    description: publication.description || publication.beschrijving,
    summary:     publication.summary     || publication.samenvatting,
    category:    publication.category    || publication.tooiCategorieNaam,
    published:   publication.published   || publication?.['@self']?.published,
  };
};
```

A small Dutch-↔-English field-aliasing helper consumed in `src/stores/publications.store.js` (in Acato) to normalise publication objects before exposing them as `single` / `items` getters.

**Why this exists:** Acato's backend evidently returns Dutch keys (`titel`, `beschrijving`, `samenvatting`, `tooiCategorieNaam`); the mapping ensures consumers can use either name. We may already handle this elsewhere — in our stores, in `con-format-by-json-schema.js`, or in templating layer (`con-template-processor.js` / `getDisplayValue` in `con-detect-object-references.js`). To be confirmed during the publications store deep-dive (category 11 is already done — cross-check there).

## Recommendation

| File | Recommendation |
|------|----------------|
| 7 identical utilities | No action |
| `ac-build-url-search-params.js` | **Keep ours.** It is purpose-built for our backend's bracket-array query syntax; switching to Acato's would break facet/array filters. |
| `ac-search-params-to-object.js` | **Keep ours.** Read counterpart to the above — must match. |
| `ac-get-type-of.js` | **Keep ours.** Acato's pruning removed exports our code uses. No backport needed; their version is a subset of ours. |
| `ac-format-request-parameters.js` | **Keep ours; flag Acato's empty file as upstream cleanup debt.** If we ever push back upstream, send our implementation. |
| `ac-format-date.js` | Trivial; no action. Maybe drop the leftover comment block on a future tidy. |
| `ac-set-document-title.js` | Keep ours (stylistic consistency); optionally reformat to spaces if the rest of the file uses spaces. |
| `ac-validate-date.js` | Keep ours (cleaner regex). |
| `utilities/index.js` | Keep ours — barrel divergence is mechanical. |
| Acato's `ac-map-publication.js` | **Needs decision — check first.** Verify whether our publications store / template system already aliases Dutch keys to English. If not, this helper is cheap to adopt and would simplify view code. If yes, no action. |

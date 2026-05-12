# Analysis: Molecule components

## Branches Compared
- Ours (tilburg-woo-ui): `softwarecatalogus-performance`
- Acato (tilburg-woo-ui_acato): `main`

Scope note: this file covers the generic molecule primitives in `src/molecules/`. Card molecules (`ac-card-category`, `ac-card-intro`, `con-cards`), search-related molecules (`ac-search-filters`, `ac-search-result`, `con-active-filters`, `con-facets-filters`) and `ac-breadcrumbs` are analyzed in their own category files and are *not* re-analyzed here, only referenced where the index file changed because of them.

## Files Compared

**Both (shared molecules analyzed here):**
- `src/molecules/ac-button/ac-button.js`
- `src/molecules/ac-checkbox/ac-checkbox.js`
- `src/molecules/ac-cta/ac-cta.js`
- `src/molecules/ac-form-field/ac-form-field.js`
- `src/molecules/ac-link/ac-link.js`
- `src/molecules/ac-select/ac-select.js`
- `src/molecules/ac-table/ac-table.js`
- `src/molecules/index.js`

**Ours only:**
- `src/molecules/ac-tile/ac-tile.js`
- `src/molecules/con-accordion/con-accordion.js`

---

## What is the same

- **`ac-cta`** — byte-for-byte identical in logic (one trivial import-style difference: ours has a blank line between two import groups). No behavioural divergence. Same props, same JSX, same NLDS `AcCard` + `AcLink` composition.
- **`ac-select`** — fully identical. Both wrap the Utrecht `Select`/`SelectOption` with the same prop surface (`label`, `defaultOption`, `options`, `onChange`, `id`) and the same `onChange` guard.
- **`ac-table`** — same component shape (header / rows / footer rendered through Utrecht `Table*` primitives) and same default-empty-array fallback. Differences are minor (see below) but the rendering contract for callers is the same.
- **`ac-link`** — identical in role: thin wrapper around `react-router-dom` `Link` with a `type` toggle (`link` vs `button`) driving Utrecht class names. They diverge only on which utility button class is applied (see below).
- **`ac-button`** — same conceptual contract: a `<button>` element with classes driven by a `style` prop (`link` / `button` / …). Both expose `animate`, `className`, `sr`, `children` and spread `...restProps`.

Across the board, **the public API of these molecules is intentionally close** — components are composed with the same JSX-tag/prop names in both repos, which makes them friendly merge candidates.

---

## What differs

### `ac-button`
- **`buttonType` prop (ours only).** Ours adds a `buttonType` prop (`'primary' | 'secondary'`) on top of `style`. This expands the matrix from 1 → 4 variants: `button` × {primary, secondary} and a new `buttonSlim` × {primary, secondary} variant (uses Utrecht `--slim` modifier). Acato only handles `style === 'button'` → `utrecht-button--primary-action`. No secondary button without our change.
- **`icon` + `loading` props (ours only).** Ours wraps children in `AcFlex spacing='xs' alignItems='center'` and renders an `ac-button__icon-container`. When `loading` is true, the icon is replaced by `VISUALS.SPINNER` and the `ac-button--loading` modifier is added. Acato has no spinner / icon slot.
- **`href` prop (Acato only, but unused).** Acato destructures `href` from props but never uses it (so it's silently swallowed and *not* forwarded to the underlying `<button>`). Looks like a leftover; harmless but dead.
- **React import.** Ours has an explicit `import React from 'react'` with `// eslint-disable-next-line import/no-unresolved` — required because the rest of the file references no React identifier directly but JSX needs it under the current build setup. Acato omits the import (likely relies on the auto-JSX runtime).

### `ac-checkbox`
- **Wrapper composition is different.**
  - Acato: renders an `<AcFlex as='li'>` directly, putting the `FormLabel` inline next to a Utrecht `BadgeCounter` (showing facet counts).
  - Ours: wraps in `<FormField type='checkbox'>` + `<Paragraph>` + `<FormLabel>` and removes the `BadgeCounter`. The count display has been moved to the search facets layer (`con-facets-filters`) rather than living on the checkbox.
- **Extra props in ours:** `tooltip`, `required`, `customLabelPart`, `disabled`, `srOnlyLabel`, `className`, and an explicit `id` fallback. Adds an info tooltip (`VISUALS.INFO` + `data-tooltip-id={TOOLTIP_ID}`), a "(verplicht)" `sr-only` indicator, optional custom label section, screen-reader-only label mode.
- **UUID resolution in label (ours only).** Label text is run through `<ConUuidResolver>` — this is the glossary/object-name resolution mechanism unique to our codebase. Acato just renders the label string.
- **ID generation.** Ours uses a `useRef`-backed random ID fallback (`ac-checkbox-${random}`) when `id`, `label`, and `value` are all absent. Acato uses `id` if provided and otherwise falls back to `${label}_${value}` with no random-id safety net — so duplicate IDs occur when `id` is unspecified and the same `label`/`value` pair is reused (or both are missing).
- **Change handler shape.** Acato forwards the raw event to `onChange`. Ours unwraps to `e.target.checked` first, so callers get the boolean. Behavioural break point if Acato ever adopts our version.

### `ac-form-field`
This is where the largest divergence sits.

Acato's `ac-form-field` is a small form field that:
- Renders only `Textbox` (no `Textarea`, no custom input slot).
- Has built-in `checkValidity` flow (`valid`/`modified` local state, conditional error message rendering via `invalidLabel`).
- Wraps label in a `<Paragraph>` rather than a `<Heading>`.
- Passes through `min`, `max`, `pattern`, `data-date-format`.
- Avoids passing both `value` *and* `defaultValue`.

Ours has been substantially extended:
- **Input types:** `customInput` slot, `Textarea` branch (with `fullWidth` modifier), password field with a show/hide toggle (`VISUALS.EYE` / `VISUALS.EYE_SLASH` button, `aria-label`, `tabIndex={-1}`), icon-prefixed input (`ac-form-field__icon-wrapper`).
- **Validation surface:** `hasError`, `touched`, `touchedKey`, `errorMessage` — driven by an external form library (looks like Formik/RHF) rather than by `checkValidity`.
- **Label rendering:** uses `<Heading level={headingLevel}>` (default 4, configurable), supports `labelStyle`, `customLabelPart`, `tooltip` with `VISUALS.INFO` + tooltip ID, required indicator (`*` + `sr-only "(verplicht)"`).
- **Constraints:** `minLength`, `maxLength`, `disabled`.
- **What was dropped:** ours does *not* implement `checkValidity` / `invalidLabel` / `min` / `max` / `pattern` / `data-date-format` validation flow. If callers in the shared parts of the app rely on those props they would silently no-op in our component.

### `ac-link`
- Acato renders `type='button'` as `utrecht-button utrecht-button--secondary-action` and supports an `animate` prop (adds `animate` class).
- Ours renders `type='button'` as plain `utrecht-button` (no `--secondary-action` modifier) and has *no* `animate` prop.
- Net: visually a "button-styled link" looks different in the two repos — Acato's looks like the Utrecht secondary action; ours falls back to the default Utrecht button style.

### `ac-table`
- Acato wraps the `<Table>` in `<div className='utrecht-table-container'>` (a horizontal-scroll container). Ours does not.
- Ours adds React `key` props on each rendered row/cell/column. Acato omits `key` entirely (will fire the React "each child should have a unique key" warning). Ours uses `row.id` for the row key — but `row.id` won't exist if the row is a plain array, which is how the data is iterated (`row.map((cell) => …)`) — so this key is likely `undefined` in practice. Both are subtly wrong; ours is *less* wrong but still flawed.

### `index.js`
- Ours adds three extra lazy exports: `ConFacetsFilters`, `ConActiveFilters`, `AcTile`, plus a special `ConAccordion` export that uses `createElement` from `preact/compat` to preserve the compound-component pattern (`ConAccordion.Item`) through `loadable`. Without this trick, the loadable proxy would not expose `.Item`.
- Acato's index has no `ConAccordion`/tile/facets entries, only the original shared set. Same `@loadable/component` mechanism otherwise.

---

## Only in ours

- **`ac-tile`** — square colored tile with icon + text used by the dashboard/Beheer entry tiles. Handles `to` (React Router navigate), `href` (external `window.open` with `noopener,noreferrer`), `onClick`, `disabled`, hex-color override via inline `style`, named color variants (`primary`, `secondary`, `success`, `warning`, `danger`, plus orange/green/purple/yellow/teal/blue), size variants (`small`/`medium`/`large`), keyboard handler for Enter/Space, full `role='button'` + `aria-disabled` + `tabIndex`. Uses `prop-types` (the only molecule that does). Project-specific; tied to admin UX.
- **`con-accordion`** — compound component (`ConAccordion` + `ConAccordion.Item`) with optional `singleOpen` mode coordinated via React Context. Generates unique button/panel IDs via `useRef`, sets ARIA `aria-expanded`/`aria-controls`/`aria-hidden`, conditionally wraps the trigger in a Utrecht `Heading` when `headerLevel` is provided. The `singleOpen` flow tracks open item via `openId` and enforces a registry of unique IDs (throws on duplicate or missing IDs in single-open mode). `header` can be a render function `({ isOpen }) => …`. Imports from `preact/compat` — relevant to the preact/react aliasing this codebase uses.
- **Index lazy-loading shim for compound components.** The `ConAccordion` export in `index.js` is non-trivial: it wraps two `loadable` instances (one for the parent, one for `.Item`) and re-glues them with `createElement` so the compound API survives code-splitting. This pattern is reusable for any future compound molecule.

---

## Only in Acato's

- **`AcCheckbox` count badge.** Acato's checkbox renders `<BadgeCounter>{count}</BadgeCounter>` inline. In our codebase this concern moved up into `con-facets-filters`. Whether that move was clean enough is a question for the search analysis, not this one.
- **`AcLink` `animate` prop + secondary-action button style.** As above.
- **`AcTable` horizontal-scroll container.** `utrecht-table-container` wrapper.
- **`AcFormField` `checkValidity` flow.** Self-contained HTML5-constraint-validation flow with an `invalidLabel` message. Independent of any form library.
- **`AcButton` deadcode `href` destructure** — not really a feature, just noise; not worth backporting.

---

## Recommendation

| Item | Recommendation | Rationale |
|---|---|---|
| `ac-cta` | **No action** | Identical. |
| `ac-select` | **No action** | Identical. |
| `ac-link` — `animate` prop | **Take from Acato** (low-risk additive) | Trivial class toggle; allows hover/transition styling in Acato themes we may inherit later. Verify no class collision with our `ac-button--animate`. |
| `ac-link` — `secondary-action` on `type='button'` | **Needs decision** | Visual change. If our "button-styled link" was deliberately *not* a secondary action, keep ours; otherwise align with Acato so NLDS tokens land correctly. |
| `ac-button` — `buttonType` + `buttonSlim` + `icon` + `loading` | **Keep ours** | Project-specific (loading spinner uses `VISUALS.SPINNER`, slim variant is admin-UI specific). Acato's button is a strict subset. |
| `ac-button` — drop unused `href` destructure (Acato) | **Adopt cleanup in Acato direction** (cosmetic) | If Acato's code is ever merged back, drop the dead destructure. |
| `ac-checkbox` — extended label/tooltip/required/ConUuidResolver | **Keep ours** | These are admin/form-driven features and depend on our `ConUuidResolver` and `TOOLTIP_ID` infrastructure that does not exist in Acato. |
| `ac-checkbox` — `BadgeCounter` count | **Needs decision** | Whether facet counts belong on the checkbox (Acato) or in the filter wrapper (ours). Decide together with the search-filters analysis — picking one is fine, but they should agree. |
| `ac-checkbox` — `onChange(e.target.checked)` (ours) vs raw event (Acato) | **Keep ours**, but flag | Boolean is friendlier; if you ever merge in Acato call sites, they will need adaptation. |
| `ac-form-field` — extended input types (textarea / password / icon / custom) | **Keep ours** | Driven by auth, register, beheer forms we own. |
| `ac-form-field` — `checkValidity`/`invalidLabel` flow (Acato) | **Backport into ours, additively** | This is a clean, library-free validation path useful for simple public-portal inputs. It can sit alongside our `touched`/`hasError` flow without conflict — just guard on whether `checkValidity` is set. Likely worth doing because the public portal pages from Acato will rely on it. |
| `ac-form-field` — label as `<Heading>` vs `<Paragraph>` | **Needs decision** | This is an a11y/semantics call. Headings inside `<label>` are technically allowed but unusual; Acato's `<Paragraph>` is closer to typical patterns. Get a design/a11y signoff before changing. |
| `ac-table` — `utrecht-table-container` wrapper | **Take from Acato** | Pure improvement (horizontal overflow on mobile). No API change. |
| `ac-table` — missing/incorrect `key` props | **Fix in ours** | Neither version is correct. Use a stable derived key (e.g. row index + cell index, or accept a `keyFor` callback). Independent of merge direction. |
| `index.js` — extra lazy exports | **Keep ours** | Required for our extra molecules. |
| `ac-tile` | **Keep ours** | Project-specific, no Acato equivalent. |
| `con-accordion` | **Keep ours** | Generic enough to upstream eventually, but no Acato consumer asks for it. Hold. |

### Flagged for human business decision
1. **Facet-count placement** (checkbox vs filter wrapper) — coupling with search analysis.
2. **`ac-form-field` label semantics** (Heading vs Paragraph) — affects every form in both repos.
3. **`ac-link type='button'` Utrecht class** — visual call.

### Flagged as a real bug, regardless of merge direction
- `AcTable` row keys: `row.id` is always undefined when rows are plain arrays (which is how the component iterates them). Fix before either repo is shipped from this.

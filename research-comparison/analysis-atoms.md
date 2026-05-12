# Analysis: Atomic UI components

## Branches Compared
- Ours (tilburg-woo-ui): `softwarecatalogus-performance`
- Acato (tilburg-woo-ui_acato): `main`

## Files Compared

**Both (19 files):**
- `src/atoms/ac-card/ac-card.js`
- `src/atoms/ac-column/ac-column.js`
- `src/atoms/ac-container/ac-container.js`
- `src/atoms/ac-data-list/ac-data-list.js`
- `src/atoms/ac-flex/ac-flex.js`
- `src/atoms/ac-grid/ac-grid.js`
- `src/atoms/ac-image/ac-image.js`
- `src/atoms/ac-rich-text/ac-rich-text.js`
- `src/atoms/ac-row/ac-row.js`
- `src/atoms/ac-section/ac-section.js`
- `src/atoms/index.js`
- `src/styles/atoms/_ac-card.scss`
- `src/styles/atoms/_ac-column.scss`
- `src/styles/atoms/_ac-flex.scss`
- `src/styles/atoms/_ac-grid.scss`
- `src/styles/atoms/_ac-rich-text.scss`
- `src/styles/atoms/_ac-row.scss`
- `src/styles/atoms/_ac-usps.scss`
- `src/styles/atoms/index.scss`

**Ours only (10 files — tab system + small primitives):**
- `src/atoms/con-logo/con-logo.js`
- `src/atoms/tab/ac-tab/ac-tab.js`
- `src/atoms/tab/ac-tabList/ac-tabList.js`
- `src/atoms/tab/ac-tabPanel/ac-tabPanel.js`
- `src/atoms/tab/ac-tabs/ac-tabs.js`
- `src/components/con-external-link/con-external-link.js`
- `src/components/con-horizontal-overflow-wrapper/con-horizontal-overflow-wrapper.js`
- `src/styles/components/_con-logo.scss`
- `src/styles/components/_ac-tabs.scss`
- `src/styles/components/_con-horizontal-overflow-wrapper.scss`

**Acato only:** None.

---

## What is the same

These files are byte-identical or differ only in whitespace:

- `src/atoms/ac-image/ac-image.js`
- `src/atoms/ac-row/ac-row.js`
- `src/styles/atoms/_ac-row.scss`
- `src/styles/atoms/_ac-usps.scss`
- `src/styles/atoms/index.scss`

`src/atoms/index.js` is identical in scope for the shared atoms; ours just appends extra exports for the tab system (`AcTabs`, `AcTabList`, `AcTab`, `AcTabPanel`) and `ConLogo`.

Both repos use the same loading approach (`loadable(() => import(...))`), the same `clsx` BEM class composition, and the same Tilburg design-token namespace (`--tilburg-*`).

---

## What differs

### 1. [ac-card.js](../src/atoms/ac-card/ac-card.js) — extra `organisation` variant, fixes a typo

| Aspect | Ours | Acato |
|--------|------|-------|
| Variant props | `blue`, `category`, `searchResult`, `organisation`, `padding`, `skeleton`, `spaceBetween` | same, minus `organisation` |
| Content wrapper attribute | `className='ac-card__content'` | **`class='ac-card__content'`** (HTML attr, not JSX `className`) |

Acato's `class=` attribute is a bug in JSX — React will warn at runtime and the content styles won't apply. Ours has the corrected `className`.

### 2. [_ac-card.scss](../src/styles/atoms/_ac-card.scss) — different abstraction levels

Both share the same skeleton shimmer animation, padding-size modifiers (`sm/md/default/lg`), and `&--space-between` block. The differences:

- **Ours** wraps almost every value in a `--tilburg-search-card-*` token alias with a fallback (e.g. `var(--tilburg-search-card-border-radius, var(--tilburg-border-radius-md))`). Adds `&--organisation` variant. Removes the default 1-px gray border. Adds a separate `.organisation-card__updated` helper class at the end (a meta-info badge for org cards).
- **Acato** uses direct tokens (no card-specific alias layer). Keeps a default border. Has typography refinements scoped to `&__content` (`.utrecht-paragraph`, `.utrecht-badge-status` font sizes) and to `&--blue` (responsive overflow at `sm` breakpoint, larger paragraph at `md+`). Adds an `&--category` SVG path-fill rule.

The two are not drop-in compatible: ours assumes a theming layer that defines all `--tilburg-search-card-*` tokens; Acato assumes those tokens don't exist.

### 3. [ac-column.js](../src/atoms/ac-column/ac-column.js) + [_ac-column.scss](../src/styles/atoms/_ac-column.scss)

- **JS:** ours adds two extra props: `className` (passthrough) and `horizontalOverflowWrapper` (boolean → `--horizontal-overflow-wrapper` modifier that sets `min-width: 0; flex: 1` so the column can shrink inside a flex parent without overflowing).
- **SCSS:** the gap vocabularies have diverged:
  - Ours: `horse`, `tiger`, `sm` (mapped to `--tilburg-space-column-mouse`).
  - Acato: `horse`, `tiger`, `pig`, `dog`, `cat`, `rabbit`, `rat` (7 sizes, no `sm`).
- Neither is a superset of the other. Anything in our code that uses `gap="sm"` won't render under Acato; anything Acato code uses `gap="pig"` etc. won't render under ours.

### 4. [ac-container.js](../src/atoms/ac-container/ac-container.js) — `className` passthrough

Trivial: ours adds optional `className` to the `clsx()` call. Acato doesn't. Functionally a strict superset.

### 5. [ac-data-list.js](../src/atoms/ac-data-list/ac-data-list.js) — Acato richer

| Aspect | Ours | Acato |
|--------|------|-------|
| `row.description` field | not rendered | rendered as `<p className='utrecht-paragraph'>` above the value |
| Wrapper | none | wraps `<Table>` in `<div className='utrecht-table-container'>` |

The wrapper class is a NL Design System (Utrecht) convention — overflow scrolling on small viewports. Ours regressed this when forking. Adopt Acato's version.

### 6. [ac-flex.js](../src/atoms/ac-flex/ac-flex.js) — Acato polymorphic, ours adds inline `style`

| Aspect | Ours | Acato |
|--------|------|-------|
| Element type | always `<div>` | polymorphic via `as: Component = 'div'` prop |
| Rest-prop spread | only `style` | full `...props` spread + explicit `id` |
| JSDoc | yes (lists allowed enum values) | none |
| `align-items` SCSS variants | `center`, `start`, `end` | only `center` |

Acato's `as` prop is the bigger feature (use `<AcFlex as="nav">` etc.); ours has slightly more useful CSS modifiers and a useful inline `style` escape hatch. The two could be merged — neither is a strict superset.

### 7. [ac-grid.js](../src/atoms/ac-grid/ac-grid.js) + [_ac-grid.scss](../src/styles/atoms/_ac-grid.scss) — incompatible APIs, ours has a bug

This is the biggest divergence in atoms.

- **Acato (clean, BEM):**
  ```jsx
  const AcGrid = ({ children, row = 3 }) => {
    const _CLASSES = clsx('ac-grid', row && `ac-grid--${row}`);
    ...
  };
  ```
  SCSS defines `&--2`, `&--3`, `&--4` modifiers with their own responsive breakpoints baked in. Self-contained.

- **Ours (CSS variable + side-effect):**
  ```jsx
  const AcGrid = ({ children, columns = 1, className, style }) => {
    document.documentElement.style.setProperty('--ac-grid-columns', columns);
    ...
  };
  ```
  Sets a **global** CSS custom property on `:root` every render, then SCSS reads it via `&[class*='columns-']`.

  Issues with our approach:
  1. **Two `<AcGrid>` instances on one page will fight** — the last to render wins for both.
  2. Side effect runs during render (not in `useEffect`), violating React purity.
  3. Default is `columns=1` (Acato's is `3`), so swapping the import direction would silently regress every existing grid.
  4. Prop renamed (`row` → `columns`).

Recommendation in section below: adopt Acato's BEM modifiers (drop the global custom property), but keep our default-from-1 if intentional — verify call sites.

### 8. [ac-rich-text.js](../src/atoms/ac-rich-text/ac-rich-text.js) + [_ac-rich-text.scss](../src/styles/atoms/_ac-rich-text.scss)

- **Ours:** wrapped with `withStore(observer(...))`, pulls `user` from the MobX root store, runs the content through `processUserTemplate(content, user)` before `AcSanitizeHtml` — so authored content can contain `{{user.displayName}}`-style template variables.
- **Acato:** plain `AcSanitizeHtml(content)`, no template processing, no store wiring. Adds a `space-content` utility class (always applied) and a `&.space-content` block in SCSS that gives vertical rhythm to direct children (`> * + * { margin-block-start: ... }`, plus larger spacing before headings).

Acato's `space-content` is real value and is missing from ours. Our template processing is required by [TEMPLATE-VARIABLES.md](../TEMPLATE-VARIABLES.md) and the admin flows.

Also, the `@import` lists differ: ours imports each Utrecht heading-N component CSS individually; Acato imports `button-css`, `paragraph-css`, `ordered-list-css`, `unordered-list-css` and skips headings (presumably picked up elsewhere). This is a style-asset wiring difference that needs verification against the global SCSS entry point.

### 9. [ac-section.js](../src/atoms/ac-section/ac-section.js)

Acato adds a `blue` boolean prop that toggles a `--blue` modifier class. Ours doesn't. Trivial to backport; verify Acato has a corresponding SCSS rule (not in `_ac-section.scss` since neither repo has that file under atoms — check global styles).

---

## Only in ours

### Tab system — [src/atoms/tab/](../src/atoms/tab/)

Four files wrapping `react-tabs`:

- **[ac-tabs.js](../src/atoms/tab/ac-tabs/ac-tabs.js)**, **[ac-tab.js](../src/atoms/tab/ac-tab/ac-tab.js)**, **[ac-tabPanel.js](../src/atoms/tab/ac-tabPanel/ac-tabPanel.js)** — thin pass-throughs that set `tabsRole` and add an `ac-*` class.
- **[ac-tabList.js](../src/atoms/tab/ac-tabList/ac-tabList.js)** (150 lines) — the substantive piece. Detects horizontal overflow on the tab list and renders chevron scroll buttons:
  - `ResizeObserver` on the tab-list container.
  - `MutationObserver` on `aria-selected` (selection changes can alter tab widths, e.g. bolder text).
  - Window `resize` listener.
  - `handleScrollRight` schedules a re-check 300 ms after smooth scroll completes.

  The complexity is real (selected-tab styles can grow the scrollWidth, so the chevron must re-evaluate after every selection), and there's a 5 px tolerance to dodge floating-point precision issues. Not the cleanest code (three observers + a setTimeout) but tackles a known UX problem.

[_ac-tabs.scss](../src/styles/components/_ac-tabs.scss) (219 lines) supports it.

### Cross-cutting primitives

- **[con-logo.js](../src/atoms/con-logo/con-logo.js)** — 16-line empty `<div>` with `con-logo-container` + variant (`header` | other) + optional `clickable` modifier. All visuals come from [_con-logo.scss](../src/styles/components/_con-logo.scss) via `background-image`. Used by [con-c-navigation](../src/components/ac-c-navigation/ac-c-navigation.js) and the [register view](../src/views/ac-register/ac-register.js).

- **[con-external-link.js](../src/components/con-external-link/con-external-link.js)** — wraps `AcLink`, prepends `https://` if missing, hardcodes `target='_blank' rel='noopener noreferrer'`. Falls back to a `<span>{children || '-'}</span>` when `href` is empty.

- **[con-horizontal-overflow-wrapper.js](../src/components/con-horizontal-overflow-wrapper/con-horizontal-overflow-wrapper.js)** — generic version of the `ac-tabList` scroll-button machinery. `ResizeObserver` on both wrapper and content refs, chevron buttons with `aria-label` from the `ariaLabels` prop, `requestAnimationFrame` debouncing. Cleaner than `ac-tabList` but doesn't share code with it — the scroll logic is duplicated.

---

## Only in Acato

Nothing in this category exists only in Acato.

---

## Recommendation

| File | Action | Reason |
|------|--------|--------|
| `ac-image.js`, `ac-row.js`, `_ac-row.scss`, `_ac-usps.scss`, `atoms/index.scss` | **No action** | Identical |
| `ac-card.js` | **Keep ours** | Our `className='ac-card__content'` fixes Acato's JSX bug (`class='...'`). Keep `organisation` variant. |
| `_ac-card.scss` | **Needs decision** | Different abstraction levels. Adopting Acato's typography refinements (`.utrecht-paragraph`, `.utrecht-badge-status` sizing, blue-card responsive overflow) is low-risk and worth doing. Dropping our `--tilburg-search-card-*` token aliases is a bigger call — depends on whether the theming layer needs them. |
| `ac-column.js` + `_ac-column.scss` | **Merge** | Keep ours `className` + `horizontalOverflowWrapper` props. Adopt Acato's larger gap vocabulary (`pig/dog/cat/rabbit/rat`). Keep `sm` for backward compat or migrate call sites. |
| `ac-container.js` | **Keep ours** | Strict superset (adds `className` passthrough). |
| `ac-data-list.js` | **Take from Acato** | Adds `description` field rendering + `utrecht-table-container` wrapper. Ours regressed both. Low-risk backport. |
| `ac-flex.js` | **Merge** | Adopt Acato's polymorphic `as` prop + `...props` spread. Keep our `style` prop + JSDoc + extra `align-items` modifiers (`start`, `end`). |
| `_ac-flex.scss` | **Keep ours** | Has more `align-items` modifiers; functional superset. |
| `ac-grid.js` + `_ac-grid.scss` | **Take from Acato** | Our `document.documentElement.style.setProperty(...)` in render is a real bug (breaks with multiple grids, runs during render). Acato's BEM `--2/--3/--4` is the correct shape. Migration: rename prop `columns` → `row` at call sites (or alias both), and verify default-column count expectations. |
| `ac-rich-text.js` | **Merge** | Keep our template-processing + MobX wiring (admin requires it). Adopt Acato's `space-content` class + corresponding SCSS for vertical rhythm. |
| `_ac-rich-text.scss` | **Take from Acato (mostly)** | Adopt `&.space-content` block. Reconcile the `@import` list — verify Utrecht heading CSS is loaded somewhere globally before dropping our individual heading imports. |
| `ac-section.js` | **Take from Acato** | Add `blue` modifier prop. Confirm SCSS rule exists somewhere or add `&--blue`. |
| Tab system (4 files + SCSS) | **Keep ours** | Acato has no tab system. Could be cleaned up later (consider merging `ac-tabList` scroll logic with `con-horizontal-overflow-wrapper`). |
| `con-logo`, `con-external-link`, `con-horizontal-overflow-wrapper` | **Keep ours** | Conduction-specific primitives, no Acato equivalent. |

### Flagged for human decision
- **`_ac-card.scss` token strategy:** keeping the `--tilburg-search-card-*` alias layer affects the rest of the theming/design-token strategy (NLDS overrides, multi-tenant token files). Not a per-file decision.
- **`ac-grid` API change:** renaming `columns` → `row` (or vice versa) ripples through every call site. Worth doing for correctness, but plan the codemod.
- **`ac-rich-text` Utrecht import list:** verify which file globally loads `@utrecht/components/heading-*/css` before changing imports here, or layouts will silently lose heading styles.

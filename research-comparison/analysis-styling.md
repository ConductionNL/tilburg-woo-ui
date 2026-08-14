# Analysis: Styling & design tokens

## Branches Compared
- Ours (tilburg-woo-ui): `softwarecatalogus-performance`
- Acato (tilburg-woo-ui_acato): `main`

## Scope
Global styles, SCSS mixins, NLDS token files, and design-system overrides. Component-specific SCSS partials (e.g. `_ac-button.scss`, `_ac-search-box.scss`) are intentionally **excluded** — those are covered in their respective category analyses.

## Files Compared

**Both (~44 files):**
- `src/styles/index.scss`
- `src/styles/global/index.scss`
- `src/styles/global/_breakpoints.scss`
- `src/styles/global/_colors.scss`
- `src/styles/global/_easings.scss`
- `src/styles/global/_fontfaces.scss`
- `src/styles/global/_general.scss`
- `src/styles/global/_page.scss`
- `src/styles/global/_reset.scss`
- `src/styles/global/_route.scss`
- `src/styles/global/animations/_fade-wait.scss`
- `src/styles/global/animations/_pulse.scss`
- `src/styles/global/animations/_ripple.scss`
- `src/styles/global/animations/index.scss`
- `src/styles/global/helpers/_container.scss`
- `src/styles/global/helpers/_flex-align.scss`
- `src/styles/global/helpers/_margins.scss`
- `src/styles/global/helpers/_paddings.scss`
- `src/styles/global/helpers/_responsive.scss`
- `src/styles/global/helpers/_typography.scss`
- `src/styles/global/helpers/_z-index.scss`
- `src/styles/global/helpers/index.scss`
- `src/styles/global/icons/_icons.scss`
- `src/styles/global/icons/_variables.scss`
- `src/styles/global/icons/index.scss`
- `src/styles/global/mixins/_box-shadow.scss`
- `src/styles/global/mixins/_font.scss`
- `src/styles/global/mixins/_gradients.scss`
- `src/styles/global/mixins/_normalize.scss`
- `src/styles/global/mixins/_outline.scss`
- `src/styles/global/mixins/_paragraphs.scss`
- `src/styles/global/mixins/_respond.scss`
- `src/styles/global/mixins/_sr-only.scss`
- `src/styles/global/mixins/index.scss`
- `src/styles/nlds/_extends.scss`
- `src/styles/nlds/_tokens.scss`
- `src/styles/nlds/_tokens-custom.scss`
- `src/styles/nlds/index.scss`
- `src/styles/nlds/overrides/_ams-pagination.scss`
- `src/styles/nlds/overrides/_utrecht-data-list.scss`
- `src/styles/nlds/overrides/_utrecht-link.scss`
- `src/styles/nlds/overrides/_utrecht-secondary-action-button.scss`
- `src/styles/nlds/overrides/_utrecht-table.scss`
- `src/styles/nlds/overrides/index.scss`

**Acato only (3 files):**
- `src/styles/nlds/overrides/_utrecht-button.scss`
- `src/styles/nlds/overrides/_utrecht-form-field.scss`
- `src/styles/nlds/overrides/_utrecht-text-sizes.scss`

**Ours only (13 files):**
- `src/styles/global/_fallback-error-page.scss`
- `src/styles/global/_gemma.scss`
- `src/styles/global/mixins/_breadcrumb.scss`
- `src/styles/nlds/_tokens-dimpact.scss`
- `src/styles/nlds/_tokens-horst-aan-de-maas.scss`
- `src/styles/nlds/_tokens-logo.scss`
- `src/styles/nlds/_tokens-migrato.scss`
- `src/styles/nlds/_tokens-opencatalogi.scss`
- `src/styles/nlds/_tokens-venray.scss`
- `src/styles/nlds/_tokens-vng.scss`
- `src/styles/nlds/overrides/_denhaag-step.scss`
- `src/styles/nlds/overrides/_utrecht-accordion.scss`
- `src/styles/nlds/overrides/_utrecht-select.scss`

---

## What is the same

The following files are byte-identical (or only differ in trivial whitespace/comments):

- Root: `index.scss`
- Global: `_breakpoints.scss`, `_colors.scss`, `_easings.scss`, `_reset.scss`
- Animations: `index.scss`, `_pulse.scss`, `_ripple.scss`, `_fade-wait.scss` *(ours has a duplicate comment line; semantically identical)*
- Helpers: `index.scss`, `_flex-align.scss`, `_margins.scss`, `_paddings.scss`, `_responsive.scss`, `_typography.scss`, `_z-index.scss`
- Icons: `index.scss`, `_icons.scss`, `_variables.scss`
- Mixins: `_box-shadow.scss`, `_respond.scss`, `_sr-only.scss`, `_gradients.scss` *(minor whitespace difference only)*
- NLDS: `_extends.scss`
- Global `_route.scss` differs only in `transform-origin: 0% 50%` vs `0 50%` — no semantic difference.

These shared foundations indicate the layout grid, color palette, breakpoint scale, spacing helpers, icon font definitions, and base animations have not meaningfully diverged.

---

## What differs

### `global/index.scss`
Ours adds two imports: `@import 'fallback-error-page'` and `@import 'gemma'`. Acato omits both (those features don't exist there).

### `global/_fontfaces.scss`
Different font strategy:
- **Ours**: Roboto (regular, 500, 700), full Montserrat unicode ranges (cyrillic / vietnamese / latin), legacy Avenir. Defines font-icon/heading/title/body/mono mixins inline.
- **Acato**: Minimal — only Roboto + Roboto Condensed. Removes Montserrat and Avenir. Moves font mixins into `_font.scss`.

### `global/_general.scss`
Multi-tenant vs. single-tenant philosophy:
- **Ours**: Sizes via CSS variable `var(--tilburg-erm-font-size)`; `font-size: 1rem` relative to a `10px` base.
- **Acato**: Hard-coded `10px` / `1.6rem`. Adds ~30 lines of component-scoped overrides: header/main/footer `h1` uppercase + Roboto Condensed, breadcrumb disabled link weight, error-message sub-variant, accordion paragraph line-height.

### `global/_page.scss`
- **Ours**: 236 lines including `.ac-publication-*` grid layouts, three-column card grids, organization card styling, logo containers (catalog/publication features).
- **Acato**: 123 lines — all publication-specific selectors stripped out.

### `global/helpers/_container.scss`
- **Ours**: Compact width `744px`; `lg` max-width `1200px`.
- **Acato**: Compact `calc(936px + padding*2)`; `lg` `calc(1128px + padding*2)`. Adds `:has(.utrecht-skip-link)` wrapper for a11y skip-link focus positioning.

### `global/mixins/index.scss`
Ours adds `breadcrumb` import (corresponding to the ours-only `_breadcrumb.scss` mixin).

### `global/mixins/_font.scss`
- **Ours** (74 lines): More verbose line-clamp; `hyphens()` has IE/older-Safari fallbacks.
- **Acato** (66 lines): Drops duplicate `-webkit-box-orient`; `hyphens()` modernized (no `-ms-word-break`/older `-webkit-` patterns).

### `global/mixins/_normalize.scss`
Acato removes non-standard `font-smooth: always` and Firefox-only `-moz-appearance`. Targets evergreen browsers only.

### `global/mixins/_outline.scss`
Ours has explicit `outline-color: black !important`. Acato relies on the default.

### `global/mixins/_paragraphs.scss`
- **Ours**: `.utrecht-paragraph { line-height: 1.5 !important; }`.
- **Acato**: Empty file.

### `nlds/index.scss`
Major divergence in design-system entry point:
- **Ours**: Imports 10 local token files (`tokens-logo`, `-vng`, `-opencatalogi`, `-migrato`, `-horst-aan-de-maas`, `-dimpact`, `-venray`) plus external packages (`@conduction/theme`, `@nl-design-system-unstable`).
- **Acato**: Only `_tokens` + `_tokens-custom`. Imports only AMS pagination CSS.

### `nlds/_tokens.scss`
- **Ours** (1226 lines): Style Dictionary auto-generated; no SCSS imports — pure CSS custom properties inside `.tilburg-theme`.
- **Acato** (1090 lines): Also self-contained — pure CSS custom properties, no SCSS imports.

Both files are pure CSS-variable declaration sheets with no `@use`/`@import` directives. The token contents are largely shared; ours has additional declarations (~140 lines) not yet audited at the property level.

### `nlds/_tokens-custom.scss`
Largest divergence in this category:
- **Ours** (267 lines): Maps `.conduction-theme`, `.rotterdam-theme`, etc. — date-input tokens, link-icon spacing, Tilburg status badges, multi-tenant custom-property bundles.
- **Acato**: Single empty `.tilburg-theme { }` block (3 lines). Defers token customization to external packages.

### `nlds/overrides/index.scss` + overrides set
Different curated lists of third-party components being overridden:
- **Both**: `ams-pagination`, `utrecht-data-list`, `utrecht-link`, `utrecht-secondary-action-button`, `utrecht-table`.
- **Ours adds**: `utrecht-accordion`, `denhaag-step`, `utrecht-select`.
- **Acato adds**: `utrecht-button`, `utrecht-form-field`, `utrecht-text-sizes`.

### `nlds/overrides/_ams-pagination.scss`
- **Ours** (106 lines): Full state coverage — `:hover`, `:active`, `:focus`, `:current` pseudo-classes; explicit padding, border-radius, and color mappings.
- **Acato** (28 lines): ~75% less code — only list layout, `aria-hidden` spacing, and `:current` background.

---

## Only in ours

| File | Purpose |
|------|---------|
| `global/_fallback-error-page.scss` | Layout for the fallback error UI (flex container + heading gap). |
| `global/_gemma.scss` | GEMMA Linked-Data graph container — responsive sizing, loader, select styling (~4.8 KB). |
| `global/mixins/_breadcrumb.scss` | Breadcrumb link WCAG padding override (10 px block padding). |
| `nlds/_tokens-dimpact.scss` | Tenant token overrides — Dimpact. |
| `nlds/_tokens-horst-aan-de-maas.scss` | Tenant token overrides — Horst aan de Maas. |
| `nlds/_tokens-migrato.scss` | Tenant token overrides — Migrato. |
| `nlds/_tokens-opencatalogi.scss` | Tenant token overrides — OpenCatalogi. |
| `nlds/_tokens-venray.scss` | Tenant token overrides — Venray. |
| `nlds/_tokens-vng.scss` | Tenant token overrides — VNG (Vereniging van Nederlandse Gemeenten). |
| `nlds/_tokens-logo.scss` | Logo-specific token customizations. |
| `nlds/overrides/_denhaag-step.scss` | Den Haag DS step-indicator overrides. |
| `nlds/overrides/_utrecht-accordion.scss` | Utrecht accordion overrides. |
| `nlds/overrides/_utrecht-select.scss` | Utrecht select-dropdown overrides. |

These reflect the multi-tenant deployment model and the additional features (GEMMA, error page, beheer accordion/select usage).

---

## Only in Acato's

| File | Purpose |
|------|---------|
| `nlds/overrides/_utrecht-button.scss` | Button gap spacing (`1rem`) + primary-action focus color fix. |
| `nlds/overrides/_utrecht-form-field.scss` | Form-field input `vertical-align: center`. |
| `nlds/overrides/_utrecht-text-sizes.scss` | Aggressive font-size normalization for forms/tables/accordion (forces `tilburg-typography-font-size-md`). |

All three are small, targeted upstream-component overrides. They are not feature-specific and could plausibly be backported.

---

## Overall observations

1. **Deployment model divergence.** Ours is a **multi-tenant platform** (per-municipality token files: Dimpact, Horst aan de Maas, Migrato, OpenCatalogi, Venray, VNG) with explicit feature styling (publications, GEMMA, error page). Acato is a **single-tenant baseline** that defers theming to external packages and strips out catalog/publication scaffolding.

2. **Browser-support trajectory.** Acato modernizes mixins — drops `-ms-word-break`, older `-webkit-` prefixes, `-moz-appearance`, non-standard `font-smooth`. Ours retains those fallbacks. None are load-bearing for our target browsers; we could likely follow Acato here.

3. **Token strategy.** Ours hand-writes `_tokens-custom.scss` and tenant override files. Acato treats `_tokens-custom.scss` as a stub and delegates to npm packages (`@conduction/theme`, `@nl-design-system-unstable`). Acato's approach is cleaner but requires the package contents to actually cover everything our tenant files cover (almost certainly they don't, today).

4. **Override curation differs by surface area.** Acato overrides `utrecht-button` / `utrecht-form-field` / `utrecht-text-sizes` (form-heavy UI). Ours overrides `utrecht-accordion` / `utrecht-select` / `denhaag-step` (beheer + forms wizards). Both sets are plausible candidates to merge — the components are orthogonal.

5. **Global SCSS is doing too much in ours.** `_page.scss` and `_general.scss` hold layout for `.ac-publication-*` and similar — concerns that belong in component partials. Acato's slimmer versions are an indicator of where refactoring would pay off.

---

## Recommendation

### Backport from Acato (low risk, modernization wins)

- **`global/mixins/_normalize.scss`** — adopt Acato's cleaner version (drops non-standard `font-smooth`, deprecated prefixes). **Take from Acato.**
- **`global/mixins/_font.scss`** — adopt simplified `hyphens()` and line-clamp. **Take from Acato.**
- **`global/helpers/_container.scss`** — adopt the `:has(.utrecht-skip-link)` a11y pattern. **Merge** (keep our container widths if they're load-bearing for the catalog layout). Note: Acato's rule *absolutely-positions* the skip-link inside the container, so adoption is not a pure addition — verify no other absolutely-positioned skip-link exists upstream and that the parent has the expected stacking/overflow context before merging.
- **`nlds/overrides/_utrecht-button.scss`** — small, targeted; safe to adopt. **Take from Acato.**
- **`nlds/overrides/_utrecht-form-field.scss`** — small; relevant to our forms/wizards. **Take from Acato.**
- **`nlds/overrides/_utrecht-text-sizes.scss`** — verify it doesn't conflict with our tenant typography tokens, then **merge**.

### Keep ours (feature-specific or multi-tenant)

- All tenant token files (`_tokens-dimpact.scss`, `_tokens-vng.scss`, etc.) — Acato has nothing equivalent. **Keep.**
- `global/_gemma.scss`, `global/_fallback-error-page.scss`, `global/mixins/_breadcrumb.scss` — feature-specific. **Keep.**
- All ours-only overrides (`_denhaag-step.scss`, `_utrecht-accordion.scss`, `_utrecht-select.scss`) — required by beheer and forms. **Keep.**
- `nlds/_tokens-custom.scss` (the populated version) — load-bearing for multi-tenant theming. **Keep.**

### Needs decision (business / design call)

- **Font stack.** Acato uses Roboto + Roboto Condensed only; we use Roboto + Montserrat + Avenir. Question for design/brand: does the catalog still need Montserrat/Avenir, or can we drop them and save bundle size? **Decision needed.**
- **`global/_page.scss` cleanup.** The `.ac-publication-*` layout rules in our global SCSS belong in component partials. Refactor scope is not trivial. **Decision needed — defer or schedule as cleanup.**
- **Container widths.** Ours uses `744px` / `1200px`; Acato uses `936px` / `1128px` (intrinsic + padding). Layout-affecting; needs visual QA across catalog views. **Decision needed.**
- **`nlds/_tokens.scss`** — content-level audit not done here. The ~140-line size difference may be new tokens we should keep or stale tokens we can drop. **Needs follow-up file-level diff** before any merge.

### Avoid

- Adopting Acato's stub `_tokens-custom.scss` wholesale would delete our multi-tenant token mappings. **Do not take from Acato.**
- Adopting Acato's `global/index.scss` would remove our `gemma` and `fallback-error-page` imports — breaks features. **Do not take from Acato.**

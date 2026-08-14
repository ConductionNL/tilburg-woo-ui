# Analysis: Organism / layout components

## Branches Compared
- Ours (tilburg-woo-ui): `documentation/VSC-498/compare-to-acato` (descended from `softwarecatalogus-performance`)
- Acato (tilburg-woo-ui_acato): `main`

Scope note: this file covers the layout-level "organisms" exported from `src/components/`: `ac-about`, `ac-faq`, `ac-featured`, `ac-hero`, `ac-intro`, `ac-loader`, `ac-modal`, `ac-sections-handler`, plus their SCSS partials and `src/components/index.js`. It also covers the four ours-only organisms (`ac-content-blocks`, `ac-quote`, `con-markdown`, `con-spin-loader`, `spin-loader`). Header/Footer/Navigation/Drawer live under category 7 (navigation) and search-specific components under category 3, so they are not re-analyzed here.

## Files Compared

**Both:**
- `src/components/ac-about/ac-about.js`
- `src/components/ac-faq/ac-faq.js`
- `src/components/ac-featured/ac-featured.js`
- `src/components/ac-hero/ac-hero.js`
- `src/components/ac-intro/ac-intro.js`
- `src/components/ac-loader/ac-loader.js`
- `src/components/ac-modal/ac-modal.js`
- `src/components/ac-sections-handler/ac-sections-handler.js`
- `src/components/index.js`
- `src/styles/components/_ac-about.scss`
- `src/styles/components/_ac-featured.scss`
- `src/styles/components/_ac-hero.scss`
- `src/styles/components/_ac-intro.scss`
- `src/styles/components/_ac-loader.scss`
- `src/styles/components/_ac-modal.scss`
- `src/styles/components/_ac-section.scss`
- `src/styles/components/_ac-sections.scss`

**Ours only:**
- `src/components/ac-content-blocks/ac-content-blocks.js`
- `src/components/ac-quote/ac-quote.js`
- `src/components/con-markdown/con-markdown.js`
- `src/components/con-spin-loader/con-spin-loader.js`
- `src/components/spin-loader/spin-loader.js`
- `src/styles/components/_ac-quote.scss`
- `src/styles/components/_con-markdown.scss`
- `src/styles/components/_spin-loader.scss`

---

## What is the same

- **`ac-faq.js`** — byte-for-byte identical. Both wrap Utrecht's `AccordionProvider`, mapping `{ question, answer }` → `{ label, body: AcSanitizeHtml(answer) }` through `useMemo`. No divergence.
- **`_ac-sections.scss`** — byte-for-byte identical. Selector list `> .ac-rich-text, > .utrecht-accordion, > .utrecht-table` and `> .ac-card` rules match exactly.
- **`_ac-intro.scss`** — byte-for-byte identical. Same grid layout, same `max-inline-size: 18ch` heading, same mobile breakpoint adjustments.
- **`_ac-section.scss`** — partially identical. The `&--spacing` block is identical. Acato adds a `&--blue` variant (see "What differs").
- **`_ac-loader.scss`** — same structure, same colors. Two tiny formatting differences only: ours adds an explicit `animation-delay: 0` on `&:nth-child(1)` (a no-op since 0 is the default) and ours has a blank line between `}` and `&-dot`. Behaviour is identical.
- **AcModal core shape** — both repos use `React.forwardRef`, the same `useState(isOpen)`, `onCloseHandler`, `onBackdropClick`, and the same `<dialog>` element with `ac-modal__header` / `ac-modal__content` / `ac-modal__footer` structure. The divergence is in props and footer behaviour (below), not in the underlying anatomy.
- **AcIntro core shape** — both render `AcSection > AcContainer > div.ac-intro__heading + div.ac-intro__content` with the same Heading/Paragraph/AcRichText composition. The only divergence is the question-mark icon swap (below).
- **AcAbout core shape** — same `AcSection > AcContainer > div.ac-about__heading + div.ac-about__img` skeleton, same `AcImage {...image}` pattern.

---

## What differs

### `ac-about.js`
- **`list` prop (Acato only).** Acato adds a `list` prop rendered inside a second `<Paragraph>` between `content` and `link`. Ours has no equivalent — the `__heading` slot is `title + content + link` only.
- **`blue` modifier on `AcSection` (Acato only).** Acato renders `<AcSection className='ac-about' spacing blue>` and pairs it with a new `.ac-section--blue` SCSS variant. Ours uses `<AcSection ... spacing>` with no blue background.
- **CSS `a { display: inline }` (Acato only).** Acato's `_ac-about.scss` adds `display: inline` to the `a` selector in addition to the shared `@extend .utrecht-link` rule. Ours only has the `@extend`. Practical effect: in Acato, inline links inside `ac-about__heading` won't be forced to `inline-block` by any inherited rule.
- **`@import` path difference.** Acato: `@import '@utrecht/link-css'`. Ours: `@import '@utrecht/components/link/css'`. Both resolve to the same Utrecht link CSS package, just via different entry-point paths in `package.json` exports. Either works; this is package-resolution cosmetics.

### `ac-featured.js`
This component has been substantively reworked on our side.

- **Acato** renders three hard-coded, prop-less `<AcSearchResult />` placeholders inside a plain `<div className='ac-featured__content'>`. Heading uses the default level (no explicit `level` prop). It is effectively a static skeleton — useful only as a visual stub, not driven by real data.
- **Ours** takes `publications` and `isLoading` props, wraps results in `<AcGrid row={3}>`, renders skeleton `AcSearchResult` cards while `isLoading`, and otherwise maps `publications` to `AcSearchResult` with `hideCategory` and `hideEllipses` passed to suppress the category/ellipsis chrome on the homepage. Heading is forced to `level={2}` with a trailing `<br />`.
- **Import-path difference.** Acato imports constants from `@constants`. Ours imports from `@src/constants`. Both aliases resolve to the same directory under our webpack config, but it's an inconsistency worth flagging if either repo's `jsconfig.json` / webpack alias setup is later changed.

### `ac-featured.scss`
- **Ours** keeps the `.container { display: grid; gap: ... }` block live and the `&__content { display: grid; grid-template-columns: repeat(3, 1fr); ... }` block live, but also adds `background-color: var(--tilburg-color-blue-100)` on `.ac-featured` itself.
- **Acato** has *commented out* both grid blocks (`// display: grid`, `// grid-template-columns`, `// gap`), meaning the section flows with default block layout. No blue background.
- Effect: visually, our featured section is a blue-tinted 3-column grid; Acato's is a plain stack. The commented-out lines in Acato are a tell that their team disabled the grid (possibly because `AcGrid` is responsible elsewhere) but never deleted the rules.

### `ac-hero.js`
This is the most divergent file in the category.

- **Acato (38 lines).** Simple: `<AcHero />` takes no props, navigates to `/zoeken?_search=${query}` on submit (or `/zoeken` if empty), background image hard-coded to `'/home-hero-background.png'` via inline `style` string, title hard-coded to `'Open Tilburg, de plek voor alle openbare documenten van Gemeente Tilburg'`. Uses `LABELS.WHAT_ARE_YOU_LOOKING_FOR` for the search label.
- **Ours (110 lines, but file size is 625 KB on disk).** The size blowup comes from two helper functions at the bottom — `MigratoHeroImage` (line 104, ~437 KB single-line base64 PNG) and `HorstAanDeMaasHeroImage` (line 108, ~199 KB single-line base64 JPEG). These return data URIs that the runtime `getHeroImage()` falls back to for two specific hostnames (`open-migrato.accept.commonground.nu`, `horstadmaas.accept.opencatalogi.nl`, `verwerkingsregister.horstaandemaas.nl`). Embedding ~620 KB of binary data inline in a JS module is a build-size concern (see Recommendation).
- **Multi-tenant hero selection.** Our `AcHero` selects the hero background image via two mechanisms in order:
  1. `containerConfig.getHeroImageUrl()` — runtime configuration injected via `@constants/container.constants` (`require` is wrapped in try/catch so the module is optional).
  2. Hardcoded hostname switch with cases for `softwarecatalogus.*`, `opencatalogi.nl`, `open-dimpact.*`, `open-rotterdam.*`, `localhost`, `open-migrato.*`, `horstadmaas.*`, `verwerkingsregister.venray.nl`, and a default fallback. This is the multi-tenant logic for the softwarecatalogus product, not present in Acato at all.
- **Props shape difference.** Acato's `AcHero` takes no props. Ours takes a `contents` object (treated as `(contents) => contents.contents`, which is awkward — see below) and reads `_contents[0]?.data?.content` for the title. This means the hero is driven by the CMS contents array passed from the page, not a hard-coded string.
- **Submit-search route.** Acato builds `'/zoeken?_search=${query}'` via string concatenation, sends empty queries straight to `/zoeken`. Ours builds the URL via `URLSearchParams`, always sets `_page=1`, and only appends `_search` if the trimmed query is non-empty.
- **Extra `disableAutoSearch` prop on `AcSearchBox`** (ours only). Acato omits this prop — its hero auto-fires search on every keystroke; ours requires explicit submit.
- **Odd parameter destructuring (ours).** `AcHero = (contents) => { const _contents = contents.contents; … }` rather than `AcHero = ({ contents }) => { … }`. Functionally identical but inconsistent with the rest of the codebase, which destructures.

### `ac-hero.scss`
- **Acato** adds a mobile breakpoint block that goes "full-bleed": `background-color: transparent`, `background-image: none !important`, `padding-block: 0`, plus an inline-size hack on `.ac-card` (`margin-inline-start: calc(-1 * var(--tilburg-space-column-rat))`, `inline-size: calc(100% + (2 * var(--tilburg-space-column-rat)))`) to make the search card span the full viewport on phones. Also restyles `.ac-card h1` (size 2xl, blue 400, removes block-end margin).
- **Ours** does none of this — fixed background image and padding at every breakpoint, no h1 override. Functionally our mobile hero will keep its background image and `padding-block` from desktop.

### `ac-intro.js`
- **Hostname-specific icon swap (ours).** Ours imports `AcCheckIfSpecificHostname` from `@src/services/ac-check-if-specific-hostname` and renders `<VISUALS.QUESTION_MARK_VNG />` when it returns true, otherwise `<VISUALS.QUESTION_MARK />`. Acato unconditionally renders `<VISUALS.QUESTION_MARK />`. This is a tenant-specific branding tweak (VNG logo variant of the question mark).

### `ac-loader.js`
- Ours adds `style` and `className` props and spreads them onto the wrapper div: `className={\`ac-loader ac-loader--primary ${className}\`}` and `style={{ ...style }}`. Acato has no props.
- Minor: if `className` is omitted, ours produces a trailing space in the class string (`'ac-loader ac-loader--primary undefined'`) because of the unguarded template literal. Harmless visually but it does put the literal word `undefined` into the DOM. A simple `${className ?? ''}` would fix this.

### `ac-modal.js`
- **Prop surface (ours much larger).** Acato accepts `{ id, title, children, customFooter }` only. Ours adds `disableDefaultButton`, `buttonType`, `buttons[]`, `buttonPosition` (default `'start'`), `onClose`, `layoutClassName`, and `style`. Our footer is data-driven via a `buttons` array (with special-case rendering when `button.shareLink` is true: a copy-button with particle/confetti animation in `<div className='particles'>`).
- **Footer behaviour.**
  - Acato: footer is either the default "Close" button or hidden entirely when `customFooter` is truthy. The actual custom footer must be rendered by the caller as part of `children`.
  - Ours: footer is *always* present (no `customFooter` opt-out), with a leading default Close (suppressible via `disableDefaultButton`) followed by any caller-provided `buttons[]`. The whole footer row is wrapped in `<AcFlex spacing='sm' justifyContent={buttonPosition}>`.
- **Accessibility.**
  - Acato: sets ``aria-labelledby={`${id}-title\`}`` on the `<dialog>` and gives the Heading ``id={\`${id}-title\`}`` — proper a11y wiring.
  - Ours: omits both. The Heading has no `id`, and the dialog has no `aria-labelledby`. **Accessibility regression.**
- **`onClose` callback (ours only).** Ours calls `onClose && onClose()` inside `onCloseHandler`. Acato has no such hook. Backdrop click in Acato also doesn't call any callback. We *do* call `onClose` on the Close button but **not** on backdrop click (the backdrop handler just sets state and closes the dialog) — a subtle inconsistency in our code that callers depending on `onClose` for cleanup may trip on.
- **`displayName`.** Ours assigns `AcModal.displayName = 'AcModal'`. Acato does not. This affects React DevTools labels for `forwardRef` components.

### `ac-modal.scss`
- **Width / variant.**
  - Acato: `inline-size: min(80%, 650px)` (wider default).
  - Ours: `inline-size: min(80%, 450px)` (narrower default) plus a `&.wide-content` modifier that bumps to `min(80%, 800px) !important`.
- **h2 size.** Acato sets `font-size-xl`. Ours sets `font-size-md`. Visual divergence: Acato's modal titles are noticeably larger.
- **Header button margin.** Acato adds `.ac-modal__header .ac-button { margin-block-end: 0 }` to neutralise an inherited bottom margin on the header close button. Ours doesn't — likely cosmetic, may or may not be needed depending on `.ac-button` defaults.
- **`ac-modal-grid-checkboxes` (ours only).** Helper class for a vertical flex stack of checkboxes used inside modals. Caller-specific, not part of the modal contract itself.

### `ac-sections-handler.js`
- **Block type maps differ.**
  - Acato `BLOCK_TYPES`: `Cta, DataList, Faq, Image, RichText`. Then `EXTENDED_BLOCK_TYPES` adds `Category` (a custom `CategoryBlock` defined inline) that fetches from a `categories` store.
  - Ours `BLOCK_TYPES`: `Cta, DataList, Faq, Image, RichText, text` — adds the lowercase `text` key mapped to `AcRichText` to support the API returning lowercase types.
- **`text → RichText` mapping (ours).** Ours has a small adapter: when `content.type === 'text'`, copy `content.data.html` to `componentProps.content` before spreading. This is the API-shape impedance match between the WOO-style content blocks (which use `data.html`) and `AcRichText`'s expected `content` prop.
- **Authentication filtering (ours only).** Ours wraps the component in `withStore + observer`, pulls `user` from MobX store, and runs `filterPageSections(contents, user.isAuthenticated)` before iterating. Sections with role/auth gating get filtered out for anonymous users. Acato has no concept of users, so it iterates the raw `contents` array directly.
- **`CategoryBlock` (Acato only).** Acato embeds a self-contained "categories grid" block: pulls `all_categories` from `stores.categories`, fetches if empty, renders a section header + `AcGrid` of `AcCardCategory`. This depends on Acato's `categories` store, which we don't have (we use `themes` instead — see analysis-themes-categories.md). Adopting this block 1:1 would require either the categories store or a themes-shaped adapter.
- **Unknown-type warning (ours).** Ours emits `console.warn('Unknown content type: ${content.type}', content)` when a block has no matching component. Acato silently `return null`s. The warning is helpful for debugging CMS payloads.
- **Header JSDoc (ours only).** Ours has an extensive JSDoc block explaining supported content types and data shapes (lines 1–26). Acato has no doc comment.

### `src/components/index.js`
- Both files have the same `loadable(() => import(...))` pattern and the same set of shared exports for the organisms covered here.
- Ours adds many additional exports (~30 extra components): `AcContentBlocks`, `AcQuote`, `AcCNavigation`, `AcSearchSubjects`, `AcSideNav`, `ConHorizontalOverflowWrapper`, `ConSpinLoader`, `ConDynamicSchemaForm`, `ConSchemaEnhancedField`, `ConApiSelectField`, `ConMarkdown`, `ConTableSearch`, `ConTemplateText`, `ConDynamicSidenav`, `ConPublicationActions`, `ConDetailsActionsMenu`, `ConUuidResolver`, `ConSchemaResolver`, `ConRegisterResolver`, `ConStandardsResolver`, `ConStandardsTable`, `ConRelatedObjectsLinks`, `ConExistingModulesInfoBox`, `ConModulesChoiceSwitch`, `ConDebugViewer`, `ConOrganizationSelector`, `ConAangebodenSuggestiesTable`, `ConExternalLink`, `ConPublicationTypeBadge`, `ConGlossaryHighlight`, `ConGlossaryDrawer`.
- Acato has one export ours lacks: **`AcSearchThemes`** (which is the Acato analog of our `AcSearchSubjects` — see analysis-themes-categories.md and analysis-search.md).
- One non-lazy export (ours): `ConPublicationTypeBadge` is imported eagerly with comment "Don't lazy load - needs immediate access to VISUALS". Worth noting because everything else is `loadable()`.

---

## Only in ours

These components don't exist in Acato at all.

### `ac-content-blocks.js`
- A homepage-grid of 1–N call-to-action cards keyed off a `blocks: [{ icon, title, text, linkUrl, linkTitle }]` prop array.
- Icon lookup via an `ICON_MAP` (13 entries) translating string keys (`search`, `cubes`, `cube`, `users`, `building`, `document`, `gear`, `link`, `world`, `truck`, `scroll`, `themes`, `house`) to `VISUALS.*` glyphs.
- Renders `<AcSection > AcContainer > AcGrid columns={3} > AcCard category spaceBetween padding='md'>` per block, with optional `AcLink` to `block.linkUrl`. Returns `null` if `blocks` is empty.
- Closely tied to the softwarecatalogus homepage. No SCSS partial for this component is in the comparison set (would be worth checking whether one exists under a different name).

### `ac-quote.js` / `_ac-quote.scss`
- A simple centered `<blockquote>` with `title` (Heading level 2) and optional `subtitle` (Paragraph). Returns `null` if no `title`.
- SCSS: centered text, blue 50 background (with literal hex `#e8f0fe` fallback), variable-driven typography sizes with literal fallbacks (e.g., `var(--tilburg-typography-font-size-xl, 1.5rem)`). The literal hex/px fallbacks are unusual for this codebase — most other SCSS partials use bare `var(--tilburg-…)` references with no fallback.

### `con-markdown.js` / `_con-markdown.scss`
- Thin wrapper around `react-markdown` with a hard-coded plugin stack: `remarkGfm` (singleTilde:false), `remarkDefinitionList`, `remarkEmoji`, `remarkSupersub`, `remarkMark`, then `rehypeSlug` and a `remarkRehype` handler for the definition-list AST.
- Renders inside `<div className='con-markdown'>`.
- SCSS: minimal — resets `ol` padding, gives `li` left margin, styles inline `code` with a gray background.

### `con-spin-loader.js`, `spin-loader/spin-loader.js`, `_spin-loader.scss`
- **Two identical components in two different folders.** `con-spin-loader/con-spin-loader.js` exports `ConSpinLoader`, `spin-loader/spin-loader.js` exports `SpinLoader`. Their bodies are otherwise byte-for-byte identical (`<div className={clsx('spin-loader', props.className)} {...props}>` with a child `<div className='spin-loader__circle'>`).
- Only `ConSpinLoader` is re-exported from `src/components/index.js`. The non-`con-` version is reachable only by direct import path. This is a duplication tied to a likely rename mid-development that wasn't completed.
- SCSS: a spinning circle border (`border-top-color: transparent`, `animation: spin 0.8s linear infinite`).

---

## Only in Acato's

Nothing exists in this category that is purely Acato-only and unrelated to features ours has reworked. The closest things are:

- The **`CategoryBlock` inside `ac-sections-handler.js`** — depends on Acato's `categories` store (we don't have it; we have `themes` instead).
- The **`list` prop on `ac-about.js`** — small, additive feature for adding a bulleted list inside the about block.
- The **`AcSection --blue` modifier** in `_ac-section.scss` (and the corresponding `blue` prop on Acato's about) — small, additive.
- The **mobile responsive treatment in `_ac-hero.scss`** — substantial: full-bleed search card on small screens, background image suppression, h1 restyle.
- The **`aria-labelledby` wiring in `ac-modal.js`** — small, accessibility-positive.
- The **`customFooter` opt-out in `ac-modal.js`** — different ergonomics than our `buttons[]` array but more flexible at the cost of pushing footer composition back to the caller.

---

## Recommendation

| Difference | Verdict | Notes |
|---|---|---|
| `ac-faq.js` identical | No action | Already in sync |
| `_ac-sections.scss` identical | No action | Already in sync |
| `_ac-intro.scss` identical | No action | Already in sync |
| `_ac-loader.scss` near-identical | No action | Cosmetic `animation-delay: 0` in ours is a no-op |
| **`ac-about.js` — `list` prop (Acato)** | **Adopt from Acato** | Tiny, additive, no downside. Add the `list` prop and the optional `<Paragraph>{list}</Paragraph>`. |
| **`ac-about.js` — `blue` prop + `--blue` modifier (Acato)** | **Adopt from Acato** | Add `&--blue` to `_ac-section.scss`. Decide separately whether to actually pass `blue` on our home page's about section — that's a design decision, not a code one. |
| **`_ac-about.scss` — `a { display: inline }` (Acato)** | **Adopt from Acato** | Small, defensive. |
| `_ac-about.scss` — `@utrecht/link-css` vs `@utrecht/components/link/css` | No action | Both resolve to the same package; not worth churn. |
| **`ac-featured.js` (ours)** | **Keep ours** | Ours is the real implementation (driven by `publications` + `isLoading`). Acato's three hard-coded `<AcSearchResult />` placeholders are a stub. |
| **`_ac-featured.scss` (ours adds blue bg)** | **Keep ours** but verify | Our blue background is intentional for the softwarecatalogus homepage. Acato's commented-out grid blocks (`// display: grid`) should be deleted on whichever side keeps them — dead CSS. |
| **`ac-hero.js` — base64 image inlining (ours)** | **Refactor — needs decision** | The 625 KB on-disk size from `MigratoHeroImage` and `HorstAanDeMaasHeroImage` ships into the homepage bundle (or its lazy chunk via `loadable`). Replace base64 data URIs with static assets in `public/` or `src/assets/` and load them by URL. This is a build-perf regression, not a feature decision. |
| **`ac-hero.js` — multi-tenant hostname switch (ours)** | **Keep ours** | The softwarecatalogus deployment needs tenant-specific hero images. Acato's hard-coded image is fine for a single-tenant deployment but cannot satisfy our use case. |
| **`ac-hero.js` — submit URL via `URLSearchParams` + `_page=1` (ours)** | **Keep ours** | More correct (handles trimming, page reset, encoding). |
| **`ac-hero.js` — `disableAutoSearch` (ours)** | **Keep ours** | Avoids spurious API calls on every keystroke from the homepage. |
| **`ac-hero.js` — `(contents) => contents.contents` destructure** | **Refactor** | Cosmetic. Change to `({ contents }) => …` for consistency with the rest of the codebase. |
| **`_ac-hero.scss` — mobile responsive block (Acato)** | **Adopt from Acato** | The full-bleed mobile treatment is a real UX improvement. Verify the h1 size override (`font-size-2xl`) does not conflict with our heading scale before merging. |
| **`ac-intro.js` — `AcCheckIfSpecificHostname` icon swap (ours)** | **Keep ours** | Tenant-specific branding for the VNG question-mark glyph. Pure additive. |
| **`ac-loader.js` — `style` + `className` props (ours)** | **Keep ours, fix bug** | The `${className}` template literal produces the literal string `'undefined'` when `className` is omitted. Change to `${className ?? ''}` and trim, or use `clsx`. |
| **`ac-modal.js` — `aria-labelledby` (Acato)** | **Adopt from Acato** | Pure accessibility win. Add `id={\`${id}-title\`}` on the Heading and `aria-labelledby` on the dialog. Required for screen-reader announcements of the modal title. |
| **`ac-modal.js` — `displayName` (ours)** | **Adopt from ours** | Trivial DevTools improvement — Acato should add it too if merging upstream. |
| **`ac-modal.js` — `onClose` not fired on backdrop click (ours, bug)** | **Fix in ours** | If callers rely on `onClose` for cleanup, missing it on backdrop close is a latent bug. Add `onClose && onClose()` inside `onBackdropClick`. |
| **`ac-modal.js` — `buttons[]` vs `customFooter` API** | **Keep ours** | Our data-driven `buttons[]` API matches our beheer/forms patterns. Acato's `customFooter` approach (caller renders footer themselves) is fine but less consistent with our use sites. |
| **`_ac-modal.scss` — width 450 vs 650, h2 size** | **Needs design decision** | Both choices are intentional. Pick one design-system size; the `wide-content` modifier suggests we already needed a wider variant — possibly consolidate to a single set of `--narrow`/`--wide` variants. |
| **`_ac-modal.scss` — `.ac-button { margin-block-end: 0 }` (Acato)** | **Adopt from Acato** | Small defensive fix for inherited button margins in the header. |
| **`ac-sections-handler.js` — `text` lowercase mapping (ours)** | **Keep ours** | Matches our API's content-block shape. |
| **`ac-sections-handler.js` — `withStore + observer + filterPageSections` (ours)** | **Keep ours** | Required for auth-gated content sections. |
| **`ac-sections-handler.js` — `console.warn` on unknown type (ours)** | **Keep ours** | Useful for CMS debugging. |
| **`ac-sections-handler.js` — `CategoryBlock` (Acato)** | **Needs business decision** | Adopting requires either Acato's `categories` store or a themes-shaped adapter. Probably *do not* port directly; consider whether a "themes section block" makes sense for our CMS instead. |
| **`ac-content-blocks`, `ac-quote`, `con-markdown`, `con-spin-loader` (ours only)** | **Keep ours** | All four are feature components we use; no Acato equivalent to reconcile. |
| **`spin-loader/spin-loader.js` duplicate (ours)** | **Delete one** | Identical to `con-spin-loader/con-spin-loader.js`. Only `ConSpinLoader` is exported from the components index — `SpinLoader` is orphaned. Delete `src/components/spin-loader/` after a grep confirms zero direct imports. |
| **`src/components/index.js` — `AcSearchThemes` (Acato)** | **Cross-ref category 3** | Already covered under the search/themes categories. No action here. |
| **`src/components/index.js` — non-lazy `ConPublicationTypeBadge` import (ours)** | **Keep ours** | The inline comment explains the constraint (`needs immediate access to VISUALS`). Worth verifying the constraint is still real, but not part of this category. |

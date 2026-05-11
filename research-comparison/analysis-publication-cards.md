# Analysis: Publication Cards (List Views)

## Branches Compared
- Ours (tilburg-woo-ui): `softwarecatalogus-performance`
- Acato (tilburg-woo-ui_acato): `main`

## Files Compared

**Shared (exist in both repos):**
- [src/atoms/ac-card/ac-card.js](../src/atoms/ac-card/ac-card.js)
- [src/molecules/ac-card-intro/ac-card-intro.js](../src/molecules/ac-card-intro/ac-card-intro.js)
- [src/styles/atoms/_ac-card.scss](../src/styles/atoms/_ac-card.scss)

**Ours only:**
- [src/molecules/con-cards/index.js](../src/molecules/con-cards/index.js)
- [src/molecules/con-cards/con-card-organisation-application/con-card-organisation-application.js](../src/molecules/con-cards/con-card-organisation-application/con-card-organisation-application.js)
- [src/molecules/con-cards/con-card-contactpersoon/con-card-contactpersoon.js](../src/molecules/con-cards/con-card-contactpersoon/con-card-contactpersoon.js)
- [src/molecules/con-cards/con-card-dienst/con-card-dienst.js](../src/molecules/con-cards/con-card-dienst/con-card-dienst.js)
- [src/molecules/con-cards/con-card-gebruik/con-card-gebruik.js](../src/molecules/con-cards/con-card-gebruik/con-card-gebruik.js)
- [src/molecules/con-cards/con-card-koppeling/con-card-koppeling.js](../src/molecules/con-cards/con-card-koppeling/con-card-koppeling.js)
- [src/molecules/con-cards/con-card-moduleversie/con-card-moduleversie.js](../src/molecules/con-cards/con-card-moduleversie/con-card-moduleversie.js)
- [src/views/con-directory/con-directory.js](../src/views/con-directory/con-directory.js)

---

## What is the same

- **`AcCard` atom** is structurally identical in both repos: same props (`blue`, `category`, `searchResult`, `padding`, `image`, `skeleton`, `spaceBetween`), same render tree (image + `.ac-card__content` wrapper), same `clsx` BEM-style class composition.
- **`AcCardIntro` molecule** uses the same hard-coded Woo-verzoek sample text, the same `<AcCard blue>` shell, the same `Heading` / `Paragraph lead` / `Button` + `VISUALS.LIST_BLUE` composition. Functionally a placeholder in both.
- **`_ac-card.scss`** shares the same overall structure: `&--blue`, `&--category`, `&--search-result`, `&--padding-{sm,md,default,lg}`, `&--skeleton` (including the shimmer keyframes), `&--space-between`. The skeleton block is byte-for-byte identical, and the padding tokens reference the same `--tilburg-space-block-*` variables.

## What differs

### `ac-card.js` (atom)

Two changes:
1. **Ours adds an `organisation` prop** (line 7, 18) that emits an `ac-card--organisation` modifier class. Acato's atom has no awareness of this variant.
2. **Ours fixes a JSX bug**: the content wrapper uses `className='ac-card__content'`, while Acato's still uses the invalid HTML attribute `class='ac-card__content'` ([acato/src/atoms/ac-card/ac-card.js:26](../../tilburg-woo-ui_acato/src/atoms/ac-card/ac-card.js#L26)). In React, `class` is silently dropped — Acato's atom does not actually emit the content-wrapper class. This is a real bug in Acato's version.

### `ac-card-intro.js` (molecule)

Acato's version accepts `{ title, description, image }` props in the signature but never uses them — it still renders the hard-coded sample. Ours doesn't bother with the unused signature. Both are effectively stubs; Acato's is a half-finished refactor.

### `_ac-card.scss`

The two stylesheets express the same intent but at different abstraction levels:

| Aspect | Ours | Acato |
|---|---|---|
| Tokenisation | Heavy: every property reads from `--tilburg-search-card-*` custom properties with a fallback (e.g. `var(--tilburg-search-card-padding-default, var(--tilburg-space-block-cat))`). Themeable per-tenant via the `_tokens-*.scss` files. | Light: reads design-system tokens directly (`var(--tilburg-space-block-cat)`, `var(--tilburg-color-pink-300)`). |
| `&--organisation` variant | Present (mirrors `&--category` / `&--search-result` hover behavior). | Absent. |
| Heading colour override | `:is(h1..h6)` rules with `--tilburg-search-card-title-color` and a hover variant — ours has this; Acato does not. | — |
| Default border | None (only the absolute-positioned `a:after` hover border). | `border: var(--tilburg-border-width-sm) solid var(--tilburg-color-gray-200)` on every card. |
| `&__content` typography rules | None — typography is left to consumers. | Contains explicit `.utrecht-paragraph` and `.utrecht-badge-status` font-size rules. |
| `&--blue` mobile bleed | None. | Has a `@include respond-max($screen-sm)` block that bleeds the blue card to viewport edges. |
| Image transitions | `transition: var(--tilburg-search-card-transition)` on root. | None. |
| Trailing `.organisation-card` block | Present (small grey "updated" line for org cards). | Absent. |

Net: ours is the more flexible, theme-driven variant — it gives up Acato's typography defaults and the always-visible card border in exchange for full design-token control and an extra `organisation` mode.

### `ac-card-intro.js` signature

Acato added prop signature scaffolding (`{ title, description, image }`) without wiring it. Likely an in-progress change on their side.

## Only in ours

A whole family of per-entity cards under `src/molecules/con-cards/`. All six share a consistent pattern:

- Wrapped in `<AcCard organisation padding='md' skeleton={skeleton}>`.
- Header row: an icon (`VISUALS.*`) + `Heading level={3}` + optional small contextual paragraph (e.g. "Aangeboden door …").
- Body paragraph (summary / description / list).
- Meta row at the bottom with date, optional status / category / type, separated by `VISUALS.ELLIPSE` bullets.
- `AcLink` arrow on the right; `to` is computed by an `onClick`-named function that branches on a `navigateTo` prop (`'publication'` | `'beheer'` | `'beheer-organisatie'` | etc.) and returns the right `NAVIGATE_TO.*` route.
- UUID values resolve to human-readable names via `<ConUuidResolver>`.
- Dates run through `acFormatDate(value, 'YYYY-MM-DD', 'DD MMMM YYYY', 'nl-NL')`.

Per-card specifics:

- **`con-card-organisation-application`** — used for products, modules and organisations (icon switches on `cardType`). The only card that also displays a `ConLogoPreview`. Has organisation-aware navigation: when `navigateTo === 'beheer-organisatie'`, it checks `checkOrganizationPermissions(user, …)` and redirects to `/beheer/my-organisation` if the current user can edit that org. Lazy-loaded via `@loadable/component` from `con-cards/index.js`.
- **`con-card-contactpersoon`** — assembles a full name from `firstName/middleName/lastName`, shows function + email + phone in the meta row.
- **`con-card-dienst`** — has the most complex meta cell: a fallback chain that parses `type` as a JSON-array-encoded string, then as an array of objects (looking for `naam`/`name`/`label`), then as a single object, then as plain text.
- **`con-card-gebruik`** — title is `"<module> - gebruik"`, body is a truncated reference-component list (`+N meer` overflow).
- **`con-card-koppeling`** — module-to-module integration card with an arrow direction (`→ / ← / ↔`) derived from `gegevensuitwisselingRichting`, plus status-date lookup table (`in ontwikkeling`, `actief`, `teruggetrokken`, etc.).
- **`con-card-moduleversie`** — applicatieversie card. Cascades through date fields: prefers `datumInOntwikkeling`, falls back to `datumInGebruik`, and pairs with `datumEindeOndersteuning` / `datumTeruggetrokken`.

**`con-directory` view** is a separate concern: it's not a card list at all but a *table* view that fetches `/opencatalogi/api/directory` and renders the results via `ConTable` from the beheer module. Filed here only because the index lumped it with publication cards; it really belongs with admin/beheer or with a dedicated directory category.

## Only in Acato's

Nothing in this category — Acato does not have a per-entity card family. Their lightweight public portal only renders the generic `AcCard` and a stubbed `AcCardIntro`. List-view styling lives mostly in their search result molecule rather than in dedicated cards.

## Recommendation

### Atom — `ac-card.js`
- **Take from us, for one specific change**: ours fixes the `class` → `className` bug. Acato's atom would silently fail to apply `.ac-card__content` styling.
- **Open question**: whether to keep the `organisation` modifier in the shared atom or move it out. It's only used by our beheer-related cards, so the atom stays generic if we drop the prop and let consumers spread their own className. Low priority.

### Molecule — `ac-card-intro.js`
- **Keep ours, but flag for cleanup**. Neither version actually uses props or renders a real summary. Acato's half-wired props signature suggests they planned to make it data-driven but didn't. If we merge, drop Acato's unused signature and implement the data-driven version properly, or excise this stub entirely.
- **Needs decision**: is this molecule supposed to render the publication summary from `ac-publication` views? If yes, this is feature work, not a merge decision.

### Style — `_ac-card.scss`
- **Keep ours**. The token-driven approach matches our multi-tenant SCSS architecture (Dimpact / Migrato / Venray / VNG / OpenCatalogi token files all exist in ours; Acato is mono-tenant). Adopting Acato's stylesheet would regress that.
- **Consider backporting from Acato**:
  - The `&--blue` mobile bleed (`@include respond-max($screen-sm)`) — small UX improvement on narrow viewports for the intro card. Worth lifting into our tokenised form.
  - The default `.utrecht-paragraph` / `.utrecht-badge-status` font-size resets inside `&__content`. Verify whether our consumers already control these elsewhere before adopting; if not, it's a small typography consistency win.
  - The always-on `border: var(--tilburg-border-width-sm) solid var(--tilburg-color-gray-200)` is a deliberate visual choice — adopt only if design wants visible card outlines by default. **Business decision, not technical.**

### `con-cards/` family
- **Keep — no decision needed**. Ours only; serves the softwarecatalogus domain (products / modules / diensten / koppelingen / gebruik / contactpersonen / moduleversies) which Acato's public portal has no concept of.
- **Internal cleanup opportunity** (out of scope for the comparison, but worth recording): the six cards repeat a near-identical shell (header flex with icon + heading + small paragraph, body paragraph, meta flex with date bullets, arrow link). A single `ConDomainCard` taking `{ icon, title, contextLabel, body, meta, navigateTo }` would remove ~60% of the duplication. Flagging because if this whole module is in scope for a future refactor pass, the duplication makes targeted edits (e.g. consistent date formatting, navigateTo wiring) error-prone.

### `con-directory` view
- **Recategorise**. It is a table view backed by an external API call and `ConTable`, not a card list. Move analysis to the admin/beheer or a new "directory / external integrations" category. No merge decision here.

---

## Summary table

| Item | Action |
|---|---|
| `ac-card.js` `class` → `className` fix | **Take ours** (Acato has a silent bug) |
| `ac-card.js` `organisation` prop | Keep ours; consider extracting later |
| `_ac-card.scss` tokenisation | **Keep ours** (multi-tenant requirement) |
| `_ac-card.scss` `&--blue` mobile bleed | **Backport from Acato** into our tokenised form |
| `_ac-card.scss` `__content` typography resets | Verify, then optionally backport |
| `_ac-card.scss` always-on grey border | **Business decision** — design call, not technical |
| `ac-card-intro.js` stub | Cleanup — decide what this molecule is for |
| `con-cards/*` family | Keep ours; flag duplication for future refactor |
| `con-directory.js` | Recategorise — not a card view |

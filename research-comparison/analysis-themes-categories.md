# Analysis: Themes / categories browsing

## Branches Compared
- Ours (tilburg-woo-ui): `softwarecatalogus-performance`
- Acato (tilburg-woo-ui_acato): `main`

## Files Compared

**Both (8 files):**
- `src/views/ac-themes/ac-themes.js`
- `src/molecules/ac-card-category/ac-card-category.js`
- `src/components/ac-subjects/ac-subjects.js`
- `src/components/ac-tablist/ac-tablist.js`
- `src/constants/themes.constants.js`
- `src/stores/themes.store.js`
- `src/api/themes.api.js`
- `src/styles/components/_ac-tablist.scss`

**Acato only (4 files — a separate "categories" and "terms" data layer):**
- `src/api/categories.api.js`
- `src/api/terms.api.js`
- `src/stores/categories.store.js`
- `src/stores/terms.store.js`

---

## What is the same

The following files are byte-identical or trivially-different between the two repos:

- **`src/components/ac-subjects/ac-subjects.js`** — identical.
- **`src/components/ac-tablist/ac-tablist.js`** — functionally identical. Only diff: ours has an unused `React` default import (`import React, { useState, useRef }`) while Acato uses the modern named-only form (`import { useState, useRef }`). Bonus: ours passes a second arg to `onKeyDown` (`onKeyDown={(e) => handleKeyDown(e, index)}`) but the handler signature only takes `event` — harmless but dead.
- **`src/styles/components/_ac-tablist.scss`** — identical.
- **`src/constants/themes.constants.js`** — identical content. Only diff is whitespace (ours uses 2-space indent, Acato uses tabs).
- **`src/api/themes.api.js`** — identical.

Both repos use the same `withStore(observer(...))` MobX pattern, the same atoms (`AcContainer`, `AcSection`, `AcColumn`, `AcGrid`), the same Utrecht `Heading`/`Paragraph`, and the same `AcCardCategory` shape (`title`, `summary`, `image`, `icon`, `linkUrl`, `linkTitle`, `isExternal`).

---

## What differs

### 1. `src/views/ac-themes/ac-themes.js` — small but meaningful divergences

| Aspect | Ours | Acato |
|--------|------|-------|
| Grid prop | `<AcGrid columns={3}>` | `<AcGrid row={3}>` |
| Card `linkUrl` | falls back: `subject.linkUrl \|\| getSearchPageURL(...)` | always `getSearchPageURL(...)` |
| Card `linkTitle` | falls back: `subject.linkTitle \|\| LABELS.VIEW_DOCUMENTS` | always `LABELS.VIEW_DOCUMENTS` |
| Card `isExternal` | passes `subject.isExternal \|\| false` | not passed |
| Intro paragraph | branches on `AcCheckIfSpecificHostname()` — VNG/Softwarecatalogus copy vs. WOO copy | single WOO-only paragraph |

Implications:
- Ours treats themes as potentially "linked" entities — a theme can carry its own `linkUrl`/`linkTitle`/`isExternal` (e.g. an external referral) rather than always linking into the search results page. Acato is hard-wired to the search URL.
- The hostname-conditional paragraph (`AcCheckIfSpecificHostname()` returns true for VNG-specific deployments) is part of our multi-tenant skin layer. Acato doesn't ship the service.

### 2. `src/molecules/ac-card-category/ac-card-category.js` — different icon strategy

**Ours** uses an explicit, hand-maintained `ICON_MAP` (Dutch domain term → component reference from `VISUALS`):
```js
const ICON_MAP = {
  raadsstuk: VISUALS.USERS,
  bestuursstuk: VISUALS.DOCUMENT,
  ...
  themes: VISUALS.THEMES, house: VISUALS.HOUSE, world: VISUALS.WORLD,
  cube: VISUALS.CUBE, cubes: VISUALS.CUBES, truck: VISUALS.TRUCK,
  link: VISUALS.LINK, scroll: VISUALS.SCROLL, gear: VISUALS.GEAR,
};
```
~18 entries covering both WOO doc types and Softwarecatalogus iconography. Falls through silently if `icon` is missing or unmapped.

**Acato** uses a small Dutch→English alias map plus a dynamic uppercase-and-substitute fallback:
```js
const ICON_MAPPING = {
  bereikbaarheidsgegevens: 'REACHABILITY',
  bestuursstuk: 'GOVERNANCE_DOCUMENT',
  organisatie: 'ORGANIZATION',
  raadsstuk: 'COUNCIL_DOCUMENT',
  'woo-verzoek': 'WOO_REQUEST',
  convenant: 'CONVENANT',
};
const mappedName = ICON_MAPPING[iconName] || iconName.toUpperCase().replace(/-|\s/g, '_');
const IconComponent = VISUALS[mappedName];
```

Other diffs in this file:
- **Acato** forwards `image` to `<AcCard ... image={image}>`; ours drops `image` even though it's destructured.
- **Acato** uses `<AcLink to=... external>` (likely a prop the `AcLink` molecule understands) and renders `VISUALS.EXTERNAL_LINK_PINK` for external links. **Ours** sidesteps `AcLink` for externals and renders a raw `<a target="_blank" rel="noopener noreferrer" className="ac-link">` with `VISUALS.EXTERNAL_LINK`.
- **Ours** wraps the icon + heading in `<AcFlex spacing="sm" alignItems="center">`. **Acato** is `<AcFlex spacing='sm'>` (no centering).
- **Ours** only renders the link block if `linkUrl` is truthy (`linkUrl && isExternal ? ... : linkUrl ? ... : null`). **Acato** renders a link unconditionally.

The two icon strategies reflect different VISUALS naming conventions in each repo: ours has SHORT semantic names (`DOCUMENT`, `HOUSE`, `BUILDING`); Acato has more literal Dutch-mapped names (`COUNCIL_DOCUMENT`, `GOVERNANCE_DOCUMENT`, `WOO_REQUEST`). Without harmonising the asset/VISUALS layer, neither map drops into the other repo cleanly.

### 3. `src/stores/themes.store.js` — meaningful divergence

**Ours** is significantly extended:
- Optional `@constants/container.constants` import via `try/require` for runtime-generated container config.
- A hardcoded `MOCK_THEMES` array (4 generic themes) used when the `mock_themes` feature flag is enabled, and as a fallback when the API throws.
- `all_themes` computed:
  - Defensive: filters out items without a string `title` before sorting (to avoid `localeCompare` errors on missing data).
  - Sorts by an explicit `sort` field first (falling back to 999), then alphabetically — supporting **admin-managed ordering** of themes.
  - Maps to a richer shape: derives `paragraph`/`summary` from `content`/`description`, derives `linkTitle` from `theme.link` (with `VIEW_ALL_THEMES` fallback), passes through `linkUrl` from `theme.url`, passes through `isExternal`.
- `DEFAULT_QUERY = {}` — does not request the API to extend resources.

**Acato** is minimal:
- No mock, no feature flag, no try/require.
- `all_themes` sorts alphabetically by title (no defensive filtering, will throw if any item lacks a title).
- Maps only `paragraph` and `linkTitle`; filters out themes where `image === null` (i.e. requires an image to render).
- `DEFAULT_QUERY = { extend: 'all' }` — relies on the API to expand related fields.

These divergences track real product differences:
- Our themes carry CMS-driven sort order, optional external URLs, optional external-link flags.
- Acato's themes are simpler list entries that must have images to display.

### 4. `_ac-tablist.scss` — identical

No styling differences. Whatever consumes `AcTabList` in our repo (only Acato uses `ac-tablist.js` directly per the file list, but ours also exposes a more elaborate atom set under `src/atoms/tab/`) can pull from the same stylesheet.

---

## Only in ours

Nothing in this category is exclusive to us at the file level — but functionally:

- Multi-tenant intro paragraph branching (`AcCheckIfSpecificHostname`).
- CMS-driven theme ordering (`sort` field) and external-link support.
- Mock data fallback and feature flag wiring.
- Extra `VISUALS.HOUSE/WORLD/CUBE/...` icons exposed through the icon map (our repo ships ~55 additional SVGs — see the assets analysis).

---

## Only in Acato

A **parallel taxonomy data layer**: `categories` and `terms`, each with its own API + MobX store. This is not part of the themes flow; it's a separate concept Acato uses elsewhere:

- **`categories`** (`api/categories.api.js`, `stores/categories.store.js`)
  - `list()` → `/api/public/categories`
  - `single(id)` → `/api/public/categories/:id`
  - Store has `items`, `is_loading`, `all_categories` (maps to `{ icon, title, summary: AcSanitizeHtml(content), linkUrl, linkTitle, isExternal }`), `fetchCategories()`.
  - Wired in `src/api/index.js` (`this.categories = new CategoriesAPI(...)`) and `src/stores/store.js` (`this.categories = new CategoriesStore(this)`).
  - Consumed by `src/views/ac-home/ac-home.js` (home page renders category cards) and `src/components/ac-sections-handler/ac-sections-handler.js` (a section that auto-fetches and renders category cards).

- **`terms`** (`api/terms.api.js`, `stores/terms.store.js`)
  - `list()`, `single(id)`, `getForPublication()` → `/api/public/terms`
  - Store has `terms`, `publicationTerms` Map, search query, plus a `findTermsInText(terms, text)` helper that returns terms whose `name` appears in a text body.
  - `fetchTermsForPublication(publicationId)` is called from `src/views/ac-publication/ac-publication.js` and filters all-terms down to the ones mentioned in the publication summary.
  - Effectively Acato's **glossary system**: a server-managed term list, filtered against publication text, with `description` HTML-sanitised.

These are categorically distinct from our **glossary system** (category 17, `con-glossary-*` files) — Acato's `terms` store predates and is the architectural ancestor of our `glossary.store.js`. Worth confirming as part of the glossary analysis.

---

## Recommendation

For each difference:

1. **`AcGrid columns={3}` vs `AcGrid row={3}` in `ac-themes.js`** — **Verify which prop name AcGrid actually accepts in each repo**. The two repos likely have different AcGrid API surfaces; whichever name is correct in each tree is fine in-place. This is *not* a merge candidate without first reconciling AcGrid itself (covered in atoms analysis).

2. **Per-theme `linkUrl`/`linkTitle`/`isExternal` fallback in `ac-themes.js`** — **Keep ours**. It generalises Acato's behaviour (when fields are absent, we fall through to the same `getSearchPageURL` Acato hard-codes) and supports our CMS-driven theme model. No regression to Acato.

3. **`AcCheckIfSpecificHostname()` intro-paragraph branching** — **Keep ours**. Project-specific and tied to our multi-tenant skin. Not relevant upstream.

4. **`AcCard image` prop forwarding (Acato)** — **Take from Acato** as a small fix. `image` is destructured in our component but never used; either drop the destructure or actually forward it to `<AcCard image={image}>`. Low risk, one-line change. *Flag for design check*: does our `AcCard` even accept an `image` prop?

5. **External-link rendering (Acato uses `<AcLink to=.. external>`; ours uses raw `<a>`)** — **Needs decision**. Acato's approach is cleaner *if* our `AcLink` supports `external`/target handling. If it does, switch to it for consistency. If not, our raw `<a>` is the correct lower-level escape hatch. Worth a quick check before changing.

6. **Icon mapping strategy in `ac-card-category.js`** — **Keep ours**. Acato's auto-uppercase trick is clever but brittle (icon names with diacritics, hyphens-in-the-middle, or that don't match any VISUALS constant fall through silently). Our explicit table is more maintainable and matches the larger set of icons we ship. *Cross-check with assets analysis* before finalising — if we end up adopting Acato's WOO-document VISUALS names, the table needs to be regenerated.

7. **`themes.store.js` mock + sort + defensive filter** — **Keep ours**. Mock and feature-flag plumbing are part of our local dev workflow; the `sort` field and `localeCompare` guard prevent real production crashes that Acato is vulnerable to.

8. **`themes.store.js` `extend: 'all'` query (Acato)** — **Needs decision**. Acato asks the API to expand related resources eagerly; we don't. Whether to adopt depends on whether our `/opencatalogi/api/themes` endpoint understands `extend=all` and whether we *want* the bigger payload. *Flag for backend confirmation.*

9. **`image !== null` filter in Acato's `all_themes`** — **Don't adopt**. We deliberately allow icon-only themes (the `icon` field carries the visual). Filtering out image-less themes would silently drop content.

10. **Acato's separate `categories` and `terms` data layers** — **Not adopting wholesale**. But:
    - **`categories`** appears to be an alternate home-page taxonomy distinct from `themes`. **Needs business decision**: do we need a second list-of-things-on-the-homepage, or is `themes` already serving that role? If yes, our home view (category 22) would need analogous wiring.
    - **`terms`** is functionally a precursor to our glossary system. **No action here** — defer to the glossary analysis (category 17), which should compare `terms.store.js` and `glossary.store.js` side-by-side and decide whether to backport any of Acato's `findTermsInText`/`publicationTerms` ergonomics.

11. **`React` default import in `ac-tablist.js` (ours)** — Drop the unused import (one-line cleanup). Also remove the unused second arg in `onKeyDown={(e) => handleKeyDown(e, index)}`.

### Items that warrant a human decision (not just technical)

- Whether to introduce Acato's `categories` concept into our home page (recommendation 10a).
- Whether our `themes` API supports/wants `extend=all` (recommendation 8).
- Whether the multi-tenant intro paragraph should remain hostname-gated or be moved to a CMS-driven config field (recommendation 3 — currently fine, but it's drift-prone).

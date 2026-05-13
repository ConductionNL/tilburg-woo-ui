# Analysis: Assets — fonts, images, locales

## Branches Compared
- Ours (tilburg-woo-ui): `softwarecatalogus-performance`
- Acato (tilburg-woo-ui_acato): `main`

## Scope

Files under `src/assets/` only. Sibling categories cover:
- `public/` and root `static/` — see [analysis-public-static.md](analysis-public-static.md)
- `src/assets/licenses/licenses.json` — belongs to the Beheer category (admin panel, ours only) and is not analyzed here

## Files Compared

**Both — fonts:**
- `src/assets/fonts/AC Icons/ac-icons.woff`
- `src/assets/fonts/AC Icons/ac-icons.woff2`
- `src/assets/fonts/AC Icons/selection.json`
- `src/assets/fonts/roboto-v30-latin-500.woff2`
- `src/assets/fonts/roboto-v30-latin-700.woff2`
- `src/assets/fonts/roboto-v30-latin-regular.woff2`

**Acato only — fonts:**
- `src/assets/fonts/roboto-condensed.woff2`

**Both — images:** 26 filenames shared (14 byte-identical, 12 diverged — see below)

**Acato only — images:** 6 WOO publication-type icons
- `bereikbaarheidsgegevens.svg`
- `bestuursstuk.svg`
- `convenant.svg`
- `organisatie.svg`
- `raadsstuk.svg`
- `woo-verzoek.svg`

**Ours only — images:** 57 additional SVGs covering admin/auth/softwarecatalogus features. Full list grouped functionally below under "What differs → Images — Ours only".

**Both — locales:**
- `src/assets/locales/translations.js`
- `src/assets/locales/translations.txt`
- `src/assets/locales/en/translation.js`
- `src/assets/locales/nl/translation.js`

---

## What is the same

### Fonts
All shared font files are **byte-identical** (md5 match):
| File | md5 |
|---|---|
| `AC Icons/ac-icons.woff` | `afcdd563bde8537749edc24c159f1edf` |
| `AC Icons/ac-icons.woff2` | `e2100c772ca77f1b95d2b34099c4a3c0` |
| `AC Icons/selection.json` | `e41c3625bba13fc829c0e237c2e5d416` |
| `roboto-v30-latin-500.woff2` | `3a44e06eb954b96aa043227f3534189d` |
| `roboto-v30-latin-700.woff2` | `e9f5aaf547f165386cd313b995dddd8e` |
| `roboto-v30-latin-regular.woff2` | `15d9f621c3bd1599f0169dcf0bd5e63e` |

The AC Icons font + `selection.json` (IcoMoon export) is the bundled icon set both repos consume via the `_fontfaces.scss` declaration and SCSS icon mixins (category 13).

### Locales
All four translation files are **byte-identical**:
| File | md5 |
|---|---|
| `translations.js` | `400e6e45b893b88f231811ea3df276f1` |
| `translations.txt` | `0e5512ae350a6e6e79cbbe5a29c1c698` |
| `en/translation.js` | `14cd9295c278d7fed45e5fc943dca495` |
| `nl/translation.js` | `80810b618cbff1cb6512c43da613b040` |

This is the **most surprising finding** in this category — despite both repos diverging substantially in features and views, the i18n payloads have not drifted. Either nobody on either side has touched translation strings since the fork, or both teams have been disciplined about adding strings somewhere else (likely inline `t('…')` keys that don't have entries in these files yet).

### Images — byte-identical shared (14 of 26)
`check.svg`, `close-small.svg`, `close.svg`, `ellipse.svg`, `filter.svg`, `info-blue.svg`, `list-alt.svg`, `list-blue.svg`, `list.svg`, `particles.svg`, `placeholder.jpeg`, `search-alt.svg`, `share.svg`, `themes.svg`.

---

## What differs

### Fonts — `roboto-condensed.woff2` (Acato only)

Referenced exactly once in Acato's `src/styles/global/_fontfaces.scss`. Ours has no `roboto-condensed` reference anywhere under `src/`. This means Acato actually uses Roboto Condensed; we dropped it (and presumably whichever component it was styling) somewhere during our fork.

### Images — diverged shared (12 of 26)

Three categories of divergence, summarised:

| File | Type of difference | Detail |
|---|---|---|
| `arrow-right.svg` | Refactor only | `fill="currentColor"` moved from `<g>` to `<path>`. Visually identical. |
| `chevron-right.svg` | Refactor only | Ours adds `viewBox` and multi-line formatting; same fill (`#5B6E8A`). |
| `contact.svg` | Color | Ours `currentColor`, Acato hardcodes `#fff`. |
| `document.svg` | Color | Ours `currentColor`, Acato hardcodes `#C8006C` (pink). |
| `external-link.svg` | Color + a11y | Ours `currentColor` no title. Acato hardcodes `#fff` and adds `<title>Opent in een nieuw tabblad</title>`. |
| `external-link-blue.svg` | a11y only | Same fill (`#026596`). Acato adds `<title>Opent in een nieuw tabblad</title>`. |
| `external-link-pink.svg` | a11y only | Same fill (`#C8006C`). Acato adds `<title>Opent in een nieuw tabblad</title>`. |
| `info.svg` | Refactor only | Ours adds `viewBox`, content otherwise the same. |
| `logo.svg` | **Real visual difference** | Ours: 96×96, embedded raster scaled to fill the square. Acato: 70×96, `#003865` Tilburg-blue rectangle as background with the same embedded raster shrunk and positioned via `matrix(0.00111658 0 0 0.000581554 -0.18 0.145833)`. Two visually different logos that share the underlying raster image. |
| `menu.svg` | Color | Ours `currentColor`, Acato hardcodes `#fff`. |
| `question-mark.svg` | Whitespace only | Same fill (`#C8006C`), only formatting differs. |
| `search.svg` | Color | Ours `currentColor`, Acato hardcodes `white`. |

**The dominant pattern**: Acato hardcodes specific colors (typically `#fff` for use on dark-coloured backgrounds, sometimes accent pinks/blues), while ours uses `currentColor` so the icon inherits the surrounding text colour. This is a deliberate divergence tied to theming — our codebase supports multiple `_tokens-*.scss` theme variants (category 13) and needs the icons to recolor per theme, whereas Acato ships a single dark-blue Tilburg theme where white-on-blue is the only context the icons appear in.

**Accessibility note**: Acato's three `external-link*.svg` icons all carry a Dutch `<title>` element ("Opent in een nieuw tabblad") that screen readers announce. Ours lack this — meaning users of assistive tech get no warning that an external-link icon means the link opens in a new tab. This is a real WCAG concern.

### Images — Acato only (6 WOO document-type icons)

Each icon is a detailed line-art SVG for a Dutch WOO (Wet open overheid) publication category, all using `fill="currentColor"`:
- `bereikbaarheidsgegevens.svg` (1.4 KB) — contact-info pin/map
- `bestuursstuk.svg` (746 B) — governance document
- `convenant.svg` (2.5 KB) — handshake/agreement
- `organisatie.svg` (2.5 KB) — three people icon
- `raadsstuk.svg` (2.2 KB) — council document
- `woo-verzoek.svg` (877 B) — WOO request

They are wired up in Acato's `src/constants/visuals.constants.js` and consumed by `ac-card-category.js` and `ac-themes.js` (category 6 themes browsing). Our codebase has no equivalent icon set for these specific WOO document types — our publication-type system is broader (gebruik, koppeling, dienst, module, organisatie, applicatie…) and uses a different visual vocabulary.

### Images — Ours only (57 additional SVGs)

Three rough functional groupings (no per-file analysis here — that belongs to whichever feature category consumes the icon):

1. **Auth / user**: `user`, `user-circle`, `user-plus`, `user-check`, `user-xmark`, `users`, `key`, `eye`, `eye-slash`, `right-from-bracket`, `person_add`, `envelope`, `envelope-outline`, `envelopes-bulk`, `phone`
2. **Admin / Beheer / forms**: `pencil`, `trash-can`, `plus`, `minus`, `xmark`, `gear`, `download`, `upload`, `save`, `publish`, `publish-off`, `clipboard-check`, `paper-plane`, `rotate-right`, `circle-check`, `circle-xmark`, `circle-exclamation`, `triangle-exclamation`, `spinner`, `ellipsis`, `sort`, `sort-up`, `sort-down`
3. **Softwarecatalogus / domain icons**: `building`, `chart-line`, `cloud`, `commonground`, `cubes`, `cube`, `github`, `handshake`, `hand-holding`, `house`, `link`, `network-strength-4-cog`, `scroll`, `truck`, `wand-sparkles-solid`, `world`, `question-mark-vng`, `arrow-left`, `chevron-left`

These are all FontAwesome-style line icons exported individually as SVGs. They drive the views/admin features that exist only in our fork (auth, beheer, forms, softwarecatalogus, etc.).

---

## Only in ours
- `src/assets/licenses/` directory and contents — not part of category 20, listed under Beheer (category 15). Mentioned here only to flag that the `assets/` tree differs in structure, not just content.

## Only in Acato's
- `src/assets/fonts/roboto-condensed.woff2` (37 KB) — actively referenced in their font stack.
- `src/assets/images/<6 WOO doc icons>` — actively wired into their themes browsing UI.

---

## Recommendation

| Item | Decision | Reason |
|---|---|---|
| `AC Icons` font set | **No action.** | Byte-identical across repos. |
| `roboto-v30-latin-*` fonts | **No action.** | Byte-identical across repos. |
| `roboto-condensed.woff2` (Acato only) | **Skip — verify first.** | If our `_fontfaces.scss` no longer declares it and no component requests `font-family: 'Roboto Condensed'`, dropping it was intentional. Worth a one-grep verification (`grep -r "roboto.condensed\|Roboto Condensed" src/styles`) but no action expected. |
| All four locale files | **No action.** | Byte-identical. If we ever need to backport translation additions from upstream, expect zero conflicts — but also expect zero new strings, because Acato hasn't edited them since the fork either. |
| 14 byte-identical SVGs | **No action.** | |
| 4 cosmetic-refactor SVGs (`arrow-right`, `chevron-right`, `info`, `question-mark`) | **Keep ours.** | Ours add `viewBox` declarations on a couple of them, which improves cross-browser sizing. No reason to revert. |
| 5 color-divergence SVGs (`contact`, `document`, `external-link`, `menu`, `search`) | **Keep ours.** | Acato's hardcoded `#fff`/accent colors don't work in our multi-theme setup. `currentColor` is the correct generic choice. |
| 2 a11y-divergence SVGs (`external-link-blue`, `external-link-pink`) | **Backport from Acato.** | Add `<title>Opent in een nieuw tabblad</title>` to both of our `external-link*.svg` files (all three including the `currentColor` variant). It's a one-line per file, no visual change, and closes a WCAG H33 (link purpose / icon labeling) gap. **Low-risk, defensive improvement.** |
| `external-link.svg` | **Backport title only, keep our color.** | Take the `<title>` from Acato's version, keep our `fill="currentColor"`. |
| `logo.svg` | **Keep ours.** | Acato's version is Tilburg-specifically branded (`#003865` background frame). Our multi-tenant deployment serves several municipalities. The logo difference reflects that. |
| Acato's 6 WOO document-type icons | **Needs decision.** | They're wired only to Acato's themes/categories UI. We do not currently surface WOO publication types in our UI at all — we surface gebruik/koppeling/dienst/etc. instead. Either (a) we have a future use case for showing WOO doc types (e.g. when the portal serves a municipality whose use of the system is purely publication-disclosure), in which case import these and the corresponding `visuals.constants.js` entries, or (b) it's a category-mismatch and we won't use them. **Asks: do we plan to support WOO publication-disclosure use cases?** |
| Our 57 extra SVGs | **Keep ours.** | All consumed by features that exist only in our fork. |
| `src/assets/licenses/licenses.json` (ours only) | **Out of scope — see category 15.** | |

### Items requiring a human decision (not just technical)

1. **Backport `<title>` accessibility text to our external-link icons?** Three SVGs (`external-link-blue.svg`, `external-link-pink.svg`, `external-link.svg`) lack the Dutch screen-reader title Acato added. Low-risk WCAG improvement, but the title text is Dutch-only — if we serve multilingual portals (en/nl), the `<title>` is a static literal and won't translate. That trade-off (static Dutch title vs no title at all) is a product decision.
2. **Do we want to support WOO publication-disclosure use cases?** If yes, the 6 WOO doc icons + their `visuals.constants.js` wiring should be backported. If no, leave them out.
3. **Confirm Roboto Condensed is genuinely unused on our side** before treating its absence as intentional rather than an accidental drop during the fork.

# Research Comparison: tilburg-woo-ui vs tilburg-woo-ui_acato

A category-by-category comparison of Conduction's fork (`tilburg-woo-ui`, branch `softwarecatalogus-performance`) and Acato's upstream (`tilburg-woo-ui`, branch `main`). Each file below covers one feature area and ends with a per-difference recommendation. Reading order is free — start where the work is.

For just the items requiring a human/business judgment, see **[DECISIONS.md](DECISIONS.md)**.

## Verdict legend

| Tag | Meaning |
|---|---|
| `ours-only` | Feature exists only in our fork — no merge needed; analysis is an inventory + cleanup notes |
| `keep-ours` | Both repos have it, but ours is the version to keep |
| `merge` | Mix of taking parts from Acato and keeping parts of ours; each item has a per-line recommendation |
| `mixed` | Per-item verdicts vary (some keep, some adopt, some need decision) |
| `needs-decision` | One or more items require human/business/coordination judgment |

## Index

| # | Category | Verdict | What you'll find |
|---|---|---|---|
| 1 | [Dependencies & build tooling](analysis-dependencies-build-tooling.md) | `merge` | Core webpack/Babel/SCSS shared; ours adds multi-tenant deployment (Helm, runtime-config, dev Docker). 5 small backports flagged. |
| 2 | [App entry & routing](analysis-app-entry-routing.md) | `needs-decision` | CMS-page-driven routing (Acato) replaced with catch-all (ours) for multi-tenant theming. Sitemap view removed. |
| 3 | [Search system](analysis-search.md) | `keep-ours` | URL-as-source-of-truth (ours) vs store-as-truth (Acato); ours adds facets API, auto-search, per-schema result cards. |
| 4 | [Publication cards](analysis-publication-cards.md) | `keep-ours` | Generic `AcCard` + intro shared; ours adds 6 per-entity card variants. Multi-tenant tokenisation must stay. |
| 5 | [Publication detail](analysis-publication-detail.md) | `keep-ours` | Monolithic (Acato) vs dispatcher + 14 type-specific variants (ours). Adopt Acato's share-modal, "not found" state, attachment search. |
| 6 | [Themes / categories](analysis-themes-categories.md) | `merge` | Acato keeps `categories` and `terms` as separate stores; we merge into themes. Decision needed on whether to split. |
| 7 | [Navigation & menu](analysis-navigation-menu.md) | `keep-ours` | Static constants (Acato) vs backend-driven menu store + auth-gating + templating (ours). Small a11y backport from Acato. |
| 8 | [Atoms](analysis-atoms.md) | `mixed` | 6 shared atoms; per-atom verdicts vary. `ac-grid` should adopt Acato; `ac-card` stays ours (fixes JSX bug). |
| 9 | [Molecules](analysis-molecules.md) | `merge` | 8 shared molecules; mostly keep ours; backport Acato's table wrapper and form-field `checkValidity`. |
| 10 | [API layer](analysis-api.md) | `merge` | Split clients (Acato) vs unified client (ours); ours' interceptor stack stays (auth, cancel, vibrate). |
| 11 | [State management / stores](analysis-stores.md) | `mixed` | Publications store keeps ours (AbortController, fuzzy, schema norm). Categories/terms split is a business call. |
| 12a | [Hooks](analysis-hooks.md) | `merge` | One shared hook; backport Acato's clean `useIsMobile`. |
| 12b | [Utilities — shared](analysis-utilities-shared.md) | `merge` | 15 shared (7 byte-identical); ours' PHP-bracket query syntax is backend-required. Backport Acato's `acMapPublication`. |
| 12c | [Utilities — ours-only](analysis-utilities-ours-only.md) | `ours-only` | 73-file inventory; consolidation candidates flagged, no merge decision needed. |
| 13 | [Styling & design tokens](analysis-styling.md) | `merge` | 44 shared SCSS files; adopt Acato's modernised mixins and 3 small overrides. Tenant tokens stay. |
| 14 | [Authentication](analysis-auth.md) | `ours-only` | Full OAuth + session + role/org/field-level ACL; Acato has zero auth. |
| 15a | [Beheer — core](analysis-beheer-core.md) | `ours-only` | ~25k LoC generic CRUD panel; major internal refactor opportunities flagged. |
| 15b | [Beheer — domains](analysis-beheer-domains.md) | `ours-only` | 8 per-domain pages; 7 are copy-paste candidates for one generic component. |
| 16 | [Chat & GEMMA](analysis-chat-gemma.md) | `ours-only` | Chat is UI scaffold (no LLM wired); GEMMA is full ArchiMate viewer + admin surface. |
| 17 | [Glossary system](analysis-glossary.md) | `ours-only` | 680 LoC: term-fetch warmup + highlight + side drawer. Acato's `terms.store.js` is its ancestor. |
| 18 | [Standards / Standaardversies](analysis-standards.md) | `ours-only` | Compliance table + schema/standard resolvers + resolution hook. Acato has none. |
| 19 | [Public / static files](analysis-public-static.md) | `merge` | `.htaccess` security fixes (Piwik CSP, X-XSS), placeholder hygiene, runtime-config layer is ours-only. |
| 20 | [Assets (fonts, images, locales)](analysis-assets.md) | `keep-ours` | Locales byte-identical; 57 ours-only icons vs 6 WOO-specific in Acato (product-direction call). |
| 21 | [Organism / layout components](analysis-organisms.md) | `merge` | 8 shared organisms; backport `aria-labelledby` on modal, mobile hero, `ac-about` props. |
| 22 | [Home & general public views](analysis-home-views.md) | `mixed` | Home view shares scaffold but diverged; ours adds multi-tenant copy, glossary wrapper, fallback handling. Sitemap view missing from ours. |
| 23 | [Constants & app configuration](analysis-constants-config.md) | `merge` | Several typo fixes, Piwik CSP, faqs import path, hostname-gating in `getTitle`. |
| 24 | [Forms & wizards](analysis-forms-wizards.md) | `ours-only` | 73 files, ~41k LoC: 7 multi-step registration wizards. Internal consolidation flagged. |
| 25 | [Services layer](analysis-services.md) | `ours-only` | 7 files: register/schema caches + hostname helpers. |
| 26 | [User account & Mijn Omgeving](analysis-user-account.md) | `ours-only` | Profile + 4 modals + stub `/mijn-omgeving`. Some files unmounted. |
| 27 | [Error handling & fallbacks](analysis-error-handling.md) | `ours-only` | Fallback page (unmounted), token refresher, error formatter. |
| 28 | [Documentation & dev guides](analysis-documentation.md) | `keep-ours` | Acato: 46-line README; ours: 197 + 39 supplementary docs. Triage of frozen-in-time docs flagged. |
| — | [Security audit](security-audit.md) | reference | Cross-cutting security findings (dompurify, CSP, X-XSS, token handling). |

## How the analyses are structured

Each analysis file follows the template in [CLAUDE.md](../../CLAUDE.md):

1. **Branches Compared** — at the top of every file
2. **Files Compared** — exact file list scoped to that category
3. **What is the same** — byte-identical or semantically equivalent
4. **What differs** — concrete diffs between the two
5. **Only in ours** / **Only in Acato's** — uncontested adds
6. **Recommendation** — per-difference call (take Acato / keep ours / merge / needs decision)

Cross-references between analyses (e.g. auth touching stores) point to the **primary** category for that file — see the table at the end of [file-category-index.md](../../file-category-index.md).

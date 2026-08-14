# Decisions Backlog

Items extracted from the analyses that require a human call — business judgment, cross-team coordination, or a non-obvious technical tradeoff. Pure "keep ours, here's the rationale" items are **not** here; they're in their respective analysis files.

Each item links to its source analysis. Tags help you filter:

- `[product]` — product-direction call (WOO portal vs softwarecatalogus, multi-tenant scope)
- `[backend]` — needs API/backend team coordination
- `[security]` — security or CSP fix
- `[a11y]` — accessibility backport from Acato
- `[api-design]` — component API reconciliation (breaking change implied)
- `[cleanup]` — delete-or-finish call on partially-built/orphaned code

---

## Cross-cutting themes

A few decisions recur across multiple analyses — surface them once here so they get one answer, not five:

1. **Are we still building toward "softwarecatalogus" only, or do we re-converge with Acato's WOO-portal direction?** Affects: WOO doc icons, terms-vs-glossary stores, categories-vs-themes taxonomy, publication-detail copy variants. See: [assets](analysis-assets.md), [stores](analysis-stores.md), [themes](analysis-themes-categories.md).
2. **Does the backend support Acato's flat query shape, or are we locked into `@self.published`-style filters?** Affects: search sort keys, stores, publication query layer. See: [search](analysis-search.md), [stores](analysis-stores.md), [api](analysis-api.md).
3. **Multi-tenant deployment is here to stay — confirm.** Eight active hostnames assumed throughout. If we ever collapse to one, several "keep ours" calls flip. See: [app-entry-routing](analysis-app-entry-routing.md), [styling](analysis-styling.md), [public-static](analysis-public-static.md).

---

## By category

### Dependencies & build tooling — [analysis](analysis-dependencies-build-tooling.md)

- [ ] `[security]` Bump `dompurify` to 3.2.4 — confirmed CVE fix.
- [ ] Adopt Acato's `@babel/plugin-transform-*` plugin names — deprecation cleanup, low risk.
- [ ] Create `.env.example` mirroring Acato's; ours has none.
- [ ] Move off the deprecated `@nl-design-system-community/utrecht` umbrella package to consolidated Utrecht packages.
- [ ] Decide whether to take Acato's webpack-dev-server major-version bump.

### App entry & routing — [analysis](analysis-app-entry-routing.md)

- [ ] `[product]` Restore Acato's CMS-page route loop, or stay on catch-all? Ours is better for TTFB; theirs is more declarative. Tied to OpenCatalogi-managed routing for ABOUT/FAQ/CONTACT — verify that path works end-to-end before deciding.
- [ ] Re-add a dedicated sitemap view (Acato has it; ours dropped it). Detail in [home-views decision](#home--general-public-views--analysis).

### Search — [analysis](analysis-search.md)

- [ ] `[backend]` Sort key semantics: `_created` / `_name` / `_relevance` (ours) vs `@self.published`-style (Acato). Backend convergence call.
- [ ] Date filter UX: adopt Acato's explicit "Apply" button pattern?
- [ ] `[cleanup]` `AcSearchSubjects` appears orphaned in ours — grep before deleting.
- [ ] `[product]` Categories model: backport Acato's richer (WOO-portal) content, or confirm ours (softwarecatalogus) is the destination?

### Publication detail — [analysis](analysis-publication-detail.md)

- [ ] Backport Acato's inline attachment search, pagination math fix, share-modal, and "not found" empty state.
- [ ] Terms/glossary handling — defer to the [glossary decision](#glossary) below.
- [ ] `[cleanup]` Delete unreachable JSX in dispatcher, remove old variant files (`-default-old`, `-default1`), consolidate the two related-tabs implementations.

### Themes / categories — [analysis](analysis-themes-categories.md)

- [ ] `[product]` Acato keeps `categories.store.js` and `terms.store.js` as separate concepts; ours merges them into themes. Is "categories" a separate taxonomy from themes in our product? Business call.
- [ ] Verify Roboto Condensed font removal was intentional (Acato still ships it).

### Atoms — [analysis](analysis-atoms.md)

- [ ] `[api-design]` `ac-grid` — adopt Acato's version (ours has bugs with the CSS-variable approach). Breaking API change, audit callers.
- [ ] `ac-data-list` — adopt Acato's `description` field + wrapper element.
- [ ] `ac-column` — merge: keep our props but adopt Acato's gap vocabulary.

### Molecules — [analysis](analysis-molecules.md)

- [ ] `ac-table` — adopt `utrecht-table-container` wrapper; both repos have a row-key bug to fix.
- [ ] `ac-form-field` — keep our extended inputs; backport Acato's `checkValidity` flow.
- [ ] `ac-checkbox` — backport Acato's `BadgeCounter` count behaviour (decide on UX).
- [ ] `ac-link` — decide whether button-style secondary-action usage from Acato fits ours.

### Organisms — [analysis](analysis-organisms.md)

- [ ] `[a11y]` `ac-modal` — backport `aria-labelledby`; fix `onClose` not firing on backdrop click.
- [ ] `ac-hero` — refactor base64 image inlining; merge multi-tenant hostname logic with Acato's mobile responsive block.
- [ ] `ac-about` — adopt Acato's `list` prop + `blue` modifier.
- [ ] `ac-sections-handler` — decide on adopting Acato's `CategoryBlock`.

### Home & general public views — [analysis](analysis-home-views.md)

- [ ] `[product]` Re-add a "latest publications" block on the home page (Acato has one; ours dropped it). Data layer already supports it (`publications.fetchLatestPublications`) — only the JSX block was removed. Product / design call.
- [ ] `[product]` Adopt Acato's `/sitemap` view + route? Cheap to add and an a11y/SEO win, but only worth doing if the portal needs a public sitemap. If adopted, also: rename inner component (`AcSearch` → `AcSitemap` — copy-paste leftover in Acato's file), add list `key` props, decide whether sitemap respects auth-filtering (`getFilteredPages`) so beheer/mijn-omgeving routes aren't advertised publicly, and verify iteration ignores `VNG_ROUTES_*` skin variants.
- [ ] `[cleanup]` Fix `slug: '/home'` vs `slug: 'home'` inconsistency between `fetchPage` and `fetchPages` fallbacks in `pages.store.js` — pick one canonical form.
- [ ] `[backend]` `pages.store.js` fallback layer papers over backend returning HTML for JSON endpoints — track as tech debt; ideally the backend stops doing this rather than carrying permanent fallback data.

### API layer — [analysis](analysis-api.md)

- [ ] `[backend]` Single shared Client (ours) vs Acato's split `PublicationsClient`/`ThemesClient` — depends on whether backend topology stays unified. Coordinate with backend team.

### Stores — [analysis](analysis-stores.md)

- [ ] `[backend]` Query shape convergence (`@self.published` vs flat) — needs API team decision; cascades through publications/themes/search.
- [ ] `[product]` `categories.store.js` (Acato) — see themes decision above.
- [ ] `[product]` `terms.store.js` (Acato) vs `glossary.store.js` (ours) — see glossary decision below.

### Hooks — [analysis](analysis-hooks.md)

- [ ] Backport Acato's `useIsMobile` (move it from `utilities/` to `hooks/`). Audit our existing scroll/resize debouncing for overlap with `use-window-size` and `use-debounce-hook`.

### Utilities (shared) — [analysis](analysis-utilities-shared.md)

- [ ] Adopt Acato's cleaner `ac-validate-date` regex (trivial).
- [ ] Backport Acato's `ac-map-publication` — first verify our stores don't already alias the Dutch keys.

### Styling — [analysis](analysis-styling.md)

- [ ] `[a11y]` Adopt Acato's `_container.scss` skip-link pattern.
- [ ] Adopt Acato's modernised mixins (drop legacy `-webkit-`/`-ms-` prefixes).
- [ ] Adopt Acato's three small component overrides (`_utrecht-button.scss`, `_utrecht-form-field.scss`, `_utrecht-text-sizes.scss`) — verify no conflict with our tenant tokens.
- [ ] Decide font-stack pruning (Montserrat / Avenir still listed), container widths, `_page.scss` cleanup.

### Public & static — [analysis](analysis-public-static.md)

- [ ] `[security]` Fix `script-src` CSP to allow Piwik (currently allows Siteimprove instead — Piwik is blocked).
- [ ] `[security]` Take Acato's `X-XSS-Protection: 0` header (modern security guidance).
- [ ] `[cleanup]` Decide on unreferenced placeholder images (4 in `public/`): delete or restore usage.
- [ ] `[product]` Wire up VNG favicon swapping per tenant, or delete the asset.
- [ ] Add Acato's `placeholder.png` for mock-themes fallback.

### Constants & config — [analysis](analysis-constants-config.md)

- [ ] `[security]` Fix `script-src` CSP to allow Piwik (duplicate with public-static — single fix).
- [ ] Fix typo: `contact@acato.nl.nl` → `contact@acato.nl`.
- [ ] Verify breadcrumbs `SEARCH(label)` href removal was intentional.
- [ ] Decide `SEARCH_RESULTS_LOADED` constant typo fix.
- [ ] Move the duplicated `getTitle` hostname switch into a shared service (also in [documentation analysis](analysis-documentation.md)).
- [ ] `faqs` import path: keep our direct path vs Acato's `@constants` barrel. Cosmetic.

### Assets — [analysis](analysis-assets.md)

- [ ] `[a11y]` Backport `<title>` accessibility text on Acato's external-link icons.
- [ ] `[product]` Do we support WOO publication-disclosure use cases? Affects whether we adopt Acato's 6 WOO-specific icons (`bereikbaarheidsgegevens`, `bestuursstuk`, `convenant`, `organisatie`, `raadsstuk`, `woo-verzoek`).
- [ ] Verify Roboto Condensed font is unused in ours (Acato ships it).

### Documentation — [analysis](analysis-documentation.md)

- [ ] Backport Acato's tighter opening README paragraph.
- [ ] `[cleanup]` Audit "frozen-in-time" docs: `AUTHENTICATION-STATUS.md`, `RUNTIME-CONFIG-FIX.md`, `REBUILD-INSTRUCTIONS.md` — still accurate?
- [ ] Triage root-level system docs: move into `docs/`, keep only README + README.docker + developer.md at root.

### Auth — *(ours-only, no merge decisions)*
### Beheer — *(ours-only, no merge decisions; internal refactors flagged in analysis)*
### Chat & GEMMA <a id="chat-gemma"></a>

- [ ] `[cleanup]` Wire chat to a real LLM backend, or delete the placeholder integration. Currently it's a UI scaffold with no end-to-end functionality.

### Glossary <a id="glossary"></a>

- [ ] `[product]` Decide relationship between our `glossary.store.js` (full highlight + drawer system) and Acato's simpler `terms.store.js`. Are we keeping the glossary feature long-term? Hooks into terms-vs-glossary decisions in stores and publication-detail analyses.

### User account — *(ours-only)*

- [ ] `[cleanup]` `AcMyAccount` view is unmounted. Wire it up or delete it.
- [ ] `[cleanup]` Finish or delete the `/mijn-omgeving` stub route.

### Error handling — *(ours-only)*

- [ ] `[cleanup]` Wire fallback error page to a React `ErrorBoundary` or delete the file.
- [ ] Decide Rollbar wiring scope.

### Standards — *(ours-only)*

- [ ] `[cleanup]` Delete `ConStandardsResolver` if confirmed unused.

### Forms & wizards — *(ours-only)*

- [ ] `[cleanup]` Migrate older wizards to the `useStepper` hook so all flows share one stepper implementation.
- [ ] `[cleanup]` Consolidate koppeling/dienst duplication between `gebruik-*` and root `ac-forms-*` directories.

---

## Suggested next step

Read this list, mark a verdict per item (you/team), then we can group the green-lit ones into PR-sized batches and start executing.

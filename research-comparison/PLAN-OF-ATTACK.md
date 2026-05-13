# Plan of Attack: Reconciling tilburg-woo-ui with Acato upstream

**Audience:** Project owner / steering. Sequence-over-dates roadmap based on the 30-category analysis in this folder.

**Inputs:** [README.md](README.md) (verdict per category), [DECISIONS.md](DECISIONS.md) (items needing a human call), [CLAUDE.md](../../CLAUDE.md) (scope and rules of the research phase).

**Premise:** Both repos share a common ancestor; ours has grown into a full CMS + portal while Acato has stayed a lightweight public WOO viewer. The goal of this plan is not to "re-merge" the two repos — they have diverged on purpose. The goal is to:

1. Adopt the genuinely useful improvements Acato has made downstream of the fork point.
2. Resolve a handful of strategic questions that have been deferred during the research phase.
3. Pay down internal tech debt that the research surfaced.
4. Put a cadence in place so we don't have to do this all over again in 12 months.

---

## At a glance — phase summary

| Phase | Name | Goal | Blocks what? | Parallel-safe? |
|---|---|---|---|---|
| **0** | Security & low-risk housekeeping | Clear the P0 backlog: dompurify CVE, CSP fix, a11y backports, typos | Nothing | ✅ Starts immediately |
| **1** | Strategic decision gates | Get stakeholder answers on 3 cross-cutting questions | Phases 3 & 4 | Runs alongside Phase 0 |
| **2** | Quick-win Acato adoptions | Small, low-risk backports from Acato | Nothing | ✅ Starts after Phase 0 |
| **3** | Major reconciliations | The bigger merges (component API changes, multi-tenant hero, etc.) | — | Partially blocked by Phase 1 |
| **4** | Strategic execution | Implement what Phase 1 decided (taxonomy split, glossary fate, etc.) | — | Blocked by Phase 1 |
| **5** | Internal cleanup | Pay down ours-only tech debt (beheer dedup, orphan files, doc triage) | Nothing | ✅ Fully parallel |
| **6** | Continuous reconciliation | Cadence to re-check Acato's main branch | — | Ongoing |

---

## Phase 0 — Security & low-risk housekeeping (P0)

**Goal:** Clear the security/compliance backlog and ship the trivially-safe backports while the bigger decisions are still being negotiated.

**Why this phase is first:** No decision-gate required, all items are well-bounded, and most are visible-to-auditors.

| Item | Source | Type |
|---|---|---|
| Bump `dompurify` to 3.2.4 (CVE fix) | [dependencies](analysis-dependencies-build-tooling.md) | security |
| Fix `script-src` CSP to allow Piwik (currently blocked; allows Siteimprove instead) | [public-static](analysis-public-static.md), [constants](analysis-constants-config.md) | security |
| Adopt Acato's `X-XSS-Protection: 0` header | [public-static](analysis-public-static.md) | security |
| Backport `<title>` accessibility text on external-link icons | [assets](analysis-assets.md) | a11y |
| Backport `aria-labelledby` on `ac-modal` and `ac-drawer` | [organisms](analysis-organisms.md), [navigation](analysis-navigation-menu.md) | a11y |
| Adopt Acato's `_container.scss` skip-link pattern | [styling](analysis-styling.md) | a11y |
| Rename deprecated `@babel/plugin-transform-*` plugins | [dependencies](analysis-dependencies-build-tooling.md) | cleanup |
| Fix `contact@acato.nl.nl` typo | [constants](analysis-constants-config.md) | cleanup |

**Done when:** All items merged to `softwarecatalogus-performance`. Security audit re-runs clean.

**Risk:** Tiny. CSP change needs a smoke-test on each tenant hostname to confirm Piwik fires.

---

## Phase 1 — Strategic decision gates

**Goal:** Get explicit stakeholder answers on the three cross-cutting questions that have been deferred throughout the research phase. **No code work in this phase — it's meetings and a written sign-off.**

**Why now:** Phases 3 and 4 cannot be planned in detail without these answers. Every week these slip, planning downstream slips.

### Decision 1 — Product direction

> **Are we still building toward a softwarecatalogus (software-catalogue) product, or do we want to re-converge with Acato's WOO-portal direction?**

This single answer cascades into:

- Whether to adopt Acato's 6 WOO-specific document icons ([assets](analysis-assets.md))
- Whether to split categories from themes as Acato does ([themes](analysis-themes-categories.md), [stores](analysis-stores.md))
- Whether to keep our glossary, or revert to Acato's lighter terms-store ([glossary](analysis-glossary.md), [stores](analysis-stores.md))
- Whether richer publication-detail copy variants are warranted ([publication-detail](analysis-publication-detail.md))
- Hostname-gated UI in Intro/Themes ([organisms](analysis-organisms.md))

### Decision 2 — Backend query shape

> **Does the backend support Acato's flat query shape, or are we locked into the `@self.published`-style filters we use today?**

This requires a conversation with the API team. It affects:

- Sort key semantics in search ([search](analysis-search.md))
- Publications store query construction ([stores](analysis-stores.md))
- Whether ours' unified Client or Acato's split per-resource Clients is the right shape ([api](analysis-api.md))

### Decision 3 — Multi-tenant confirmation

> **Are we committed to the eight-tenant deployment model long-term?**

If yes, several "keep ours" calls in the analyses are confirmed correct (tenant tokens, runtime-config, hostname switches, theming logic). If no, several files become deletable.

**Done when:** Each decision has a written answer in `DECISIONS.md` (or a stakeholder doc) with date and decision-maker.

**Risk:** Decisions may surface that the answer is "we don't know yet" — in which case Phase 4 plans defensively (build the seam, don't commit the model).

---

## Phase 2 — Quick-win Acato adoptions

**Goal:** Ship the small, low-risk, no-decision-needed backports.

**Starts after:** Phase 0 (just to avoid stomping each other's PRs).

**Parallel-safe:** Yes — each item is roughly one PR.

| Item | Source | Notes |
|---|---|---|
| Adopt cleaner `ac-validate-date` regex | [utilities-shared](analysis-utilities-shared.md) | Trivial. |
| Backport `ac-map-publication` helper | [utilities-shared](analysis-utilities-shared.md) | First verify our stores don't already alias Dutch keys. |
| Backport `useIsMobile` (move from `utilities/` to `hooks/`) | [hooks](analysis-hooks.md) | Audit overlap with `use-window-size` and `use-debounce-hook`. |
| Adopt `ac-about`'s `list` prop + `blue` modifier | [organisms](analysis-organisms.md) | |
| Adopt `ac-data-list`'s `description` field + wrapper element | [atoms](analysis-atoms.md) | |
| Adopt `utrecht-table-container` wrapper for `ac-table` | [atoms](analysis-atoms.md), [molecules](analysis-molecules.md) | Same change in both layers. |
| Backport `ac-form-field`'s `checkValidity` flow | [molecules](analysis-molecules.md) | Keep our extended inputs. |
| Adopt Acato's modernised SCSS mixins | [styling](analysis-styling.md) | Drop legacy `-webkit-`/`-ms-` prefixes. |
| Adopt Acato's three small Utrecht component overrides | [styling](analysis-styling.md) | `_utrecht-button`, `_utrecht-form-field`, `_utrecht-text-sizes`. Verify no tenant-token conflict. |
| Add Acato's `placeholder.png` for mock-themes fallback | [public-static](analysis-public-static.md) | |
| Create `.env.example` | [dependencies](analysis-dependencies-build-tooling.md) | |
| Move off deprecated `@nl-design-system-community/utrecht` umbrella | [dependencies](analysis-dependencies-build-tooling.md) | Consolidated Utrecht packages. |

**Done when:** Each item merged. No regressions on smoke-test pass.

**Risk:** Low. The form-field and table changes can interact with our admin-panel inputs — extra QA on Beheer flows.

---

## Phase 3 — Major reconciliations

**Goal:** The bigger Acato adoptions where there's real merge complexity, breaking changes, or interaction with multi-tenant code.

**Some items depend on Phase 1.** Marked below.

| Item | Source | Depends on | Notes |
|---|---|---|---|
| Adopt Acato's `ac-grid` (drop ours' CSS-var approach) | [atoms](analysis-atoms.md) | — | Breaking API change. Audit all callers across the app. |
| Refactor `ac-hero` base64 image inlining + adopt Acato's mobile responsive block | [organisms](analysis-organisms.md) | Phase 1 D3 | Multi-tenant hostname logic must survive. |
| Backport publication-detail share-modal, "not found" state, attachment search, pagination fix | [publication-detail](analysis-publication-detail.md) | — | Several small pieces; can split across PRs. |
| Fix `ac-modal` `onClose` not firing on backdrop click | [organisms](analysis-organisms.md) | — | Both repos affected. |
| Fix row-key bug in `ac-table` | [atoms](analysis-atoms.md), [molecules](analysis-molecules.md) | — | Both repos affected. |
| Adopt Acato's date-filter "Apply" UX | [search](analysis-search.md) | — | UX call — confirm with design. |
| Decide unified-vs-split API client | [api](analysis-api.md) | Phase 1 D2 | If backend stays unified, keep ours. |
| Decide CMS-page-driven routing vs catch-all | [app-entry-routing](analysis-app-entry-routing.md) | Phase 1 D3 | Restore Acato's pattern, or stay. Tied to OpenCatalogi-managed routing. |
| Re-add a dedicated sitemap view | [app-entry-routing](analysis-app-entry-routing.md) | — | Acato has one; ours dropped it. |

**Done when:** Each merged with caller-audit + QA on the affected screens (admin, public portal, search).

**Risk:** Highest in the plan. `ac-grid` is a breaking component-API change — needs a full app sweep. Publication-detail backports interact with our 14 type-specific variants — careful regression testing required.

---

## Phase 4 — Execute strategic decisions

**Goal:** Implement whatever Phase 1 decided.

**Blocked by:** Phase 1 written sign-offs.

Three scenario trees, depending on Phase 1 outcomes:

### 4a — If product = "stay softwarecatalogus"
- Confirm WOO icons are not adopted; document the call.
- Confirm categories/themes stay merged; close that decision.
- Confirm glossary stays; clean up dead Acato `terms.store.js` references in our notes.

### 4b — If product = "re-converge with WOO portal"
- Adopt Acato's 6 WOO-specific icons.
- Split `categories.store.js` and `terms.store.js` back out from our themes store.
- Reduce/retire glossary system; migrate consumers to the terms store.
- Adopt richer publication-detail copy variants from Acato.

### 4c — If product = "hybrid / both"
- Build a tenant-or-feature-flagged seam. Most expensive option.

### Backend query shape — D2 follow-up
- **If "flat query shape supported":** migrate publications store, search sort keys, and consider splitting the API Client.
- **If "stuck with `@self.published`":** document the divergence; flag for Acato that a query-layer adapter is needed if they want to use any of our backend.

### Multi-tenant — D3 follow-up
- **If confirmed:** finalize VNG favicon swapping (or delete unreferenced asset), retain tenant token files, keep hostname switches.
- **If walking away:** schedule deletion of tenant SCSS files (`_tokens-dimpact`, `_tokens-horst-aan-de-maas`, `_tokens-logo`, `_tokens-migrato`, `_tokens-opencatalogi`, `_tokens-venray`, `_tokens-vng`).

**Done when:** Code reflects the decision and remaining decision items in `DECISIONS.md` are closed out.

**Risk:** Scope blow-up if 4b or 4c is chosen. Treat each subtask as its own mini-plan.

---

## Phase 5 — Internal cleanup (ours-only tech debt)

**Goal:** Pay down debt the research surfaced inside our own code. **Fully parallel** to Phases 1–4 — give it to whoever has bandwidth.

Grouped by category:

### Component / view dedup
- Collapse 7 beheer per-domain detail pages into a generic `ConDomainDetailsPage`. [beheer-domains](analysis-beheer-domains.md)
- Split `object.store.js` into smaller stores; unify icon-mapping helper. [beheer-core](analysis-beheer-core.md)
- Migrate older wizards to `useStepper`; consolidate koppeling/dienst duplication. [forms-wizards](analysis-forms-wizards.md)
- Delete `ConStandardsResolver` (unused), `AcSearchSubjects` (orphan candidate). [standards](analysis-standards.md), [search](analysis-search.md)
- Remove `-default-old` / `-default1` legacy variants; consolidate `con-related-tabs` and `con-related-tabs-new`. [publication-detail](analysis-publication-detail.md)
- Consolidate parallel hostname switches into the services layer. [services](analysis-services.md), [constants](analysis-constants-config.md), [documentation](analysis-documentation.md)
- Move hooks that live in `utilities/` into `hooks/`. [utilities-ours-only](analysis-utilities-ours-only.md)

### "Decide-or-delete" partially-built features
Each of these needs an owner-call. Wire it up or remove it — don't leave it in limbo.

| Surface | Question | Source |
|---|---|---|
| `ac-chat` | Wire to a real LLM backend, or delete? | [chat-gemma](analysis-chat-gemma.md) |
| `ac-fallback-error-page` (unmounted) | Wire to a React `ErrorBoundary`, or delete? | [error-handling](analysis-error-handling.md) |
| `ac-my-account` view (unmounted) | Wire up or delete? | [user-account](analysis-user-account.md) |
| `/mijn-omgeving` (stub route) | Finish or remove? | [user-account](analysis-user-account.md) |
| `con-register-resolver`, `con-logo-preview` | Categorise correctly, or remove if dead | [auth](analysis-auth.md) |
| Rollbar wiring | Confirm scope (which env, which errors) | [error-handling](analysis-error-handling.md) |
| VNG favicon | Wire tenant swapping, or delete | [public-static](analysis-public-static.md) |
| 4 unreferenced placeholder images | Restore use, or delete | [public-static](analysis-public-static.md) |

### Documentation triage
- Audit "frozen-in-time" docs for accuracy: `AUTHENTICATION-STATUS.md`, `RUNTIME-CONFIG-FIX.md`, `REBUILD-INSTRUCTIONS.md`. [documentation](analysis-documentation.md)
- Move root-level system docs into `docs/`. Keep only `README.md`, `README.docker.md`, `developer.md` at the root.
- Backport Acato's tighter opening README paragraph.

**Done when:** No remaining "decide-or-delete" items. Beheer + forms refactors merged. Docs reorganised.

**Risk:** Beheer-domains refactor is the largest single piece (~25k LoC area). Scope it as its own mini-plan.

---

## Phase 6 — Continuous reconciliation

**Goal:** Don't let the two repos drift this far apart again.

- Subscribe to Acato's `main` branch (RSS / GitHub watch / equivalent).
- Set a quarterly review: pull a fresh `git log` from Acato; assess for backport-worthy changes; update the analyses in this folder.
- Re-run the security audit yearly at minimum.
- Treat this `research-comparison/` folder as a living artefact, not a one-shot.

**Risk:** If skipped, in 12 months we redo this entire exercise.

---

## Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Phase 1 decisions stall | Medium | High — blocks Phases 3 & 4 | Owner-assigned in Phase 1; meeting on the calendar before Phase 0 ships |
| `ac-grid` breaking-change sweep finds non-trivial callers | Medium | Medium | Audit callers as the first step of that PR; feature-flag if needed |
| Backend cannot adopt the query shape we'd prefer | Medium | Medium | Decision 2 surfaces this early; defensive plan in 4b |
| Beheer-domains refactor balloons | Medium | Medium | Treat as its own mini-plan with a separate scope doc |
| Acato keeps adding changes during our work | High | Low–Medium | Phase 6 cadence is the long-term answer; in the short term, re-sync the analyses before Phase 3 starts |
| Multi-tenant assumption is questioned mid-flight | Low | High | Decision 3 makes this an explicit upfront answer, not a discovered surprise |
| "Decide-or-delete" items become permanent zombies | Medium | Low | Phase 5 has named owners per item; no defaults to "leave it" |

---

## What to ask the boss

If they want to push back on this plan, the questions worth asking are:

1. **Who owns each of the three Phase 1 decisions?** (Product/Engineering split — naming the decision-maker is the most important PM step here.)
2. **What's the cadence appetite?** Continuous (Phase 6 from day one) or one-shot push and re-evaluate later?
3. **Risk tolerance on the `ac-grid` change?** Breaking-change appetite shapes whether Phase 3 needs feature flags.
4. **Capacity assumption?** Plan assumes flexible parallelism; if it's solo, Phase 5 starts after Phase 4 instead of alongside it.

---

## Where to drill in next

- For a per-category verdict: [README.md](README.md)
- For the specific judgment calls owed by stakeholders: [DECISIONS.md](DECISIONS.md)
- For any individual category's evidence: `analysis-<category>.md`

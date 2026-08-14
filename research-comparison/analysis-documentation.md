# Analysis: Documentation & dev guides

## Branches Compared
- Ours (tilburg-woo-ui): `softwarecatalogus-performance`
- Acato (tilburg-woo-ui_acato): `main`

## Files Compared

### Ours (39 markdown/mdc files + 1 IDE config)

**Root-level operational/dev guides:**
- [README.md](../README.md)
- [README.docker.md](../README.docker.md)
- [developer.md](../developer.md)
- [DOCKER-TROUBLESHOOTING.md](../DOCKER-TROUBLESHOOTING.md)
- [ENVIRONMENT-CONFIG.md](../ENVIRONMENT-CONFIG.md)
- [REBUILD-INSTRUCTIONS.md](../REBUILD-INSTRUCTIONS.md)
- [RUNTIME-CONFIG-FIX.md](../RUNTIME-CONFIG-FIX.md)
- [CACHE-BUSTING-GUIDE.md](../CACHE-BUSTING-GUIDE.md)

**Root-level feature/system docs:**
- [AUTHENTICATION-STATUS.md](../AUTHENTICATION-STATUS.md)
- [AUTHENTICATION-SYSTEM.md](../AUTHENTICATION-SYSTEM.md)
- [BACKEND-REQUIREMENTS-EXTENDS.md](../BACKEND-REQUIREMENTS-EXTENDS.md)
- [TEMPLATE-VARIABLES.md](../TEMPLATE-VARIABLES.md)
- [STANDAARDVERSIES-EDIT-BUG.md](../STANDAARDVERSIES-EDIT-BUG.md)
- [@rules.md](../@rules.md)

**`docs/` system documentation:**
- [docs/CHANGELOG-ROUTING.md](../docs/CHANGELOG-ROUTING.md)
- [docs/CHAT-SYSTEM.md](../docs/CHAT-SYSTEM.md)
- [docs/FACETS-FILTER-SYSTEM.md](../docs/FACETS-FILTER-SYSTEM.md)
- [docs/FORMS-SYSTEM.md](../docs/FORMS-SYSTEM.md)
- [docs/KNOWN_WCAG_ISSUES.md](../docs/KNOWN_WCAG_ISSUES.md)
- [docs/MENU-SYSTEM.md](../docs/MENU-SYSTEM.md)
- [docs/MODAL-SYSTEM.md](../docs/MODAL-SYSTEM.md)
- [docs/NAMES-CACHE-SYSTEM.md](../docs/NAMES-CACHE-SYSTEM.md)
- [docs/ROUTING-SYSTEM.md](../docs/ROUTING-SYSTEM.md)

**Helm/deployment:**
- [helm/DEPLOYMENT.md](../helm/DEPLOYMENT.md)
- [helm/tilburg-woo-ui/README.md](../helm/tilburg-woo-ui/README.md)

**AI agent / editor instructions:**
- [.github/copilot-instructions.md](../.github/copilot-instructions.md)
- [.cursor/commands/beheer.md](../.cursor/commands/beheer.md) *(empty — 0 bytes)*
- [.cursor/rules/no-console-and-eslint-disable.mdc](../.cursor/rules/no-console-and-eslint-disable.mdc)
- [.cursor/rules/project-rules.mdc](../.cursor/rules/project-rules.mdc)
- [.cursor/rules/rules.mdc](../.cursor/rules/rules.mdc)
- [.cursor/rules/update-existing-documentation.mdc](../.cursor/rules/update-existing-documentation.mdc)
- [.vscode/settings.json](../.vscode/settings.json)

**Beheer component READMEs (co-located with code):**
- [src/views/ac-beheer/README-Beheer.md](../src/views/ac-beheer/README-Beheer.md)
- [src/views/ac-beheer/README-Generic-Beheer.md](../src/views/ac-beheer/README-Generic-Beheer.md)
- [src/views/ac-beheer/README-Generic-Details-Page.md](../src/views/ac-beheer/README-Generic-Details-Page.md)
- [src/views/ac-beheer/core/hooks/README-Related-Create-Actions.md](../src/views/ac-beheer/core/hooks/README-Related-Create-Actions.md)
- [src/views/ac-beheer/core/modals/ac-generic-beheer-delete-modal/README-generic-delete-modal.md](../src/views/ac-beheer/core/modals/ac-generic-beheer-delete-modal/README-generic-delete-modal.md)
- [src/views/ac-beheer/core/modals/ac-generic-beheer-publish-depublish-modal/README-generic-publish-depublish-modal.md](../src/views/ac-beheer/core/modals/ac-generic-beheer-publish-depublish-modal/README-generic-publish-depublish-modal.md)
- [src/views/ac-beheer/core/modals/con-generic-form-modal/README-Generic-Form-Modal.md](../src/views/ac-beheer/core/modals/con-generic-form-modal/README-Generic-Form-Modal.md)

### Acato (1 file)
- `README.md` (46 lines)

## What is the same

Only the **file name** `README.md` exists in both repos. The contents are completely different — see _What differs_ below. No other documentation file in either repo has a counterpart.

## What differs

### `README.md` — same path, fully diverged

**Acato's README (46 lines)** is the original lightweight portal description:
- Single-paragraph mission statement (public WOO portal for Municipality of Tilburg, NLDS components, data from Conduction's opencatalogi)
- TOC: Prerequisites → Installation → Scripts → Deployments
- Installation explicitly references **`.env.example`** ("Copy and fill these to an `.env` file")
- Deployments section is **not filled in** (empty)
- No architecture, feature, or developer-onboarding content

**Our README (197 lines)** is a full developer-onboarding document:
- Same opening sections, but TOC also includes Architecture and Documentation
- Title changed to "Tilburg WOO UI" (heading style differs from Acato's "Open Tilburg" single-paragraph form)
- New **Architecture** section: tech stack, key features (multi-tenant theming, forms, auth, i18n, responsive), forms namespace catalogue, component-architecture tree
- New **Deployments** section actually filled in: dev / staging / production hosting on ACATO-prod-4 / ACATO-prod-6 via Bitbucket Pipelines
- New **Documentation** section: links to ROUTING-SYSTEM, MENU-SYSTEM, AUTHENTICATION-SYSTEM, AUTHENTICATION-STATUS plus beheer component READMEs
- New **Development Guidelines** subsection: SCSS / NLDS / MobX / `con-`/`ac-` prefix rules / path aliases
- New ~80-line **"Developing on docker"** section: Run-On-Save extension setup for VS Code and Cursor, container targeting, HMR trick, destructive-sync warning, PowerShell command example
- **Does not mention `.env.example`** — that file does not exist in our repo (we generate configuration at runtime via `runtime-config.js`; see [RUNTIME-CONFIG-FIX.md](../RUNTIME-CONFIG-FIX.md))

The two READMEs are not mergeable line-by-line; ours has fully replaced Acato's.

## Only in ours

Every other documentation artefact is ours-only. Grouped by purpose:

### A. Docker / deployment / runtime config (operational)
- **[README.docker.md](../README.docker.md)** (130 lines) — Local Docker setup, prod vs. watch vs. hot-reload modes, port mapping, build commands. Points readers to `developer.md` for fuller instructions.
- **[developer.md](../developer.md)** (884 lines) — Comprehensive developer guide: dual-proxy architecture, env var reference, debugging, build profiles. The single most detailed dev-onboarding document.
- **[DOCKER-TROUBLESHOOTING.md](../DOCKER-TROUBLESHOOTING.md)** (145 lines) — Recipes for module-resolution failures, container resets, stale watcher state.
- **[ENVIRONMENT-CONFIG.md](../ENVIRONMENT-CONFIG.md)** (1164 lines) — Reference for the environment-variable-driven configuration system (replaces legacy hostname-based config). Includes mermaid diagrams.
- **[REBUILD-INSTRUCTIONS.md](../REBUILD-INSTRUCTIONS.md)** (134 lines) — Step-by-step rebuild guide for runtime-config changes. Focused on `container.constants.js` generation flow.
- **[RUNTIME-CONFIG-FIX.md](../RUNTIME-CONFIG-FIX.md)** (167 lines) — Post-mortem / fix record describing why `runtime-config.js` and `container.constants.js` were not integrated, and the migration done. **Historical** — describes a fix that has already landed.
- **[CACHE-BUSTING-GUIDE.md](../CACHE-BUSTING-GUIDE.md)** (189 lines) — Build-version injection, service worker invalidation, GitHub Actions integration, nginx config snippets.

### B. Helm / Kubernetes
- **[helm/DEPLOYMENT.md](../helm/DEPLOYMENT.md)** (82 lines) — ArgoCD parameters, external vs. internal Nextcloud backend wiring.
- **[helm/tilburg-woo-ui/README.md](../helm/tilburg-woo-ui/README.md)** (258 lines) — Helm chart reference (install, values, prerequisites, container registry `ghcr.io/conductionnl/tilburg-woo-ui`).

### C. Authentication
- **[AUTHENTICATION-SYSTEM.md](../AUTHENTICATION-SYSTEM.md)** (264 lines) — Architecture document: session + OAuth dual auth, UserStore / AuthStore split, protected routes, header integration, login flow.
- **[AUTHENTICATION-STATUS.md](../AUTHENTICATION-STATUS.md)** (116 lines) — **Status snapshot** of the Basic Auth fallback implementation for cross-domain cookie issues. Describes "current working solution" — frozen in time and may already be stale.

### D. Feature-system documentation (`docs/`)
All Dutch + English mix, mostly comprehensive (with mermaid diagrams):
- **[docs/ROUTING-SYSTEM.md](../docs/ROUTING-SYSTEM.md)** (312 lines) — React Router config, PATHS constants, dynamic CMS routes, protected routes.
- **[docs/MENU-SYSTEM.md](../docs/MENU-SYSTEM.md)** (213 lines) — Dynamic menu API contract, menu positions, header/secondary nav.
- **[docs/MODAL-SYSTEM.md](../docs/MODAL-SYSTEM.md)** (495 lines) — Generic beheer modal architecture (delete / publish / form), workflow diagrams, used-by checks.
- **[docs/FORMS-SYSTEM.md](../docs/FORMS-SYSTEM.md)** (641 lines) — `/forms/*` namespace, form types (register / gebruik / product / koppeling), per-type API endpoint, stage breakdowns.
- **[docs/FACETS-FILTER-SYSTEM.md](../docs/FACETS-FILTER-SYSTEM.md)** (267 lines) — Facet-driven filtering, API-driven config, UUID→name resolution with cache.
- **[docs/NAMES-CACHE-SYSTEM.md](../docs/NAMES-CACHE-SYSTEM.md)** (818 lines) — UUID-to-name cache architecture, bulk POST endpoint, multi-layer cache.
- **[docs/CHAT-SYSTEM.md](../docs/CHAT-SYSTEM.md)** (346 lines) — Chat-with-data LLM feature, feature toggle via `CHAT_ENDPOINT` env var, chat store observables.
- **[docs/CHANGELOG-ROUTING.md](../docs/CHANGELOG-ROUTING.md)** (101 lines) — **Single dated entry (2025-01-19)** describing the `/forms` namespace introduction. Not a maintained changelog — one-shot release note.
- **[docs/KNOWN_WCAG_ISSUES.md](../docs/KNOWN_WCAG_ISSUES.md)** (186 lines) — Dutch-language WCAG accessibility audit notes (Siteimprove findings, level A/AA/AAA categorisation, developer commentary by `@sudothijn`).

### E. Project rules / backend coordination
- **[@rules.md](../@rules.md)** (78 lines) — `_source=database` vs `_source=index` API parameter rules. Also referenced/embedded from `.cursor/rules`. The `@`-prefixed filename is unusual and may exist to make it sort to the top of file listings.
- **[BACKEND-REQUIREMENTS-EXTENDS.md](../BACKEND-REQUIREMENTS-EXTENDS.md)** (246 lines) — **Spec for backend work**: requirements on `_extend[]` parameter behaviour for the Applicatie-aanmelden wizard. Forward-looking — describes what the backend should do, not finished docs.
- **[TEMPLATE-VARIABLES.md](../TEMPLATE-VARIABLES.md)** (286 lines) — `{{ user.displayName }}` template-variable system reference (variables, syntax, usage in menus / rich text / components).
- **[STANDAARDVERSIES-EDIT-BUG.md](../STANDAARDVERSIES-EDIT-BUG.md)** (149 lines) — **Bug investigation note** with code citations of a specific useEffect issue in `ac-forms-applicatie.js`. Likely already fixed — historical artefact.

### F. AI / editor instructions
- **[.github/copilot-instructions.md](../.github/copilot-instructions.md)** (45 lines) — Compact AI-agent briefing covering project entry points, conventions, pitfalls.
- **[.cursor/rules/project-rules.mdc](../.cursor/rules/project-rules.mdc)** (49 lines, `alwaysApply: true`) — Cursor rule with project-specific conventions (Dutch-for-content, `ac-`/`con-` prefixes, atomic design, MobX usage).
- **[.cursor/rules/no-console-and-eslint-disable.mdc](../.cursor/rules/no-console-and-eslint-disable.mdc)** (23 lines, `alwaysApply: true`) — Forbids `eslint-disable` / `@ts-ignore`; allows `console.log` during debugging only.
- **[.cursor/rules/update-existing-documentation.mdc](../.cursor/rules/update-existing-documentation.mdc)** (4 lines, `alwaysApply: true`) — Requires that doc files / JSDoc be updated when behaviour changes.
- **[.cursor/rules/rules.mdc](../.cursor/rules/rules.mdc)** (8 lines, `alwaysApply: false`) — useEffect infinite-loop guidance.
- **[.cursor/commands/beheer.md](../.cursor/commands/beheer.md)** — **0 bytes (empty file)**. Either a leftover placeholder or never written.
- **[.vscode/settings.json](../.vscode/settings.json)** — Editor + Run-On-Save extension config that touches files inside `tilburg-woo-ui-hot` container to trigger HMR.

### G. Beheer component-level READMEs
Co-located with code in `src/views/ac-beheer/`:
- **[README-Beheer.md](../src/views/ac-beheer/README-Beheer.md)** (99 lines) — Folder structure overview (core / domains / shared layout).
- **[README-Generic-Beheer.md](../src/views/ac-beheer/README-Generic-Beheer.md)** (477 lines) — Generic beheer system architecture (factories, ConGenericBeheerPage).
- **[README-Generic-Details-Page.md](../src/views/ac-beheer/README-Generic-Details-Page.md)** (232 lines) — Generic details-page component spec, what it does and doesn't replace.
- **[core/hooks/README-Related-Create-Actions.md](../src/views/ac-beheer/core/hooks/README-Related-Create-Actions.md)** (175 lines) — Hook that builds context-aware "Toevoegen" actions.
- **[core/modals/.../README-generic-delete-modal.md](../src/views/ac-beheer/core/modals/ac-generic-beheer-delete-modal/README-generic-delete-modal.md)** (67 lines) — Usage example.
- **[core/modals/.../README-generic-publish-depublish-modal.md](../src/views/ac-beheer/core/modals/ac-generic-beheer-publish-depublish-modal/README-generic-publish-depublish-modal.md)** (59 lines) — Usage example.
- **[core/modals/con-generic-form-modal/README-Generic-Form-Modal.md](../src/views/ac-beheer/core/modals/con-generic-form-modal/README-Generic-Form-Modal.md)** (1016 lines) — Largest component README. Full configuration / dropdown options / dependent-options reference for the generic form modal.

## Only in Acato's

**Nothing exists in Acato that we don't have in some form**, but two contentful Acato-side details deserve note even though they live inside `README.md`:

1. **`.env.example` workflow.** Acato's README installation step expects developers to `Copy and fill .env.example to .env`. Their repo actually contains an `.env.example` file (see `analysis-dependencies-build-tooling.md`). Our flow uses `runtime-config.js` generated at container startup from env vars — fundamentally different mechanism. Our README correctly omits the `.env.example` step.
2. **A cleaner, shorter onboarding narrative.** Acato's 46-line README is approachable for an outside reader of a public portal. Ours is 197 lines and assumes the reader is a Conduction developer.

Acato has no `docs/`, no `.cursor/`, no `.github/`, no `.vscode/`, no component-level READMEs, no helm docs, no AUTHENTICATION/RUNTIME/CACHE/TEMPLATE/BACKEND-REQUIREMENTS guides. They simply do not document at the same depth — which is consistent with the much smaller feature surface.

## Recommendation

**Headline:** This category does not have technical-merge decisions to make. Acato has effectively zero documentation beyond a README; ours is the result of intentional investment. None of Acato's docs need to be "adopted." The real decisions here are about **what to do with our own pile**.

### 1. README.md — **keep ours**
Ours is strictly a superset of Acato's content plus features Acato doesn't have. Acato's deployments section is unfilled and references their Bitbucket pipeline anyway. The one thing worth importing: Acato's tighter opening paragraph ("A public web portal for the Municipality of Tilburg…") could replace our terse `### Tilburg WOO UI` to give external readers a clearer mission statement.

### 2. Everything ours-only — **keep all, but triage**
Recommended sub-actions, in priority order:

- **Audit "frozen-in-time" documents** before relying on them:
  - `AUTHENTICATION-STATUS.md` — labelled as "current working solution"; verify the Basic Auth fallback still represents production behaviour.
  - `RUNTIME-CONFIG-FIX.md` — describes a fix that has landed. Either archive or fold the relevant parts into `ENVIRONMENT-CONFIG.md`.
  - `REBUILD-INSTRUCTIONS.md` — narrowly tied to the runtime-config rebuild; same risk.
  - `STANDAARDVERSIES-EDIT-BUG.md` — bug write-up with explicit code references; if the bug is fixed, this should move to commit-message history rather than living at the repo root.
  - `BACKEND-REQUIREMENTS-EXTENDS.md` — forward-looking spec to backend team; verify it still reflects current desired backend behaviour, or move it into a tracked ticket.
  - `docs/CHANGELOG-ROUTING.md` — single dated entry (2026-01-19 timeline). Either commit to maintaining as an ongoing routing changelog or fold into the routing README.

- **Decide on doc placement convention** (worth doing as a one-off pass):
  - Today the root directory has 14 markdown files at the top level alongside ~9 more in `docs/`. The threshold for "this goes at root vs. in docs/" is inconsistent. Recommendation: move all feature/system documents into `docs/`, keep only `README.md`, `README.docker.md`, `developer.md`, `LICENSE` at root.

- **Empty file:** `.cursor/commands/beheer.md` is 0 bytes — delete or populate.

- **Unusual filename:** `@rules.md` — the `@` prefix is non-standard. If the intent is to sort it first, a clearer name (`PROJECT-RULES.md`) would be more readable; the file is already linked from `.cursor/rules/project-rules.mdc` which contains overlapping content.

- **AI agent instructions are fine as-is.** `.cursor/rules/*.mdc`, `.github/copilot-instructions.md`, and `.vscode/settings.json` are all narrowly scoped, low-volume, and clearly current.

- **Helm and beheer component READMEs are fine as-is.** Co-located with their code; large enough to be useful; not stale.

### 3. Acato will not benefit from our docs
Most of our documentation describes features Acato does not have (chat, gemma, beheer, forms wizards, authentication, helm deploy, runtime config). There is nothing to push upstream.

### Summary of decisions
- **Take from Acato:** the mission-statement opening paragraph of `README.md` (optional polish).
- **Keep ours:** everything else.
- **Internal cleanup recommended** (not a merge decision, but a separate task): triage the seven "frozen-in-time" documents listed above, move root-level system docs into `docs/`, delete or populate the empty `.cursor/commands/beheer.md`, and consider renaming `@rules.md`.
- **No business decision needed** — this category is purely documentation; nothing impacts user-facing behaviour.

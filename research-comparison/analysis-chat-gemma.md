# Analysis: Chat & GEMMA (ours only)

## Branches Compared
- Ours (tilburg-woo-ui): `softwarecatalogus-performance`
- Acato (tilburg-woo-ui_acato): `main`

## Scope

Two functionally distinct features bundled in this category by the file index:

- **Chat** — a placeholder conversational UI at `/chat` ([src/views/ac-chat/](../src/views/ac-chat/)) backed by [src/stores/chat.store.js](../src/stores/chat.store.js).
- **GEMMA** — a reference-architecture ArchiMate diagram viewer at `/gemma` and `/views` ([src/views/ac-gemma/](../src/views/ac-gemma/), [src/views/con-views-list/](../src/views/con-views-list/)) backed by [src/stores/gemma.store.js](../src/stores/gemma.store.js) and [src/api/gemma.api.js](../src/api/gemma.api.js).

**Acato has nothing in this category.** No `ac-chat`, no `ac-gemma`, no `con-views-list`, no chat/gemma store or api file, and none of the supporting dependencies (`@conduction/archimate-diagram-engine`, `@arktect-co/archimate-diagram-engine`, `jointjs`, `svg-pan-zoom`). Acato's repo is a read-only public WOO portal; both these features sit firmly on the Conduction softwarecatalogus side of the fork.

Per `CLAUDE.md` rules: ours-only → "keep, no decision needed". This file is an inventory and a note on the considerable internal debt inside the GEMMA half.

## Files Inventoried

| File | LoC | Notes |
|------|----:|-------|
| [src/views/ac-chat/ac-chat.js](../src/views/ac-chat/ac-chat.js) | 108 | View shell — gates on `isChatFeatureEnabled` from container config |
| [src/views/ac-chat/components/con-chat-area.js](../src/views/ac-chat/components/con-chat-area.js) | 217 | Message list + textarea input |
| [src/views/ac-chat/components/con-chat-sidebar.js](../src/views/ac-chat/components/con-chat-sidebar.js) | 146 | Conversation list with delete |
| [src/views/ac-chat/components/con-chat-dossiers.js](../src/views/ac-chat/components/con-chat-dossiers.js) | 71 | Dossiers panel (always empty — see below) |
| [src/views/ac-chat/components/index.js](../src/views/ac-chat/components/index.js) | 11 | Barrel |
| [src/stores/chat.store.js](../src/stores/chat.store.js) | 543 | MobX store — placeholder LLM integration |
| [src/styles/views/_ac-chat.scss](../src/styles/views/_ac-chat.scss) | 488 | |
| [src/views/ac-gemma/ac-gemma.js](../src/views/ac-gemma/ac-gemma.js) | 29 | Hostname-gated entry |
| [src/views/ac-gemma/ac-gemma-view.js](../src/views/ac-gemma/ac-gemma-view.js) | 1 080 | Full viewer (ArchiMate + jointjs + svg-pan-zoom) |
| [src/views/con-views-list/con-views-list.js](../src/views/con-views-list/con-views-list.js) | 685 | Public `/views` browser — near-clone of ac-gemma-view |
| [src/views/con-views-list/index.js](../src/views/con-views-list/index.js) | 1 | Barrel |
| [src/stores/gemma.store.js](../src/stores/gemma.store.js) | 309 | Views, voorzieningGebruik, modules, deelnames, applicaties, elementReferences |
| [src/api/gemma.api.js](../src/api/gemma.api.js) | 44 | 5 endpoints |
| [src/styles/global/_gemma.scss](../src/styles/global/_gemma.scss) | 182 | Global graph container styles |
| [src/styles/views/_con-views-list.scss](../src/styles/views/_con-views-list.scss) | 162 | |

**Total**: ~4 080 LoC of which ~3 280 LoC are GEMMA and ~1 580 LoC are Chat. The GEMMA half dominates.

## Chat feature

### What's wired up

- Route: `/chat` → `AcChat` (registered in [routes.constants.js#L462-L469](../src/constants/routes.constants.js#L462-L469)).
- Store: `ChatStore` instantiated in [stores/store.js:44](../src/stores/store.js#L44) as `store.chat`.
- Container config knobs: `CHAT_ENDPOINT`, `CHAT_TITLE`, `CHAT_DESCRIPTION` ([container.constants.js#L43-L45](../src/constants/container.constants.js#L43-L45)); `isChatEnabled` returns true only when `CHAT_ENDPOINT` is set.
- Layout: header banner + sidebar (`ConChatSidebar`, `ConChatDossiers`) + main area (`ConChatArea`) — the [_ac-chat.scss](../src/styles/views/_ac-chat.scss) styling is the substantial part (~488 LoC).

### What is NOT wired up

The store is currently a **scaffolded shell** waiting for a real LLM integration. Inline comments in [chat.store.js](../src/stores/chat.store.js) flag this explicitly:

- `fetchConversations` reads from `localStorage` (line 248: `// Placeholder: Will be implemented when LLM API documentation is provided`).
- `loadMessages` does the same (line 304).
- `sendMessage` (line 355) appends a hard-coded mock assistant response (`'Dit is een tijdelijke response. De LLM API integratie wordt later toegevoegd.'`) after a 1-second `setTimeout`.
- `fetchDossiers` (line 501) is a no-op that sets `dossiers = []`.
- `getAuthHeaders` builds a Bearer/Basic header from cookies or `window.app.store.user.basicAuthCredentials` — never actually called anywhere in this file (no `fetch` call exists).
- There is **no `chat.api.js`** counterpart in [src/api/](../src/api/).

So the route and UI are functional, but the feature does not yet talk to any LLM. `dossiers` will always render the empty state.

### Surface area

- `ChatStore` exposes 7 observables (`conversations`, `activeConversationId`, `messages`, `dossiers`, `isLoading`, `isSendingMessage`, `error`), 2 computed accessors, and 9 actions. No external consumers — `store.chat` is only referenced by [stores/store.js](../src/stores/store.js) and the `ac-chat` view tree.

## GEMMA feature

### What's wired up

- Routes:
  - `/gemma` → `AcGemma` ([routes.constants.js#L208-L215](../src/constants/routes.constants.js#L208-L215))
  - `/views` → `ConViewsList` ([routes.constants.js#L398-L407](../src/constants/routes.constants.js#L398-L407))
  - `/views/:id` → `AcViews` (this is a beheer-side detail view — covered by category 15, not here)
  - `BEHEER_VIEWS`, `BEHEER_VIEWS_DETAIL`, `BEHEER_VIEW_DETAIL` — all beheer-side, category 15
- Store: `GemmaStore` instantiated in [stores/store.js:42](../src/stores/store.js#L42) as `store.gemma`.
- API: 5 endpoints on the OpenRegister proxy ([endpoints.constants.js#L46-L55](../src/constants/endpoints.constants.js#L46-L55)) — `view`, `views`, `elementReferences`, `relationships` plus the two `voorzieningen/*` endpoints (`gebruik`, `module`).
- Breadcrumbs: `BREADCRUMBS.GEMMA` at [breadcrumbs.constants.js:14](../src/constants/breadcrumbs.constants.js#L14).
- Renderer stack: `@conduction/archimate-diagram-engine` (a Conduction fork of `@arktect-co/archimate-diagram-engine`) + `jointjs` 3.4.2 + `svg-pan-zoom` 3.6.2 + `react-select` for the view picker. Both ArchiMate engine packages are declared as dependencies in [package.json#L61-L62](../package.json#L61-L62) — the arktect one is imported only via a commented-out `import` line at [ac-gemma-view.js:7](../src/views/ac-gemma/ac-gemma-view.js#L7).

### `ac-gemma.js` is a hostname allowlist

[ac-gemma.js](../src/views/ac-gemma/ac-gemma.js) (29 LoC) hard-codes a `useEffect` that redirects to `/` unless the current hostname matches one of:

```
localhost
softwarecatalogus.accept.opencatalogi.nl
softwarecatalogus.test.opencatalogi.nl
acceptatie.softwarecatalogus.nl
performance.accept.opencatalogi.nl
```

It then unconditionally renders `<AcGemmaView />`. The hostname list is the only thing the wrapper does — no other branching. This means `/gemma` is effectively a staging-only feature on production hostnames (e.g. `softwarecatalogus.nl` without `accept`/`acceptatie`/`performance` would redirect). Verify whether this allowlist is still intentional before assuming the route is reachable for end users.

### `ac-gemma-view.js` is the full diagram viewer

A 1 080-LoC component. Two modes depending on whether a `viewId` prop is passed:

- **No `viewId`** (the `/gemma` route case): renders a `react-select` dropdown populated from `gemma.fetchViews({ _limit: 100 })`, plus a header card with download-SVG button, plus the graph container.
- **With `viewId`** (embedded from beheer — [con-generic-beheer-details-page.js:344](../src/views/ac-beheer/core/components/con-generic-beheer-details-page.js#L344)): renders three filter checkboxes (`Gebruik`, `Product`, `Deelnames`) above the graph container. The filter checkboxes toggle gebruik/module overlay rendering on top of the diagram nodes.

What it does:

1. Sanitises `viewNodes`/`viewRelationships` from the new API shape.
2. When filters are active, fetches gebruik + modules via the store, then builds module-name overlays positioned as small rects stacked at the bottom of each parent referentiecomponent node (capped at 2 000 overlays — see [ac-gemma-view.js:415](../src/views/ac-gemma/ac-gemma-view.js#L415)).
3. Topologically sorts nodes so parents render before children (so jointjs `graph.getCell(parentId)` resolves), and converts absolute coordinates to parent-relative offsets ([L460-L500](../src/views/ac-gemma/ac-gemma-view.js#L460-L500)).
4. Hands the result to `ViewRenderer.renderToGraph` from the Conduction ArchiMate engine, then post-processes the SVG (per-node fill/stroke/text colour, label alignment) by querying DOM nodes via `[model-id="…"]`.
5. Wraps the SVG in `svg-pan-zoom` with custom pinch-to-zoom and pan handlers (~150 LoC of touch event plumbing inside `customEventsHandler.init`).
6. `downloadSvg` clones the live SVG, strips the pan-zoom controls, converts `data-tooltip-content` attributes to native `<title>` elements, and triggers a download.

The file also carries **~200 LoC of commented-out legacy fallback code** — block comments at [L94-L202](../src/views/ac-gemma/ac-gemma-view.js#L94-L202), [L334-L392](../src/views/ac-gemma/ac-gemma-view.js#L334-L392), [L519-L547](../src/views/ac-gemma/ac-gemma-view.js#L519-L547) — that handled the previous API shape (`nodes`/`connections` instead of `viewNodes`/`viewRelationships`). The header notes "Legacy … retained for reference"; it is not reachable.

### `con-views-list.js` is a near-clone

[con-views-list.js](../src/views/con-views-list/con-views-list.js) (685 LoC) is the public `/views` browser. Same rendering stack (jointjs + ViewRenderer + svg-pan-zoom). Functionally it differs from `ac-gemma-view` only in:

- The dropdown's selected view is reflected in `?selected=<id>` query param (uses `useNavigate` + `useLocation`); `ac-gemma-view` only keeps it in local state.
- No filter checkboxes / no gebruik overlay logic.
- No commented-out legacy block.
- Slightly different fallback handling for legacy API shape (no fallthrough rendering of nodes/connections shape — only a soft fallback in [L180-L205](../src/views/con-views-list/con-views-list.js#L180-L205)).

The other ~500 LoC — `setNodeColor`, `setRelationshipColor`, `setSvgViewBox`, `downloadSvg`, and the entire `svgPanZoom` init block — are essentially identical to ac-gemma-view, with minor null-safety differences (e.g. `if (!parentElement) return` guards in con-views-list that ac-gemma-view lacks).

### `gemma.store.js` has unused methods

`GemmaStore` ([gemma.store.js](../src/stores/gemma.store.js)) declares 8 observable data buckets and corresponding getter/setter/fetch/reset triples. Only a subset is actually consumed:

| Bucket | Used by |
|--------|---------|
| `views`, `view` | ac-gemma-view, con-views-list, beheer-views, beheer-views-list |
| `allVoorzieningGebruik` | ac-gemma-view (filter overlay), beheer-views-list |
| `modules` | ac-gemma-view (filter overlay), beheer-views-list |
| `applicaties` | beheer-views-list only |
| `deelnames` | declared but **never read or written** outside the store |
| `voorzieningGebruik` (singular) | declared but **never read or written** outside the store |
| `elementReferences` | `fetchElementReferences` exists but no caller anywhere in `src/` |
| `mobileFiltersOpen` | declared but **never read or written** outside the store |

The dead observables/actions (`deelnames`, `voorzieningGebruik`, `elementReferences`, `mobileFiltersOpen`) and their `reset*` companions are cleanup candidates — but again, none of this affects the Acato comparison.

The `RELATIONSHIPS` endpoint at [endpoints.constants.js#L51-L52](../src/constants/endpoints.constants.js#L51-L52) likewise has no caller in `src/`.

### `gemma.api.js`

44 LoC, five methods (`views`, `view`, `allVoorzieningGebruik`, `modules`, `elementReferences`). `relationships` is declared in `ENDPOINTS.GEMMA` but has no method on the API class — consistent with the unused state above.

## Observations worth flagging (no action required)

1. **Chat is a placeholder.** [chat.store.js](../src/stores/chat.store.js) ships with `// Placeholder: Will be implemented when LLM API documentation is provided` in three methods and a hard-coded mock assistant response in `sendMessage`. The view layer is finished; the integration is not. If anyone tries to build on chat, expect to wire up a real backend first.

2. **No `chat.api.js`.** Every other feature uses an API class registered in [src/api/index.js](../src/api/index.js); chat does not, presumably because the `getAuthHeaders` helper inside `chat.store.js` was a sketch toward calling the LLM endpoint directly. Worth aligning with the rest of the codebase whenever the real integration lands.

3. **Two ArchiMate engine packages declared.** `package.json` ships both `@arktect-co/archimate-diagram-engine` and `@conduction/archimate-diagram-engine`. The arktect import in [ac-gemma-view.js:7](../src/views/ac-gemma/ac-gemma-view.js#L7) is commented out and replaced by the Conduction fork on the next line; con-views-list uses the Conduction fork exclusively. The arktect package looks like a stale dependency — confirm before removing.

4. **`ac-gemma-view.js` and `con-views-list.js` share ~500 LoC of duplicated rendering code.** `setNodeColor`, `setRelationshipColor`, `setSvgViewBox`, `downloadSvg`, the svg-pan-zoom init block, and the legacy fallback are duplicated with only cosmetic differences. A shared `useArchimateGraph` hook would absorb most of the duplication, but neither version is dead and consolidation would touch live functionality — out of scope for this comparison.

5. **`ac-gemma.js` is a hostname allowlist with no other purpose.** The five-hostname check is hard-coded; production-only hostnames are not in the list. If `/gemma` is supposed to be public, this gate is silently blocking it. If it's intentionally staging-only, the allowlist should arguably live in container config rather than source.

6. **Large legacy comment blocks in `ac-gemma-view.js`** (~200 LoC across three `/* … */` regions) describe the previous OpenExchange API shape. The headers explicitly say "retained for reference" — they are dead code preserved during the API migration.

7. **Several GemmaStore observables and actions are unreferenced** — `deelnames`, `voorzieningGebruik` (singular), `elementReferences`, `mobileFiltersOpen`, and the `RELATIONSHIPS` endpoint. Likely remnants of an earlier API plan.

8. **AcGemmaView is reused from beheer** via [con-generic-beheer-details-page.js:344](../src/views/ac-beheer/core/components/con-generic-beheer-details-page.js#L344) with `viewId={id}`. That coupling means GEMMA viewer changes need to be tested in both the standalone `/gemma` flow and the embedded beheer-detail flow.

## Recommendation

**Keep everything in this category — no merge decision needed.** Acato has none of it.

If this category is ever revisited as separate hygiene work (not part of the Acato merge):

1. Wire the real LLM backend for chat, or remove the `/chat` route until it's ready; the current placeholder shape ships mock responses to users.
2. Remove the dead Gemma observables/actions and the `RELATIONSHIPS` endpoint, or document why they exist.
3. Pick one ArchiMate engine package and drop the other from `package.json`.
4. Strip the legacy commented-out blocks in [ac-gemma-view.js](../src/views/ac-gemma/ac-gemma-view.js).
5. Extract the shared diagram-rendering helpers between `ac-gemma-view` and `con-views-list` into a hook.
6. Move the `ac-gemma.js` hostname allowlist into container config.

None of these affect Acato; they are local-debt notes only.

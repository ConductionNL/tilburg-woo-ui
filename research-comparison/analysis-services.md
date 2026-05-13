# Analysis: Services Layer (ours only)

## Branches Compared
- Ours (tilburg-woo-ui): `softwarecatalogus-performance`
- Acato (tilburg-woo-ui_acato): `main`

## Scope

Everything under [src/services/](../src/services/) — 7 files total. **Acato has no `services/` directory.** Verified: `ls tilburg-woo-ui_acato/src/` shows `api`, `atoms`, `components`, `config`, `constants`, `hooks`, `molecules`, `stores`, `styles`, `utilities`, `views` — no `services` folder, no equivalent files scattered elsewhere.

Per `CLAUDE.md` rules: ours-only → "keep, no decision needed". This file is an inventory; recommendation is **keep**.

## Files Inventoried

| File | LoC | One-line purpose |
|------|----:|------------------|
| [src/services/index.js](../src/services/index.js) | 8 | Barrel — re-exports the other 6 modules |
| [src/services/ac-check-if-specific-hostname.js](../src/services/ac-check-if-specific-hostname.js) | 27 | Returns `true` if `window.location.hostname` is in a hard-coded allowlist of Conduction deployment hostnames |
| [src/services/con-get-title.js](../src/services/con-get-title.js) | 52 | Returns the site title — first tries `@constants/container.constants` (runtime-config), falls back to a hostname `switch` |
| [src/services/ac-get-additional-info-row.js](../src/services/ac-get-additional-info-row.js) | 153 | Builds the rows of the "additional info" `AcTable` on publication detail pages — returns an array of `[label, JSX]` tuples |
| [src/services/ac-mapped-attachmend-row.js](../src/services/ac-mapped-attachmend-row.js) | 36 | Builds an attachment-row JSX entry for publication detail tables (note: filename has typo `attachmend`) |
| [src/services/registerCache.service.js](../src/services/registerCache.service.js) | 65 | Singleton in-memory cache: `registerId → slug` |
| [src/services/schemaCache.service.js](../src/services/schemaCache.service.js) | 163 | Singleton in-memory cache: `schemaId → slug` — with promise-based `waitFor` / `waitUntilReady` for callers that arrive before the store finished populating |

Total: **~504 LoC** across 7 files.

## How the modules are used

**`AcCheckIfSpecificHostname`** — feature-flag gate for "are we on a Conduction-branded deployment?". Consumed by [src/components/ac-intro/ac-intro.js](../src/components/ac-intro/ac-intro.js), [src/components/ac-footer/ac-footer.js](../src/components/ac-footer/ac-footer.js), [src/components/ac-search-categories/ac-search-categories.js](../src/components/ac-search-categories/ac-search-categories.js), [src/constants/titles.constants.js](../src/constants/titles.constants.js), and ~40 lines in [src/constants/routes.constants.js](../src/constants/routes.constants.js) (every per-route document title is wrapped in `AcCheckIfSpecificHostname() ? getTitle() : 'Open Tilburg'`).

**`getTitle`** (from `con-get-title.js`) — paired with the above; consumed by [src/components/ac-header/ac-header.js](../src/components/ac-header/ac-header.js#L12), [routes.constants.js](../src/constants/routes.constants.js), and [titles.constants.js](../src/constants/titles.constants.js).

**`AcGetAdditionalInfoRow`** — used by 4 publication views: [ac-publication-default-old.js](../src/views/ac-publication/ac-publication-default-old.js#L290), [ac-publication-default1.js](../src/views/ac-publication/ac-publication-default1.js#L123), [ac-publication-formulier.js](../src/views/ac-publication/ac-publication-formulier.js#L229), [ac-publication-softwarecatalogus.js](../src/views/ac-publication/ac-publication-softwarecatalogus.js#L215).

**`AcMappedAttachmentRow`** — used by 5 publication views: `ac-publication-default.js`, `ac-publication-default1.js`, `ac-publication-formulier.js`, `ac-publication-softwarecatalogus.js`, `ac-publication-woo-verzoek.js`.

**`schemaCache`** — populated by [src/stores/object.store.js#L1482](../src/stores/object.store.js#L1482) and [src/stores/publications.store.js#L833](../src/stores/publications.store.js#L833). Consumed by 8+ publication views (`ac-publication-product/contactperson/moduleversie/organisation/koppeling/gebruik/dienst/module`), [con-related-tabs.js](../src/views/ac-publication/con-related-tabs.js#L519), [con-related-tabs-new.js](../src/views/ac-publication/con-related-tabs-new.js#L74), [con-facets-filters.js](../src/molecules/con-facets-filters/con-facets-filters.js#L411), [use-resolve-schema-ids.hook.js](../src/hooks/use-resolve-schema-ids.hook.js#L28), [con-schema-resolver.js](../src/components/con-schema-resolver/con-schema-resolver.js), [con-resolve-schema.js](../src/utilities/con-resolve-schema.js#L25).

**`registerCache`** — populated by [object.store.js#L1502](../src/stores/object.store.js#L1502) and the `fetchAllRegisters` flow at [object.store.js#L3915](../src/stores/object.store.js#L3915). Consumed by [con-register-resolver.js](../src/components/con-register-resolver/con-register-resolver.js#L38) and [object.store.js#L928](../src/stores/object.store.js#L928).

## Cache services — implementation notes

Both cache modules use the same pattern: a module-scoped `const cache = {}` and named functions assigned to a singleton export object. Module-level state means there's exactly one cache per browser session (ES-module singleton, not a class).

**`registerCache`** is the simpler of the two:
- API: `set`, `get`, `getAll`, `clear` only.
- `set` stringifies the id and lowercases the slug; `get` stringifies the id.
- `console.info('📋 Register cache: ...')` fires on every `set`; `console.info('🗑️ ...')` on every `clear`.
- No eviction. Cache lives until page reload. Reasonable for UUID→slug mappings (low cardinality, low churn).

**`schemaCache`** adds a waiter mechanism on top of the same shape:
- API: `set`, `get`, `getAll`, `isReady`, `waitFor(schemaId, timeout=10000)`, `waitUntilReady(timeout=10000)`, `clear`.
- `waiters` is `{ [schemaId]: [{ resolve, timeoutId }] }`; `readinessWaiters` is a flat array. `set` resolves the matching `waiters[schemaId]` queue and (if any are pending) the readiness queue.
- Timeouts resolve to `null` / `false` rather than rejecting — the comment on line 110 calls this out explicitly. Means callers never need a try/catch.
- `get` does **not** stringify the id (unlike `registerCache.get`). Callers stringify themselves when they care: `schemaCache.get(String(schemaId))` appears in `con-related-tabs-new.js` and `publications.store.js`, raw `schemaCache.get(schemaId)` in the publication views. Easy to miss when a number sneaks in.
- No `_isReady`-style atomic — `isReady()` is `Object.keys(cache).length > 0`. Cheap enough.

## Observations worth flagging (no action required)

1. **`con-get-title.js` has no default export, but `services/index.js` re-exports it as one.** The file exports `export const getTitle = ...` (named). `services/index.js#L5` does `export { default as ConGetTitle } from './con-get-title';`. Importing `ConGetTitle` from `@services` would yield `undefined`. Every real consumer correctly does `import { getTitle } from '@services/con-get-title'` — so the broken barrel entry is dead but unused. Easy cleanup, not load-bearing.

2. **`services/` vs `utilities/` vs `stores/` boundary is fuzzy.** Only the two cache modules really earn the "service" label (singleton stateful modules). The other five would fit elsewhere:
   - `AcCheckIfSpecificHostname` — pure-ish predicate reading `window.location`. Would sit happily in `utilities/`.
   - `con-get-title` — environment/runtime-config helper. Could live in `config/` (alongside [container.constants.js](../src/constants/container.constants.js) which it falls back through) or `utilities/`.
   - `AcGetAdditionalInfoRow` and `AcMappedAttachmentRow` — return JSX trees, not data. They're React render helpers, closer to a component utility than a service. Naming them `Ac…` (like a component) reinforces this — but they're imperative functions, not components.

   The cache services are the only files where the directory name carries weight. Worth noting if we ever rationalise the layering, but not a merge blocker.

3. **Two filename conventions in one folder.** Five files use `ac-`/`con-` kebab-case prefixes (matching the rest of the codebase). The two cache modules use camelCase with a `.service.js` suffix (`schemaCache.service.js`, `registerCache.service.js`). Cosmetic — won't surface in the Acato merge.

4. **Filename typo preserved.** `ac-mapped-attachmend-row.js` (`attachmend` instead of `attachment`). The exported symbol is spelled correctly (`AcMappedAttachmentRow`), so renames are cosmetic and don't affect imports. Five callers reference it via the symbol, not the path.

5. **`AcCheckIfSpecificHostname` hostname list partially overlaps with `getTitle` switch list but isn't the same set.** The "specific hostname" allowlist (`ac-check-if-specific-hostname.js#L5-L23`) is 16 entries including `localhost`. The `getTitle` switch (`con-get-title.js#L20-L48`) is 11 hostnames not including `localhost` (falls through to `'Open Tilburg'`). Two parallel hostname lists with similar but non-identical contents — minor drift risk if someone adds a deployment to one but not the other. Both are now layered under [container.constants.js](../src/constants/container.constants.js) (runtime-config), so the long-term direction is to deprecate both lists in favour of the runtime config. Already started in `con-get-title.js` via the `require('@constants/container.constants')` try/catch fallback.

6. **Cache services use `console.info` on every `set`.** With emoji prefixes (`📋`, `🗑️`). At the rates these get hit (every schema lookup during a page render), this is loud in production. Same pattern in both files. Worth gating behind a debug flag if console-noise comes up — but not a correctness concern.

7. **Cache services are an intentional bypass of MobX.** The same `(schemaId, slug)` pairs are stored in `publications.store.js`'s `_schemasObj` observable map and on the schemas owned by `object.store.js`. The cache exists so synchronous callers (e.g. JSX render expressions in publication views, the route-title resolver in `routes.constants.js`) can do a fast `O(1)` lookup without subscribing to a MobX store. The `waitFor` promise interface is the bridge for callers that arrive before the store has populated. This duplication is deliberate — it's a perf/ergonomics choice, not an accident. Worth understanding before touching either side.

## Recommendation

**Keep all 7 files — no merge decision needed.** Acato has no `services/` layer and no equivalent code elsewhere.

If we ever do hygiene on this folder (not part of the Acato merge), candidates in priority order:

1. Fix or remove the broken `ConGetTitle` default-export re-export in `services/index.js`.
2. Move `AcGetAdditionalInfoRow` / `AcMappedAttachmentRow` to a component or render-helper location and rename `services/` to reflect that the remaining entries are stateful singletons (the two caches).
3. Collapse the two parallel hostname lists in `AcCheckIfSpecificHostname` and `getTitle` once `container.constants` runtime config covers all deployments.
4. Gate the `console.info` calls in the cache services behind a debug flag.
5. Fix the `attachmend` filename typo (and update the 5 import paths).

None of these affect the Acato comparison; local debt notes only.

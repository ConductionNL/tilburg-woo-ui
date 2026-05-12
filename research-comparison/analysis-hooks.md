# Analysis: Hooks

## Branches Compared
- Ours (tilburg-woo-ui): `softwarecatalogus-performance`
- Acato (tilburg-woo-ui_acato): `main`

## Scope

This file covers React hooks only. Utilities are split into two sibling files:
- `analysis-utilities-shared.md` — shared `ac-*` utilities + Acato-only utilities
- `analysis-utilities-ours-only.md` — inventory of `ours-only` utilities

## Files Compared

**Both:**
- `src/hooks/index.js`
- `src/hooks/use-auto-focus.hook.js`

**Ours only:**
- `src/hooks/con-use-debounced-input-hook.js`
- `src/hooks/con-use-facet-name-resolution.js`
- `src/hooks/con-use-later-effect.js`
- `src/hooks/use-click-outside.hook.js`
- `src/hooks/use-debounce.hook.js`
- `src/hooks/use-document-title-from-path.hook.js`
- `src/hooks/use-escape-key.hook.js`
- `src/hooks/use-ref-options.js`
- `src/hooks/use-resolve-schema-ids.hook.js`
- `src/hooks/use-ui-actions.hook.js`
- `src/hooks/use-window-size.hook.js`

**Acato only:**
- `src/utilities/use-is-mobile.js` *(located in `src/utilities/` despite being a hook)*

## What is the same

- `src/hooks/use-auto-focus.hook.js` — byte-identical in both repos.

## What differs

### `src/hooks/index.js` — barrel export only

Acato's barrel is one line: `export * from './use-auto-focus.hook';`.

Ours re-exports every additional hook listed under "Ours only". No conflict — just our barrel grows with our hook surface.

## Only in ours

A breakdown of the ours-only hooks and what each one does. None of these have an equivalent in Acato.

| Hook | LoC | Purpose |
|------|----:|---------|
| `con-use-debounced-input-hook.js` | 201 | Debounced controlled-input helper used by the search system (cross-referenced with category 3 / Search) |
| `con-use-facet-name-resolution.js` | 172 | Resolves facet IDs to display names against `objectStore`; provides `useResolvedFacets` HOC variant via MobX `withStore` |
| `con-use-later-effect.js` | 22 | `useEffect` variant that skips the first run (deferred / non-mount effect) |
| `use-click-outside.hook.js` | 27 | Fires a callback when a mousedown lands outside the supplied ref |
| `use-debounce.hook.js` | 20 | Generic value debouncer with a 400 ms default |
| `use-document-title-from-path.hook.js` | 31 | Derives and sets `document.title` from the current route path |
| `use-escape-key.hook.js` | 26 | Fires a callback when the Escape key is pressed (configurable deps / window) |
| `use-ref-options.js` | 509 | Large utility for resolving "$ref"-style option lists in dynamic forms; exposes `clearRefOptionsCache` and `inspectRefOptionsCache`, so it has its own memo layer |
| `use-resolve-schema-ids.hook.js` | 66 | Bulk-resolves a list of schema IDs to objects (paired with the standards/standaardversies system) |
| `use-ui-actions.hook.js` | 75 | Binds UI-action handlers from a MobX store to a DOM ref |
| `use-window-size.hook.js` | 29 | Returns `window.innerWidth`, debounced via `requestAnimationFrame` |

All of these hooks back features unique to our fork (auth, dynamic forms, beheer, facets, glossary, search-with-facets, etc.) so they are out of scope for an upstream merge.

## Only in Acato's

### `src/utilities/use-is-mobile.js` (25 lines)

```js
const breakpoint = 1024;
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(undefined);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = () => setIsMobile(window.innerWidth <= breakpoint);
    mql.addEventListener('change', onChange);
    setIsMobile(window.innerWidth <= breakpoint);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return !!isMobile;
};
```

A clean `useIsMobile` boolean hook backed by `matchMedia`. Three things to note:

1. **It is filed under `src/utilities/`, not `src/hooks/`** — a small but real misplacement on Acato's side.
2. We have `use-window-size.hook.js` instead, which returns a numeric width and listens to `resize`. The two hooks overlap in intent but have different shapes:
   - Acato listens for `matchMedia` `change` events (cheaper, only fires when crossing the breakpoint).
   - Ours listens to every `resize` event (rAF-debounced) and consumers must compare against a breakpoint themselves.
3. Acato's version is simpler and arguably more efficient for the "am I mobile?" use case.

## Recommendation

| Item | Decision |
|------|----------|
| `use-auto-focus.hook.js` | Identical — no action |
| `src/hooks/index.js` divergence | Keep ours (just a larger barrel) |
| Acato's `use-is-mobile.js` | **Consider adopting.** It is generic, well-shaped, and complements (does not replace) `useWindowSize`. If adopted, relocate to `src/hooks/` and export from the barrel. Low cost, low risk. |
| All ours-only hooks | Keep — they back ours-only features |

No business decisions required for this sub-category; the `useIsMobile` adoption is a pure technical judgement call.

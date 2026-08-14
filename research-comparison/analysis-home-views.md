# Analysis: Home & general public views

## Branches Compared
- Ours (tilburg-woo-ui): `softwarecatalogus-performance`
- Acato (tilburg-woo-ui_acato): `main`

## Files Compared

**Both (5 files):**
- `src/views/ac-home/ac-home.js`
- `src/stores/faqs.store.js`
- `src/stores/pages.store.js`
- `src/api/faqs.api.js`
- `src/api/pages.api.js`

**Acato only (1 file):**
- `src/views/ac-sitemap/ac-sitemap.js`

---

## What is the same

The following files are effectively identical between the two repos:

- **`src/stores/faqs.store.js`** — byte-identical. Same `FaqsStore` class, same `items` / `loading` / `is_loading` / `all_faqs` / `fetchFaqs` surface. Both map raw FAQ items to `{ label, body }` via `AcSanitizeHtml(answer)`.
- **`src/api/faqs.api.js`** — functionally identical. Only diff: ours imports `ENDPOINTS` from the barrel `@constants`, Acato imports directly from `@constants/endpoints.constants`. Trivial.
- **`src/api/pages.api.js`** — byte-identical. Both expose `list()` and `single(id)` against `ENDPOINTS.PAGES.INDEX` / `ENDPOINTS.PAGES.SHOW(id)`.

Both home views share the same skeleton: `withStore(observer(...))`, a `useEffect` that calls `fetchPage('/home')` + `fetchThemes()` and resets on unmount, a loader fallback while `contents` is null, then a hero + section + about layout built from CMS-driven `contents` array offsets.

---

## What differs

### 1. `src/views/ac-home/ac-home.js` — substantially diverged

Both views start from the same scaffold but tell different stories. Below is a structural diff.

| Aspect | Ours | Acato |
|--------|------|-------|
| Root wrapper | `<ConGlossaryHighlight as='div'>` (glossary feature) | React fragment `<>` |
| Hero | `<AcHero contents={contents} />` — passes CMS contents | `<AcHero />` — no props |
| Extra data fetched | `fetchPage`, `fetchThemes` | `fetchPage`, `fetchThemes`, `fetchLatestPublications(3)`, `fetchCategories` |
| Loading gate | `!contents` | `!contents \|\| is_loading_categories` |
| Categories grid | renders `all_themes` (full set) as `AcCardCategory` | renders `all_categories` (Acato's separate `categories` store) as `AcCardCategory` |
| Grid prop | `<AcGrid columns={3}>` | `<AcGrid row={3}>` |
| Heading | `LABELS.THEMES` | hard-coded string `"Welke documenten vind je hier binnenkort?"` |
| Intro paragraph | branches on `AcCheckIfSpecificHostname()` — VNG/Softwarecatalogus copy vs. Tilburg WOO copy | single hard-coded WOO paragraph |
| Card props | passes through `linkUrl`, `linkTitle`, `isExternal` with fallbacks (`subject.linkUrl \|\| getSearchPageURL(...)`) | spreads category as-is, no link logic |
| Featured publications | not rendered | `<AcFeatured publications={latest_publications} isLoading={is_loading_latest} />` shown when ≥1 |
| `AcAbout` contents offsets | reads `contents[3]`, `[4]`, `[5]`, `[6]` and **skips render** if `title \|\| content` is empty | reads `contents[0]`, `[1]`, `[2]`, `[3]`, `[4]` and **always renders** |
| `AcAbout` props | `title`, `content`, `link`, `image` | `title`, `content`, `list`, `link`, `image` (extra `list` slot) |
| Dead/commented code | none | a commented-out `<AcSection blue>` themes block that references `LABELS`, `PATHS`, `VISUALS` — none of which are imported (orphaned snippet, harmless because commented) |

Implications:

- **Different content models.** Acato's home expects a CMS page where `contents[0..4]` is the "about" block at the top, plus a `categories` data layer (`all_categories`) populated independently from `themes`. Ours expects `contents[3..6]` to be the about block (offsets 0–2 are presumably consumed by `AcHero`) and reuses `themes` to populate the category grid — Acato's `categories` store does not exist in our repo.
- **Featured / latest publications.** Acato shows the 3 most recent publications on the home page. We removed that block — either deliberately (different home design) or as collateral when our themes-first layout replaced it.
- **Hostname-conditional copy.** Same multi-tenant pattern documented in [analysis-themes-categories.md](analysis-themes-categories.md): `AcCheckIfSpecificHostname()` lets us ship the same bundle for both VNG/Softwarecatalogus and Tilburg deployments. Acato has no equivalent.
- **Glossary wrapper.** Our home is wrapped in `ConGlossaryHighlight` (part of the ours-only glossary system documented in [analysis-glossary.md](analysis-glossary.md)).
- **Guarded About block.** Ours refuses to render `AcAbout` when the CMS hasn't supplied a title/content — Acato will render `AcAbout` with empty strings. Our guard is the more robust behaviour.

### 2. `src/stores/pages.store.js` — ours has auth filtering + extensive fallback handling

Both stores expose the same baseline surface (`items`, `single`, `loading`, `all_pages`, `get_single`, `resetPage`, `setPages`, `setPage`, `fetchPage`, `fetchPages`, `is_loading`).

**Ours adds (lines 36–60):**
- `getFilteredPages` computed returning a function `(userIsAuthenticated) => filtered pages`.
- `shouldShowPage(page, userIsAuthenticated)` action that honours `hideBeforeLogin` / `hideAfterLogin` flags on each page.

This is tied to our authentication system (documented in [analysis-auth.md](analysis-auth.md)) — Acato has no auth so the concept is irrelevant there.

**Ours adds (in `fetchPage` and `fetchPages`):**
- Large inline `fallbackPageData` / `fallbackPagesData` constants with a complete `@self` envelope (locked, owner: "Fallback gods", `1970-01-01` timestamps, etc.).
- Detection of HTML-instead-of-JSON responses (`responseText.includes('<!doctype html>')`) → emits a `console.warn` and falls back to the static fallback page.
- Catch handler also falls back to the static page instead of just logging.
- `fetchPage` accepts either `response.data` *or* `response` (Acato only handles `response.data`).
- `fetchPages` accepts either `response.data` *or* `response.results` (Acato only handles `response.data`).

This defensive layer looks like it was added to keep the public portal usable when the backend (Open Registers / Nextcloud) returns the HTML index page or 404s — i.e. survive a misconfigured nginx routing. Acato presumably runs against a controlled backend and doesn't need this.

**Note:** the fallback page (`'/home'`) has `slug: '/home'` in the list fallback but `slug: 'home'` in the single fallback — minor inconsistency, probably not load-bearing but worth flagging.

### 3. `src/views/ac-sitemap/ac-sitemap.js` — Acato only

50-line view (Acato repo, not present in ours). Renders a flat unordered list of:
1. all pages from `pages.fetchPages()` linked by `slug`
2. all entries from `ROUTES` that have a `component`, no `:` param in path, and aren't `/`

Wired into Acato at `routes.constants.js:113` under `ROUTES.SITEMAP` → path `/sitemap`. Backed by `TITLES.SITEMAP = 'Sitemap'`.

Two minor quality issues in Acato's file:
- Component is named `AcSearch` internally (`const AcSearch = ...`) — clearly a copy-paste artefact from `ac-search`. The default export still works fine because it's anonymous-ish (`observer(AcSearch)`), but the symbol name is misleading.
- The two `<UnorderedListItem>` lists don't pass a `key` prop — React will warn in dev. The page slug or route id would be the obvious key.

Our repo has no `/sitemap` route. Our `routes.constants.js` does contain `VNG_ROUTES_SITEMAP` and `VNG_FOOTER_ITEMS_SITEMAP` — but those are footer link-list groupings for the VNG theme, not a "/sitemap page", so they're unrelated. There is no dedicated sitemap *view* on our side.

---

## Only in ours

- Auth-aware page filtering (`getFilteredPages`, `shouldShowPage`, `hideBeforeLogin` / `hideAfterLogin`) in `pages.store.js`.
- Fallback-page data + HTML-response detection + error fallback in `pages.store.js`.
- `ConGlossaryHighlight` wrapper around the home view.
- `AcCheckIfSpecificHostname()` hostname-conditional copy.
- `subject.linkUrl` / `subject.linkTitle` / `subject.isExternal` per-theme overrides on the home category cards.
- `AcAbout` no-render guard when the CMS hasn't provided a title or content.

## Only in Acato's

- Dedicated **sitemap view** (`src/views/ac-sitemap/ac-sitemap.js`) + matching route `/sitemap`.
- Featured **latest publications** block on the home page (top 3 via `publications.fetchLatestPublications(3)`).
- `categories` store powering the home category grid (separate data layer from `themes`).
- Different CMS contents-array shape for the home page (`contents[0..4]`, with a 5th `list` slot in `AcAbout`).

---

## Recommendation

For each difference:

### `src/views/ac-home/ac-home.js` — **keep ours**, cherry-pick selectively
- **Keep ours' multi-tenant copy switch, glossary wrapper, link-overrides, and AcAbout guard.** These are real improvements driven by features we ship.
- **Consider re-adding a "latest publications" block** (Acato's `AcFeatured` usage) if product confirms that is desired UX for our portal. The data is available (`publications.fetchLatestPublications`); only the JSX block was removed. Needs a product / design call, not a technical one.
- **Do not adopt Acato's `categories` store.** Our home reuses `themes` — adopting a parallel `categories` store would split the data model for no gain. (Same recommendation as [analysis-themes-categories.md](analysis-themes-categories.md).)
- **Resolve grid prop divergence at the molecule level**, not here — see the `AcGrid` `columns` vs `row` issue documented in [analysis-themes-categories.md](analysis-themes-categories.md). The home view should follow whatever `AcGrid` ends up settling on.

### `src/stores/pages.store.js` — **keep ours**
- The auth-filtering API is required by our auth feature; not negotiable.
- The fallback handling is defensive but real — it papers over a backend misconfiguration we've apparently hit. Worth keeping but flag for review: ideally the *backend* should not return HTML for a JSON endpoint, and a long-term fix is preferable to permanent fallback data. Track as tech debt, not a blocker.
- Fix the `slug: '/home'` vs `slug: 'home'` inconsistency between `fetchPage` and `fetchPages` fallbacks while you're in there. **Needs decision: which form is correct?**

### `src/stores/faqs.store.js` — **no action**
Identical.

### `src/api/faqs.api.js` — **no action**
Import path divergence is cosmetic; ours uses the barrel which is the project convention elsewhere.

### `src/api/pages.api.js` — **no action**
Identical.

### `src/views/ac-sitemap/ac-sitemap.js` — **needs decision** (likely adopt with cleanup)
- Adopting Acato's sitemap view is **cheap** (one 50-line file + one route entry + one `TITLES` constant) and is a meaningful accessibility / SEO win.
- Before merging, fix:
  - Rename the inner component from `AcSearch` to `AcSitemap`.
  - Add `key` props to the two list iterations.
  - Verify that our `routes.constants.js` shape is compatible (ours has `VNG_ROUTES_*` skin groups that may pollute the `Object.values(ROUTES)` enumeration — sitemap should iterate the base `ROUTES` only, not the skin variants).
  - Decide whether the sitemap should respect our auth-filtering (`getFilteredPages`) or list everything — likely the former, given our authenticated routes (beheer, mijn-omgeving, etc.) should not be advertised on a public sitemap.
- **Business question:** does the portal need a public sitemap? If Acato shipped one but the Tilburg site never linked to it, this may be optional. Confirm with stakeholders before adopting.

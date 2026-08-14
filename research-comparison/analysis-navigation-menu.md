# Analysis: Navigation & menu system

## Branches Compared
- Ours (tilburg-woo-ui): `softwarecatalogus-performance`
- Acato (tilburg-woo-ui_acato): `main`

## Files Compared

**Both (paths exist in both repos — content diverges):**
- [src/components/ac-header/ac-header.js](../src/components/ac-header/ac-header.js) (Acato's equivalent at the same path)
- [src/components/ac-footer/ac-footer.js](../src/components/ac-footer/ac-footer.js) (Acato's equivalent at the same path)
- [src/components/ac-navigation/ac-navigation.js](../src/components/ac-navigation/ac-navigation.js) (Acato's equivalent at the same path)
- [src/components/ac-drawer/ac-drawer.js](../src/components/ac-drawer/ac-drawer.js) (Acato's equivalent at the same path)
- [src/molecules/ac-breadcrumbs/ac-breadcrumbs.js](../src/molecules/ac-breadcrumbs/ac-breadcrumbs.js) (Acato's equivalent at the same path)
- Matching SCSS pairs: `_ac-header.scss`, `_ac-footer.scss`, `_ac-navigation.scss`, `_ac-drawer.scss` (all four differ)

**Ours only:**
- [src/components/ac-c-navigation/ac-c-navigation.js](../src/components/ac-c-navigation/ac-c-navigation.js) — secondary nav with dropdown
- [src/components/ac-sidenav/ac-side-nav.js](../src/components/ac-sidenav/ac-side-nav.js) — hardcoded admin sidenav (older)
- [src/components/con-dynamic-sidenav/con-dynamic-sidenav.js](../src/components/con-dynamic-sidenav/con-dynamic-sidenav.js) — backend-driven admin sidenav
- [src/api/menu.api.js](../src/api/menu.api.js) — menu list/single endpoints
- [src/stores/menu.store.js](../src/stores/menu.store.js) — menu store with positions, auth filtering, group filtering, template processing
- [src/styles/components/_ac-c-navigation.scss](../src/styles/components/_ac-c-navigation.scss)
- `menuPositions.png` (documentation image)

**Acato only:** none in this category. Footer relies on static `FOOTER_PRIMARY_ABOUT`, `FOOTER_PRIMARY_QUICK`, `FOOTER_SECONDARY` arrays exported from Acato's `src/constants/routes.constants.js:158-173`.

---

## What is the same

- The overall composition: `AcHeader` renders `AcNavigation` + `AcBreadcrumbs`, wrapped in `AcContainer`. `AcFooter` renders one or more `<nav>` blocks. `AcDrawer` is a `<dialog>` forwarded-ref wrapper.
- Both use the same NL Design System building blocks: `SkipLink`, `BreadcrumbNav*` from `@utrecht/component-library-react`.
- Both implement the same skip-link → main pattern, mobile menu toggle pattern, and "Hoofd/Hoofdnavigatie" aria-labels.
- `AcDrawer` is structurally identical (dialog + header + close button + slot for children). Behavior is the same; only minor cosmetic differences (see below).
- Breadcrumbs in both wire `BREADCRUMBS.SEARCH`, `BREADCRUMBS.PUBLICATION`, `BREADCRUMBS.THEMES`, and `BREADCRUMBS.CONTENT` cases, and prepend a "Home" link.

---

## What differs

### 1. Menu source: static constants vs backend-driven store

The biggest difference, and it cascades everywhere.

- **Acato** hardcodes navigation everywhere:
  - `AcNavigation` lists four static `<Link>` items (Over Open Tilburg, Zoeken, Onderwerpen [commented out], Contact) — see Acato's `src/components/ac-navigation/ac-navigation.js:23-49`.
  - `AcFooter` maps over three static arrays imported from `routes.constants.js`.
  - No store, no API call, no notion of menu "positions."

- **Ours** runs a full dynamic menu system backed by `MenuStore` + `MenuAPI`:
  - Menus are fetched once into `menu.all_menu_items` and looked up by **position** (1=main nav, 2=secondary nav, 3/4/5=footer columns, 6=sub-footer, 7=admin dashboard sidenav). Positions are documented visually in `menuPositions.png`.
  - The store applies `hideBeforeLogin` / `hideAfterLogin` flags per menu and per item, plus a `groups[]` allowlist that intersects with `user.userGroups` ([src/stores/menu.store.js:134-162](../src/stores/menu.store.js#L134-L162)).
  - Menu titles/names run through `processUserTemplate` so backend strings can interpolate user data ([src/stores/menu.store.js:177-189](../src/stores/menu.store.js#L177-L189)).
  - Position-7 lookup has a `title === 'Dashboard'` tiebreaker to skip test menus ([src/stores/menu.store.js:81-90](../src/stores/menu.store.js#L81-L90)).

### 2. `AcHeader` complexity

- **Acato (50 LOC)**: pure rendering. Two zones: logo + nav, then breadcrumbs.
- **Ours (260 LOC)**: three zones (main, secondary, breadcrumbs). Adds:
  - Authenticated-user info link with avatar, full name fallback chain (`firstName middleName lastName` → `displayName` → `email`), and the active organisation name in parentheses.
  - A multi-attempt async fetch of the full organisation object (up to 3 retries, 200 ms apart) so the display name reflects the canonical `@self.name` rather than the session snapshot ([src/components/ac-header/ac-header.js:41-92](../src/components/ac-header/ac-header.js#L41-L92)).
  - A secondary navigation strip rendering `AcCNavigation` from menu position 2, with an **additional inline `getIconForMenuItem` mapper** that injects the admin (position 7) menu as a dropdown when the viewport is `≤ 1024 px` and the user is on a `/beheer/*` route — a mobile collapse of the admin sidenav.
  - Skip-link target is `#main` (Acato uses `${pathname}#main`).
  - Uses `<ConLogo variant="header">` and `<h1>{getTitle()}</h1>` rather than Acato's `<VISUALS.LOGO />` + `<span>{LABELS.APP_NAME}</span>`.

### 3. `AcNavigation`

- **Acato**: hardcoded `<ul>`, no store, no auth awareness.
- **Ours**: reads `menu.getMenuFromPosition(1, isAuthenticated, userGroups)`, filters out login/register items when already authenticated using a small `LOGIN_PATHS` / `LOGIN_NAMES` allowlist ([src/components/ac-navigation/ac-navigation.js:21-35](../src/components/ac-navigation/ac-navigation.js#L21-L35)), and triggers `fetchMenus()` on mount if the store is empty. Icons resolved by string name against `VISUALS`.

### 4. `AcFooter`

- **Acato (62 LOC)**: three static lists rendered via a `renderLink` helper that handles `isExternal` vs internal. One section + one sub-section. Static "PUBLICATIES GEMEENTE TILBURG" branding.
- **Ours (172 LOC)**: maps over `menu.getFooterMenus()` (positions 3/4/5) and `menu.getSubFooterMenus()` (position 6). Items can carry an `icon` (string → `VISUALS[icon]`), `link` (auto-detected http(s) → external), or be a div if no link. Branding pulled from `getFooterLogoTitle()` / `getFooterLogoSubtitle()` (runtime container config) with hardcoded fallbacks. Container CSS class gated by `AcCheckIfSpecificHostname()`.

### 5. `AcBreadcrumbs`

- Both share the search/publication/themes/content branches.
- **Acato (67 LOC)** adds one extra `/sitemap` case (inline, not via constants).
- **Ours (170 LOC)** adds branches for `/directory`, `/login`, `/reminder`, `/mijn-omgeving`, `/gemma`, `/beheer/my-account`, `/beheer/my-organisation`, `/beheer/view(s)/:id`, generic `/beheer/:section/:id` (with UUID-vs-slug detection), `/register`, `/views`, `/forms`. Also passes the publication schema into `BREADCRUMBS.PUBLICATION(title, schema)` so the trail can branch per publication type, and falls back from `get_single_page.name` to `.title`. Adds a `handleBreadcrumbClick` that calls `navigate()` (SPA) instead of letting the anchor do a hard load — this is a behavioural fix.
- Acato uses bare `<></>` Fragment without keys in the `.map()` (React warning); ours uses `React.Fragment key={index}`.

### 6. `AcDrawer`

- Tiny differences:
  - **Ours** adds a `removeBackdrop` prop and toggles an `ac-drawer--backdrop` class via `clsx`.
  - **Ours** drops the `aria-labelledby={id-title}` linkage and the `id={id-title}` on the heading.
  - **Ours** sets `AcDrawer.displayName = 'AcDrawer'`.

  Net: Acato's accessibility is slightly stronger (the labelling), ours has a styling escape hatch.

### 7. SCSS

All four shared style files differ (header +145 lines vs Acato, footer +75, nav −30, drawer −8). Not line-by-line audited here — the header divergence in particular reflects the extra zones and user-info element ours adds.

---

## Only in ours

- **`AcCNavigation`** ([ac-c-navigation.js](../src/components/ac-c-navigation/ac-c-navigation.js)) — a horizontal secondary navigation bar that supports nested dropdowns (`items[].items`) and `dropdown-overflow` styling when an item has more than 8 sub-items. Currently rendered only from `AcHeader` for position-2 menus and the injected admin dropdown.
- **`AcSideNav`** ([ac-side-nav.js](../src/components/ac-sidenav/ac-side-nav.js)) — a hardcoded `@gemeente-denhaag/components-react` sidenav with 9 fixed beheer routes. Looks like dead/legacy code — `ConDynamicSidenav` covers the same purpose dynamically.
- **`ConDynamicSidenav`** ([con-dynamic-sidenav.js](../src/components/con-dynamic-sidenav/con-dynamic-sidenav.js)) — same sidenav idea but reads from menu position 7, with its own `getIconForMenuItem` icon-mapping helper (duplicated from `AcHeader`).
- **`MenuStore`** ([menu.store.js](../src/stores/menu.store.js)) — full MobX store: `fetchMenus`, `fetchMenu(id)`, `getMenuFromPosition`, `getMenusFromPositions`, `getFooterMenus`, `getSubFooterMenus`, `getAdminMenus`, `getAdminDashboardMenu`, `shouldShowMenu`, `shouldShowMenuItem`, `filterMenuItems`, `processMenuTemplate`.
- **`MenuAPI`** ([menu.api.js](../src/api/menu.api.js)) — `list()` (limit 100) and `single(id)` against `ENDPOINTS.MENU`.

---

## Only in Acato's

Nothing exclusive in the file list — Acato simply does less. The only Acato-specific *behavior* worth flagging:

- The Acato `AcDrawer` correctly wires `aria-labelledby` to the heading id (a11y win).
- The Acato breadcrumb's skip-link uses `${location.pathname}#main` so the anchor target is page-scoped; ours uses `#main`. Acato's form is more robust if the page has multiple regions sharing the same id, but `#main` is the more conventional pattern.

---

## Recommendation

**Keep ours** for the entire navigation/menu system. Ours is strictly a superset and the dynamic menu system is a deliberate, load-bearing feature (positions, hideBefore/AfterLogin, group filtering, template processing, secondary nav, dynamic sidenav). Acato has no equivalent and no upstream improvements to backport.

Per-file recommendations:

| Concern | Action |
|---|---|
| `AcHeader`, `AcNavigation`, `AcFooter` | **Keep ours.** Backend-driven menu is required for our admin/auth features. |
| `AcBreadcrumbs` | **Keep ours.** It covers everything Acato covers, plus all our extra routes, and the SPA `navigate()` click handler is an improvement. Optional micro-port: add Acato's `/sitemap` case if we ever bring back a sitemap view (currently we have none — see category 22). |
| `AcDrawer` | **Keep ours, but backport Acato's `aria-labelledby` + heading id.** Cheap a11y fix worth taking. |
| `AcSideNav` (ours-only legacy) | **Needs decision — likely delete.** `ConDynamicSidenav` covers it dynamically. Verify no remaining imports before removal. |
| Icon-mapping helper duplicated between `AcHeader` and `ConDynamicSidenav` | **Needs decision (internal cleanup, unrelated to Acato merge).** Extract into a shared utility. |
| SCSS | **Keep ours.** Style divergence follows from the structural differences above. |

**Business decisions to flag:**
- None. This category is pure infrastructure: Acato has no shared user base or admin panel that would justify their static-array approach for our merged codebase.

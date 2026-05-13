# Analysis: Public / static files

## Branches Compared
- Ours (tilburg-woo-ui): `softwarecatalogus-performance`
- Acato (tilburg-woo-ui_acato): `main`

## Files Compared

**Both repos:**
- `public/index.html`
- `public/robots.txt`
- `public/.htaccess`
- `public/favicon.svg`
- `public/home-hero-background.png`

**Ours only:**
- `public/runtime-config.js`
- `public/card-placeholder-1.png`
- `public/card-placeholder-2.png`
- `public/card-placeholder-3.png`
- `public/about-tilburg-placeholder.png`
- `public/vng-favicon.ico`
- `static/fonts/avenir-lt-w01-55-roman.woff2`

**Acato only:**
- `public/placeholder.png`

> Acato has no `static/` directory at all. Our `static/` directory exists solely to host one Avenir font file referenced from [src/styles/global/_fontfaces.scss:134](../src/styles/global/_fontfaces.scss#L134).

---

## What is the same

- **`public/robots.txt`** — byte-identical (`md5: 50d8a01…`). Both files are the same 23-byte permissive `User-agent: * / Disallow:` stub.
- **`public/favicon.svg`** — byte-identical (`md5: 7de552d…`, 375 KB).
- **`public/home-hero-background.png`** — byte-identical (`md5: 6d65633…`, 1.4 MB). Both repos load it from the same path (`/home-hero-background.png`) in [ac-hero.js](../src/components/ac-hero/ac-hero.js#L78).
- **`public/index.html`** common shell — `<!DOCTYPE html>`, `<html lang="nl" translate="no">`, the same set of meta tags (charset, X-UA-Compatible, viewport, format-detection, description), the same favicon SVG fallback link, the same `dns-prefetch` placeholders for `%API_URL%` and `%STORAGE_URL%`, the same Apple/Android touch-icon and webmanifest block under `/meta/`, the same `mask-icon` with color `#0091c5`, `theme-color #ffffff`, `<base href="/">`, the same external font kit preconnect/link (`cdn.fonts.net/kit/98d15e86-…`), and the same `<noscript>` + `<div id="root">` body. The differences are confined to the small set of insertions below.
- **`public/.htaccess`** — the vast majority is identical: `Options`/`ServerSignature` block, the same set of base security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Set-Cookie HttpOnly/Secure/SameSite=Lax, X-Permitted-Cross-Domain-Policies, Feature-Policy, Permissions-Policy), the same generic / HTML / MIME / `mod_expires` / GZIP blocks, the same 1-year font cache and 4-week image cache `FilesMatch` rules, the same `Limit GET` / deny-everything-else block, the same PHP and `mod_speling` blocks, and the same SPA `RewriteRule ^ /index.html [L]` fallback.

## What differs

### `public/index.html`

| Concern | Ours | Acato |
|---|---|---|
| Cache-busting meta tags | Adds `<meta name="build-timestamp" content="%BUILD_TIMESTAMP%">` and `<meta name="build-version" content="%BUILD_VERSION%">` (lines 17–19). Filled in by our build pipeline; ties into the `CACHE-BUSTING-GUIDE.md` system. | Absent. |
| Favicon links | Both favicon links carry `id` attributes (`id="favicon"` for SVG, `id="faviconMeta"` for the `.ico`). Lets runtime JS swap the favicon via `getElementById`. | Same two links, but without the `id` attributes, so they can't be swapped at runtime. |
| Runtime config bootstrap | Inlines `<script src="%PUBLIC_URL%/runtime-config.js"></script>` in `<head>` (line 76), **before** the React bundle. This is the entry point of the runtime-config system (see [generate-runtime-config.js](../scripts/generate-runtime-config.js) and [container.constants.js](../src/constants/container.constants.js)). | No runtime-config script. Acato relies purely on build-time webpack env injection. |
| Analytics in `<body>` | Inlines a 24-line Piwik Pro Analytics bootstrap (lines 80–104) that reads `%PIWIK_SRC_URL%`, `%PIWIK_DATA_LAYER%`, and `%PIWIK_ID%` placeholders. If any value is missing it logs an error or no-ops; otherwise it injects the Piwik tag script and seeds `window[dataLayerName]`. | Inlines a one-liner `<script async src="https://siteimproveanalytics.com/js/siteanalyze_6006199.js"></script>` — Siteimprove instead of Piwik. |
| `<body>` element | `<body id="body">` — extra DOM id (handy for global selectors). | `<body>` — no id. |

Both index.html files leave `<title>` empty; the title is set at runtime.

### `public/.htaccess`

Three meaningful differences. The other diffs are whitespace / comment phrasing only.

1. **`X-XSS-Protection` (line 17)**
   - Ours: `Header set X-XSS-Protection "1; mode=block"` (legacy enabled-and-block setting).
   - Acato: `Header set X-XSS-Protection 0` (explicitly disabled).
   - Modern OWASP / browser guidance is to set it to `0`, because the legacy XSS Auditor has been removed from Chromium and could itself be abused as an oracle on the few browsers that still ship it. Acato's value is the current recommendation; ours is the legacy one.

2. **HSTS header (line 33–34)**
   - Ours: `Header set Strict-Transport-Security "…" env=HTTPS` — only emitted when the request is already HTTPS (avoids accidental HSTS upgrade on plain HTTP responses).
   - Acato: `Header always set Strict-Transport-Security "…"` — emitted on every response, including 4xx/5xx and HTTP.
   - Practical effect is mostly the same since `RewriteRule` upgrades insecure requests and `block-all-mixed-content` is enforced in CSP, but the `env=HTTPS` form is technically more correct per RFC 6797 (HSTS must not be sent over insecure transport, and only the `always` flag delivers it on error pages).

3. **Content-Security-Policy (line 37 ours / 36 Acato)** — large divergence driven by feature differences. Side-by-side breakdown per directive:

   | Directive | Ours adds vs Acato | Acato adds vs Ours |
   |---|---|---|
   | `default-src` | `*.opencatalogi.nl`, `*.commonground.nu`, `opencatalogi.open-regels.nl`, `nextcloud.local` | — |
   | `style-src` | `nextcloud.local` | — |
   | `script-src` | — | — (both `'self' siteimproveanalytics.com`) |
   | `font-src` | `nextcloud.local` | — |
   | `img-src` | `*.opencatalogi.nl`, `nextcloud.open-regels.nl`, `https://vng.nl`, `https://migrato.nl`, `https://dimpact.nl`, `https://rotterdam.nl` | `*.digitaloceanspaces.com` |
   | `connect-src` | `*.opencatalogi.nl`, `nextcloud.open-regels.nl`, `nextcloud.local` | — |

   Notes:
   - Both keep `script-src 'self' siteimproveanalytics.com`, even though our `index.html` injects Piwik (not Siteimprove) and Acato's injects Siteimprove. Our CSP therefore allows a script our HTML never loads (Siteimprove) but does **not** allow our actual analytics (Piwik). If `%PIWIK_SRC_URL%` resolves to anything outside `'self'`, browsers will block it under the current CSP. This is worth flagging — see Recommendation.
   - Both repos whitelist `*.rollbar.com` and `*.commonground.nu` in `connect-src`. The Rollbar entry is load-bearing for us (matches the [rollbar dependency](../package.json) and `ENABLE_ROLLBAR` toggle) and appears to be a leftover in Acato — they ship no Rollbar code. Ours additionally widens `connect-src` for opencatalogi APIs and Nextcloud (the chat/nextcloud-auth feature in category 14/16), which Acato lacks.
   - Acato's `*.digitaloceanspaces.com` (img-src only) implies their deployment hosts images on DigitalOcean Spaces; we don't, so we don't need it.

The header set is otherwise identical. There is no difference in Feature-Policy, Permissions-Policy, Referrer-Policy, Set-Cookie hardening, gzip/deflate, MIME mapping, `mod_expires`, or the SPA rewrite rule.

## Only in ours

- **`public/runtime-config.js`** — auto-generated stub that defines `window.RUNTIME_CONFIG = { … }` (≈ 55 keys covering site identity, auth flags, feature toggles, Rollbar config, Chat/GEMMA endpoints, Nginx upstreams, theme variant, footer copy, etc.). Loaded synchronously before the React bundle via `<script src="%PUBLIC_URL%/runtime-config.js">` and consumed by [container.constants.js](../src/constants/container.constants.js#L363) (`getRuntimeConfig`). Generated at container start by [scripts/generate-runtime-config.js](../scripts/generate-runtime-config.js); the file checked into `public/` is a development-mode template (note `"SITE_TITLE": "Hot Reload Development 🔥"`). This is the foundation of our env-var-driven multi-tenant deployment story and has no equivalent in Acato.

- **`public/card-placeholder-1.png`, `card-placeholder-2.png`, `card-placeholder-3.png`** — three card-sized placeholder images (~160–180 KB each). **No references found anywhere in the repo** (searched `src/`, `public/`, `config/`, `scripts/`, `helm/`, all `.js/.scss/.html/.yaml/.tpl/.conf` files). They may be intended for runtime use through a future configurable card image, or be a leftover from a removed design iteration. Treat as unused until proven otherwise.

- **`public/about-tilburg-placeholder.png`** — large (~310 KB) image. **No references found in the repo.** Same situation as the card placeholders.

- **`public/vng-favicon.ico`** — VNG-branded favicon (`.ico`). **No references found in the repo** — index.html points to `%PUBLIC_URL%/favicon.svg` and `%PUBLIC_URL%/meta/favicon.ico`, not this file. Likely intended for runtime favicon swapping via the `id="favicon"` / `id="faviconMeta"` hooks plus the `FAVICON_URL` runtime-config key, but I could not find code that actually performs the swap. Worth verifying with whoever added the runtime-config theming hooks.

- **`static/fonts/avenir-lt-w01-55-roman.woff2`** — Avenir LT W01 55 Roman, 17 KB. Referenced exactly once from [src/styles/global/_fontfaces.scss:134](../src/styles/global/_fontfaces.scss#L134) (`url("../../../static/fonts/avenir-lt-w01-55-roman.woff2") format("woff2")`). The path `../../../static/fonts/…` walks out of `src/styles/global/` to the repo-root `static/` directory, which is why this folder exists outside `public/`. Acato's font stack does not include Avenir.

## Only in Acato's

- **`public/placeholder.png`** — single generic placeholder (~330 KB). **No references found** in `src/` or `public/` of Acato either. **However**, our mock theme data in [src/stores/themes.store.js:22–40](../src/stores/themes.store.js#L22-L40) references `'/placeholder.png'` four times. That path resolves to **a 404 in our build** (we have no `public/placeholder.png`), whereas Acato's repo has the file. This is the only case in this category where Acato has an asset we should arguably copy in: it would silently fix a broken image whenever `ENABLE_MOCK_THEMES` is on and the themes API is unavailable.

## Recommendation

| Item | Decision | Reason |
|---|---|---|
| `public/robots.txt` | **No action.** | Byte-identical. |
| `public/favicon.svg` | **No action.** | Byte-identical. |
| `public/home-hero-background.png` | **No action.** | Byte-identical. |
| `public/index.html` — cache-busting meta, `id` on favicon links, runtime-config `<script>`, Piwik snippet, `id="body"` | **Keep ours.** | All five are load-bearing for our runtime-config / cache-busting / Piwik integration. Acato has no equivalent and nothing to backport on this file. |
| `public/index.html` — Siteimprove `<script>` (Acato only) | **Skip.** | We've already replaced it with Piwik Pro. Don't reintroduce. |
| `.htaccess` — X-XSS-Protection | **Take from Acato (`0`).** | Modern security guidance is to disable XSS Auditor. The legacy `"1; mode=block"` we ship is at best a no-op and at worst exposes XSS-auditor side-channel bugs on older Chromium. Low risk, defensive improvement. **Needs a quick security sign-off**, then can be a one-line change. |
| `.htaccess` — HSTS `env=HTTPS` vs `always set` | **Keep ours.** | `env=HTTPS` is more correct per RFC 6797. No reason to switch to `always`. |
| `.htaccess` — CSP | **Keep ours, but fix `script-src`.** | Our CSP correctly carries the extra domains we need (opencatalogi, commonground, nextcloud, rollbar, vng/migrato/dimpact/rotterdam image hosts). **Issue to fix:** `script-src` still lists `siteimproveanalytics.com` (legacy) and does not list the Piwik host — when Piwik is enabled via runtime-config, browsers will block its script unless `%PIWIK_SRC_URL%`'s host resolves to `'self'`. Either (a) add the Piwik host to `script-src` (and ideally remove `siteimproveanalytics.com`), or (b) confirm in deployment that Piwik is served from the same origin. **Needs a human decision** on which Piwik hosts to whitelist. |
| `.htaccess` — `*.digitaloceanspaces.com` img-src (Acato only) | **Skip.** | Acato-specific storage backend; we don't use DigitalOcean Spaces. |
| `public/runtime-config.js` | **Keep ours.** | Foundational for our multi-tenant deployment. No Acato equivalent. |
| `public/card-placeholder-1/2/3.png`, `about-tilburg-placeholder.png` | **Needs decision.** | Currently unreferenced in the codebase. Either (a) find/restore the code that consumed them and keep, or (b) delete to shed ~800 KB of dead bytes. **Don't silently drop without checking with whoever added them** — they may be loaded via runtime-config or external CMS content. |
| `public/vng-favicon.ico` | **Needs decision.** | Unreferenced today; the `id="favicon"` + `FAVICON_URL` infrastructure suggests it was meant for runtime favicon swapping. Either wire up the swap (small JS hook reading `FAVICON_URL` and replacing `document.getElementById('favicon').href`) or delete the asset. |
| `static/fonts/avenir-lt-w01-55-roman.woff2` | **Keep ours.** | Actively referenced from `_fontfaces.scss`. |
| `public/placeholder.png` (Acato only) | **Take from Acato — small but real fix.** | Drops a 404 in our mock-themes flow ([themes.store.js:22–40](../src/stores/themes.store.js#L22-L40)). Alternative: change the mock data to reference one of our existing placeholders (e.g. `card-placeholder-1.png`) and delete the broken refs instead — that ties this decision to the "unreferenced placeholders" decision above. |

### Items requiring a human decision (not just technical)

1. **Which Piwik hosts to whitelist in the production CSP `script-src`?** Today the CSP allows `siteimproveanalytics.com` but our HTML loads Piwik. Either the Piwik script is being silently blocked in production, or the deployment serves it from `'self'`. Confirm with whoever owns analytics.
2. **What is the intended use of `card-placeholder-1/2/3.png`, `about-tilburg-placeholder.png`, and `vng-favicon.ico`?** They're shipped to `/usr/share/nginx/html/` but nothing in the repo references them. Either un-orphan them or delete.
3. **For mock theme images** (`/placeholder.png`), pick: copy Acato's `placeholder.png` into our `public/`, or change the mock data to reference an asset we already ship.

# Security Audit

**Date:** 2026-05-11  
**Scope:** tilburg-woo-ui (`softwarecatalogus-performance` branch) — primary focus, with notes on tilburg-woo-ui_acato (`main`)  
**Type:** Static analysis — no runtime testing performed

---

## Summary

| Severity | Count |
|---|---|
| Critical | 1 |
| High | 3 |
| Medium | 4 |
| Low / Info | 4 |

The most serious findings are in the CORS configuration and token storage. The XSS surface is relatively well-managed (DOMPurify is consistently used) but a few gaps exist. Acato's codebase has no auth system and therefore a much smaller attack surface.

---

## Critical

### C1 — CORS reflects any origin with credentials enabled

**File:** [config/nginx.conf.template](tilburg-woo-ui/config/nginx.conf.template)

The API proxy block reflects the request's `Origin` header back verbatim in `Access-Control-Allow-Origin`, combined with `Access-Control-Allow-Credentials: true`:

```nginx
add_header Access-Control-Allow-Origin $http_origin always;
add_header Access-Control-Allow-Credentials true always;
```

This is equivalent to `Access-Control-Allow-Origin: *` with credentials, which browsers block when you use `*` explicitly — but reflect-origin bypasses that protection. Any website the user visits can silently make credentialed cross-origin requests to this proxy (including cookie-authenticated API calls) and read the response. This is a classic CORS misconfiguration enabling cross-site request forgery and credential theft.

**Fix:** Maintain an explicit allowlist of permitted origins and only reflect the incoming origin if it is in that list:
```nginx
map $http_origin $cors_origin {
    default "";
    "https://your-domain.nl"    $http_origin;
    "https://other-allowed.nl"  $http_origin;
}
add_header Access-Control-Allow-Origin $cors_origin always;
```

---

## High

### H1 — Auth token cookie missing `Secure` flag

**File:** [src/stores/user.store.js:287](tilburg-woo-ui/src/stores/user.store.js#L287)

```js
document.cookie = `openconnector_access_token=${data.access_token}; path=/; SameSite=Lax`;
```

The `openconnector_access_token` cookie — the app's primary authentication credential — is set without the `Secure` flag. It will be transmitted over plain HTTP if the user ever lands on the domain without HTTPS (misconfigured redirect, internal network, development). The Nextcloud tokens set in `ac-nextcloud-authorization.js` do use `secure: true` via `setCookie()`, so this inconsistency appears to be an oversight.

**Fix:** Add `; Secure` to the cookie string, or use the existing `setCookie()` utility which handles the `secure` option.

---

### H2 — Access tokens stored in localStorage

**File:** [src/utilities/ac-storage.js:6-7](tilburg-woo-ui/src/utilities/ac-storage.js#L6)

```js
const _type_of_storage = process.env.STORAGE || 'local';
const _storage = window[`${_type_of_storage}Storage`];
```

`AcGetState` / `AcSaveState` default to `localStorage`. Access tokens (`ACCESS_TOKEN`, `IMPERSONATED_ACCESS_TOKEN`, `XUSR_TOKEN`) are stored there. `localStorage` is accessible to all JavaScript running on the page, including browser extensions and any injected scripts. A single XSS anywhere in the app exfiltrates all tokens persistently (they survive tab closes).

**Fix:** Store tokens in `sessionStorage` (gone on tab close) or, ideally, in `httpOnly` cookies managed server-side. If `localStorage` is required for UX reasons, pair it with a strict CSP to reduce XSS risk.

---

### H3 — Nextcloud OAuth tokens set with `httpOnly: false`

**File:** [src/views/ac-nextcloud-authorization/ac-nextcloud-authorization.js:125-137](tilburg-woo-ui/src/views/ac-nextcloud-authorization/ac-nextcloud-authorization.js#L125)

```js
setCookie('nextcloud_access_token', access_token, expires_in, {
    secure: true,
    httpOnly: false,   // explicit
    sameSite: 'strict',
});
```

`httpOnly: false` is explicitly set on all three Nextcloud cookies (`nextcloud_access_token`, `nextcloud_refresh_token`, `nextcloud_user_id`). `httpOnly` cookies are inaccessible to JavaScript — removing that protection means XSS can read and exfiltrate these tokens. The tokens are read by `getCookie()` in several stores, which requires JS access — but the correct fix is to move token-reading server-side or to an httpOnly approach, not to leave long-lived OAuth tokens readable by JS.

**Note:** Since `document.cookie` cannot set a truly httpOnly cookie (that's a server-side concept), the right fix here is to have the backend set these cookies after the OAuth exchange, not the frontend.

---

## Medium

### M1 — Missing security headers: CSP, HSTS, Referrer-Policy

**File:** [config/nginx.conf.template](tilburg-woo-ui/config/nginx.conf.template)

Current headers:
```nginx
add_header X-Content-Type-Options nosniff always;   # good
add_header X-Frame-Options DENY always;             # good
add_header X-XSS-Protection "1; mode=block" always; # deprecated, ignored by modern browsers
```

Missing:
- **`Content-Security-Policy`** — the most effective XSS mitigation. Without it, any injected script executes freely.
- **`Strict-Transport-Security`** — no HSTS means browsers will accept HTTP, enabling downgrade attacks where the `Secure` cookie fix (H1) can be bypassed.
- **`Referrer-Policy`** — URL parameters (including `redirect_url` tokens) can leak to third parties via the Referer header.
- **`Permissions-Policy`** — no restriction on browser feature access (camera, geolocation, etc.).

`X-XSS-Protection` was removed from Chrome in 2019 and Firefox never implemented it. It should be removed to avoid false confidence.

**Fix (minimum viable):**
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; ..." always;
# remove X-XSS-Protection
```

CSP will require tuning based on actual script/style sources (inline styles from design systems, etc.).

---

### M2 — `dangerouslySetInnerHTML` with unsanitized DOM clone

**File:** [src/views/con-beheer-views/con-beheer-views.js:87, :1154](tilburg-woo-ui/src/views/con-beheer-views/con-beheer-views.js#L87)

```js
const clonedContainer = container.cloneNode(true);   // line 87
setFrozenViewHtml(clonedContainer.outerHTML);

// later:
dangerouslySetInnerHTML={{ __html: frozenViewHtml }}  // line 1154
```

`frozenViewHtml` is cloned from a DOM element (`#graph-container`) that React rendered, then re-injected unsanitized. In normal flow the content is only what React wrote, so the risk is low. However, if any upstream API response injects HTML into the graph (e.g. via a label or tooltip field that gets rendered into the graph container), that HTML would be re-rendered without sanitization. This is an indirect XSS vector.

Compare: `con-template-text.js` correctly wraps its `dangerouslySetInnerHTML` with `AcSanitizeHtml()`.

**Fix:** Wrap with `AcSanitizeHtml()` for consistency, or replace with a React-rendered frozen snapshot.

---

### M3 — Basic auth credentials accessible on `window.app`

**File:** [src/stores/chat.store.js:74-82](tilburg-woo-ui/src/stores/chat.store.js#L74)

```js
if (window.app && window.app.store && window.app.store.user &&
    window.app.store.user.basicAuthCredentials) {
    const basicAuth = window.app.store.user.basicAuthCredentials;
    const credentials = btoa(`${basicAuth.username}:${basicAuth.password}`);
    headers.Authorization = `Basic ${credentials}`;
}
```

The global `window.app` exposes the full MobX store tree including plaintext credentials. Any XSS, browser extension, or third-party script can call `window.app.store.user.basicAuthCredentials` to extract credentials. The same pattern exists in `config/index.js`.

**Fix:** Remove the global store reference from `window`. Pass credentials through a context or store accessor that does not expose the raw username/password, and remove the basic auth fallback once Bearer token support is complete (see the `TODO` in `config/index.js:106`).

---

### M4 — `redirect_url` read from sessionStorage without validation

**File:** [src/views/ac-nextcloud-authorization/ac-nextcloud-authorization.js:75-143](tilburg-woo-ui/src/views/ac-nextcloud-authorization/ac-nextcloud-authorization.js#L75)

```js
const redirect_url = sessionStorage.getItem('redirect_url');
sessionStorage.removeItem('redirect_url');
// ...
navigate(redirect_url);  // line 143
```

The redirect URL comes from sessionStorage (set by another part of the app before the OAuth flow). `navigate()` from react-router-dom only handles in-app routes, so this cannot redirect to `https://evil.com`. However, it can navigate to any path within the app, including admin routes. If an attacker can control sessionStorage contents (via another XSS), they could redirect a user to a sensitive internal page post-login.

Risk is low but this is worth validating: confirm the value is a relative path before navigating.

---

## Low / Informational

### L1 — `dompurify` version behind Acato's

**File:** [package.json](tilburg-woo-ui/package.json)

Our version is `^3.1.4`, Acato pins `3.2.4`. DOMPurify 3.2.x includes security fixes. This was already flagged in the dependency analysis — prioritise the bump.

---

### L2 — `rollbar-sourcemap-webpack-plugin` uploads source maps to Rollbar

**File:** [package.json](tilburg-woo-ui/package.json) (devDependency)

If source maps are uploaded to Rollbar in production builds, any party with access to the Rollbar account (or a leaked Rollbar token) can read the original unminified source code. Verify the plugin is only configured when `ENABLE_ROLLBAR=true` and that the `ROLLBAR_KEY` is rotated if it has ever appeared in any committed config file.

---

### L3 — `X-XSS-Protection` header should be removed

**File:** [config/nginx.conf.template:29](tilburg-woo-ui/config/nginx.conf.template#L29)

`X-XSS-Protection "1; mode=block"` is ignored by all modern browsers and in some edge cases has been used to introduce XSS via the IE XSS auditor. Remove it and replace with CSP (M1).

---

### L4 — TODO: Bearer token endpoint still uses basic auth fallback

**File:** [src/config/index.js:106](tilburg-woo-ui/src/config/index.js#L106)

```js
// TODO: Implement Bearer token endpoint in OpenConnector to replace basic auth
```

Basic auth sends credentials on every request and is weaker than short-lived Bearer tokens. The fallback also drives the M3 issue. Completing this TODO removes both the basic auth surface and the need to store credentials in the global store.

---

## Acato comparison

Acato's codebase has **none of the above issues** primarily because it has no authentication system. It uses DOMPurify in the same way we do, has no `dangerouslySetInnerHTML` usage, and no token/cookie handling. The CORS and nginx issues don't apply (Apache static-file server, no proxy). From a security perspective Acato's codebase is simpler and therefore cleaner — but only because it intentionally lacks the features that create the attack surface.

---

## Recommended fix order

1. **C1** — CORS origin allowlist (nginx config change, no code deploy needed)
2. **H1** — Add `Secure` flag to `openconnector_access_token` cookie
3. **M1** — Add HSTS + Referrer-Policy headers (nginx config change)
4. **H2/H3** — Token storage architecture (requires backend coordination — move OAuth cookie-setting server-side)
5. **M3** — Remove `window.app` / complete Bearer token TODO
6. **L1** — Bump `dompurify` to `3.2.4`
7. **M2** — Sanitize `frozenViewHtml`
8. **M4** — Validate `redirect_url` is a relative path
9. **M1 cont.** — Add CSP (requires audit of all script/style sources first)

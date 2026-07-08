// Post-build for the Portaliq portal variant: make the CRA `public_html/index.html`
// hostable under Nextcloud's /index.php/apps/portaliq/portal mount (zero NC chrome).
// Run after `PUBLIC_URL=/index.php/apps/portaliq/portal node scripts/build.js`.

const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, '..', 'public_html');
const indexPath = path.join(dir, 'index.html');
let h = fs.readFileSync(indexPath, 'utf8');

// 1. drop <base href="/"> — breaks subpath asset resolution + the router basename.
h = h.replace(/<base[^>]*>/g, '');
// 2. drop the external cdn.fonts.net preconnect + stylesheet (CSP-blocked; not needed).
h = h.replace(/<link[^>]*cdn\.fonts\.net[^>]*>/g, '');
// 3. drop root-absolute /meta/* icons + /favicon.svg; keep id-bearing favicon
//    placeholders (boot code references them) pointed at a harmless data URI.
h = h.replace(/<link[^>]*href="\/meta\/[^"]*"[^>]*>/g, '');
h = h.replace('<link id="favicon" rel="shortcut icon" href="/favicon.svg"/>',
  '<link id="favicon" rel="shortcut icon" href="data:,"/>');
h = h.replace(/<link id="faviconMeta"[^>]*>/,
  '<link id="faviconMeta" rel="shortcut icon" href="data:,"/>');
// 4. strip the inline analytics (Matomo/Piwik) snippet — it is empty here and its
//    inline execution is blocked by the strict same-origin CSP.
h = h.replace(/<script(?![^>]*\ssrc=)[^>]*>[\s\S]*?<\/script>/g, '');
// 4b. strip external analytics (siteimprove) — the strict same-origin CSP blocks
//     it anyway, so remove it to keep the portal console clean.
h = h.replace(/<script[^>]*\ssrc="https?:\/\/[^"]*(siteimprove|analytics)[^"]*"[^>]*><\/script>/gi, '');
// 5. repoint runtime-config.js to the portal mount (must not 404 at root).
h = h.replace('src="/runtime-config.js"', 'src="/index.php/apps/portaliq/portal/runtime-config.js"');

fs.writeFileSync(indexPath, h);

// 6. write the portal runtime-config (theme + portalMode flag).
fs.writeFileSync(path.join(dir, 'runtime-config.js'),
  'window.RUNTIME_CONFIG = { themeVariant: "vng", portalMode: true };\n');

console.log('portal post-build: index.html hostable, runtime-config written');

/**
 * Router basename resolution.
 *
 * The SPA is mounted at different paths per deployment: the standalone
 * Open-Tilburg / Softwarecatalogus site is served from the web root (see
 * `location /` in config/nginx.conf.template and `homepage` in package.json),
 * while a deployment hosted under a Nextcloud app path (Portaliq's `/woo`)
 * sets its basename in runtime-config.js.
 *
 * The former Portaliq portal mode, mounted at /index.php/apps/portaliq/portal,
 * is retired: Portaliq stopped serving it in July 2026 and its /portal address
 * now redirects to its own site renderer at /index.php/apps/portaliq/site.
 *
 * A basename that does not prefix the current URL makes react-router match
 * nothing and render an empty page — the failure is silent apart from a console
 * warning, which is why this is kept as a pure function with tests rather than
 * inlined at the render call.
 */

/** Standalone deployments are served from the web root. */
export const DEFAULT_STANDALONE_BASENAME = '/';

/**
 * Resolve the react-router basename for the current deployment.
 *
 * Resolution order:
 *   1. runtimeConfig.routerBasename  — camelCase, for a hand-written runtime-config.js
 *   2. runtimeConfig.ROUTER_BASENAME — UPPER_SNAKE, written by scripts/generate-runtime-config.js
 *   3. the web root
 *
 * @param {Object} [runtimeConfig] - window.RUNTIME_CONFIG, may be undefined.
 * @returns {string} basename to hand to <Router>.
 */
export const resolveRouterBasename = (runtimeConfig) => {
  const configured =
    runtimeConfig &&
    (runtimeConfig.routerBasename || runtimeConfig.ROUTER_BASENAME);

  // An empty string is a valid-looking but broken basename, so treat only a
  // non-empty string as configured.
  if (typeof configured === 'string' && configured.trim() !== '') {
    return configured;
  }

  return DEFAULT_STANDALONE_BASENAME;
};

/**
 * True when `pathname` is served by `basename`.
 *
 * Mirrors react-router's own check. Useful as a startup assertion: if this is
 * false the router will render nothing.
 *
 * @param {string} basename
 * @param {string} pathname
 * @returns {boolean}
 */
export const basenameMatchesPath = (basename, pathname) => {
  if (!basename || basename === '/') return true;
  if (typeof pathname !== 'string') return false;

  const normalised = basename.endsWith('/') ? basename.slice(0, -1) : basename;
  return pathname === normalised || pathname.startsWith(`${normalised}/`);
};

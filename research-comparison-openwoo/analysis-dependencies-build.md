# Analysis — Dependencies & Build Tooling

**Scope:** `package.json`, webpack configs, babel config, ESLint/Prettier config, Dockerfile(s), helm chart, runtime-config generation, CI workflow, nginx template, dev-server config, build scripts.

---

## 1. Files compared

| File | Ours (`tilburg-woo-ui/`) | Theirs (`openwoo-tilburg-ui/`) |
|---|---|---|
| Package manifest | [package.json](../package.json) | [package.json](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/package.json) |
| App manifest | [app.json](../app.json) | [app.json](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/app.json) |
| Yarn pin | [.yarnrc.yml](../.yarnrc.yml) | [.yarnrc.yml](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/.yarnrc.yml) |
| Prettier | [.prettierrc.json](../.prettierrc.json) | [.prettierrc.json](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/.prettierrc.json) |
| TS/JS path config | [jsconfig.json](../jsconfig.json) | [jsconfig.json](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/jsconfig.json) |
| ESLint | [.eslintrc.cjs](../.eslintrc.cjs) | [.eslintrc](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/.eslintrc) |
| Babel | [.babelrc](../.babelrc) | *(none — relies on webpack inline)* |
| Webpack prod | [config/webpack.config.prod.js](../config/webpack.config.prod.js) | [config/webpack.config.prod.js](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/config/webpack.config.prod.js) |
| Webpack dev | [config/webpack.config.dev.js](../config/webpack.config.dev.js) | [config/webpack.config.dev.js](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/config/webpack.config.dev.js) |
| Webpack dev server | [config/webpackDevServer.config.js](../config/webpackDevServer.config.js) | [config/webpackDevServer.config.js](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/config/webpackDevServer.config.js) |
| Webpack env helper | [config/env.js](../config/env.js) | [config/env.js](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/config/env.js) |
| Webpack paths | [config/paths.js](../config/paths.js) | [config/paths.js](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/config/paths.js) |
| HTTPS helper | [config/getHttpsConfig.js](../config/getHttpsConfig.js) | [config/getHttpsConfig.js](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/config/getHttpsConfig.js) |
| Polyfills | [config/polyfills.js](../config/polyfills.js) | [config/polyfills.js](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/config/polyfills.js) |
| Build script | [scripts/build.js](../scripts/build.js) | [scripts/build.js](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/scripts/build.js) |
| Start script | [scripts/start.js](../scripts/start.js) | [scripts/start.js](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/scripts/start.js) |
| Container build | [Dockerfile](../Dockerfile) | [Dockerfile](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/Dockerfile) |

---

## 2. What's the same

Byte-identical (or only-whitespace-different):

- **[config/env.js](../config/env.js)** ≡ theirs (`diff` is empty).
- **[config/getHttpsConfig.js](../config/getHttpsConfig.js)** ≡ theirs.
- **[config/paths.js](../config/paths.js)** ≡ theirs.
- **[scripts/build.js](../scripts/build.js)** ≡ theirs.
- **[app.json](../app.json)** ≡ theirs (entry point identical).
- **[.yarnrc.yml](../.yarnrc.yml)** ≡ theirs (`nodeLinker: node-modules`).
- **[.prettierrc.json](../.prettierrc.json)** ≡ theirs (printWidth 85, singleQuote, trailingComma es5, tabWidth 2, jsxSingleQuote).
- **[jsconfig.json](../jsconfig.json)** — same path aliases on both sides. Ours adds `"jsx": "react"` and uses tab indentation; otherwise identical alias set.

Semantically equivalent / same shape:

- **Yarn version pin** — both pin `yarn@4.1.1`, both require `node >=18.17.0`.
- **Browserslist** — production/development targets identical.
- **`resolutions`** — both pin `react-error-overlay: 6.0.9`.
- **Preact aliasing** — both alias `react` / `react-dom` / `react/jsx-runtime` to `preact/compat` in webpack `resolve.alias`. Both keep the same `@src`/`@atoms`/`@components`/…/`@utils` alias set.
- **Webpack production pipeline shape** — both use: CompressionPlugin (gzip + brotli), HtmlWebpackPlugin (minified), InterpolateHtmlPlugin, DefinePlugin, MiniCssExtractPlugin, WebpackManifestPlugin (filter htaccess/pdf/xlsx/old), WorkboxWebpackPlugin.InjectManifest, ProgressBarPlugin, TerserPlugin, CssMinimizerPlugin, identical `optimization.splitChunks` cacheGroups (`vendors`, `resources`, `shared`, `utils`, `common`, `default` — same 75kb chunk caps, `moduleIds: 'named'`).
- **PostCSS chain** — both use `postcss-flexbugs-fixes`, `postcss-preset-env` (stage 3, flexbox no-2009), `postcss-normalize`.
- **SVG handling** — both use `@svgr/webpack` + `file-loader` with the same `issuer` filter.
- **CSS Modules** — both use `webpack-minimal-classnames` (`MinimalClassnameGenerator({ length: 3, excludePatterns: [/ad/i] })`) for production module-mode classname mangling.
- **Asset hashing layout** — same `static/js/[name].[chunkhash:8].js`, `static/css/[name].[contenthash:8].css`, `static/media/[hash:13][ext]` patterns.

---

## 3. What differs

### 3.1 `package.json` — metadata

| Field | Ours | Theirs |
|---|---|---|
| `license` | `EUPL-1.2` | `UNLICENSED` |
| `homepage` | `https://open-tilburg.nl` | `https://open.tilburg.nl` |
| `repository.url` | `bitbucket.org/acato/tilburg-woo-ui` | `bitbucket.org/acato/tilburg-woo-ui` *(stale — refers to Acato's old repo, not openwoo)* |

[package.json:5](../package.json#L5), [package.json:6](../package.json#L6) (ours); theirs at [package.json:5](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/package.json#lines-5:6).

### 3.2 `package.json` — scripts

Theirs declares only 4 scripts: `start`, `dev:web`, `build:web`, `analyze:bundle` (see [package.json:44-49](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/package.json#lines-44:49)).

Ours adds the lint/format toolchain ([package.json:44-57](../package.json#L44-L57)):
`lint`, `lint:fix`, `lint:check`, `format`, `format:check`, `validate`, `pre-commit`, `lint:full`.

### 3.3 `package.json` — runtime dependencies

**Shared on both sides:** `@amsterdam/design-system-css`, `@amsterdam/design-system-react`, `@loadable/component`, `@utrecht/component-library-react`, `axios`, `clsx`, `dayjs`, `dompurify`, `history`, `html-react-parser`, `mobx`, `mobx-react-lite`, `mobx-react-router`, `preact`, `react-focus-lock`, `react-router`, `react-router-dom`.

Version-pin divergences on the shared set:

| Package | Ours | Theirs |
|---|---|---|
| `axios` | `^1.6.7` | `1.13.2` (exact) |
| `dompurify` | `^3.1.4` | `3.2.4` (exact) |
| `@utrecht/component-library-react` | `9.0.3` (exact) | `^3.0.1-alpha.41` |

> ⚠️ `@utrecht/component-library-react` major divergence — ours is on the published `9.x` line, theirs is on a 3.0.1-alpha. We need to know whether Acato's NLDS layer expects the alpha range; if so, our pin will need to track theirs (or we accept that NLDS-imports in our codebase target a different API surface). → [D-002](DECISIONS.md#d-002).

**Only in theirs** — the modern per-component CSS packages from the Utrecht/NLDS design system. These collectively *replace* the deprecated `@utrecht/components` omnibus we still depend on; the NLDS convention is now to install only the per-component packages you use:
- `@utrecht/button-css ^2.3.1`
- `@utrecht/link-css ^1.6.1`
- `@utrecht/ordered-list-css ^1.5.2`
- `@utrecht/paragraph-css ^2.3.1`
- `@utrecht/unordered-list-css ^1.5.1`

**Only in ours** (Conduction additions, grouped by purpose — see [package.json:58-110](../package.json#L58-L110)):
- **Conduction/theme:** `@conduction/theme 1.1.49` (pinned), `@nl-design-system-unstable/rotterdam-design-tokens`.
- **GEMMA / Archimate:** `@arktect-co/archimate-diagram-engine`, `@conduction/archimate-diagram-engine`, `@joint/core`, `jointjs 3.4.2`, `svg-pan-zoom`. Load-bearing for [`con-gemma-*`](../src/) views.
- **Emotion / DenHaag NLDS:** `@emotion/react`, `@gemeente-denhaag/components-react`.
- **`@utrecht/components`** `^3.0.1-alpha.42` — **deprecated.** This was the omnibus SCSS package for NLDS Utrecht components; it has since been split into per-component CSS packages (`@utrecht/button-css`, `@utrecht/link-css`, `@utrecht/paragraph-css`, `@utrecht/ordered-list-css`, `@utrecht/unordered-list-css`, …). Acato has already migrated — they ship the new per-component packages (see "Only in theirs" below) and have dropped `@utrecht/components` entirely. We are still pulling the deprecated omnibus.
- **Markdown editor / rendering:** `@uiw/react-md-editor`, `react-markdown`, `rehype-sanitize`, `rehype-slug`, `remark-definition-list`, `remark-emoji`, `remark-gfm`, `remark-mark-highlight`, `remark-rehype`, `remark-supersub`. Powers the `beheer` content editor and rich-text rendering.
- **Forms / validation:** `ibantools`, `libphonenumber-js`, `react-select 5.8.0`, `react-tabs`, `react-tooltip`.
- **Lottie / animation:** `@lottiefiles/react-lottie-player`, `react-css-transition-replace`, `react-transition-group`, `blazy` (lazy-load).
- **Search / docs:** `fuse.js` (probably the glossary search).
- **File utilities:** `file-saver`, `focus-trap-react`.
- **Observability:** `rollbar` (Acato has the `rollbar-sourcemap-webpack-plugin` devDep but no runtime `rollbar` package — they kept the sourcemap upload plumbing without a client SDK; the plugin invocation is commented out on both sides).
- **CLI helper:** `npm-run-all`.

### 3.4 `package.json` — devDependencies

Theirs holds a tight set of 47 devDeps; ours has ~63. The shared core is large and lockstep on most build-time tooling.

**Identical or near-identical** (same major across the board): `@babel/cli`, `@babel/core 7.22.5`, `@babel/helper-module-imports`, `@babel/helper-module-transforms 7.22.5`, `@babel/plugin-proposal-decorators 7.22.5`, `@babel/plugin-transform-react-jsx 7.22.5`, `@babel/plugin-transform-runtime`, `@babel/preset-env 7.22.5`, `@babel/preset-react`, `@babel/types 7.22.5`, `babel-loader 9.1.2`, `babel-preset-mobx`, `bfj`, `case-sensitive-paths-webpack-plugin`, `compression-webpack-plugin`, `console-browserify`, `copy-webpack-plugin 11.0.0`, `css-loader 6.8.1`, `css-minimizer-webpack-plugin`, `dotenv`, `dotenv-expand`, `file-loader`, `html-webpack-plugin`, `import-glob-loader`, `node-polyfill-webpack-plugin`, `postcss`, `postcss-flexbugs-fixes`, `postcss-loader 7.3.3`, `postcss-normalize`, `postcss-preset-env`, `preload-webpack-plugin`, `prettier 2.8.8`, `progress-bar-webpack-plugin`, `react-dev-utils`, `react-scripts 5.0.1`, `react-svg-loader`, `react-test-renderer`, `resolve`, `resolve-url-loader`, `rollbar-sourcemap-webpack-plugin`, `sass 1.63.5`, `sass-loader 13.3.2`, `source-map-explorer`, `style-loader`, `svg-react-loader`, `sw-precache-webpack-plugin`, `terser-webpack-plugin 5.3.9`, `url-loader`, `webpack-cli 5.1.4`, `webpack-manifest-plugin`, `webpack-minimal-classnames`, `workbox-webpack-plugin`, `zlib`.

**Version divergences on the shared set:**

| Package | Ours | Theirs |
|---|---|---|
| `webpack` | `5.87.0` | `5.94.0` |
| `webpack-dev-server` | `^4.15.1` | `^5.2.2` (major bump) |
| `mini-css-extract-plugin` | `2.7.6` | `^2.9.2` |
| `postcss` | `8.4.24` | `8.4.31` |
| `@babel/runtime` | `7.22.5` | `7.27.4` |

**Only in ours:**
- `@babel/eslint-parser ^7.28.6`, `@eslint/js ^9.0.0`, `eslint ^8.57.0`, `eslint-import-resolver-alias`, `eslint-plugin-import`, `eslint-plugin-react`, `eslint-plugin-react-hooks` — full ESLint stack.
- `@babel/plugin-proposal-class-properties`, `@babel/plugin-proposal-private-methods`, `@babel/plugin-proposal-private-property-in-object` (the old *proposal* variants).
- `@babel/polyfill ^7.12.1` — deprecated; superseded by `core-js` (ours imports `core-js/stable` directly in [config/polyfills.js:3](../config/polyfills.js#L3)).
- `extract-text-webpack-plugin ^3.0.2` — deprecated; modern equivalent (`mini-css-extract-plugin`) is in both. Looks like a stale dep.

**Only in theirs:**
- `@babel/plugin-transform-class-properties`, `@babel/plugin-transform-private-methods`, `@babel/plugin-transform-private-property-in-object` — the *transform* (modern, non-proposal) variants of the same three plugins ours uses.

So Acato moved Babel plugins from `proposal-` to the official `transform-` names while we did not.

### 3.5 ESLint configuration

- Theirs ([.eslintrc](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/.eslintrc)): 17 lines, `plugin:react-app/recommended`, `babel-eslint` parser, single rule override (`react-app/jsx-a11y/href-no-hash: off`). Stale shape — `babel-eslint` is unmaintained, `plugin:react-app` is the legacy `react-scripts` config.
- Ours ([.eslintrc.cjs](../.eslintrc.cjs), 125 lines): runs the modern `@babel/eslint-parser` with explicit Babel options (decorators legacy, class-properties loose, etc.), pulls `eslint:recommended`, `plugin:react/recommended`, `plugin:react-hooks/recommended`, `plugin:import/recommended`. Aliases mirror webpack/jsconfig. Disables `react-hooks/exhaustive-deps` (project rule: "minimal deps only"), promotes `no-console` to error (allowlist warn/error/info/debug/group/groupEnd), keeps `react/prop-types` and `react/react-in-jsx-scope` off.

Ours also ships [.eslintignore](../.eslintignore) and a `scripts/lint.js` entry point + `lint:full` script invoking it.

### 3.6 Babel configuration

- Theirs: **no `.babelrc`**. Babel runs through `babel-loader` with `cacheDirectory: true` only — there are no presets configured. The build still works because `@babel/preset-env` + `@babel/preset-react` defaults are picked up elsewhere (likely from `react-scripts`'s baked config, which Babel loader will discover via `babel.config.js` lookup — but neither exists in their repo at the pinned commit). **This may actually be broken or rely on `react-scripts` magic** — flag for verification.
- Ours: explicit [.babelrc](../.babelrc): presets `@babel/env` + `@babel/react` (`importSource: "preact"`); plugins for legacy decorators, loose class-properties, loose private-methods, loose private-property-in-object, `@babel/plugin-transform-react-jsx` with `runtime: automatic, importSource: preact`, `@babel/plugin-transform-runtime`.

### 3.7 Webpack — production config

Both files are >700 lines and share the same skeleton (style-loader chain, oneOf rules, splitChunks, plugin order). Concrete differences in ours:

1. **Cache-busting build version** ([config/webpack.config.prod.js:62-75](../config/webpack.config.prod.js#L62-L75)):

   ```js
   const BUILD_VERSION = process.env.GITHUB_SHA
     ? `${process.env.GITHUB_RUN_NUMBER || 'build'}-${process.env.GITHUB_SHA.substring(0,7)}-${Date.now()}`
     : `${YYYY.MM.DD}-${Date.now()}`;
   ```

   Injected as `BUILD_TIMESTAMP` and `BUILD_VERSION` via both `DefinePlugin` and `InterpolateHtmlPlugin` raw vars; passed to Workbox `additionalManifestEntries` so the service worker treats every CI build as a new revision. Theirs has none of this.

2. **Piwik Pro variable injection** ([config/webpack.config.prod.js:109-125](../config/webpack.config.prod.js#L109-L125)) — always defines `PIWIK_SRC_URL`, `PIWIK_DATA_LAYER`, `PIWIK_ID` (empty fallback) so `InterpolateHtmlPlugin` can substitute `%PIWIK_*%` placeholders in `index.html`.

3. **Robust `dotenv` parse** — `dotenv.config().parsed || {}` ([config/webpack.config.prod.js:96](../config/webpack.config.prod.js#L96)) vs theirs `dotenv.config().parsed` (will throw if `.env` is missing — see [their:60](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/config/webpack.config.prod.js#lines-60)).

4. **Terser config**:
   - Theirs: `drop_console: true` ([their:603](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/config/webpack.config.prod.js#lines-603)).
   - Ours: `drop_console: false` + `pure_funcs: ['console.log', 'console.debug']` ([config/webpack.config.prod.js:693-694](../config/webpack.config.prod.js#L693-L694)). Effect: keeps `console.warn/error/info` calls in production while dropping `log`/`debug`.

5. **Workbox `dontCacheBustURLsMatching`** — theirs matches `\.[0-9a-f]{8}\.` (js only by default), ours widens to `\.[0-9a-f]{8,13}\.(js|css|woff|woff2|png|jpg|jpeg|gif|svg)$` ([config/webpack.config.prod.js:591-592](../config/webpack.config.prod.js#L591-L592)). Stops Workbox from cache-busting our 13-char-hash asset URLs.

6. **Unused imports** at the top of ours ([config/webpack.config.prod.js:11-25](../config/webpack.config.prod.js#L11-L25)): `CopyPlugin`, `ModuleScopePlugin`, `PreloadWebpackPlugin`, `getCSSModuleLocalIdent` are required but not referenced in the returned config. The `generateMinimalClassname` path is used for module SCSS instead. Cleanup candidate — not a behaviour diff.

7. **CSS module classnames** in prod — both use `generateMinimalClassname` (the `webpack-minimal-classnames` helper). So no behaviour diff there.

### 3.8 Webpack — development config

Both look CRA-derived and equivalent in plugin order, loader pipeline, and `output`. Only difference: ours runs the same Piwik Pro injection block as prod ([config/webpack.config.dev.js:56-74](../config/webpack.config.dev.js#L56-L74)) and uses `dotenv.config().parsed || {}` defensively. Otherwise the dev configs are byte-equivalent on plugin shape.

### 3.9 Webpack dev server config (`webpackDevServer.config.js`)

**Big divergence.**

- Theirs ([webpackDevServer.config.js, 10 lines](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/config/webpackDevServer.config.js)) — stub that returns `{}`. No host check, no proxy, no middleware, no static-dir serving.
- Ours ([webpackDevServer.config.js, 128 lines](../config/webpackDevServer.config.js#L1-L128)) — full CRA dev server: `allowedHosts`, CORS headers, `compress`, `static.directory + watch.ignored`, hot-reload websocket URL, `historyApiFallback`, `proxy`, `onBeforeSetupMiddleware` (evalSourceMapMiddleware + proxy setup hook), `onAfterSetupMiddleware` (`redirectServedPath`, `noopServiceWorkerMiddleware`), `https: getHttpsConfig()`.

Since theirs bumped to `webpack-dev-server 5.x`, several options ours uses (the `onBefore*` / `onAfter*` middleware hooks) are gone in WDS 5 — they were replaced with `setupMiddlewares`. Aligning would require both upgrading WDS and reshaping middleware registration.

### 3.10 `config/polyfills.js`

- Theirs ([polyfills.js:3](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/config/polyfills.js#lines-3)): top-level `import 'core-js/stable';` is **absent**.
- Ours ([polyfills.js:3](../config/polyfills.js#L3)) imports `core-js/stable` to polyfill the full ES feature set. The rest of the file is identical except tabs vs spaces.

### 3.11 `scripts/start.js`

Theirs has slightly more setup: it requires `semver` (Node version guard) and uses `getClientEnvironment(paths.publicUrlOrPath.slice(0, -1))` ([their:30-36](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/scripts/start.js#lines-30:36)). Ours drops those lines (no semver check, no env precompute) but keeps the unhandled-rejection guard. Effect on local dev only.

### 3.12 Dockerfile / runtime stack

**Theirs ([Dockerfile, 7 lines](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/Dockerfile)):**

```dockerfile
FROM httpd:2.4
# enable rewrite + deflate, AllowOverride All
COPY public_html /usr/local/apache2/htdocs/
```

A static Apache image that serves the pre-built `public_html/` directory. Build happens outside the container (CI runs `yarn build:web` first, then the image is built from the resulting assets).

**Ours ([Dockerfile, 87 lines](../Dockerfile)):** multi-stage `node:18.17.0-alpine → nginx:alpine`:

1. **Builder stage** ([Dockerfile:1-32](../Dockerfile#L1-L32)) — enables Corepack, pins Yarn 4.1.1, runs `yarn install --immutable`, generates runtime-aware container constants via `scripts/generate-container-constants.js`, then `yarn build:web`.
2. **Runtime stage** ([Dockerfile:34-87](../Dockerfile#L34-L87)) — nginx + Node (for runtime config script), copies `config/nginx.conf.template`, copies `scripts/` + `src/` into the image, embeds a `start-with-env.sh` that:
   - mkdir for nginx tmp/log,
   - runs `envsubst` over the nginx template to bake `NGINX_OPENCONNECTOR_UPSTREAM`, `NGINX_NEXTCLOUD_UPSTREAM`, `NGINX_NEXTCLOUD_DOMAIN`, `NGINX_TARGET_HOST`, `NGINX_ROOT_DIR`,
   - runs `node /usr/local/scripts/generate-runtime-config.js` to write `/usr/share/nginx/html/runtime-config.js` (loaded **before** the React bundle),
   - `exec nginx -g "daemon off;"`.

   Exposes port 81, includes a `HEALTHCHECK` (curl localhost:81).

The two stacks aren't interchangeable. Theirs assumes static hosting on Apache with a pre-built `public_html` tree. Ours assumes a Kubernetes pod that needs to read its config from env vars at container start (runtime config + nginx upstreams).

### 3.13 Build infrastructure entirely missing from theirs

All of the following are **only in ours** with no equivalent in `openwoo-tilburg-ui/`:

| Surface | Path(s) | Purpose |
|---|---|---|
| Dev Dockerfile | [Dockerfile.dev](../Dockerfile.dev) (113 lines) | Two-stage `development` (watch build + nginx, port 81) and `hot-reload` (webpack-dev-server, port 3000) images. |
| Docker Compose | [docker-compose.yml](../docker-compose.yml) (97 lines), [docker-compose.dev.yml](../docker-compose.dev.yml) (193 lines) | Local stack orchestration. |
| `.dockerignore` | [.dockerignore](../.dockerignore) | Build context filter. |
| Nginx template | [config/nginx.conf.template](../config/nginx.conf.template) (77 lines) | Runtime-templated nginx with API proxy and nextcloud routing. |
| Runtime config | [public/runtime-config.js](../public/runtime-config.js) (55 lines) | `window.RUNTIME_CONFIG` payload loaded before bundle. |
| Runtime config generator | [scripts/generate-runtime-config.js](../scripts/generate-runtime-config.js) (445 lines) | Emits `runtime-config.js` at container start from env vars / values.yaml. |
| Container constants generator | [scripts/generate-container-constants.js](../scripts/generate-container-constants.js) (484 lines) | Generates the runtime-aware `src/constants/container.constants.js` that reads `window.RUNTIME_CONFIG` at runtime (built into the bundle). |
| Manual / scripted lint | [scripts/lint.js](../scripts/lint.js), [scripts/manual-lint.sh](../scripts/manual-lint.sh) | Lint runners invoked by `lint:full`. |
| Runtime config smoke test | [scripts/test-runtime-config.sh](../scripts/test-runtime-config.sh) | |
| Helm chart | [helm/tilburg-woo-ui/](../helm/tilburg-woo-ui/) — `Chart.yaml v0.2.0`, templates: `configmap`, `deployment`, `hpa`, `ingress`, `networkpolicy`, `poddisruptionbudget`, `secret`, `serviceaccount`, `service`, plus `values.yaml` / `values-development.yaml` / `values-production.yaml`, [helm/DEPLOYMENT.md](../helm/DEPLOYMENT.md), [helm/deploy.sh](../helm/deploy.sh), [helm/test-nginx-config.sh](../helm/test-nginx-config.sh) | Full Kubernetes deployment surface. |
| GitHub Actions | [.github/workflows/build-and-deploy.yml](../.github/workflows/build-and-deploy.yml) (140 lines) | Triggers on `softwarecatalogus*`, `development`, `softwarecatalog-gebruik` branches. Builds image, pushes to `ghcr.io`. |
| Bitbucket Pipelines | [bitbucket-pipelines.yml](../bitbucket-pipelines.yml) (140 lines) | Legacy CI parallel to GH Actions — pipelines for `hotfix/*`, `develop`, etc. Builds + pushes to `$DOCKER_DOMAIN/acato/tilburg-woo-ui`. |
| `.gitattributes` | [.gitattributes](../.gitattributes) | |
| `.eslintignore` | [.eslintignore](../.eslintignore) | |
| `.babelrc` | [.babelrc](../.babelrc) | Explicit babel config (theirs has none). |
| Docs (build/ops) | [README.docker.md](../README.docker.md), [DOCKER-TROUBLESHOOTING.md](../DOCKER-TROUBLESHOOTING.md), [ENVIRONMENT-CONFIG.md](../ENVIRONMENT-CONFIG.md), [RUNTIME-CONFIG-FIX.md](../RUNTIME-CONFIG-FIX.md), [CACHE-BUSTING-GUIDE.md](../CACHE-BUSTING-GUIDE.md), [REBUILD-INSTRUCTIONS.md](../REBUILD-INSTRUCTIONS.md), [TEMPLATE-VARIABLES.md](../TEMPLATE-VARIABLES.md), [BACKEND-REQUIREMENTS-EXTENDS.md](../BACKEND-REQUIREMENTS-EXTENDS.md), [AUTHENTICATION-STATUS.md](../AUTHENTICATION-STATUS.md), [AUTHENTICATION-SYSTEM.md](../AUTHENTICATION-SYSTEM.md), [STANDAARDVERSIES-EDIT-BUG.md](../STANDAARDVERSIES-EDIT-BUG.md), [developer.md](../developer.md), [@rules.md](../@rules.md). (Documentation will be covered in its own analysis — listed here only because some of it documents the build pipeline.) |
| Editor configs | [.cursor/](../.cursor/), [.vscode/](../.vscode/), [.github/copilot-instructions.md](../.github/copilot-instructions.md) | |
| Test fixtures at root | [test-lint-demo.js](../test-lint-demo.js), [test-session.html](../test-session.html) | |

### 3.14 Build infrastructure only in theirs

| Surface | Path | Purpose |
|---|---|---|
| `.env.example` | [.env.example](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/.env.example) | Documents the four expected env vars: `API_URL`, `API_URL_COMMONGROUND`, `API_URL_COMMONGROUND_ORGANIZATION_OIN`, `API_URL_COMMONGROUND_TOKEN`. |
| `LICENSE.md` (vs ours `LICENSE`) | [LICENSE.md](https://bitbucket.org/acato/openwoo-tilburg-ui/src/4db2ee9c1c6072525b8184734e7e9142fd9ed0ba/LICENSE.md) | Same EUPL text (likely); filename differs. |

### 3.15 `.gitignore`

Effectively unrelated files. Theirs is a generic Atlassian boilerplate (`node_modules/`, `*.log`, `.idea/`, `.DS_Store`, etc.). Ours is project-tuned: ignores `.cache`, `/public_html`, `/build`, `/node_modules`, all `.env*` variants, `.yarn`, and `.cursor/debug*.log`. Neither is wrong; ours actually keeps the build artefacts out which is what we want.

---

## 4. Only in ours — load-bearing inventory

| Capability | Where | Load-bearing? |
|---|---|---|
| Runtime configuration (read env vars at container start, write `window.RUNTIME_CONFIG` before bundle loads) | [public/runtime-config.js](../public/runtime-config.js), [scripts/generate-runtime-config.js](../scripts/generate-runtime-config.js), [scripts/generate-container-constants.js](../scripts/generate-container-constants.js) | **Yes.** Multi-tenant tokenisation depends on this. |
| Nginx as a proxy layer to OpenConnector + Nextcloud | [config/nginx.conf.template](../config/nginx.conf.template), [Dockerfile:42-77](../Dockerfile#L42-L77) | **Yes.** Required for auth flow + file storage. |
| Helm chart with ingress / network policy / HPA / PDB / secrets / configmap | [helm/tilburg-woo-ui/](../helm/tilburg-woo-ui/) | **Yes.** This is how we deploy. |
| GitHub Actions CI/CD | [.github/workflows/build-and-deploy.yml](../.github/workflows/build-and-deploy.yml) | **Yes** (active branches: `softwarecatalogus*`, `development`). |
| Bitbucket Pipelines | [bitbucket-pipelines.yml](../bitbucket-pipelines.yml) | Unclear — predates GH Actions. May be dormant. → check before assuming we can drop it. |
| Cache-busting via `BUILD_VERSION` injection | [config/webpack.config.prod.js:62-75](../config/webpack.config.prod.js#L62-L75) | **Yes.** Service worker updates depend on this revision change. |
| Piwik Pro analytics placeholders | [config/webpack.config.prod.js:109-125](../config/webpack.config.prod.js#L109-L125) | **Yes** if Piwik is enabled in any env. |
| Local dev nginx watch build + hot reload | [Dockerfile.dev](../Dockerfile.dev), [docker-compose.dev.yml](../docker-compose.dev.yml) | Developer-experience only, not deploy-critical. |
| Rollbar client + dependency stack | `rollbar ^2.26.1` runtime dep, sourcemap plugin invocation commented out on both sides | **Maybe** — invocation is commented (theirs and ours), so it's a runtime SDK without active source-map upload. Verify in [src/utilities/](../src/utilities/) usage. |
| ESLint + Prettier toolchain | [.eslintrc.cjs](../.eslintrc.cjs), [scripts/lint.js](../scripts/lint.js), `lint:*` + `format:*` scripts | Dev workflow only. |
| Markdown editor (`@uiw/react-md-editor`) + remark/rehype stack | runtime deps | **Yes** — needed for beheer content editing. |
| Archimate / GEMMA diagram engine | `@joint/core`, `jointjs`, `svg-pan-zoom`, `@*-archimate-diagram-engine` | **Yes** — `ac-gemma` view. |
| Form-validation toolkit (`ibantools`, `libphonenumber-js`, `react-select`, `react-tabs`, `react-tooltip`) | runtime deps | **Yes** — `ac-forms` view. |

---

## 5. Only in theirs

| Item | Adoption stance |
|---|---|
| Apache-based `Dockerfile` static-server image | **Do not adopt.** Incompatible with our runtime-config requirement and nginx proxy layer. |
| `webpack-dev-server 5.x` upgrade | **Adopt eventually** (`4.x` is still maintained but theirs is the modern target). Requires reshaping our `onBefore/AfterSetupMiddleware` hooks into `setupMiddlewares`. → [D-003](DECISIONS.md#d-003) (timing). |
| `@utrecht/button-css`, `link-css`, `paragraph-css`, `ordered-list-css`, `unordered-list-css` | **Adopt — and drop `@utrecht/components`.** These per-component packages are the official modern NLDS convention: install only the CSS you use, on a per-component basis. They replace the now-deprecated `@utrecht/components` omnibus we still depend on. This is independent of the `@utrecht/component-library-react` decision (CSS packages are versioned separately from the React component-library) — we can migrate the CSS side regardless of how the React side resolves. |
| `@babel/plugin-transform-class-properties`/`-private-methods`/`-private-property-in-object` (modern names) | **Adopt.** Cosmetic refactor — same behaviour, removes deprecation noise. |
| `.env.example` | **Adopt** (documentation hygiene). Add the additional env vars our runtime config expects (Rollbar, Piwik, NGINX_*, EXTERNAL_*). |
| `@babel/runtime 7.27.4`, `webpack 5.94.0`, `postcss 8.4.31`, `mini-css-extract-plugin ^2.9.2` | **Adopt** unless we have a known incompatibility. Patch-bumps mostly. |
| Removal of unused webpack imports (`CopyPlugin`, `ModuleScopePlugin`, `PreloadWebpackPlugin`, etc.) | Theirs already removed `ModuleScopePlugin` etc.; we should too. Cleanup pass. |
| Drop deprecated `@babel/polyfill` | **Adopt removal.** We already use `core-js/stable` so the polyfill package is dead weight. |
| Drop `extract-text-webpack-plugin` | **Adopt removal.** Deprecated and unused (we use `mini-css-extract-plugin`). |

---

## 6. Per-item recommendations

| # | Item | Recommendation | Note |
|---|---|---|---|
| 1 | `license` field (EUPL-1.2 vs UNLICENSED) | **Keep ours** | EUPL is the publication-licence Conduction has been distributing under. |
| 2 | `homepage` URL | **Decision** → [D-001](DECISIONS.md#d-001) | `open-tilburg.nl` vs `open.tilburg.nl` — confirm canonical hostname with product. |
| 3 | `repository.url` (still points to old Acato repo) | **Update ours** | Should point to our actual upstream (`ConductionNL/tilburg-woo-ui` per Helm Chart.yaml). |
| 4 | Lint/format scripts in `package.json` | **Keep ours** | Theirs has no lint pipeline at all. |
| 5 | `@utrecht/component-library-react 9.0.3` vs `^3.0.1-alpha.41` | **Decision** → [D-002](DECISIONS.md#d-002) | Major API divergence. Likely the cornerstone of any NLDS-alignment effort. |
| 6 | `axios ^1.6.7` vs `1.13.2` exact | **Adopt theirs** (bump) | Patch-line bump, no behavioural risk. |
| 7 | `dompurify ^3.1.4` vs `3.2.4` exact | **Adopt theirs** (bump) | |
| 8 | `webpack 5.87.0` → `5.94.0` | **Adopt theirs** | |
| 9 | `webpack-dev-server ^4.15.1` → `^5.2.2` | **Decision** → [D-003](DECISIONS.md#d-003) | Major upgrade; requires middleware refactor in our [webpackDevServer.config.js:104-125](../config/webpackDevServer.config.js#L104-L125). |
| 10 | `mini-css-extract-plugin` 2.7.6 → ^2.9.2 | **Adopt theirs** | |
| 11 | `@babel/runtime 7.22.5` → `7.27.4` | **Adopt theirs** | |
| 12 | `@babel/plugin-proposal-*` → `@babel/plugin-transform-*` (class-props, private-methods, private-property-in-object) | **Adopt theirs** | Rename only; configure same `loose: true` options in [.babelrc](../.babelrc). |
| 13 | `@babel/polyfill` (deprecated) | **Drop** | Already covered by `core-js/stable`. |
| 14 | `extract-text-webpack-plugin` (deprecated, unused) | **Drop** | |
| 15 | Conduction runtime deps (`@conduction/theme`, archimate engines, emotion, GEMMA, markdown stack, form-validation stack, lottie, etc.) | **Keep ours** | All tied to features absent from theirs — see §4. |
| 16 | `@utrecht/button-css` + 4 other per-component CSS packages | **Adopt** | Modern NLDS convention: per-component CSS rather than the omnibus `@utrecht/components`. Decoupled from #5 — these packages version independently of the React component-library. |
| 16b | `@utrecht/components ^3.0.1-alpha.42` (omnibus, deprecated) | **Drop** | Superseded by the per-component `@utrecht/*-css` packages in #16. Acato already migrated; we're still on the deprecated package. Audit our usage of `@utrecht/components` imports before removing — every site needs to switch to the matching per-component import. |
| 17 | ESLint config (`.eslintrc.cjs` vs theirs' minimal `.eslintrc`) | **Keep ours** | Theirs uses `babel-eslint` (unmaintained) and `plugin:react-app` (legacy). Ours is the modern stack. |
| 18 | `.babelrc` (theirs has none) | **Keep ours** | Required for our explicit Babel presets + decorators. Theirs likely relies on unspecified default — verify in their build if it actually works. |
| 19 | `config/polyfills.js` `core-js/stable` import | **Keep ours** | We need it; rest of the file is whitespace-equivalent. |
| 20 | `scripts/start.js` (semver guard removed) | **Adopt theirs** | Restore the Node-version sanity check — costs nothing. |
| 21 | `config/webpackDevServer.config.js` (full vs no-op) | **Keep ours** | Without it `yarn start` won't proxy. (Coupled with #9.) |
| 22 | `config/webpack.config.prod.js` `BUILD_VERSION` cache-busting | **Keep ours** | Required for service-worker updates across deploys. |
| 23 | `config/webpack.config.prod.js` Piwik injection | **Keep ours** | Active analytics integration. |
| 24 | `config/webpack.config.prod.js` Terser `pure_funcs` vs `drop_console: true` | **Keep ours** | Preserves `console.warn/error/info` for ops debugging in prod. (Confirm we want this — it bloats bundle slightly.) |
| 25 | `config/webpack.config.prod.js` widened `dontCacheBustURLsMatching` regex | **Keep ours** | Matches our 13-char asset hashes; theirs only matches 8-char. |
| 26 | Stale unused requires at top of [webpack.config.prod.js:11-25](../config/webpack.config.prod.js#L11-L25) | **Clean up** | Remove `CopyPlugin`, `ModuleScopePlugin`, `PreloadWebpackPlugin`, `getCSSModuleLocalIdent`. No behaviour change. |
| 27 | Dockerfile (Apache static vs Nginx + Node runtime) | **Keep ours** | Required for runtime-config injection, multi-tenant routing, nginx proxy. |
| 28 | Dockerfile.dev, docker-compose.yml, docker-compose.dev.yml | **Keep ours** | Dev-workflow infrastructure. |
| 29 | Helm chart | **Keep ours** | Our deployment target is Kubernetes; no equivalent on their side. |
| 30 | GitHub Actions workflow | **Keep ours** | |
| 31 | Bitbucket Pipelines | **Decision** → [D-004](DECISIONS.md#d-004) | Likely dormant; confirm before removing (one less thing to maintain). |
| 32 | `nginx.conf.template` | **Keep ours** | |
| 33 | `runtime-config.js` + `generate-runtime-config.js` + `generate-container-constants.js` | **Keep ours** | Core to multi-tenant config story. |
| 34 | `.env.example` | **Adopt theirs (extended)** | Add ours-relevant env vars (`SITE`, `MODE`, `THEME_VARIANT`, `NGINX_*`, Rollbar, Piwik, etc. — see [public/runtime-config.js](../public/runtime-config.js#L1-L55) for the full list). |
| 35 | `.gitignore` | **Keep ours** | Theirs is a generic boilerplate. |
| 36 | `jsconfig.json` (formatting + `"jsx": "react"`) | **Keep ours** | Alias set is the same on both sides. |

---

## 7. Category verdict

**`mixed`** — most of the build pipeline is ours-only by necessity (deployment model, multi-tenant runtime config, Kubernetes, lint stack, Conduction-specific deps) and should be kept. A meaningful slice of changes is uncontroversial *bumps + cleanups* from theirs that we can adopt without disrupting our deployment story (#6, #7, #8, #10, #11, #12, #13, #14, #16, #16b, #20, #26, #34). A small but consequential subset is **needs-decision**: the `@utrecht/component-library-react` 3→9 divergence (#5), the WDS major bump (#9), Bitbucket Pipelines retirement (#31), and the canonical homepage hostname (#2).

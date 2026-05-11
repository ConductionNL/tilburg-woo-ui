# Analysis: Dependencies & Build Tooling

## Branches Compared
- Ours (tilburg-woo-ui): `softwarecatalogus-performance`
- Acato (tilburg-woo-ui_acato): `main`

## Files Compared
- Ours: `package.json`, `Dockerfile`, `Dockerfile.dev`, `docker-compose.yml`, `docker-compose.dev.yml`, `.eslintrc.cjs`, `.prettierrc.json`, `.babelrc`, `bitbucket-pipelines.yml`, `.github/workflows/build-and-deploy.yml`
- Acato's: `package.json`, `Dockerfile`, `.eslintrc`, `.prettierrc.json`, `.babelrc`, `bitbucket-pipelines.yml`, `.env.example`

---

## What is the same

- Package name (`open-tilburg-ui`), version (`1.0.0`), author (Jorik Bosman / Acato), contributors, repository URL — **metadata is essentially identical** (forked origin is clear)
- Core build stack: webpack 5, Babel, Sass, PostCSS — same underlying technology
- Node/Yarn engine requirements: `node >=18.17.0`, `yarn >=4.1.1`, `packageManager: yarn@4.1.1`
- The four base npm scripts: `start`, `dev:web`, `build:web`, `analyze:bundle` — identical
- Browserslist config — identical
- `resolutions: { "react-error-overlay": "6.0.9" }` — identical
- Core runtime dependencies shared: `mobx 6.9.0`, `mobx-react-lite`, `mobx-react-router`, `preact ^10.15.1`, `react-router 6.13.0`, `react-router-dom 6.13.0`, `axios`, `clsx`, `dayjs`, `dompurify`, `history`, `html-react-parser`, `react-focus-lock`, `@loadable/component`, `@amsterdam/design-system-css ^0.9.0`, `@amsterdam/design-system-react ^0.9.0`
- `prettier 2.8.8` version locked in both
- `.prettierrc.json` — **byte-for-byte identical**
- `.babelrc` structure and intent — same presets (`@babel/env`, `@babel/react`) and JSX transform to Preact (`importSource: preact`)

---

## What differs

### 1. License
| Ours | Acato |
|------|-------|
| `EUPL-1.2` | `UNLICENSED` |

Business decision: our license is the correct one for a government open-source project. No action needed.

### 2. Babel plugin naming (deprecated vs current)

Ours uses deprecated `@babel/plugin-proposal-*` names; Acato has migrated to the current `@babel/plugin-transform-*` names:

| Ours (deprecated) | Acato (current) |
|---|---|
| `@babel/plugin-proposal-class-properties` | `@babel/plugin-transform-class-properties` |
| `@babel/plugin-proposal-private-methods` | `@babel/plugin-transform-private-methods` |
| `@babel/plugin-proposal-private-property-in-object` | `@babel/plugin-transform-private-property-in-object` |

The `plugin-proposal-*` packages are deprecated and were merged into `plugin-transform-*` in Babel 7.x. Acato's `.babelrc` and `devDependencies` correctly reflect the new names.

### 3. Newer package versions in Acato

Acato has bumped several packages that we have not:

| Package | Ours | Acato |
|---|---|---|
| `webpack` | `5.87.0` (pinned) | `5.94.0` (pinned) |
| `webpack-dev-server` | `^4.15.1` | `^5.2.2` (major bump) |
| `@babel/runtime` | `7.22.5` | `7.27.4` |
| `mini-css-extract-plugin` | `2.7.6` (pinned) | `^2.9.2` |
| `postcss` | `8.4.24` (pinned) | `8.4.31` (pinned) |
| `dompurify` | `^3.1.4` | `3.2.4` (security fix) |
| `axios` | `^1.6.7` | `1.13.2` (pinned, newer) |

Notable: `webpack-dev-server` is a **major version bump** (4 → 5) in Acato. This may require config changes. `dompurify 3.2.4` likely includes security fixes and is worth adopting.

### 4. ESLint configuration

| Ours (`.eslintrc.cjs`) | Acato (`.eslintrc`) |
|---|---|
| `@babel/eslint-parser` (current) | `babel-eslint` (**deprecated**, unmaintained since 2021) |
| Full plugin set: `eslint-plugin-import`, `eslint-plugin-react`, `eslint-plugin-react-hooks` | Only `plugin:react-app/recommended` |
| Extensive custom rules (import ordering, hooks rules) | Minimal rules, just disables one a11y rule |
| `eslint ^8.57.0` with `@eslint/js ^9.0.0` | Not specified |

Ours is strictly more modern and thorough. Acato's setup is outdated.

### 5. npm scripts / toolchain

| Ours | Acato |
|---|---|
| `lint`, `lint:fix`, `lint:check`, `format`, `format:check`, `validate`, `pre-commit`, `lint:full` | Only the 4 build scripts |

Ours has a full linting/formatting toolchain with pre-commit hooks. Acato has none.

### 6. Dockerfile / containerisation

| Ours | Acato |
|---|---|
| Multi-stage: Node 18 builder → Nginx Alpine | Single-stage: Apache 2.4 (`httpd:2.4`) |
| Runtime environment variable injection via `envsubst` | Static build — no runtime config |
| Nginx reverse proxy with `envsubst` for upstream config | Apache serves files directly from `public_html` |
| Separate `Dockerfile.dev` with watch-build and hot-reload targets | No dev Dockerfile |
| `docker-compose.yml` + `docker-compose.dev.yml` | No compose files |
| Exposes port 81 (with proxy logic) | Exposes default Apache port 80 |
| Health checks on both prod and dev containers | No health checks |
| Runtime config script generates `runtime-config.js` at container start | No runtime config |

Ours is significantly more sophisticated. Acato's Dockerfile is a naive static-file container.

### 7. CI/CD

| Ours | Acato |
|---|---|
| Bitbucket Pipelines + GitHub Actions (`build-and-deploy.yml`) | Bitbucket Pipelines only |
| Builds and pushes Docker image to registry | Likely similar pipeline, different deployment targets |

Both have Bitbucket Pipelines but the branch names and deployment environments differ (ours targets Conduction infrastructure).

### 8. Additional runtime dependencies (ours only)

Ours has substantial additional dependencies reflecting our extended feature set. Checked against `src/` imports to flag unused packages.

**Active (confirmed used):**
- `@conduction/archimate-diagram-engine`, `jointjs` — ArchiMate diagram rendering (used in `ac-gemma`, `ac-views`, `con-views-list`, `con-beheer-views`)
- `@conduction/theme` — Conduction design tokens (used in `src/styles/nlds/index.scss`)
- `@gemeente-denhaag/components-react` — Used in sidenav and form views
- `@nl-design-system-unstable/rotterdam-design-tokens` — Used in `src/styles/nlds/index.scss`
- `@utrecht/component-library-react 9.0.3`, `@utrecht/components` — Newer Utrecht library (Acato pins `^3.0.1-alpha.41`)
- `@uiw/react-md-editor`, `react-markdown` + `rehype-*` / `remark-*` plugins — Markdown rendering (used in publication views and schema form)
- `rollbar` — Error tracking (used in `src/config/index.js`)
- `react-select` — Used in pagination, table search, API select field
- `react-tabs` — Used in tab atoms (`src/atoms/tab/`)
- `react-tooltip` — Used in `src/index.web.js` and schema form
- `fuse.js` — Used in `con-generic-beheer-page.js`
- `ibantools` — Used in `ac-format-iban.js`
- `libphonenumber-js` — Used in form validations and `ac-format-phonenumber.js`
- `file-saver` — Used in `ac-download-file.js`
- `svg-pan-zoom` — Used in ArchiMate views

**Unused — candidates for removal:**
| Package | Evidence |
|---|---|
| `@arktect-co/archimate-diagram-engine` | Import is commented out in `ac-gemma-view.js`; `@conduction/archimate-diagram-engine` is the active fork |
| `@joint/core` | Listed in deps but code imports `jointjs` directly (`import { dia, shapes } from 'jointjs'`); `@joint/core` is never imported |
| `react-transition-group` | No imports anywhere in `src/` |
| `react-css-transition-replace` | No imports anywhere in `src/` |
| `focus-trap-react` | No imports anywhere in `src/` |
| `blazy` | No imports anywhere in `src/` |
| `@emotion/react` | No imports anywhere in `src/` |
| `@lottiefiles/react-lottie-player` | No imports anywhere in `src/` |
| `npm-run-all` | Not referenced in any `scripts/` file or `package.json` script command |

### 9. `.env.example` (Acato only)

Acato ships a `.env.example` documenting the four environment variables a developer needs:
```
API_URL="..."
API_URL_COMMONGROUND="..."
API_URL_COMMONGROUND_ORGANIZATION_OIN="..."
API_URL_COMMONGROUND_TOKEN="..."
```
We have no equivalent — developers must consult Docker Compose files or institutional knowledge to understand what env vars are expected.

### 10. Utrecht component library version gap

| Package | Ours | Acato |
|---|---|---|
| `@utrecht/component-library-react` | `9.0.3` (pinned) | `^3.0.1-alpha.41` |

This is a major version difference (9.x vs 3.x alpha). This likely means our version is significantly more recent. No regression risk here — Acato is behind.

---

## Only in ours
- `Dockerfile.dev`, `docker-compose.yml`, `docker-compose.dev.yml`
- GitHub Actions workflow
- Full ESLint + Prettier toolchain with pre-commit hooks
- `eslint-import-resolver-alias`, multiple ESLint plugins
- All Conduction/GEMMA/ArchiMate/auth-related dependencies
- `source-map-explorer` bundle analysis (both have the `analyze:bundle` script, but we also include it explicitly in devDeps)
- `compression-webpack-plugin`, `preload-webpack-plugin`, `webpack-minimal-classnames` (Acato has these too — shared)

## Only in Acato's
- `.env.example`
- Updated Babel plugin names (`@babel/plugin-transform-*`)
- Newer `webpack 5.94.0`, `webpack-dev-server ^5.2.2` (major), `dompurify 3.2.4`
- Individual Utrecht CSS packages (`@utrecht/button-css`, `@utrecht/link-css`, etc.) instead of our single `@utrecht/components` umbrella

---

## Recommendations

| Item | Action | Priority |
|---|---|---|
| Babel plugin names (`proposal-*` → `transform-*`) | **Adopt from Acato** — ours uses deprecated names; rename packages in `package.json` and `.babelrc` | High |
| `dompurify 3.2.4` | **Adopt from Acato** — security fix release, straightforward bump | High |
| `.env.example` | **Adopt from Acato** — create our own with all env vars documented; Acato's 4-variable version is too minimal for our setup but the practice is good | Medium |
| `webpack-dev-server ^5.x` | **Needs decision** — major version bump, may require config changes in `scripts/start.js`. Evaluate separately. | Medium |
| `webpack 5.94.0`, `@babel/runtime 7.27.4`, `postcss 8.4.31` | **Adopt from Acato** — minor version bumps, low risk | Low |
| `axios 1.13.2` | **Adopt from Acato** — newer pinned version | Low |
| Acato's Dockerfile (Apache, static) | **Keep ours** — our Nginx setup with runtime env injection and proxy is far more capable | — |
| Acato's ESLint (babel-eslint, react-app only) | **Keep ours** — our setup is more modern and thorough | — |
| GitHub Actions (ours only) | **Keep ours** — no equivalent in Acato | — |
| Utrecht `@utrecht/button-css` etc. (individual packages) | **Keep ours** — we use the newer umbrella package `@utrecht/components 9.0.3`; Acato is behind on Utrecht | — |

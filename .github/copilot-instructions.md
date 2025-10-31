This project is a React/Preact single-page application organized using an atomic design structure (atoms, molecules, components, views) with MobX for state management and Webpack as the build system.

Keep these repository-specific rules short and actionable to help AI agents be productive quickly.

- Project entry points
  - App bootstrap: `src/index.web.js` (creates store, router, renders `<App />`).
  - App root: `src/App.web.js` (route wiring, theme & favicon logic, page rendering).

- Common directories to inspect when changing UIs or flows
  - `src/atoms`, `src/molecules`, `src/components`, `src/views` — follow the atomic pattern.
  - `src/stores` — MobX stores and business logic (use `withStore`/`StoreContext`).
  - `src/hooks` and `src/utilities` — small helpers (watch for side-effects and useEffect patterns).

- Build & run commands (from `package.json`)
  - Development (hot reload): `yarn dev:web` (runs `node scripts/start.js`).
  - Production build: `yarn build:web` (runs `node scripts/build.js`).
  - Lint / format checks: `yarn lint`, `yarn format` and `yarn validate`.
  - Node/Yarn versions: defined in `package.json` engines (Node >= 18.17.0, yarn@4.1.1).

- Key conventions and patterns
  - Atomic naming: components often use prefixes: `ac-` (Acato) and `con-` (Conduction). Keep the prefix when adding new components.
    - If a component is completely new (not based on existing patterns from Acato), use the `con-` prefix.
  - Path aliases: code imports use aliases (e.g. `@components`, `@stores`, `@styles`, `@config`). Check `config/paths.js` and webpack configs when adding files.
  - Store usage: components access state using `withStore` or `StoreContext`; prefer existing store methods instead of introducing new global state.
  - Theming: theme selection happens in `App.web.js` via container constants or hostname fallbacks — editing theme logic must consider both runtime container constants and hostname-based cases.

- Common pitfalls for AI agents
  - useEffect infinite loops: inspect dependency arrays and memoize objects returned from stores/hooks. See `.cursor/rules/rules.mdc` which warns about fixing the root cause (change dependencies or the upstream object reference), not adding more deps.
  - Container constants: `@constants/container.constants` may be injected at runtime; guard `require` calls and provide safe fallbacks (see `App.web.js`).
  - Service calls: network layer is in `src/api/*` and `src/services` — keep interceptors and auth flows intact (look at `src/api/interceptors.api.js` and `AUTHENTICATION-SYSTEM.md`).

- Integration & infra
  - Docker: dev compose files are present (`docker-compose.dev.yml`) and README contains notes about hot-reload behavior, chokidar env vars, and the Run On Save trick used by developers.
  - Deployments: CI/CD uses Bitbucket pipelines (see `bitbucket-pipelines.yml`) and Helm charts under `helm/tilburg-woo-ui`.

- When changing documentation or behavior
  - If changing functionality, update related docs in `/docs` and any component-level README. See `.cursor/rules/update-existing-documentation.mdc` which enforces updating docs when changing behavior.

- Quick file examples to reference in PRs
  - route wiring & auth: `src/App.web.js`
  - store creation: `src/index.web.js` and `src/stores/index.js`
  - path resolution: `config/paths.js`
  - build scripts: `scripts/start.js`, `scripts/build.js`

If any runtime workflows or private scripts (docker setup, pipeline variables, or container constants generation) are missing from this repo or need more detail, tell me what to add and I will expand these instructions.

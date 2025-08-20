# Open Tilburg

### Tilburg WOO UI

## Getting started

0. [Prerequisites](#prerequisites)
1. [Installation](#installation)  
2. [Scripts](#scripts)
3. [Architecture](#architecture)
4. [Deployments](#deployments)
5. [Documentation](#documentation)

## Prerequisites

```json
  "engines": {
    "node": ">=18.16.0",
    "yarn": ">=3.2.4"
  }
```

## Installation

```bash
# install app's dependencies
$ yarn
```

## Scripts

```bash
# serve with hot reload at localhost:<port>
$ yarn dev:web
```

```bash
# build for production with minification & compressions (gzip, brotli)
$ yarn build:web
```

## Architecture

The Tilburg WOO UI is a React-based single-page application with the following key features:

### Technology Stack
- **Frontend**: React/Preact with MobX state management
- **Styling**: SCSS with NLDS design system  
- **Routing**: React Router with centralized route configuration
- **Build System**: Webpack with code splitting
- **Architecture**: Atomic design pattern (atoms, molecules, components, views)

### Key Features
- **Multi-tenant theming**: Automatic theming based on hostname
- **Dynamic forms system**: Multiple form types with dedicated API endpoints
- **Authentication system**: Protected routes with user session management
- **Internationalization**: Dutch language support for end-user content
- **Responsive design**: Mobile-first approach with NLDS components

### Form System
The application includes a comprehensive forms system under the '/forms' namespace:

- **'/forms/register'**: Organization registration
- **'/forms/gebruik'**: Usage registration  
- **'/forms/product'**: Product catalog registration
- **'/forms/koppeling'**: System integration registration

Each form type posts to its dedicated API endpoint for specialized processing.

### Component Architecture
```
src/
├── atoms/          # Basic UI building blocks
├── molecules/      # Simple component combinations
├── components/     # Complex reusable components  
├── views/          # Page-level components
├── stores/         # MobX state management
├── hooks/          # Custom React hooks
├── utilities/      # Helper functions
└── constants/      # Application constants
```

## Deployments

- Development deployments (hosted on ACATO-prod-4), are done using Bitbucket Pipelines, automatically triggered.
- Staging deployments (hosted on ACATO-prod-4), are done using Bitbucket Pipelines, automatically triggered.
- Production deployments (hosted on ACATO-prod-6), are done using Bitbucket Pipelines, manually triggered.

## Documentation

Technical documentation is available in the '/docs' directory:

- **[ROUTING-SYSTEM.md](docs/ROUTING-SYSTEM.md)**: Complete routing system documentation
- **[MENU-SYSTEM.md](docs/MENU-SYSTEM.md)**: Dynamic menu system documentation
- **[AUTHENTICATION-SYSTEM.md](AUTHENTICATION-SYSTEM.md)**: Authentication flow documentation
- **[AUTHENTICATION-STATUS.md](AUTHENTICATION-STATUS.md)**: Authentication status tracking

### Component-Specific Documentation
Individual components include README files with usage examples:

- **Beheer System**: 'src/views/ac-beheer/README-*.md'
- **Form Modals**: 'src/views/ac-beheer/core/modals/*/README-*.md'
- **Related Actions**: 'src/views/ac-beheer/core/hooks/README-*.md'

### Development Guidelines
- Use established SCSS structure and NLDS design tokens
- Follow atomic design patterns for component organization  
- Use MobX patterns for state management
- Apply 'con-' prefix for new Conduction components
- Apply 'ac-' prefix for existing Acato components
- Use path aliases ('@components', '@utils', '@stores') instead of relative imports

## Developing on docker

### Requirements

- Docker Desktop is running
- Git is available in your PATH
- Workspace is trusted (not in Restricted Mode)
- “Run On Save” extension is installed

### Installing the extension

#### VS Code

- Install: [Run On Save — Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=emeraldwalk.RunOnSave).

#### Cursor (via Marketplace Service URL)

- In Cursor, open Settings and search for `marketplace`, or navigate: Features → Extensions → Gallery → Service URL.
- Set the Service URL to: `https://marketplace.visualstudio.com/_apis/public/gallery`.
- Restart Cursor to apply the change.
- Open the Extensions view in Cursor, search for “Run On Save” by emeraldwalk, and install it: [Run On Save — Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=emeraldwalk.RunOnSave).

> Note: Using an alternative marketplace endpoint is not officially supported and behavior may change. See the discussion in [Cursor issue #2461](https://github.com/cursor/cursor/issues/2461).

**Warning — destructive sync action (avoid unless necessary)**

- If you use “Sync extensions from VS Code,” Cursor will overwrite its extension list with VS Code’s list.
- Any extensions installed only in Cursor (and not present in VS Code) will be removed.
- Use with caution; see: [Cursor issue #2461](https://github.com/cursor/cursor/issues/2461).

### What it does

- Automatically triggers the front‑end rebuild process in the running Docker dev container when you save a file.
- Skips files that match `.gitignore`.
- Only reacts to changes in `src/` and `public/`.
- Logs appear in the “Run On Save” output channel.

### How it works

- On save, a script computes the saved file path relative to the repository.
- It checks the path with `git check-ignore`; ignored files are skipped.
- For files in `src/` or `public/`, it executes a command inside the hot‑reload container that “touches” the corresponding path under `/app/...`.
- The “touch” prompts Webpack/Watchpack to recompile the changed modules; the browser updates via HMR without restarting the container.

### Container targeted by on-save

- The on-save command targets the hot-reload container by default: `tilburg-woo-ui-hot`.
- If your setup uses a different service name, update the service in `.vscode/settings.json` where the command invokes Docker.

Example: change the service name

```json
{
  "emeraldwalk.runonsave": {
    "commands": [
      {
        "match": ".*",
        "autoShowOutputPanel": "always",
        "message": "🚀 Trigger HMR in <your-service-name>",
        "cmd": "powershell -NoProfile -ExecutionPolicy Bypass -Command \"$enc=[Text.Encoding]::UTF8; try{[Console]::OutputEncoding=$enc}catch{}; $OutputEncoding=$enc; $root='${workspaceFolder}'; $f='${file}'; if ($f.ToLower().StartsWith($root.ToLower())) { $rel=$f.Substring($root.Length).TrimStart('\\\\') } else { $rel=$f }; git -C $root check-ignore -q -- $rel; if ($LASTEXITCODE -eq 1) { $relUnix=$rel -replace '\\\\','/'; if ($relUnix.StartsWith('src/') -or $relUnix.StartsWith('public/')) { docker compose exec -T <your-service-name> sh -lc \\\"if [ -e '/app/$relUnix' ]; then echo 'Updated: $relUnix'; else echo 'Saved outside mounted dirs: $relUnix'; fi\\\" } } }\""
      }
    ]
  }
}
```

- Replace `<your-service-name>` with the container service from your `docker-compose.yml`.

#### If you change the container

- Ensure the container has reliable file-watching enabled (as in `docker-compose.dev.yml`):
  - `CHOKIDAR_USEPOLLING=true`
  - `WATCHPACK_POLLING=true`
  - Place these under `services.<your-service-name>.environment`.
- Recreate the container(s) so env vars take effect:

```powershell
docker compose down
docker compose up -d <your-service-name>
```

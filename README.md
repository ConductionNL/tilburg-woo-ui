# Open Tilburg

### Tilburg WOO UI

## Getting started

0. [Prerequisites](#prerequisites)
1. [Installation](#installation)
2. [Scripts](#scripts)
3. [Deployments](#deployments)

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

## Deployments

- Development deployments (hosted on ACATO-prod-4), are done using Bitbucket Pipelines, automatically triggered.
- Staging deployments (hosted on ACATO-prod-4), are done using Bitbucket Pipelines, automatically triggered.
- Production deployments (hosted on ACATO-prod-6), are done using Bitbucket Pipelines, manually triggered.

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
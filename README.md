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

### Installing the extension in Cursor

- Install the extension in VS Code first: [Run On Save — Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=emeraldwalk.RunOnSave).
- Then, in Cursor, update your extensions from VS Code.

**Important — destructive action**

- Updating extensions in Cursor from VS Code will overwrite Cursor’s extension list with VS Code’s.
- Extensions installed only in Cursor (and not in VS Code) will be removed.
- Use this action with caution. 
  - See discussion: [Cursor issue comment](https://github.com/cursor/cursor/issues/2461#issuecomment-2540387698).

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

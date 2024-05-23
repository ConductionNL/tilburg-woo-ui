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

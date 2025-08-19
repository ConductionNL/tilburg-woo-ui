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

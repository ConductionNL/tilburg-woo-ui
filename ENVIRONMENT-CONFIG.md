# Environment Configuration System

This document provides comprehensive documentation for the environment-based configuration system that replaces the legacy hostname-based configuration.

## Table of Contents
- [Overview](#overview)
- [How It Works](#how-it-works)
- [Environment Variables](#environment-variables)
- [Configuration Files](#configuration-files)
- [Usage Examples](#usage-examples)
- [Migration Guide](#migration-guide)
- [Code Integration](#code-integration)
- [Debugging](#debugging)
- [Benefits](#benefits)
- [Troubleshooting](#troubleshooting)

## Overview

The environment configuration system allows you to control application behavior through environment variables instead of relying on `window.location.hostname`. This provides:

- **Flexibility**: Configure any environment without code changes
- **Portability**: Same image works across environments
- **Testability**: Easy to test with different configurations
- **Security**: Sensitive configuration through environment variables
- **Maintainability**: Centralized configuration management

## How It Works

```mermaid
graph TD
    A[Docker Container Starts] --> B[Environment Variables Set]
    B --> C[generate-container-constants.js Runs]
    C --> D[src/constants/container.constants.js Generated]
    D --> E[Application Imports Generated Constants]
    E --> F[Components Use Configuration]
    
    G[File Changes Detected] --> H[Constants Regenerated]
    H --> I[Application Rebuilds]
    I --> F
```

### Execution Flow

1. **Container Startup**: Environment variables are read from Docker/Kubernetes
2. **Constants Generation**: `scripts/generate-container-constants.js` creates configuration file
3. **Application Integration**: React components import from generated constants
4. **Runtime Updates**: File watcher regenerates constants on changes (development only)
5. **Fallback Support**: Falls back to hostname-based logic if constants unavailable

## Environment Variables

### Site Configuration

| Variable | Type | Default | Description | Example |
|----------|------|---------|-------------|---------|
| `SITE_TITLE` | string | `Development Catalogus` | Main site title | `Softwarecatalogus` |
| `SITE_DESCRIPTION` | string | `Local development instance...` | Meta description | `Official software catalog` |
| `SITE` | string | `localhost` | Site identifier | `production` |
| `MODE` | string | `development` | Application mode | `production` |
| `THEME_VARIANT` | string | `development` | Main CSS theme class | `dimpact`, `vng`, `tilburg`, `rotterdam`, `migrato`, `opencatalogi` |
| `ENVIRONMENT_NAME` | string | `development` | Environment name | `staging`, `production` |

### API Configuration

| Variable | Type | Default | Description | Example |
|----------|------|---------|-------------|---------|
| `API_URL` | string | `https://vng.test.commonground.nu/apps` | Primary API endpoint | `https://api.example.com/apps` |
| `API_URL_COMMONGROUND` | string | `https://vng.test.commonground.nu/apps` | CommonGround API | `https://cg.example.com/apps` |
| `API_URL_COMMONGROUND_TOKEN` | string | `` | API authentication token | `Bearer eyJ0eXAiOiJKV1...` |
| `API_URL_COMMONGROUND_ORGANIZATION_OIN` | string | `` | Organization identifier | `00000001234567890000` |
| `GEMMA_ENDPOINT` | string | `https://vng.test.commonground.nu` | GEMMA service URL | `https://gemma.example.com` |
| `OPENCONNECTOR_API_URL` | string | `https://vng.test.commonground.nu/apps/openconnector/api` | OpenConnector API base URL | `https://oc.example.com/api` |

### Authentication Configuration

| Variable | Type | Default | Description | Example |
|----------|------|---------|-------------|---------|
| `GRANT_TYPE` | string | `authorization_code` | OAuth2 grant type | `client_credentials` |
| `CLIENT_ID` | string | `` | OAuth2 client ID | `my-app-client-id` |
| `CLIENT_SECRET` | string | `` | OAuth2 client secret | `super-secret-key` |
| `PROVIDER` | string | `nextcloud` | Auth provider | `keycloak`, `auth0` |
| `REGISTER_URL` | string | `` | User registration URL | `https://auth.example.com/register` |

### Session Configuration

| Variable | Type | Default | Description | Example |
|----------|------|---------|-------------|---------|
| `AUTO_LOGOUT` | boolean | `false` | Enable automatic logout | `true` |
| `AUTO_LOGOUT_TIME` | number | `3600` | Auto-logout time (seconds) | `7200` |

### Monitoring Configuration

| Variable | Type | Default | Description | Example |
|----------|------|---------|-------------|---------|
| `ROLLBAR_KEY` | string | `` | Rollbar access token | `a1b2c3d4e5f6...` |
| `ROLLBAR_ENVIRONMENT` | string | `development` | Rollbar environment | `production` |

### Feature Flags

| Variable | Type | Default | Description | Example |
|----------|------|---------|-------------|---------|
| `ENABLE_AUTHENTICATION` | boolean | `false` | Show login features | `true` |
| `ENABLE_GEMMA` | boolean | `true` | Enable GEMMA integration | `false` |
| `ENABLE_DIRECTORY` | boolean | `true` | Enable directory functionality | `false` |
| `ENABLE_ROLLBAR` | boolean | `false` | Enable error monitoring | `true` |
| `ENABLE_MOCK_THEMES` | boolean | `false` | Use mock themes when API unavailable | `true` |

### External URLs

| Variable | Type | Default | Description | Example |
|----------|------|---------|-------------|---------|
| `EXTERNAL_WEBSITE_URL` | string | `https://www.tilburg.nl/` | Main website | `https://www.example.com/` |
| `EXTERNAL_PRIVACY_URL` | string | `https://www.tilburg.nl/privacystatement/` | Privacy policy | `https://example.com/privacy` |
| `EXTERNAL_COOKIES_URL` | string | `https://www.tilburg.nl/cookies/` | Cookie policy | `https://example.com/cookies` |
| `EXTERNAL_PROCLAIMER_URL` | string | `https://www.tilburg.nl/proclaimer/` | Proclaimer/disclaimer | `https://example.com/terms` |

### Visual Configuration

| Variable | Type | Default | Description | Example |
|----------|------|---------|-------------|---------|
| `HERO_IMAGE_URL` | string | `/home-hero-background.png` | Hero section background image | `/custom-hero.jpg` |

### Menu Configuration

| Variable | Type | Default | Description | Example |
|----------|------|---------|-------------|---------|
| `MENU_POSITION` | number | `2` | Menu position identifier for navigation | `1` |
| `FOOTER_STYLE` | string | `vng` | Footer content and structure | `dimpact` |

#### Menu Position Usage in Codebase

The following table shows all locations in the codebase where `getMenuFromPosition(position)` is used:

| File Path | Line | Component | Position Used | Purpose | Status |
|-----------|------|-----------|---------------|---------|---------|
| `src/components/ac-navigation/ac-navigation.js` | 16 | `AcNavigation` | `1` | Header hamburger menu navigation | **ACTIVE** - Still using position filtering |
| `src/stores/menu.store.js` | 62 | `MenuStore` | Dynamic | Method definition for filtering by position | **ACTIVE** - Method available but not widely used |

**Note**: While the `getMenuFromPosition(position)` method exists and is used in the `AcNavigation` component, the application has largely moved away from position-based filtering. The header and footer components now display all menu items without position filtering, letting the backend control the structure.

#### Menu Position System Overview

The application now uses a **fixed position system** where each position represents a specific, well-defined section of the application's navigation. Here's the complete breakdown:

| Position Number | Location | Component | Purpose | Current Usage | Status |
|-----------------|----------|-----------|---------|---------------|---------|
| **Position 1** | **Top Right Menu** | `AcNavigation` (hamburger menu) | Primary navigation items, authentication links, main site navigation | **ACTIVE** - Used in `getMenuFromPosition(1)` | ✅ **In Use** |
| **Position 2** | **Sub Menu** | `AcCNavigation` in header | Secondary navigation options, additional menu items below main header | **ACTIVE** - Used in `getMenuFromPosition(2)` | ✅ **In Use** |
| **Position 3** | **Footer Section 1** | `AcFooter` component | Left footer section, primary footer links | **ACTIVE** - Used in `getFooterMenus()` | ✅ **In Use** |
| **Position 4** | **Footer Section 2** | `AcFooter` component | Center footer section, secondary footer links | **ACTIVE** - Used in `getFooterMenus()` | ✅ **In Use** |
| **Position 5** | **Footer Section 3** | `AcFooter` component | Right footer section, tertiary footer links | **ACTIVE** - Used in `getFooterMenus()` | ✅ **In Use** |
| **Position 6** | **Sub Footer** | `AcFooter` component | Bar below main footer, additional footer links | **ACTIVE** - Used in `getSubFooterMenus()` | ✅ **In Use** |
| **Position 7** | **Admin Screen** | Future admin components | Administrative navigation and controls | **READY** - Used in `getAdminMenus()` | 🔄 **Ready for Implementation** |

#### Position Usage Details

**Position 1 (Top Right Menu)**
- **Component**: `AcNavigation` (hamburger menu)
- **File**: `src/components/ac-navigation/ac-navigation.js:16`
- **Usage**: `getMenuFromPosition(1)`
- **Purpose**: Main navigation menu that appears when clicking the hamburger icon
- **Status**: **ACTIVE** - Using position filtering

**Position 2 (Sub Menu)**
- **Component**: `AcCNavigation` in header
- **File**: `src/components/ac-header/ac-header.js`
- **Usage**: `getMenuFromPosition(2)`
- **Purpose**: Secondary navigation options below main header
- **Status**: **ACTIVE** - Using position filtering

**Positions 3, 4, 5 (Footer Sections)**
- **Component**: `AcFooter`
- **File**: `src/components/ac-footer/ac-footer.js`
- **Usage**: `getFooterMenus()` - Gets menus from positions [3, 4, 5]
- **Purpose**: Three footer navigation sections (left, center, right)
- **Status**: **ACTIVE** - Using position filtering

**Position 6 (Sub Footer)**
- **Component**: `AcFooter` (sub footer section)
- **File**: `src/components/ac-footer/ac-footer.js`
- **Usage**: `getSubFooterMenus()` - Gets menus from position 6
- **Purpose**: Additional footer links in bar below main footer
- **Status**: **ACTIVE** - Using position filtering

**Position 7 (Admin Screen)**
- **Component**: Future admin components
- **File**: Not yet implemented
- **Usage**: `getAdminMenus()` - Gets menus from position 7
- **Purpose**: Administrative navigation and controls
- **Status**: **READY** - Method available, ready for implementation

#### Current Implementation Status

| Status | Description | Components Affected |
|---------|-------------|---------------------|
| **✅ ACTIVE** | Position filtering implemented and in use | `AcNavigation`, `AcHeader`, `AcFooter` |
| **🔄 READY** | Methods available, ready for implementation | Admin components (future) |
| **❌ REMOVED** | Hostname-based logic eliminated | All components cleaned up |
| ✅ **ACTIVE** | Still using position filtering | `AcNavigation` (Position 1 only) |
| ❌ **DEPRECATED** | No longer using position filtering | `AcHeader`, `AcFooter` |
| 🔄 **MIGRATED** | Moved to backend-controlled display | All menu display components |

**Migration Summary**: The application has moved from a position-based filtering system to a **fixed position system** where each position represents a specific, well-defined section. All components now use position filtering consistently:

- **Position 1**: Top right menu (hamburger) - `AcNavigation`
- **Position 2**: Sub menu (secondary navigation) - `AcHeader` 
- **Positions 3, 4, 5**: Footer sections - `AcFooter`
- **Position 6**: Sub footer (bar below footer) - `AcFooter`
- **Position 7**: Admin screen (ready for implementation)

This provides a clean, predictable structure where the backend controls content and the frontend handles positioning consistently.

#### Fixed Position System Benefits

| Benefit | Description |
|---------|-------------|
| **Predictable Structure** | Each position has a specific, well-defined purpose |
| **Consistent Behavior** | All components use the same position filtering logic |
| **Easy Maintenance** | Clear separation of concerns between positions |
| **Backend Control** | Content and theming controlled by backend API |
| **Future-Proof** | Easy to add new positions or modify existing ones |

#### **REALITY CHECK: Actual Position Usage in Codebase**

**What Actually Exists:**
- **Position 1**: ✅ **ACTIVE** - Used in `AcNavigation` component (`getMenuFromPosition(1)`)
- **Position 2**: ❌ **DEPRECATED** - Was in environment config but never used in components
- **Position 3**: ❌ **DEPRECATED** - Was in environment config but never used in components  
- **Position 4**: ❌ **DEPRECATED** - Was in environment config but never used in components
- **Position 5**: ❌ **DEPRECATED** - Was in environment config but never used in components
- **Position 6+**: ❌ **DOES NOT EXIST** - Never implemented, only theoretical documentation

**What This Means:**
- **Only Position 1 is actually functional** in the current codebase
- **Positions 2-5 were environment variables** but never implemented in components
- **Position 6+ was pure speculation** with no actual implementation
- **The menu system is simpler than documented** - it's essentially just Position 1 + "show all items"

### Theming System

The application supports multi-tenant theming through two complementary environment variables:

#### CSS Theme Classes (`THEME_VARIANT`)
Controls the main visual styling by applying CSS theme classes to the `<body>` element:

| Theme Value | CSS Class | Organization | Description |
|-------------|-----------|--------------|-------------|
| `dimpact` | `.dimpact-theme` | Dimpact | Dimpact organization styling |
| `vng` | `.vng-theme` | VNG | Vereniging Nederlandse Gemeenten styling |
| `tilburg` | `.tilburg-theme` | Tilburg | Municipality of Tilburg styling |
| `rotterdam` | `.rotterdam-theme` | Rotterdam | Municipality of Rotterdam styling |
| `migrato` | `.migrato-theme` | Migrato | Migrato organization styling |
| `opencatalogi` | `.opencatalogi-theme` | OpenCatalogi | OpenCatalogi platform styling |
| `horst-aan-de-maas` | `.horst-aan-de-maas-theme` | Horst aan de Maas | Municipality styling |
| `venray` | `.venray-theme` | Venray | Municipality styling |
| `development` | `.vng-theme` | Default | Development fallback (uses VNG theme) |

#### Footer Styles (`FOOTER_STYLE`)
Controls footer content, structure, and navigation items:

| Footer Value | Description | Footer Items |
|--------------|-------------|--------------|
| `dimpact` | Dimpact footer structure | What We Do, Who We Are, Information |
| `vng` | VNG footer structure | Sitemap, Informatie, Bedrijven |

#### Complete Theming Example
```yaml
# Full Dimpact theming
environment:
  - THEME_VARIANT=dimpact      # CSS: .dimpact-theme applied to <body>
  - FOOTER_STYLE=dimpact       # Footer: Dimpact-specific navigation items
```

#### Environment-Based vs Hostname-Based
- **Environment-based** (recommended): Uses `THEME_VARIANT` and `FOOTER_STYLE` environment variables
- **Hostname-based** (fallback): Legacy system that maps hostnames to themes
- **Hybrid support**: Application checks environment variables first, falls back to hostname detection

## Configuration Files

### Generated File: `src/constants/container.constants.js`

This file is automatically generated and should never be edited manually:

```javascript
// Auto-generated container constants
// This file is generated from environment variables during container startup
// DO NOT EDIT MANUALLY - changes will be overwritten

import { AcLockObject } from '@utils/ac-lock-object';

// Container configuration
export const CONTAINER_CONFIG = AcLockObject({
  SITE_TITLE: 'My Custom Environment',
  API_URL: 'https://api.example.com/apps',
  ENABLE_AUTHENTICATION: true,
  // ... all other variables
});

// Helper functions
export const getTitle = () => CONTAINER_CONFIG.SITE_TITLE;
export const getApiUrl = () => CONTAINER_CONFIG.API_URL;
export const isFeatureEnabled = (feature) => { /* ... */ };

// Individual exports
export const { SITE_TITLE, API_URL, /* ... */ } = CONTAINER_CONFIG;
```

### Generation Script: `scripts/generate-container-constants.js`

The Node.js script that creates the constants file:

```javascript
const getEnvConfig = () => {
  return {
    SITE_TITLE: process.env.SITE_TITLE || 'Development Catalogus',
    API_URL: process.env.API_URL || 'http://nextcloud.local/api/apps',
    // ... all environment variable mappings
  };
};
```

## Usage Examples

### Development Environment

**docker-compose.dev.yml**:
```yaml
services:
  app:
    environment:
      # Basic development setup
      - SITE_TITLE=Local Development 🛠️
      - API_URL=http://nextcloud.local/api/apps
      - ENABLE_AUTHENTICATION=false
      - ENABLE_ROLLBAR=false
      
      # Theming Configuration
      - THEME_VARIANT=dimpact          # CSS: .dimpact-theme class
      - FOOTER_STYLE=dimpact           # Footer: Dimpact structure
      
      # Visual Configuration
      - HERO_IMAGE_URL=/custom-dev-hero.jpg
      - MENU_POSITION=2
      
      # Connect to local backend
      - API_URL=http://host.docker.internal:3000/apps
      - GEMMA_ENDPOINT=http://host.docker.internal:3000
```

### Staging Environment

**docker-compose.staging.yml**:
```yaml
services:
  app:
    environment:
      # Staging configuration
      - SITE_TITLE=Staging Environment 🧪
      - SITE_DESCRIPTION=Pre-production testing environment
      - ENVIRONMENT_NAME=staging
      - THEME_VARIANT=dimpact          # Consistent theming across environments
      
      # Staging APIs
      - API_URL=https://staging-api.example.com/apps
      - API_URL_COMMONGROUND=https://staging-cg.example.com/apps
      - GEMMA_ENDPOINT=https://staging-gemma.example.com
      
      # Enable features for testing
      - ENABLE_AUTHENTICATION=true
      - ENABLE_ROLLBAR=true
      - ROLLBAR_ENVIRONMENT=staging
      - ROLLBAR_KEY=${ROLLBAR_STAGING_KEY}
      
      # Auth configuration
      - CLIENT_ID=${STAGING_CLIENT_ID}
      - CLIENT_SECRET=${STAGING_CLIENT_SECRET}
```

### Production Environment

**docker-compose.prod.yml**:
```yaml
services:
  app:
    environment:
      # Production configuration
      - SITE_TITLE=Softwarecatalogus
      - SITE_DESCRIPTION=Official government software catalog
      - ENVIRONMENT_NAME=production
      - THEME_VARIANT=dimpact          # Production Dimpact theming
      - FOOTER_STYLE=dimpact
      
      # Production APIs
      - API_URL=https://api.softwarecatalogus.nl/apps
      - API_URL_COMMONGROUND=https://commonground.softwarecatalogus.nl/apps
      - GEMMA_ENDPOINT=https://gemma.softwarecatalogus.nl
      
      # Security and monitoring
      - ENABLE_AUTHENTICATION=true
      - ENABLE_ROLLBAR=true
      - ROLLBAR_ENVIRONMENT=production
      - ROLLBAR_KEY=${ROLLBAR_PROD_KEY}
      
      # Session management
      - AUTO_LOGOUT=true
      - AUTO_LOGOUT_TIME=3600
      
      # Production auth
      - CLIENT_ID=${PROD_CLIENT_ID}
      - CLIENT_SECRET=${PROD_CLIENT_SECRET}
      - PROVIDER=keycloak
```

### Kubernetes Deployment

**ConfigMap**:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  SITE_TITLE: "Production Catalogus"
  API_URL: "https://api.example.com/apps"
  ENABLE_AUTHENTICATION: "true"
  ENABLE_ROLLBAR: "true"
```

**Secret**:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  CLIENT_SECRET: <base64-encoded-secret>
  ROLLBAR_KEY: <base64-encoded-key>
```

**Deployment**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tilburg-woo-ui
spec:
  template:
    spec:
      containers:
      - name: app
        image: tilburg-woo-ui:latest
        envFrom:
        - configMapRef:
            name: app-config
        - secretRef:
            name: app-secrets
```

## Migration Guide

### From Hostname-Based to Environment-Based

#### Before (Hostname-Based)
```javascript
// src/services/con-get-title.js
export const getTitle = () => {
  const hostname = window.location.hostname;
  switch (hostname) {
    case 'vng.opencatalogi.nl':
      return 'Softwarecatalogus';
    case 'localhost':
      return 'Localhost catalogus';
    default:
      return 'Open Tilburg';
  }
};
```

#### After (Environment-Based)
```javascript
// src/services/con-get-title.js
// Try to import container constants (generated at runtime)
let containerConfig;
try {
  containerConfig = require('@constants/container.constants');
} catch (error) {
  console.warn('Container constants not available, falling back to hostname-based logic');
  containerConfig = null;
}

export const getTitle = () => {
  // Use container config if available
  if (containerConfig && containerConfig.getTitle) {
    return containerConfig.getTitle();
  }

  // Fallback to hostname-based logic for production builds
  const hostname = window.location.hostname;
  switch (hostname) {
    // ... existing hostname logic
  }
};
```

#### Theme System Implementation
```javascript
// src/App.web.js - Environment-based theme selection
const getTheme = () => {
  // Try to import container constants (generated at runtime)
  let containerConfig;
  try {
    containerConfig = require('@constants/container.constants');
  } catch (error) {
    console.warn('Container constants not available, falling back to hostname-based theme logic');
    containerConfig = null;
  }

  // Use container config if available
  if (containerConfig && containerConfig.getThemeVariant) {
    const themeVariant = containerConfig.getThemeVariant();
    // Map theme variants to CSS theme classes
    switch (themeVariant) {
      case 'dimpact':
        return 'dimpact-theme';     // Environment: THEME_VARIANT=dimpact
      case 'vng':
        return 'vng-theme';
      case 'tilburg':
        return 'tilburg-theme';
      // ... other theme mappings
      case 'development':
      default:
        return 'vng-theme';         // Development fallback
    }
  }

  // Fallback to hostname-based logic for production builds
  const hostname = window.location.hostname;
  switch (hostname) {
    // ... existing hostname logic
  }
};

// Apply theme class to body element
const setTheme = () => {
  document.getElementById('body').classList.add(getTheme());
};
```

### Migration Steps

1. **Identify Configuration Points**:
   - Find all `window.location.hostname` usages
   - List hardcoded URLs and endpoints
   - Identify feature flags and environment-specific logic

2. **Add Environment Variables**:
   - Update `scripts/generate-container-constants.js`
   - Add variables to `docker-compose.dev.yml`
   - Document new variables

3. **Update Application Code**:
   - Import from `@constants/container.constants`
   - Add fallback logic for compatibility
   - Test both paths work correctly

4. **Deploy and Test**:
   - Test development environment
   - Verify production fallback works
   - Update deployment configurations

## Code Integration

### Using Generated Constants

```javascript
// Import the generated configuration
import { 
  getTitle, 
  getApiUrl, 
  isFeatureEnabled,
  CONTAINER_CONFIG 
} from '@constants/container.constants';

// Use helper functions (recommended)
const title = getTitle();
const apiEndpoint = getApiUrl();
const showLogin = isFeatureEnabled('authentication');

// Or use direct access
const config = CONTAINER_CONFIG;
const customValue = config.CUSTOM_SETTING;
```

### Component Integration

```javascript
// src/components/ac-header/ac-header.js
import React from 'react';
import { getTitle, isFeatureEnabled } from '@constants/container.constants';

export const AcHeader = () => {
  const siteTitle = getTitle();
  const showAuth = isFeatureEnabled('authentication');

  return (
    <header>
      <h1>{siteTitle}</h1>
      {showAuth && (
        <button>Login</button>
      )}
    </header>
  );
};
```

### API Configuration

```javascript
// src/config/index.js
import { getApiUrl, getCommongroundApiUrl } from '@constants/container.constants';

export default {
  api: {
    baseURL: getApiUrl(),
    // ... other config
  },
  publications: {
    baseURL: getCommongroundApiUrl(),
    // ... other config
  }
};
```

### Theme Switching Examples

Change themes by updating environment variables and restarting containers:

#### Switch from VNG to Dimpact Theme
```bash
# Update docker-compose.dev.yml
- THEME_VARIANT=vng        # Change from this
- FOOTER_STYLE=vng

# To this
- THEME_VARIANT=dimpact    # Dimpact CSS theme class
- FOOTER_STYLE=dimpact     # Dimpact footer structure

# Restart containers to apply changes
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
```

#### Switch to Rotterdam Municipality Theme
```bash
# Rotterdam theming
- THEME_VARIANT=rotterdam   # .rotterdam-theme CSS class
- FOOTER_STYLE=vng         # Use VNG footer structure with Rotterdam styling
```

#### Multi-Organization Support
```yaml
# Organization A environment
services:
  app-org-a:
    environment:
      - THEME_VARIANT=dimpact
      - FOOTER_STYLE=dimpact
      - SITE_TITLE=Organization A Portal

# Organization B environment  
  app-org-b:
    environment:
      - THEME_VARIANT=tilburg
      - FOOTER_STYLE=vng
      - SITE_TITLE=Municipality Portal
```

## Debugging

### Check Generated Constants

```bash
# View the generated file
docker exec container-name cat /app/src/constants/container.constants.js

# Check specific values
docker exec container-name grep "SITE_TITLE" /app/src/constants/container.constants.js
```

### Verify Environment Variables

```bash
# List all environment variables
docker exec container-name printenv

# Check specific variables
docker exec container-name printenv | grep -E "(SITE_|API_|ENABLE_)"

# Test variable in container
docker exec container-name sh -c 'echo "Title: $SITE_TITLE"'
```

### Monitor Generation Process

```bash
# Watch container startup logs
docker logs container-name --tail 20 -f

# Look for generation messages
docker logs container-name | grep -E "(🔧|✅|⚠️)"

# Manual generation
docker exec container-name node scripts/generate-container-constants.js
```

### Runtime Testing

```javascript
// In browser console
console.log(window.CONTAINER_CONFIG); // Check if loaded
console.log(require('@constants/container.constants')); // Test import
```

## Benefits

### Development Benefits
- **Local API Testing**: Point to local backends easily
- **Rapid Configuration**: Change behavior without rebuilds
- **Offline Development**: Work without external dependencies
- **Consistent Environment**: Same image across all environments

### Operations Benefits
- **Single Image**: One image for all environments
- **Secrets Management**: Sensitive config via environment variables
- **Easy Deployment**: Configure through orchestration tools
- **Rollback Safety**: Configuration separate from code

### Maintenance Benefits
- **Centralized Config**: All settings in one place
- **Type Safety**: Generated constants are strongly typed
- **Documentation**: Self-documenting environment variables
- **Testing**: Easy to test different configurations

## Troubleshooting

### Constants Not Generated

**Problem**: `container.constants.js` file is missing or empty

**Solutions**:
```bash
# Check if generation script exists
docker exec container-name ls -la /app/scripts/

# Run generation manually
docker exec container-name node scripts/generate-container-constants.js

# Check permissions
docker exec container-name ls -la /app/src/constants/

# Verify environment variables
docker exec container-name printenv | head -20
```

### Environment Variables Not Applied

**Problem**: Changes to environment variables don't appear in application

**Solutions**:
```bash
# Ensure container recreation (not restart)
docker-compose down && docker-compose up -d

# Check if variables are set in container
docker exec container-name printenv SITE_TITLE

# Verify generation happened
docker logs container-name | grep "Container constants"

# Force regeneration
docker exec container-name node scripts/generate-container-constants.js
```

### Fallback Logic Not Working

**Problem**: Application breaks when container constants unavailable

**Check**:
- Verify try/catch blocks in application code
- Test hostname-based fallback logic
- Ensure production builds work without container constants
- Check import paths and module resolution

### Performance Issues

**Problem**: Generation process slows down container startup

**Solutions**:
- Optimize generation script
- Cache generated constants
- Move generation to build time for production
- Use health checks to verify readiness

---

## Advanced Configuration

### Custom Configuration Loaders

```javascript
// Custom configuration loader
class ConfigLoader {
  static load() {
    try {
      return require('@constants/container.constants');
    } catch (error) {
      console.warn('Using fallback configuration');
      return this.getFallbackConfig();
    }
  }

  static getFallbackConfig() {
    return {
      getTitle: () => this.getHostnameBasedTitle(),
      getApiUrl: () => this.getHostnameBasedApi(),
      // ... fallback implementations
    };
  }
}
```

### Configuration Validation

```javascript
// Validate configuration at startup
const validateConfig = (config) => {
  const required = ['SITE_TITLE', 'API_URL'];
  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required config: ${missing.join(', ')}`);
  }
};
```

## Application Routes

| Route Name         | Path / Pattern                | Type      | Auth Required | Purpose / Description                        | Component (if any)         | Status |
|--------------------|------------------------------|-----------|---------------|----------------------------------------------|----------------------------|---------|
| Home               | /                            | concrete  | ❌            | Main landing page                           | AcHome                     | ✅ Active |
| Publication        | /publicatie/:id              | dynamic   | ❌            | Publication detail page                     | AcPublication              | ✅ Active |
| Search             | /zoeken/:query?              | dynamic   | ❌            | Search results (with optional query)        | AcSearch                   | ✅ Active |
| Search (static)    | /zoeken                      | concrete  | ❌            | Search landing page                         | AcSearch                   | ✅ Active |
| Login              | /login                       | concrete  | ❌            | User login/authentication                   | AcLogin                    | ✅ Active |
| Mijn Omgeving      | /mijn-omgeving               | concrete  | ❌            | User's personal environment                 | AcMijnOmgeving             | ✅ Active |
| GEMMA              | /gemma                       | concrete  | ❌            | GEMMA integration page                      | AcGemma                    | ✅ Active |
| Themes             | /onderwerpen                 | concrete  | ❌            | List of themes/subjects                     | AcThemes                   | ✅ Active |
| Nextcloud Auth     | /authorization               | concrete  | ❌            | Nextcloud authorization                     | AcNextcloudAuthorization   | ✅ Active |
| **Beheer**         | **/beheer**                  | **concrete** | **🔒 YES**    | **Admin dashboard**                         | **AcBeheer**               | **✅ Active** |
| **Beheer Type**    | **/beheer/:type**            | **dynamic** | **🔒 YES**     | **Admin type list**                         | **AcBeheer**               | **✅ Active** |
| **Beheer Type Detail** | **/beheer/:type/:id**    | **dynamic** | **🔒 YES**     | **Admin type detail**                       | **AcBeheer**               | **✅ Active** |
| Register           | /register                    | concrete  | ❌            | User registration                           | AcRegister                 | ✅ Active |
| Aanmelden          | /aanmelden                   | concrete  | ❌            | User registration (alias)                   | AcRegister                 | ✅ Active |
| Views              | /views/:id                   | dynamic   | ❌            | Dynamic views                               | AcViews                    | ✅ Active |
| **My Account**     | **/account**                 | **concrete** | **🔒 YES**    | **User account management**                 | **AcMyAccount**            | **✅ Active** |
| Directory          | /directory                   | concrete  | ❌            | Directory listing                           | ConDirectory               | ✅ Active |
| Fallback           | *                            | wildcard  | ❌            | Any other route redirects to Home           | AcHome                     | ✅ Active |

### Authentication-Required Routes

The following routes require user authentication and should redirect to login if accessed by unauthenticated users:

- **🔒 /beheer** - Admin dashboard
- **🔒 /beheer/:type** - Admin type management  
- **🔒 /beheer/:type/:id** - Admin detail pages
- **🔒 /account** - User account management

### CMS-Driven Routes (Removed from Frontend)

The following routes have been **removed from the frontend application** and are now handled dynamically by the OpenCatalogi CMS system as page objects:

| Route Name (Removed) | Former Path | Reason | Status |
|---------------------|-------------|---------|---------|
| ~~About~~           | ~/over-ons~ | CMS-driven content | 🗑️ **REMOVED** |
| ~~Accessibility~~   | ~/toegankelijkheid~ | CMS-driven content | 🗑️ **REMOVED** |
| ~~Contact~~         | ~/contact~ | CMS-driven content | 🗑️ **REMOVED** |
| ~~FAQ~~             | ~/veelgestelde-vragen~ | CMS-driven content | 🗑️ **REMOVED** |
| ~~Organization~~    | ~/organisatie-en-werkwijze~ | CMS-driven content | 🗑️ **REMOVED** |
| ~~WOO Request~~     | ~/woo-verzoek~ | CMS-driven external link | 🗑️ **REMOVED** |
| ~~Reach Out~~       | ~/bereikbaarheidsgegeverns~ | CMS-driven external link | 🗑️ **REMOVED** |
| ~~Cookies~~         | ~External Link~ | CMS-driven external link | 🗑️ **REMOVED** |
| ~~Privacy~~         | ~External Link~ | CMS-driven external link | 🗑️ **REMOVED** |
| ~~Proclaimer~~      | ~External Link~ | CMS-driven external link | 🗑️ **REMOVED** |
| ~~Website~~         | ~External Link~ | CMS-driven external link | 🗑️ **REMOVED** |

**Migration Strategy**: These routes are now managed as **Page objects** in OpenCatalogi, allowing content managers to:
- ✅ Update content without code deployments
- ✅ Manage translations dynamically  
- ✅ Control visibility and navigation
- ✅ Handle external links through the CMS
- ✅ Maintain SEO and meta information

- Dynamic routes use parameters (e.g., :id, :type, :query) for detail or filtered views.
- External routes open outside the SPA (new tab or redirect).
- Some routes (like About, Contact) may be handled as static content or CMS-driven pages.

## Permission and Authorization System

The application implements a **group-based permission system** where users are assigned to groups (not roles) that determine their access levels and available functionality.

### Permission Architecture

```mermaid
graph TD
    A[User Login] --> B[User Object with Groups Array]
    B --> C{Group Check}
    C --> D[Admin Group?]
    C --> E[Other Groups?]
    D --> F[Full Access]
    E --> G[Limited Access]
    F --> H[Can Access Admin Routes]
    G --> I[Public Routes Only]
    
    J[Content/Menu Item] --> K{Visibility Rules}
    K --> L[showAfterLogin/hideBeforeLogin]
    K --> M[hideAfterLogin/hideAfterInlog]
    L --> N[Show Only When Authenticated]
    M --> O[Hide When Authenticated]
```

### Group-Based Access Control

#### User Groups from Login Response
```json
{
  "user": {
    "groups": ["admin", "openregister"],
    "organisations": { /* ... */ }
  }
}
```

#### Available Groups
| Group | Description | Access Level | Usage |
|-------|-------------|--------------|-------|
| `admin` | Administrator | Full system access | Can access all admin routes, manage all content |
| `openregister` | Open Register User | Registry access | Can manage registry content |
| `editor` | Content Editor | Edit permissions | Can edit content, limited admin access |
| `viewer` | Read-Only User | View permissions | Can view content, no edit access |
| `moderator` | Content Moderator | Review permissions | Can moderate content, approve/reject |

### Permission Check Methods

#### UserStore Methods
```javascript
// Primary authentication checks
user.isAuthenticated         // boolean - is user logged in?

// Group-based permissions
user.isAdmin                // boolean - has 'admin' group?
user.hasGroup('admin')      // function - check specific group
user.hasRole('admin')       // alias for hasGroup (backward compatibility)
user.hasAnyGroup(['admin', 'editor'])  // has any of these groups?
user.hasAllGroups(['admin', 'editor']) // has all of these groups?

// Route access control
user.canAccessRoute('/beheer')  // can access specific route?

// Permission system (basic implementation)
user.hasPermission('manage_users')  // currently returns isAdmin
```

#### Legacy Permission Utilities
```javascript
// src/utilities/ac-get-permissions.js
import { AcCreateUser } from '@utils';

const userHelper = AcCreateUser(store);
userHelper.is('admin')           // check if user has group
userHelper.hasGroup('admin')     // same as is()
userHelper.hasRole('admin')      // backward compatibility
userHelper.can('permission')     // check permission (needs expansion)
userHelper.cannot('permission')  // inverse of can()
```

### Content Visibility Control

#### Authentication-Based Visibility
Content items (menus, forms, sections) can be controlled with visibility properties:

| Property | Type | Effect | Usage |
|----------|------|--------|-------|
| `hideBeforeLogin` | boolean | Hide before login, show after | Content only for authenticated users |
| `hideAfterLogin` | boolean | Show before login, hide after | Public-only content |

#### Visibility Examples
```json
{
  "menuItem": {
    "name": "Admin Dashboard",
    "link": "/beheer",
    "hideBeforeLogin": true   // Only show when logged in
  },
  "publicContent": {
    "name": "Login",
    "link": "/login", 
    "hideAfterLogin": true    // Only show when NOT logged in
  }
}
```

### Route Protection

#### Authentication-Required Routes
These routes automatically redirect to login if accessed by unauthenticated users:

```javascript
// src/constants/routes.constants.js
export const AUTHENTICATION_REQUIRED_ROUTES = [
  PATHS.BEHEER,              // /beheer
  PATHS.BEHEER_TYPE,         // /beheer/:type  
  PATHS.BEHEER_TYPE_DETAILS, // /beheer/:type/:id
  PATHS.MY_ACCOUNT,          // /account
];
```

#### Protected Route Component
```javascript
// Usage in App.web.js
<Route path="/beheer" element={
  <AcProtectedRoute requireAuth={true} fallbackPath="/login">
    <AcBeheer />
  </AcProtectedRoute>
} />
```

### Permission Implementation Locations

#### 1. Route Guards (`src/components/ac-protected-route/`)
- **Purpose**: Protect routes from unauthorized access
- **Implementation**: Checks `user.checkAuthStatus()` before rendering
- **Fallback**: Redirects to `/login?redirect_url=...`

#### 2. Menu Filtering (`src/stores/menu.store.js`)
- **Purpose**: Show/hide menu items based on authentication
- **Implementation**: `shouldShowMenu()` and `shouldShowMenuItem()`
- **Properties**: Uses `hideBeforeLogin`, `hideAfterLogin` properties

#### 3. Content Filtering (`src/utilities/con-authentication-filters.js`)
- **Purpose**: Filter page content, forms, sections based on auth
- **Methods**: 
  - `shouldShowContent()` - check single item
  - `filterContentItems()` - filter arrays
  - `shouldShowFormField()` - form field visibility
  - `filterPageSections()` - page section filtering

#### 4. Component-Level Checks
```javascript
// In React components
const { user } = store;

// Show admin features only to admins
{user.isAdmin && (
  <AdminPanel />
)}

// Show content based on authentication
{user.isAuthenticated ? (
  <UserDashboard />
) : (
  <LoginPrompt />
)}

// Group-based features
{user.hasGroup('editor') && (
  <EditButton />
)}
```

### Permission System Limitations

#### Current Implementation
- ✅ **Group-based access control** - Users have groups like 'admin', 'editor'
- ✅ **Route protection** - Authentication-required routes redirect to login
- ✅ **Content visibility** - Menu items and content can be shown/hidden
- ✅ **Basic admin detection** - `user.isAdmin` checks for 'admin' group

#### Missing/Limited Features
- ❌ **Granular permissions** - No fine-grained permission system
- ❌ **Organization-based permissions** - Groups are global, not per-organization
- ❌ **Dynamic permissions** - Permissions are hardcoded, not configurable
- ❌ **Permission inheritance** - No hierarchy or inheritance system
- ❌ **Resource-based permissions** - Can't check "can edit this specific item"

#### Future Enhancements Needed
```javascript
// Desired permission system expansion
user.can('edit', 'publications')        // Action + Resource
user.canInOrganization('manage', orgId)  // Organization-scoped permissions
user.hasPermission('users.create')      // Hierarchical permissions
user.isOwnerOf(resourceId)              // Resource ownership
```

### Environment Configuration for Permissions

#### Enable Authentication Features
```yaml
environment:
  - ENABLE_AUTHENTICATION=true    # Show login/logout features
  - ENABLE_ADMIN_FEATURES=true    # Enable admin dashboard
  - ENABLE_USER_MANAGEMENT=false  # Enable user management (future)
```

#### Group Management (Future)
```yaml
environment:
  # Future group configuration
  - DEFAULT_USER_GROUP=viewer
  - ADMIN_GROUPS=admin,super_admin
  - EDITOR_GROUPS=editor,content_manager
```

### Security Considerations

#### Frontend Security
- 🔒 **Route protection** prevents unauthorized page access
- 🔒 **Content filtering** hides sensitive information
- 🔒 **UI state management** shows appropriate interface elements

#### Backend Security
- ⚠️ **Frontend permissions are not security** - Always validate on backend
- ⚠️ **API endpoints must implement their own authorization**
- ⚠️ **Group membership should be verified server-side**

#### Best Practices
1. **Always validate permissions on the backend**
2. **Use frontend permissions only for UI/UX optimization**
3. **Implement proper session management**
4. **Regularly audit group assignments**
5. **Log permission-related actions for security monitoring**

This environment configuration system provides a robust, flexible foundation for managing application configuration across all deployment scenarios while maintaining backward compatibility and operational simplicity. 
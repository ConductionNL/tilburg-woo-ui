# Runtime Configuration Fix - Environment Variables Not Propagating

## Problem Summary

Environment variables were being set correctly in the container and showing up in `window.RUNTIME_CONFIG`, but the frontend application was not using those runtime values. The variables appeared in container logs but not in the actual UI.

## Root Cause

The application had **two separate configuration systems** that weren't properly integrated:

1. **`runtime-config.js`** (✅ Working correctly)
   - Generated at container startup from environment variables
   - Loaded before React bundle via `<script>` tag in `index.html`
   - Sets `window.RUNTIME_CONFIG` with environment-specific values

2. **`container.constants.js`** (❌ **Problem was here**)
   - Bundled with webpack at build time
   - Had **hardcoded static values** instead of reading from `window.RUNTIME_CONFIG`
   - Application imported this file, getting stale build-time values

### The Data Flow (Before Fix)

```
Container Startup:
  Environment Variables → runtime-config.js → window.RUNTIME_CONFIG ✅
  
Application Runtime:
  container.constants.js (static) → Application (using wrong values) ❌
  
window.RUNTIME_CONFIG existed but was never used! 🐛
```

## The Solution

Modified `scripts/generate-container-constants.js` to generate code that **reads from `window.RUNTIME_CONFIG` at runtime** instead of hardcoding values at build time.

### Changes Made

#### 1. Updated Generator Script (`scripts/generate-container-constants.js`)

Changed from generating static values:
```javascript
export const CONTAINER_CONFIG = AcLockObject({
  SITE_TITLE: 'Environment Config Test ✅',  // Static value!
  FOOTER_LOGO_SUBTITLE: 'Één plek...',        // Static value!
  // ...
});
```

To generating runtime-aware code:
```javascript
// Helper function that reads from window.RUNTIME_CONFIG
const getRuntimeOrDefault = (key, defaultValue) => {
  if (typeof window !== 'undefined' && window.RUNTIME_CONFIG && window.RUNTIME_CONFIG[key] !== undefined) {
    return window.RUNTIME_CONFIG[key];  // Use runtime value!
  }
  return defaultValue;  // Fallback to build-time default
};

export const CONTAINER_CONFIG = AcLockObject({
  SITE_TITLE: getRuntimeOrDefault('SITE_TITLE', 'Development Catalogus'),
  FOOTER_LOGO_SUBTITLE: getRuntimeOrDefault('FOOTER_LOGO_SUBTITLE', 'Één plek...'),
  // ...
});
```

#### 2. Regenerated Container Constants

Ran the generator script to create the new runtime-aware `src/constants/container.constants.js`:

```bash
node scripts/generate-container-constants.js
```

#### 3. Updated Dockerfile

**CRITICAL:** The Dockerfile now generates the runtime-aware `container.constants.js` **before** webpack builds:

```dockerfile
# Generate runtime-aware container.constants.js before webpack build
RUN echo "🔧 Generating runtime-aware container constants..."
RUN node scripts/generate-container-constants.js

# Build the application with the runtime-aware constants
RUN yarn build:web
```

**Why this is needed:** The generated file contains **code** that reads from `window.RUNTIME_CONFIG`, not hardcoded values. This code needs to be bundled by webpack. At runtime, when the bundled code executes, it will read the values from `window.RUNTIME_CONFIG` which was populated by `runtime-config.js`.

### The Data Flow (After Fix)

```
Container Startup:
  Environment Variables → runtime-config.js → window.RUNTIME_CONFIG ✅
  
Application Runtime:
  container.constants.js → window.RUNTIME_CONFIG → Application (correct values) ✅
```

## Benefits

1. **Environment variables now work correctly** - Changes to environment variables are reflected in the UI
2. **No rebuild needed** - Same Docker image can be used across environments with different configs
3. **Backwards compatible** - Falls back to build-time defaults if `window.RUNTIME_CONFIG` is unavailable
4. **Single source of truth** - `window.RUNTIME_CONFIG` is the authoritative configuration source

## Testing

Created and ran tests to verify:
- ✅ `getRuntimeOrDefault()` correctly reads from `window.RUNTIME_CONFIG`
- ✅ Falls back to defaults when keys are missing
- ✅ Handles different data types (strings, booleans, numbers, null)
- ✅ Generated `container.constants.js` includes runtime config bridge
- ✅ `runtime-config.js` structure is correct

## For Developers

### Local Development

When you modify environment variables in `helm/tilburg-woo-ui/values.yaml`:

1. Regenerate container constants:
   ```bash
   node scripts/generate-container-constants.js
   ```

2. Webpack will auto-rebuild and hot-reload

### Container/Production

When the container starts:

1. `generate-runtime-config.js` runs → creates `runtime-config.js` from environment variables
2. Browser loads `runtime-config.js` → sets `window.RUNTIME_CONFIG`
3. React bundle loads → `container.constants.js` reads from `window.RUNTIME_CONFIG`

### Debugging

You can inspect the configuration in the browser console:

```javascript
// Check what runtime config was loaded
console.log(window.RUNTIME_CONFIG);

// Check what the application is using
import { CONTAINER_CONFIG } from '@constants/container.constants';
console.log(CONTAINER_CONFIG);
```

## Related Files

- `scripts/generate-runtime-config.js` - Generates `runtime-config.js` at container startup
- `scripts/generate-container-constants.js` - Generates runtime-aware `container.constants.js`
- `src/constants/container.constants.js` - Generated file (reads from `window.RUNTIME_CONFIG`)
- `public/runtime-config.js` - Generated file (sets `window.RUNTIME_CONFIG`)
- `public/index.html` - Loads `runtime-config.js` before React bundle
- `Dockerfile` - Includes runtime config generation in startup script

## Priority Order

Configuration values are resolved in this order:

1. **`window.RUNTIME_CONFIG`** (from environment variables at container startup) - **Highest priority**
2. **Build-time defaults** (from generator script) - **Fallback**

This ensures environment-specific configuration always takes precedence over defaults.


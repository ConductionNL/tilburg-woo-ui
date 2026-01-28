# How to Rebuild with Runtime Config Fix

## What Was Fixed

The `container.constants.js` file now generates **runtime-aware code** that reads from `window.RUNTIME_CONFIG` instead of having hardcoded values.

## Build Process Flow

```
1. Dockerfile runs: node scripts/generate-container-constants.js
   ↓
2. Generates: src/constants/container.constants.js (with runtime-aware code)
   ↓
3. Webpack builds: Bundles the runtime-aware code into the app
   ↓
4. Container starts: Generates runtime-config.js from environment variables
   ↓
5. Browser loads: runtime-config.js sets window.RUNTIME_CONFIG
   ↓
6. React app runs: container.constants.js reads from window.RUNTIME_CONFIG ✅
```

## How to Rebuild

### Option 1: Rebuild Locally

```bash
# 1. Make sure you have the latest code with the fixes
git pull

# 2. Build the Docker image
docker build -t ghcr.io/conductionnl/tilburg-woo-ui:latest .

# 3. Push to registry
docker push ghcr.io/conductionnl/tilburg-woo-ui:latest

# 4. Restart your Kubernetes deployment
kubectl rollout restart deployment/tilburg-woo-ui
```

### Option 2: Use CI/CD Pipeline

If you have a CI/CD pipeline (GitHub Actions, GitLab CI, etc.):

```bash
# 1. Commit the changes
git add Dockerfile scripts/generate-container-constants.js RUNTIME-CONFIG-FIX.md
git commit -m "Fix: Generate runtime-aware container constants before webpack build"
git push

# 2. Your CI/CD pipeline will automatically build and push the image

# 3. ArgoCD or your deployment system will pull the new image
```

## Verification After Rebuild

Once the new image is deployed:

1. **Check container logs** - You should see:
   ```
   🔧 Generating runtime configuration...
   ✅ Runtime configuration generated successfully!
   🌍 Configuration from environment variables:
      SITE_TITLE: Softwarecatalogus
      FOOTER_LOGO_SUBTITLE: Één plek voor alle software voor en door Gemeenten
      ...
   ```

2. **Check browser console** - Run:
   ```javascript
   console.log(window.RUNTIME_CONFIG);
   // Should show your environment variables
   ```

3. **Check the app** - The site title, footer text, hero image, and theme should now use your environment variables!

## What Changed in the Files

### `Dockerfile` (Lines 25-31)
**Before:**
```dockerfile
RUN echo "ℹ️  Skipping build-time container constants generation (using runtime config instead)"
```

**After:**
```dockerfile
RUN echo "🔧 Generating runtime-aware container constants..."
RUN node scripts/generate-container-constants.js
```

### `scripts/generate-container-constants.js`
Now generates code with `getRuntimeOrDefault()` function that reads from `window.RUNTIME_CONFIG` at runtime.

### `src/constants/container.constants.js` (Generated)
Now contains runtime-aware code instead of hardcoded values.

## Why This Works

The key insight is that we need to generate **code that reads runtime config**, not **hardcoded config values**.

- ❌ **Wrong:** Generate file with hardcoded values → Bundle → Can't change at runtime
- ✅ **Right:** Generate file with runtime-reading code → Bundle → Reads `window.RUNTIME_CONFIG` at runtime

The generated file contains **JavaScript code** like:
```javascript
const getRuntimeOrDefault = (key, defaultValue) => {
  if (window.RUNTIME_CONFIG?.[key] !== undefined) {
    return window.RUNTIME_CONFIG[key];  // ← Reads at runtime!
  }
  return defaultValue;
};
```

This code is bundled by webpack, but when it **executes** in the browser, it reads the current values from `window.RUNTIME_CONFIG`.

## Troubleshooting

If it still doesn't work after rebuild:

1. **Clear browser cache** - Hard refresh (Ctrl+F5 / Cmd+Shift+R)

2. **Check the bundle** - View source and search for `getRuntimeOrDefault` in the bundle

3. **Verify image was rebuilt** - Check the image timestamp:
   ```bash
   docker image inspect ghcr.io/conductionnl/tilburg-woo-ui:latest | grep Created
   ```

4. **Check pod is using new image**:
   ```bash
   kubectl describe pod <pod-name> | grep Image:
   ```


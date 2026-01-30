# Service Worker Cache Fix - White Screen Issue

## Problem Summary

The production environment at `https://performance.accept.opencatalogi.nl` was experiencing intermittent white screens with ChunkLoadError messages. Users had to reload multiple times before the application would work.

### Root Cause

The service worker was caching old webpack chunk manifests. After new deployments:
1. New chunks are generated with new content hashes (e.g., `6346.c7b41a17.chunk.js` → `6346.NEW_HASH.chunk.js`)
2. The old service worker still had references to old chunks in its precache manifest
3. When users visited the site, the service worker tried to load old chunks that no longer existed
4. This caused 404 errors and a white screen
5. After multiple reloads, the service worker would eventually update and the app would work

## Solution Implemented

### 1. Aggressive Service Worker Updates (`src/registerServiceWorker.js`)

- **Immediate update check** on registration
- **Automatic page reload** when a new service worker is installed (prevents users from seeing stale content)
- **Periodic update checks** every 60 seconds to detect new deployments quickly
- **Skip waiting message** sent to new service workers to activate immediately

### 2. Chunk Load Error Recovery (`src/index.web.js`)

- **Automatic reload** when ChunkLoadError is detected
- **Cache clearing** before reload to ensure fresh assets
- **Prevention of reload loops** with a counter mechanism

### 3. Improved Service Worker Caching Strategy (`src/service-worker.js`)

- **NetworkFirst strategy for JS chunks** - Always tries network first, preventing stale cached chunks
- **Automatic cache cleanup** on service worker activation
- **CLEAR_CACHE message handler** to support manual cache clearing
- **Ignore URL parameters** in precache matching to be more resilient

## Changes Made

### Modified Files:
1. `src/registerServiceWorker.js` - Added aggressive update checks and automatic reload
2. `src/index.web.js` - Added ChunkLoadError detection and recovery
3. `src/service-worker.js` - Improved caching strategies and cleanup

### Key Improvements:
- ✅ Service worker updates immediately when new deployment is detected
- ✅ Automatic page reload prevents users from seeing old cached content
- ✅ ChunkLoadError causes automatic recovery (cache clear + reload)
- ✅ Old caches are cleaned up on service worker activation
- ✅ JS chunks use NetworkFirst strategy (network-first, cache-fallback)

## Deployment Instructions

1. **Build the application:**
   ```bash
   yarn build:web
   ```

2. **Build and push Docker image:**
   ```bash
   docker build -t ghcr.io/conductionnl/tilburg-woo-ui:latest .
   docker push ghcr.io/conductionnl/tilburg-woo-ui:latest
   ```

3. **Deploy via Helm/ArgoCD:**
   - The new image will be deployed automatically
   - Users will get the fix on their next visit
   - The automatic reload mechanism will take effect immediately

4. **Verify the fix:**
   - Visit the site in an incognito window
   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - The app should load without white screens
   - After the first successful load, subsequent visits should be instant

## Expected Behavior After Fix

### For Users:
- **First visit after deployment:** May see one automatic reload (service worker updating)
- **Subsequent visits:** Instant load from cache
- **New deployment:** Automatic reload to get latest version
- **ChunkLoadError (if any):** Automatic recovery with cache clear + reload

### For Developers:
- No more "excessive reloading" needed
- Users always get the latest version within 60 seconds of deployment
- Service worker cache is properly managed and cleaned up
- Network-first strategy prevents stale chunk issues

## Technical Details

### Service Worker Lifecycle:
1. **Install** - New service worker downloads and installs in background
2. **Waiting** - New service worker waits for old one to be released
3. **Skip Waiting** - We force immediate activation (no waiting)
4. **Activate** - Old caches are cleaned up
5. **Claim** - New service worker takes control immediately

### Caching Strategy:
- **HTML (index.html):** NetworkFirst - Always try network first
- **JS Chunks:** NetworkFirst - Always try network first, fallback to cache
- **Static assets (images, fonts):** StaleWhileRevalidate - Serve from cache, update in background
- **Precache:** Webpack-generated assets are precached with proper versioning

## Testing Recommendations

1. **Test new deployment:**
   - Deploy new version
   - Wait 60 seconds (for update check interval)
   - Refresh page
   - Verify automatic reload happens
   - Verify app loads successfully

2. **Test chunk error recovery:**
   - Deploy new version
   - Immediately load page (before update check)
   - If ChunkLoadError occurs, verify automatic reload
   - Verify app loads successfully after reload

3. **Test service worker update:**
   - Check browser DevTools > Application > Service Workers
   - Verify service worker version updates on deployment
   - Verify old caches are deleted on activation

## Monitoring

Monitor these metrics post-deployment:
- ✅ ChunkLoadError occurrences (should drop to near zero)
- ✅ White screen reports (should be eliminated)
- ✅ Service worker update success rate
- ✅ Page reload frequency (should be low, only on SW updates)

## Rollback Plan

If issues occur, rollback is simple:
1. Revert the three modified files
2. Rebuild and redeploy
3. The old service worker behavior will resume

However, the changes are safe and follow best practices, so rollback should not be necessary.

## References

- [Workbox Service Worker Guide](https://developers.google.com/web/tools/workbox)
- [Service Worker Lifecycle](https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle)
- [Handling Service Worker Updates](https://redfin.engineering/how-to-fix-the-refresh-button-when-using-service-workers-a8e27af6df68)


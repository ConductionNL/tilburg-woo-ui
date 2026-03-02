# Cache Busting Guide

## ✅ Implemented Solutions

Your webpack build now includes **advanced cache busting** features:

### 1. **Build Timestamps & Versions**
- Every build gets a unique timestamp and version injected into HTML
- Format: `2024.01.15-1705123456789`
- Visible in browser DevTools: `<meta name="build-version" content="..." />`

### 2. **Enhanced Service Worker**
- Service worker now forces updates when build changes
- Improved cache busting regex for assets
- Automatic invalidation of root path `/` on new builds

### 3. **File Hashing (Already Working)**
- JS files: `[chunkhash:8]` → `app.a1b2c3d4.js`
- CSS files: `[contenthash:8]` → `main.e5f6g7h8.css`
- Assets: `[hash:13]` → `logo.a1b2c3d4e5f6g.svg`

### 4. **GitHub Actions Integration**
- Workflow now passes Git commit info to build process
- Build version format in CI: `123-a1b2c3d-1705123456789`
- Automated verification that cache busting is working
- Fails build if cache busting setup is broken

## 🔧 Server Configuration (Required)

**Add these cache headers to your nginx/server config:**

### Nginx Configuration

Add to your nginx config file:

```nginx
# Cache static assets with hash for 1 year (they won't change)
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
  # Only cache files with hash in filename
  location ~* \.[0-9a-f]{8,13}\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Vary "Accept-Encoding";
  }
  
  # Don't cache files without hash
  location ~* ^(?!.*\.[0-9a-f]{8,13}\.).*\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1d;
    add_header Cache-Control "public, must-revalidate";
  }
}

# NEVER cache HTML files (they contain references to hashed assets)
location ~* \.(html|htm)$ {
  expires -1;
  add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
  add_header Pragma "no-cache";
}

# Don't cache API responses
location /api/ {
  expires -1;
  add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
}

# Don't cache service worker
location = /service-worker.js {
  expires -1;
  add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
}
```

### Docker/Container Setup

If using Docker, add these to your `nginx.conf`:

```nginx
# Inside your server block
location / {
  try_files $uri $uri/ /index.html;
  
  # Don't cache HTML
  location = /index.html {
    expires -1;
    add_header Cache-Control "no-store, no-cache, must-revalidate";
  }
}
```

## 🚀 Deployment Process

### 1. **Automated GitHub Actions Build**

Your workflow now automatically handles cache busting:

```yaml
# Pushes to main branches trigger builds with:
- Git commit SHA in build version
- Automatic verification of cache busting
- Docker image with proper nginx cache headers
```

Each build will:
- Generate new file hashes for changed files  
- Inject unique build timestamp + Git info into HTML
- Update service worker with new revision
- Verify cache busting is working correctly
- Build Docker image with optimized nginx config

### 2. **Manual Build (Development)**
```bash
yarn build:web
```

### 3. **Deploy to Server** 
- GitHub Actions builds and pushes Docker image
- Deploy the new image to your container environment
- nginx serves with proper cache headers
- Users automatically get new code

### 3. **Verification**

Check if cache busting is working:

```bash
# Check build version in HTML
curl -s https://your-domain.com | grep "build-version"

# Check asset hashes
curl -s https://your-domain.com | grep -o 'static/js/[^"]*'
```

## 🐛 Troubleshooting

### Still Seeing Old Code?

1. **Check HTML cache headers:**
   ```bash
   curl -I https://your-domain.com
   # Should show: Cache-Control: no-store, no-cache
   ```

2. **Verify build timestamp changed:**
   - Right-click page → View Source
   - Look for `<meta name="build-version" content="..." />`
   - Should be different after each deployment

3. **Clear service worker cache:**
   - Open DevTools → Application → Storage
   - Click "Clear site data"
   - Hard refresh (Ctrl+Shift+R)

4. **Check asset hashes:**
   - View page source
   - Look for script/link tags
   - Verify they have new 8-character hashes

### Force All Users to Update

If you need to force ALL users to get new code immediately:

1. **Increment version manually:**
   ```javascript
   // In webpack.config.prod.js, change BUILD_VERSION format:
   const BUILD_VERSION = `v2.0.0-${Date.now()}`;
   ```

2. **Add cache-busting query param:**
   ```html
   <!-- Add to public/index.html if desperate -->
   <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
   <meta http-equiv="Pragma" content="no-cache">
   <meta http-equiv="Expires" content="0">
   ```

## 📊 Benefits

- **No more user complaints** about old code
- **Instant updates** for critical fixes
- **Optimal caching** for performance
- **Automatic cache invalidation** on deploy
- **Debug-friendly** with visible build versions

## ⚠️ Important Notes

1. **Server config is critical** - webpack handles assets, server handles HTML caching
2. **Test after deployment** - verify build version changes in browser
3. **Monitor service worker** - ensure it updates properly
4. **Document deployments** - build version helps track which code is live

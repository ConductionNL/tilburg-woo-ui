# Docker Development Environment Troubleshooting Guide

## Common Issue: Module Resolution Failures & Build System Problems

### Symptoms to Look For 🚨
- Browser console shows module resolution errors like:
  - `Module not found: Error: Can't resolve '../ac-beheer/constants'`
  - `Module not found: Error: Can't resolve './components/...'`
- Webpack compilation errors in the browser
- Previously working code suddenly fails to compile
- Hot reload stops working properly
- Import statements that worked before now show as missing modules

### Root Cause Analysis 🔍
These issues typically occur when:
- The webpack build system gets into a corrupted state
- File watchers stop working properly
- Container caches become stale
- Source code volume mounts become out of sync
- Node modules or build artifacts get corrupted

### Primary Solution: Container Reset 🔄

#### Step 1: Check Current Container Status
```bash
docker ps
```
Look for containers: `tilburg-woo-ui-hot` (port 3000) and `tilburg-woo-ui-dev` (port 81)

#### Step 2: Stop Development Containers
```bash
docker-compose -f docker-compose.dev.yml down
```

#### Step 3: Restart with Clean State
```bash
docker-compose -f docker-compose.dev.yml up -d
```

#### Step 4: Verify Restart Success
```bash
# Check containers are running
docker ps

# Check hot reload container logs
docker logs tilburg-woo-ui-hot --tail 20

# Look for successful webpack dev server startup
```

#### Step 5: Test the Fix
1. Refresh browser at `localhost:3000`
2. Check browser console for errors
3. Verify hot reload is working by making a small code change

### When to Use This Solution ✅
- **Module resolution errors**: Import/require statements failing
- **Hot reload issues**: Changes not reflecting in browser
- **Authentication flow problems**: Need clean session state
- **After environment variable changes**: Container constants need regeneration
- **File watcher problems**: Auto-rebuild not working
- **General "it was working before" situations**

### Alternative Solutions (If Primary Doesn't Work) 🛠️

#### Option 1: Full System Reset
```bash
# Stop all containers and remove volumes
docker-compose -f docker-compose.dev.yml down -v

# Remove images (will trigger rebuild)
docker rmi tilburg-woo-ui-tilburg-woo-ui-hot tilburg-woo-ui-tilburg-woo-ui-dev

# Rebuild and start
docker-compose -f docker-compose.dev.yml up -d --build
```

#### Option 2: Check for File System Issues
```bash
# Check if source files are properly mounted
docker exec -it tilburg-woo-ui-hot ls -la /app/src/

# Check webpack config
docker exec -it tilburg-woo-ui-hot cat /app/config/webpack.config.dev.js
```

#### Option 3: Node Modules Reset
```bash
# Enter container and reinstall dependencies
docker exec -it tilburg-woo-ui-hot sh
yarn install --force
```

### Project-Specific Context 📋

#### Container Architecture
- **tilburg-woo-ui-hot**: Hot reload development server (port 3000)
- **tilburg-woo-ui-dev**: Production-like environment (port 81)

#### Key File Locations
- Docker config: `docker-compose.dev.yml`
- Webpack config: `config/webpack.config.dev.js`
- Source mounting: `./src:/app/src`

#### Environment Variables to Monitor
- `NODE_ENV=development` (hot container)
- `NODE_ENV=production` (dev container)
- `GENERATE_SOURCEMAP=true`
- `BROWSER=none`

### Prevention Tips 🛡️

1. **Regular Restarts**: Restart containers daily during active development
2. **Clean Shutdowns**: Always use `docker-compose down` instead of killing containers
3. **Monitor Logs**: Check container logs regularly for warnings
4. **Volume Management**: Be careful with volume mounts and permissions

### Emergency Checklist ✋

When nothing works, try in this order:
1. ✅ Container restart (primary solution above)
2. ✅ Full system reset with volume cleanup
3. ✅ Check Docker Desktop/daemon status
4. ✅ Verify source code file permissions
5. ✅ Check available disk space
6. ✅ Restart Docker Desktop entirely

### Success Indicators ✨
After applying fixes, you should see:
- ✅ No module resolution errors in browser console
- ✅ Webpack dev server shows "Project is running at" message
- ✅ Container health checks passing
- ✅ Hot reload working (changes reflect immediately)
- ✅ Clean build output in container logs

### Notes for Future Reference 📝
- This solution works for ~90% of development environment issues
- Container restart is fast (usually < 30 seconds)
- No code changes are lost (source is volume-mounted)
- Both hot reload and production containers need restart together
- Always check both browser console AND container logs

---
*Last updated: $(date)*
*This guide is specifically for the Tilburg WOO UI project development environment*

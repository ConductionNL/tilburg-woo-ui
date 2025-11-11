# Tilburg WOO UI - Developer Guide

This guide provides comprehensive instructions for local development, configuration, and deployment of the Tilburg WOO UI application.

## Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd tilburg-woo-ui

# Start development environment (watch build with nginx proxy on port 81)
docker-compose -f docker-compose.dev.yml up -d

# Or start hot reload development (live reload with webpack proxy on port 3000)
docker-compose -f docker-compose.dev.yml up tilburg-woo-ui-hot -d

# Access your application
# Watch build with nginx proxy: http://localhost:81
# Hot reload with webpack proxy: http://localhost:3000
```

## Architecture Overview

This application uses a **dual-proxy architecture** to handle API requests:

### Development Setup
- **Port 81**: Nginx proxy with production-like configuration
- **Port 3000**: Webpack dev server with hot reload capabilities
- Both environments proxy `/api/*` requests to your Nextcloud backend

### Production Setup
- **Port 81**: Nginx proxy serving static files and proxying API requests
- Same proxy configuration as development for consistency

## Environment Configuration

### Required Environment Variables

#### Nextcloud Backend Configuration
```bash
# The hostname of your Nextcloud instance
NEXTCLOUD_HOST=nextcloud.local

# Nginx proxy configuration (auto-configured for development)
NGINX_OPENCONNECTOR_UPSTREAM=http://host.docker.internal:80
NGINX_NEXTCLOUD_UPSTREAM=http://host.docker.internal:80
NGINX_NEXTCLOUD_DOMAIN=nextcloud.local
NGINX_TARGET_HOST=nextcloud.local
```

#### API Endpoint Configuration
```bash
# Frontend API endpoints (nginx handles index.php automatically)
API_URL=/api/apps
API_URL_COMMONGROUND=/api/apps
GEMMA_ENDPOINT=/api
OPENCONNECTOR_API_URL=/api/openconnector
```

### Local Nextcloud Setup

By default, the application is configured to connect to a local Nextcloud instance at `nextcloud.local`. To set this up:

#### Option 1: Add to hosts file (Recommended)
```bash
# On Windows: C:\Windows\System32\drivers\etc\hosts
# On macOS/Linux: /etc/hosts
127.0.0.1    nextcloud.local
```

#### Option 2: Use Docker Compose with Nextcloud
```yaml
# docker-compose.nextcloud.yml
services:
  nextcloud:
    image: nextcloud:latest
    ports:
      - "80:80"
    volumes:
      - nextcloud_data:/var/www/html
    networks:
      - nextcloud-network

volumes:
  nextcloud_data:

networks:
  nextcloud-network:
```

#### Option 3: Override API URLs
If you prefer different URLs, override them in `docker-compose.dev.yml`:
```yaml
environment:
  - API_URL=http://your-api-server:3000/apps
  - API_URL_COMMONGROUND=http://your-api-server:3000/apps
  - GEMMA_ENDPOINT=http://your-api-server:3000
```

## Development Modes

### 1. Watch Build Mode (Recommended)
- **Port**: 81
- **Service**: `tilburg-woo-ui-dev`
- **Features**: File watching, automatic rebuilds, production-like serving
- **Best for**: Testing production builds, debugging, performance testing

```bash
docker-compose -f docker-compose.dev.yml up tilburg-woo-ui-dev -d
```

### 2. Hot Reload Mode  
- **Port**: 3000
- **Service**: `tilburg-woo-ui-hot`
- **Features**: Instant hot module replacement, live reloading
- **Best for**: Rapid development, UI changes, component development

```bash
docker-compose -f docker-compose.dev.yml up tilburg-woo-ui-hot -d
```

## Production Deployment

### Quick Production Start

```bash
# Build and start production container
docker-compose up -d

# Access production application
# Production build: http://localhost:81
```

### Production Environment Variables

The production container supports the same proxy architecture as development. Configure these variables in your production environment:

```bash
# Required: Nextcloud Backend Configuration
NGINX_OPENCONNECTOR_UPSTREAM=http://your-nextcloud-server:80
NGINX_NEXTCLOUD_UPSTREAM=http://your-nextcloud-server:80  
NGINX_NEXTCLOUD_DOMAIN=your-nextcloud-domain.com
NGINX_TARGET_HOST=your-nextcloud-domain.com

# Frontend API Configuration
API_URL=/api/apps
API_URL_COMMONGROUND=/api/apps
GEMMA_ENDPOINT=/api
OPENCONNECTOR_API_URL=/api/openconnector

# Example production docker-compose.yml override
services:
  tilburg-woo-ui:
    environment:
      - NGINX_TARGET_HOST=nextcloud.example.com
      - NGINX_OPENCONNECTOR_UPSTREAM=http://nextcloud-server:80
      - NGINX_NEXTCLOUD_UPSTREAM=http://nextcloud-server:80
      - NGINX_NEXTCLOUD_DOMAIN=nextcloud.example.com
```

### Production Features

- ✅ **Nginx Proxy**: Same proxy configuration as development
- ✅ **Static File Serving**: Optimized nginx static file serving
- ✅ **Security Headers**: Production security headers enabled
- ✅ **Gzip Compression**: Automatic compression for better performance
- ✅ **SPA Routing**: Single-page application routing support
- ✅ **Health Checks**: Built-in container health monitoring

### Customizing for Your Environment

#### 1. Custom Nextcloud Host
```bash
# In your production environment
export NGINX_TARGET_HOST=my-nextcloud.company.com
export NGINX_OPENCONNECTOR_UPSTREAM=http://nextcloud-container:80
```

#### 2. External Nextcloud Server
```bash
# For external Nextcloud servers
export NGINX_TARGET_HOST=external-nextcloud.com
export NGINX_OPENCONNECTOR_UPSTREAM=https://external-nextcloud.com
export NGINX_NEXTCLOUD_UPSTREAM=https://external-nextcloud.com
```

#### 3. Load Balancer Integration
The nginx proxy can work behind load balancers. Ensure your load balancer passes the correct headers:
```nginx
# In your load balancer config
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

## Runtime Configuration System ✨

The application uses a **runtime configuration system** that allows you to change environment-specific settings without rebuilding the Docker image. Configuration values are applied when the container starts, making it perfect for multi-environment deployments.

### How It Works

```
Helm values.yaml → ConfigMap → Pod Environment Variables → runtime-config.js → Application
```

1. **Set values** in `helm/tilburg-woo-ui/values.yaml` (or via Helm parameters)
2. **Deploy** with `helm upgrade`
3. **Container starts** and generates `runtime-config.js` from environment variables
4. **Browser loads** `runtime-config.js` which sets `window.RUNTIME_CONFIG`
5. **Application reads** from `window.RUNTIME_CONFIG` at startup

**Key Benefits:**
- ✅ No Docker rebuild needed - just restart pods
- ✅ Same image for all environments (dev, staging, production)
- ✅ Easy debugging via `window.RUNTIME_CONFIG` in browser console
- ✅ Works seamlessly with Kubernetes/Helm

### 🚀 Migration Status

The following components have been successfully migrated from hostname-based to environment-based configuration:

✅ **Site Configuration**: Site titles, descriptions, theme variants  
✅ **API Configuration**: All API endpoints (Nextcloud.local defaults)  
✅ **Visual Configuration**: Hero images, menu positions, footer styles  
✅ **Feature Flags**: Authentication, GEMMA, directory, monitoring  
✅ **External Links**: Website, privacy, cookies, disclaimer URLs  
✅ **Header Component**: Dynamic menu positioning  
✅ **Footer Component**: Dynamic footer styles and menu filtering  
✅ **Hero Component**: Configurable background images  
✅ **Title Services**: Dynamic site titles  
✅ **Route Constants**: Environment-aware page titles  

All changes maintain **backward compatibility** - the application works in production environments without the container constants system.

### Configuration Variables

#### Site Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `SITE_TITLE` | `Development Catalogus` | Main site title displayed in headers |
| `SITE_DESCRIPTION` | `Local development instance of the softwarecatalogus` | Meta description |
| `SITE` | `localhost` | Site identifier |
| `MODE` | `development` | Application mode |
| `THEME_VARIANT` | `development` | Theme variation to use |
| `ENVIRONMENT_NAME` | `development` | Environment identifier |

#### API Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `API_URL` | `https://vng.test.commonground.nu/apps` | Primary API endpoint |
| `API_URL_COMMONGROUND` | `https://vng.test.commonground.nu/apps` | CommonGround API endpoint |
| `API_URL_COMMONGROUND_TOKEN` | `` | Optional API authentication token |
| `API_URL_COMMONGROUND_ORGANIZATION_OIN` | `` | Organization OIN for API |
| `GEMMA_ENDPOINT` | `https://vng.test.commonground.nu` | GEMMA service endpoint |
| `OPENCONNECTOR_API_URL` | `https://vng.test.commonground.nu/apps/openconnector/api` | OpenConnector API base URL |

#### Authentication Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `GRANT_TYPE` | `authorization_code` | OAuth grant type |
| `CLIENT_ID` | `` | OAuth client ID |
| `CLIENT_SECRET` | `` | OAuth client secret |
| `PROVIDER` | `nextcloud` | Authentication provider |
| `REGISTER_URL` | `` | User registration URL |

#### Session Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `AUTO_LOGOUT` | `false` | Enable automatic logout |
| `AUTO_LOGOUT_TIME` | `3600` | Auto-logout time in seconds |

#### Monitoring Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `ROLLBAR_KEY` | `` | Rollbar access token for error tracking |
| `ROLLBAR_ENVIRONMENT` | `development` | Rollbar environment name |

#### Feature Flags
| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLE_AUTHENTICATION` | `false` | Enable user authentication |
| `ENABLE_GEMMA` | `true` | Enable GEMMA integration |
| `ENABLE_DIRECTORY` | `true` | Enable directory functionality |
| `ENABLE_ROLLBAR` | `false` | Enable Rollbar error monitoring |
| `ENABLE_MOCK_THEMES` | `false` | Use mock themes data when API is unavailable |

#### External URLs
| Variable | Default | Description |
|----------|---------|-------------|
| `EXTERNAL_WEBSITE_URL` | `https://www.tilburg.nl/` | Main website URL |
| `EXTERNAL_PRIVACY_URL` | `https://www.tilburg.nl/privacystatement/` | Privacy policy URL |
| `EXTERNAL_COOKIES_URL` | `https://www.tilburg.nl/cookies/` | Cookie policy URL |
| `EXTERNAL_PROCLAIMER_URL` | `https://www.tilburg.nl/proclaimer/` | Proclaimer/disclaimer URL |

#### Visual Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `HERO_IMAGE_URL` | `null` | Hero section background image (URL or base64) |
| `FAVICON_URL` | `null` | Browser favicon (URL or base64, falls back to hostname-based logic if not set) |
| `FOOTER_LOGO_TITLE` | `VNG Softwarecatalogus` | Footer logo main text |
| `FOOTER_LOGO_SUBTITLE` | `Één plek voor alle software...` | Footer logo subtitle |
| `SUPPORT_EMAIL_ADDRESS` | `info@conduction.nl` | Support contact email |

#### Menu Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `MENU_POSITION` | `2` | Menu position identifier for navigation |
| `FOOTER_STYLE` | `vng` | Footer style variant (`vng`, `dimpact`) |

#### Search Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `DEFAULT_SEARCH_SCHEMA` | `` | Default schema ID for search queries from home page (e.g., `18` for producten) |

### Using Images in Configuration

You can configure images using either **URLs** or **base64-encoded** data.

#### URL-based Images (Recommended for large images)
```yaml
extraEnvVars:
  HERO_IMAGE_URL: "/custom-hero.png"  # Relative to public directory
  FAVICON_URL: "https://example.com/favicon.ico"  # External URL
```

#### Base64-encoded Images (Good for small favicons)
```yaml
extraEnvVars:
  FAVICON_URL: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
```

**Base64 Image Guidelines:**
- ✅ **Good for:** Small logos, icons, favicons (< 50KB)
- ✅ **Pros:** No external file needed, works immediately
- ❌ **Not recommended for:** Large images like hero backgrounds (> 100KB)
- ❌ **Cons:** Makes Helm values file large, harder to read

**Converting images to base64:**
```bash
# Linux/Mac
base64 -i logo.svg

# Or use online tools
# https://www.base64-image.de/
```

**Size recommendations:**
- **Favicon:** < 10KB (base64 OK)
- **Hero Image:** Use URL (typically 100KB-1MB)

### Using Environment Configuration

#### Local Development

Edit `docker-compose.yml`:
```yaml
environment:
  - SITE_TITLE=Conduction Catalogus
  - THEME_VARIANT=opencatalogi
  - HERO_IMAGE_URL=/custom-hero.png
  - FAVICON_URL=data:image/png;base64,iVBORw0KG...
```

Then restart:
```bash
docker-compose restart tilburg-woo-ui-hot
```

#### Kubernetes/Production

Edit `helm/tilburg-woo-ui/values-production.yaml`:
```yaml
extraEnvVars:
  SITE_TITLE: "Conduction Softwarecatalogus"
  THEME_VARIANT: "conduction"
  HERO_IMAGE_URL: "/conduction-hero.jpg"
  FAVICON_URL: "https://conduction.nl/favicon.ico"
```

Deploy:
```bash
helm upgrade tilburg-woo-ui ./helm/tilburg-woo-ui \
  -f helm/tilburg-woo-ui/values-production.yaml
```

#### Testing Your Configuration

After updating environment variables, verify they're working:

```bash
# 1. Check browser console
window.RUNTIME_CONFIG

# 2. Check specific values
window.RUNTIME_CONFIG.HERO_IMAGE_URL
window.RUNTIME_CONFIG.FAVICON_URL

# 3. Check pod logs (Kubernetes)
kubectl logs -f deployment/tilburg-woo-ui | grep "Runtime configuration"

# 4. Check runtime config file in pod
kubectl exec -it deployment/tilburg-woo-ui -- cat /usr/share/nginx/html/runtime-config.js

# 3. Verify container logs show the new configuration
docker logs tilburg-woo-ui-dev --tail 10
```

#### Development Example
Edit `docker-compose.dev.yml`:

```yaml
environment:
  - SITE_TITLE=My Custom Development Environment 🚀
  - API_URL=http://my-local-api:3000/apps
  - ENABLE_AUTHENTICATION=true
  - ENABLE_ROLLBAR=false
```

#### Applying Changes
**Important**: Environment variable changes require container recreation, not just restart:

```bash
# ❌ Won't work - doesn't pick up new env vars
docker-compose -f docker-compose.dev.yml restart

# ✅ Correct way
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
```

#### Environment-Specific Configurations

**Local Development**:
```yaml
environment:
  - SITE_TITLE=Local Development 🛠️
  - API_URL=http://nextcloud.local/api/apps
  - ENABLE_AUTHENTICATION=false
  - ENABLE_ROLLBAR=false
  # Visual Configuration
  - HERO_IMAGE_URL=/custom-hero-image.jpg
  - MENU_POSITION=2
  - FOOTER_STYLE=vng
```

**Staging Environment**:
```yaml
environment:
  - SITE_TITLE=Staging Environment 🧪
  - API_URL=https://staging-api.example.com/apps
  - ENABLE_AUTHENTICATION=true
  - ENABLE_ROLLBAR=true
  - ROLLBAR_ENVIRONMENT=staging
```

**Production Environment**:
```yaml
environment:
  - SITE_TITLE=Production Catalogus
  - API_URL=https://api.example.com/apps
  - ENABLE_AUTHENTICATION=true
  - ENABLE_ROLLBAR=true
  - ROLLBAR_ENVIRONMENT=production
```

### Debugging Environment Configuration

#### Check Generated Constants
```bash
# View generated constants file
docker exec tilburg-woo-ui-dev cat /app/src/constants/container.constants.js

# Check environment variables in container
docker exec tilburg-woo-ui-dev printenv | grep SITE_TITLE
```

#### Monitor Container Logs
```bash
# Watch startup logs
docker logs tilburg-woo-ui-dev --tail 20 -f

# Look for environment configuration messages
docker logs tilburg-woo-ui-dev | grep "🔧\|✅\|⚠️"
```

## File Watching & Live Updates

The development environment automatically watches for file changes and rebuilds:

- **Triggers**: Changes to `src/`, `public/`, `config/` directories
- **Process**: Constants generation → Build → Nginx reload
- **Monitoring**: Check logs with `docker logs tilburg-woo-ui-dev --tail 10`

## Docker Commands

### Development Commands
```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# Start specific service
docker-compose -f docker-compose.dev.yml up tilburg-woo-ui-dev -d

# View logs
docker logs tilburg-woo-ui-dev --tail 20 -f

# Rebuild and restart
docker-compose -f docker-compose.dev.yml up --build -d

# Clean restart
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d

# Execute commands in container
docker exec -it tilburg-woo-ui-dev sh
```

### Production Commands
```bash
# Build production image
docker build -t tilburg-woo-ui .

# Run production container with environment config
docker run -d \
  -p 81:81 \
  -e SITE_TITLE="Production Catalogus" \
  -e API_URL="https://api.example.com/apps" \
  -e ENABLE_AUTHENTICATION=true \
  --name tilburg-woo-ui-prod \
  tilburg-woo-ui

# Check production container logs
docker logs tilburg-woo-ui-prod
```

## Deployment Guide

### Local Development Deployment

1. **Prerequisites**:
   - Docker and Docker Compose installed
   - Ports 81 and 3000 available

2. **Setup**:
   ```bash
   git clone <repository-url>
   cd tilburg-woo-ui
   
   # Copy and customize environment variables
   cp docker-compose.dev.yml docker-compose.dev.local.yml
   # Edit docker-compose.dev.local.yml with your settings
   
   docker-compose -f docker-compose.dev.local.yml up -d
   ```

### Production Deployment

#### Option 1: Docker Compose (Recommended)

1. **Create production compose file**:
   ```yaml
   # docker-compose.prod.yml
   version: '3.8'
   services:
     tilburg-woo-ui:
       build: .
       container_name: tilburg-woo-ui-prod
       restart: unless-stopped
       ports:
         - "81:81"
       environment:
         # Site Configuration
         - SITE_TITLE=Production Catalogus
         - SITE_DESCRIPTION=Official softwarecatalogus
         - ENVIRONMENT_NAME=production
         
         # API Configuration
         - API_URL=https://api.example.com/apps
         - API_URL_COMMONGROUND=https://api.example.com/apps
         - GEMMA_ENDPOINT=https://gemma.example.com
         
         # Security
         - ENABLE_AUTHENTICATION=true
         - ENABLE_ROLLBAR=true
         - ROLLBAR_KEY=your_rollbar_key
         - ROLLBAR_ENVIRONMENT=production
         
         # External URLs
         - EXTERNAL_WEBSITE_URL=https://www.yoursite.com/
         - EXTERNAL_PRIVACY_URL=https://www.yoursite.com/privacy/
       healthcheck:
         test: ["CMD", "curl", "-f", "http://localhost:81/"]
         interval: 30s
         timeout: 10s
         retries: 3
   ```

2. **Deploy**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

#### Option 2: Kubernetes

1. **Create ConfigMap**:
   ```yaml
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: tilburg-woo-ui-config
   data:
     SITE_TITLE: "Production Catalogus"
     API_URL: "https://api.example.com/apps"
     ENABLE_AUTHENTICATION: "true"
     # ... other environment variables
   ```

2. **Create Deployment**:
   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: tilburg-woo-ui
   spec:
     replicas: 2
     selector:
       matchLabels:
         app: tilburg-woo-ui
     template:
       metadata:
         labels:
           app: tilburg-woo-ui
       spec:
         containers:
         - name: tilburg-woo-ui
           image: tilburg-woo-ui:latest
           ports:
           - containerPort: 81
           envFrom:
           - configMapRef:
               name: tilburg-woo-ui-config
           livenessProbe:
             httpGet:
               path: /
               port: 81
             initialDelaySeconds: 30
             periodSeconds: 10
   ```

#### Option 3: GitHub Container Registry + CI/CD

The repository includes GitHub Actions for automated builds:

1. **Automatic Builds**: Images are built and pushed to `ghcr.io/your-org/tilburg-woo-ui`
2. **Branch Mapping**:
   - `softwarecatalogus` → `latest` tag
   - `development` → `dev` tag
3. **Pull and Deploy**:
   ```bash
   docker pull ghcr.io/your-org/tilburg-woo-ui:latest
   docker run -d -p 81:81 \
     -e SITE_TITLE="Production" \
     -e API_URL="https://api.example.com/apps" \
     ghcr.io/your-org/tilburg-woo-ui:latest
   ```

### Environment-Specific Deployment Examples

#### Development Server
```bash
docker run -d -p 81:81 \
  -e SITE_TITLE="Dev Server 🛠️" \
  -e API_URL="https://dev-api.example.com/apps" \
  -e ENABLE_AUTHENTICATION=false \
  -e ENABLE_ROLLBAR=false \
  --name tilburg-woo-ui-dev \
  tilburg-woo-ui
```

#### Staging Server
```bash
docker run -d -p 81:81 \
  -e SITE_TITLE="Staging Environment 🧪" \
  -e API_URL="https://staging-api.example.com/apps" \
  -e ENABLE_AUTHENTICATION=true \
  -e ENABLE_ROLLBAR=true \
  -e ROLLBAR_ENVIRONMENT=staging \
  --name tilburg-woo-ui-staging \
  tilburg-woo-ui
```

#### Production Server
```bash
docker run -d -p 81:81 \
  -e SITE_TITLE="Softwarecatalogus" \
  -e API_URL="https://api.example.com/apps" \
  -e ENABLE_AUTHENTICATION=true \
  -e ENABLE_ROLLBAR=true \
  -e ROLLBAR_ENVIRONMENT=production \
  -e ROLLBAR_KEY="your_production_key" \
  --restart unless-stopped \
  --name tilburg-woo-ui-prod \
  tilburg-woo-ui
```

## Troubleshooting

### Common Issues

#### Themes API Error: "Cannot read properties of undefined (reading 'localeCompare')"

**Problem**: Console error in `themes.store.js` when themes API is unavailable.

**Solution**: Enable mock themes for local development:
```yaml
# docker-compose.dev.yml
environment:
  - ENABLE_MOCK_THEMES=true
```

**Why this happens**: The themes API endpoint may not exist at `nextcloud.local`, causing malformed data to be returned.

**What mock themes provides**:
- 4 sample themes with proper structure
- Prevents console errors during development
- Allows UI testing without backend API
- Automatic fallback when real API fails

#### Hot Module Replacement (HMR) Not Working on Windows

**Problem**: Changes to React components don't appear in browser at `localhost:3000` even though webpack compiles successfully.

**Why this happens**: Docker + Windows + HMR websocket connection issues prevent browser from receiving hot updates.

**Solutions**:

1. **Use Watch Build (Recommended)**: Access `http://localhost:81` instead
   - Full rebuild on file changes (slower but reliable)
   - No websocket dependencies
   - Works consistently on Windows

2. **Force Browser Refresh**: `Ctrl+F5` after making changes
   - Webpack still compiles in background
   - Manual refresh picks up changes

3. **Check Browser Console**: Look for websocket errors or HMR failures

4. **Container Restart**: If persistent issues:
   ```bash
   docker-compose -f docker-compose.dev.yml restart tilburg-woo-ui-hot
   ```

#### Container Won't Start
```bash
# Check container logs
docker logs tilburg-woo-ui-dev
```

#### API Proxy Issues

**Problem**: Getting 404, 502, or CORS errors when accessing `/api/*` endpoints.

**Debug Steps**:

1. **Check Nginx Configuration**:
   ```bash
   # View generated nginx config
   docker exec tilburg-woo-ui-dev cat /etc/nginx/nginx.conf
   
   # Check nginx status
   docker exec tilburg-woo-ui-dev nginx -t
   ```

2. **Verify Environment Variables**:
   ```bash
   # Check if variables are set correctly
   docker exec tilburg-woo-ui-dev env | grep NGINX
   ```

3. **Test Backend Connectivity**:
   ```bash
   # Test if Nextcloud is reachable from container
   docker exec tilburg-woo-ui-dev curl -I http://host.docker.internal:80
   ```

4. **Check Proxy Logs**:
   ```bash
   # Monitor nginx access/error logs
   docker exec tilburg-woo-ui-dev tail -f /var/log/nginx/access.log
   docker exec tilburg-woo-ui-dev tail -f /var/log/nginx/error.log
   ```

**Common Solutions**:

- **502 Bad Gateway**: Backend server is down or unreachable
  ```bash
  # Verify your Nextcloud is running on host port 80
  curl -I http://localhost:80
  ```

- **CORS Errors**: Host header mismatch
  ```bash
  # Ensure NGINX_TARGET_HOST matches your Nextcloud domain
  export NGINX_TARGET_HOST=nextcloud.local
  ```

- **404 for API calls**: Wrong upstream configuration
  ```bash
  # Verify upstream points to correct backend
  export NGINX_OPENCONNECTOR_UPSTREAM=http://host.docker.internal:80
  ```

#### Authentication Logout Loop

**Problem**: User gets logged out immediately after successful login.

**Cause**: Persistent `logout=true` cookie causing immediate logout.

**Solution**: Fixed in user.store.js - logout cookie is now cleared during login.

**Debug**: Check browser cookies for persistent `logout=true` value.

#### Environment Variables Not Applied
```bash
# Ensure you recreated the container (not just restarted)
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d

# Check environment variables inside container
docker exec tilburg-woo-ui-dev printenv | grep SITE_TITLE
```

#### Build Errors
```bash
# Clean build
docker-compose -f docker-compose.dev.yml build --no-cache

# Check for Node.js/Yarn issues
docker run --rm -it node:18.17.0-alpine sh
# Test Yarn installation inside container
```

#### File Watching Not Working
```bash
# Check if files are being watched
docker exec tilburg-woo-ui-dev ps aux | grep inotify

# Check volume mounts
docker inspect tilburg-woo-ui-dev | grep -A 10 "Mounts"

# Manual rebuild
docker exec tilburg-woo-ui-dev yarn build:web
```

### Performance Tips

1. **Use .dockerignore**: Exclude unnecessary files from build context
2. **Volume Mounting**: Mount only necessary directories
3. **Health Checks**: Monitor container health
4. **Resource Limits**: Set appropriate CPU/memory limits in production

### Security Considerations

1. **Environment Variables**: Use secrets management for sensitive values
2. **Network Security**: Use custom Docker networks
3. **Image Scanning**: Scan images for vulnerabilities
4. **HTTPS**: Always use HTTPS in production
5. **Headers**: Security headers are configured in `.htaccess`

## Technology Stack

- **Frontend**: React with MobX state management
- **Styling**: SCSS with NLDS design system  
- **Build**: Webpack with Create React App
- **Architecture**: Atomic design pattern
- **Containerization**: Docker with multi-stage builds
- **Server**: Apache HTTP Server (production), Nginx (development)
- **Node.js**: 18.17.0 with Yarn 4.1.1

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with both development modes
5. Submit a pull request

For questions or issues, please check the troubleshooting section or create an issue in the repository. 
# Tilburg WOO UI - Developer Guide

This guide provides comprehensive instructions for local development, configuration, and deployment of the Tilburg WOO UI application.

## Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd tilburg-woo-ui

# Start development environment (watch build on port 81)
docker-compose -f docker-compose.dev.yml up -d

# Or start hot reload development (live reload on port 3000)
docker-compose -f docker-compose.dev.yml up tilburg-woo-ui-hot -d

# Access your application
# Watch build: http://localhost:81
# Hot reload: http://localhost:3000
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
    driver: bridge
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

## Environment Configuration System ✨

The application now uses a modern environment-based configuration system that replaces the old hostname-based logic. This system allows you to configure the application behavior using environment variables.

### How It Works

1. **Environment Variables**: Set configuration via Docker Compose environment variables
2. **Runtime Generation**: A Node.js script generates `src/constants/container.constants.js` at startup
3. **Application Integration**: Components import and use the generated configuration
4. **Fallback Support**: Falls back to hostname-based logic if container constants aren't available

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
| `SITE_DESCRIPTION` | `Local development instance of the software catalogus` | Meta description |
| `SITE` | `localhost` | Site identifier |
| `MODE` | `development` | Application mode |
| `THEME_VARIANT` | `development` | Theme variation to use |
| `ENVIRONMENT_NAME` | `development` | Environment identifier |

#### API Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `API_URL` | `http://nextcloud.local/index.php/apps` | Primary API endpoint |
| `API_URL_COMMONGROUND` | `http://nextcloud.local/index.php/apps` | CommonGround API endpoint |
| `API_URL_COMMONGROUND_TOKEN` | `` | Optional API authentication token |
| `API_URL_COMMONGROUND_ORGANIZATION_OIN` | `` | Organization OIN for API |
| `GEMMA_ENDPOINT` | `http://nextcloud.local` | GEMMA service endpoint |

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
| `HERO_IMAGE_URL` | `/home-hero-background.png` | Hero section background image |

#### Menu Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `MENU_POSITION` | `2` | Menu position identifier for navigation |
| `FOOTER_STYLE` | `vng` | Footer style variant (`vng`, `dimpact`) |

### Using Environment Configuration

#### Testing Your Configuration

After updating environment variables, verify they're working:

```bash
# 1. Recreate containers to pick up new env vars
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d

# 2. Check if variables are loaded in the container
docker exec tilburg-woo-ui-dev grep "HERO_IMAGE_URL\|MENU_POSITION\|FOOTER_STYLE" /app/src/constants/container.constants.js

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
  - API_URL=http://nextcloud.local/index.php/apps
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
         - SITE_DESCRIPTION=Official software catalogus
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
  -e SITE_TITLE="Software Catalogus" \
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

#### Container Won't Start
```bash
# Check container logs
docker logs tilburg-woo-ui-dev

# Check if ports are in use
netstat -tulpn | grep :81

# Remove and recreate container
docker rm -f tilburg-woo-ui-dev
docker-compose -f docker-compose.dev.yml up tilburg-woo-ui-dev -d
```

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
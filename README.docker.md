# Docker Setup for Tilburg WOO UI

This document explains how to run the Tilburg WOO UI application using Docker for local development and the automated GitHub Actions deployment.

## Prerequisites

- Docker and Docker Compose installed on your machine
- Git repository cloned locally

## Local Development

### Option 1: Production Build (Port 81)

To run the application exactly as it would run in production:

```bash
# Build and run the production container
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

The application will be available at: `http://localhost:81`

### Option 2: Development Mode (Port 3000)

For development with hot reloading:

```bash
# Build and run the development container
docker-compose --profile dev up --build

# Or just the development service
docker-compose up tilburg-woo-ui-dev --build
```

The development server will be available at: `http://localhost:3000`

### Docker Commands

```bash
# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild without cache
docker-compose build --no-cache

# Remove all containers and volumes
docker-compose down -v --remove-orphans
```

## GitHub Actions Workflow

The repository includes an automated GitHub Actions workflow that:

### Triggers
- **Push to `softwarecatalogus` branch**: Builds and publishes production images tagged as `latest`
- **Push to `development` branch**: Builds and publishes development images tagged as `dev`
- **Pull requests**: Builds images for testing (tagged with PR number)

### Image Tags
- `ghcr.io/[organization]/[repository]:latest` - Production branch (softwarecatalogus) builds
- `ghcr.io/[organization]/[repository]:dev` - Development branch builds
- `ghcr.io/[organization]/[repository]:softwarecatalogus-[sha]` - Production commit-specific tags
- `ghcr.io/[organization]/[repository]:development-[sha]` - Development commit-specific tags
- `ghcr.io/[organization]/[repository]:pr-[number]` - Pull request builds

### Registry
Images are published to GitHub Container Registry (ghcr.io) and are publicly available.

## Environment Configuration

### Production Environment Variables
Set these in your deployment environment:
- `NODE_ENV=production`

### Development Environment Variables
The development container supports:
- `NODE_ENV=development`
- `FAST_REFRESH=true`

## Health Checks

Both production and development containers include health checks:
- **Production**: Checks `http://localhost:81/`
- **Development**: Checks `http://localhost:3000/`

## File Structure

```
├── Dockerfile              # Multi-stage production build
├── Dockerfile.dev          # Development container
├── docker-compose.yml      # Local development setup
├── .dockerignore           # Docker build optimization
├── .github/workflows/
│   └── build-and-deploy.yml # GitHub Actions workflow
└── README.docker.md        # This file
```

## Troubleshooting

### Port Conflicts
If port 81 or 3000 is already in use, modify the ports in `docker-compose.yml`:

```yaml
services:
  tilburg-woo-ui:
    ports:
      - "8081:81"  # Change 81 to 8081 on host
```

### Build Issues
1. Clear Docker cache: `docker system prune -a`
2. Rebuild without cache: `docker-compose build --no-cache`
3. Check Docker logs: `docker-compose logs`

### Development Hot Reload
If hot reload isn't working in development mode:
1. Ensure volumes are mounted correctly in `docker-compose.yml`
2. Check that `FAST_REFRESH=true` is set
3. Verify file permissions (especially on Windows/WSL)

## Migration from Bitbucket

This setup replaces the previous Bitbucket Pipeline with:
1. **GitHub Actions** instead of Bitbucket Pipelines
2. **GitHub Container Registry** instead of Docker Hub
3. **Improved multi-stage builds** for better performance
4. **Local development support** with Docker Compose

The workflow maintains similar functionality but with better GitHub integration and improved local development experience. 
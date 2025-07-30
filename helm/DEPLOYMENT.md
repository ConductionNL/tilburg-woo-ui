# Tilburg WOO UI - Deployment Guide

## 🚀 ArgoCD Deployment

### Required Parameters

**All deployments require these parameters in ArgoCD Parameters tab:**

```yaml
# Frontend configuration
global.domain: "your-domain.com"
global.tls: true  # for HTTPS certificates

# Backend configuration (choose OPTION A or B below)
env.NGINX_NEXTCLOUD_DOMAIN: "nextcloud.your-domain.com"
env.NGINX_TARGET_HOST: "nextcloud.your-domain.com"
```

## 🔧 Backend Configuration Options

### OPTION A: External Backend Domains (Most Common)

Use when your Nextcloud/OpenConnector runs **outside** the Kubernetes cluster:

```yaml
# ArgoCD Parameters:
env.NGINX_OPENCONNECTOR_UPSTREAM: "https://nextcloud.rotterdam.accept.opencatalogi.nl"
env.NGINX_NEXTCLOUD_UPSTREAM: "https://nextcloud.rotterdam.accept.opencatalogi.nl"
env.NGINX_NEXTCLOUD_DOMAIN: "nextcloud.rotterdam.accept.opencatalogi.nl"
env.NGINX_TARGET_HOST: "nextcloud.rotterdam.accept.opencatalogi.nl"
```

### OPTION B: Internal Kubernetes Services

Use when your Nextcloud/OpenConnector runs **inside** the same Kubernetes cluster:

```yaml
# ArgoCD Parameters:
env.NGINX_OPENCONNECTOR_UPSTREAM: "http://openconnector-service.default.svc.cluster.local:80"
env.NGINX_NEXTCLOUD_UPSTREAM: "http://nextcloud-service.default.svc.cluster.local:80"
env.NGINX_NEXTCLOUD_DOMAIN: "nextcloud.rotterdam.accept.opencatalogi.nl"  # External domain
env.NGINX_TARGET_HOST: "nextcloud.rotterdam.accept.opencatalogi.nl"       # External domain
```

## 📝 Complete Example

### Rotterdam Production Deployment:

```yaml
# ArgoCD Application Parameters:
global.domain: "rotterdam.accept.opencatalogi.nl"
global.tls: true
image.image: "acatonl/woo-ui-develop"
image.tag: "latest"

# External Backend (Option A):
env.NGINX_OPENCONNECTOR_UPSTREAM: "https://nextcloud.rotterdam.accept.opencatalogi.nl"
env.NGINX_NEXTCLOUD_UPSTREAM: "https://nextcloud.rotterdam.accept.opencatalogi.nl"
env.NGINX_NEXTCLOUD_DOMAIN: "nextcloud.rotterdam.accept.opencatalogi.nl"
env.NGINX_TARGET_HOST: "nextcloud.rotterdam.accept.opencatalogi.nl"
```

## 🧪 Testing

Test your configuration locally:

```bash
cd helm
chmod +x test-nginx-config.sh
./test-nginx-config.sh
```

## 🔀 How it Works

1. **Ingress** → Routes external traffic to tilburg-woo-ui pods
2. **Nginx** → Serves React app + proxies `/api/*` calls to backend
3. **Backend** → Handles API requests (either external domain or internal service)

## 🎯 URL Structure

- Frontend: `https://rotterdam.accept.opencatalogi.nl/`
- API calls: `https://rotterdam.accept.opencatalogi.nl/api/apps/` → proxied to backend
- Static assets: Served directly by nginx from React build 
# Tilburg WOO UI Helm Chart

A Helm chart for deploying the Tilburg WOO UI application on Kubernetes.

## Prerequisites

- Kubernetes 1.16+
- Helm 3.0+
- Container images available at [ghcr.io/conductionnl/tilburg-woo-ui](https://github.com/ConductionNL/tilburg-woo-ui/pkgs/container/tilburg-woo-ui)

## Installation

### Quick Start

```bash
# Add the repository (if using a Helm repository)
helm repo add tilburg-woo-ui https://your-helm-repo.com

# Install with default values
helm install tilburg-woo-ui ./helm/tilburg-woo-ui

# Install with custom release name
helm install my-tilburg-woo-ui ./helm/tilburg-woo-ui
```

### Production Deployment

```bash
# Install for production with production values
helm install tilburg-woo-ui ./helm/tilburg-woo-ui \
  -f ./helm/tilburg-woo-ui/values-production.yaml \
  --namespace production \
  --create-namespace
```

### Development Deployment

```bash
# Install for development with development values
helm install tilburg-woo-ui-dev ./helm/tilburg-woo-ui \
  -f ./helm/tilburg-woo-ui/values-development.yaml \
  --namespace development \
  --create-namespace
```

### Custom Values

```bash
# Install with custom values
helm install tilburg-woo-ui ./helm/tilburg-woo-ui \
  --set image.tag=softwarecatalogus-7bc70ef \
  --set ingress.enabled=true \
  --set ingress.hosts[0].host=my-domain.com
```

## Configuration

The following table lists the configurable parameters and their default values.

### Image Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `image.repository` | Container image repository | `ghcr.io/conductionnl/tilburg-woo-ui` |
| `image.tag` | Container image tag | `latest` |
| `image.pullPolicy` | Image pull policy | `IfNotPresent` |
| `imagePullSecrets` | Image pull secrets | `[]` |

### Deployment Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of replicas | `1` |
| `nameOverride` | Override the name | `""` |
| `fullnameOverride` | Override the full name | `""` |

### Service Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `service.type` | Service type | `ClusterIP` |
| `service.port` | Service port | `80` |
| `service.targetPort` | Container target port | `81` |

### Ingress Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `ingress.enabled` | Enable ingress | `false` |
| `ingress.className` | Ingress class name | `""` |
| `ingress.annotations` | Ingress annotations | `{}` |
| `ingress.hosts` | Ingress hosts configuration | See values.yaml |
| `ingress.tls` | Ingress TLS configuration | `[]` |

### Environment Variables

Based on the docker-compose.yml configuration:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `env.NODE_ENV` | Node environment | `production` |
| `env.BASE_URL` | Base URL for API | `/api/apps` |
| `env.BASE_URL_COMMONGROUND` | CommonGround base URL | `/api/apps` |
| `env.NGINX_OPENCONNECTOR_UPSTREAM` | OpenConnector upstream | `http://host.docker.internal:80` |
| `env.NGINX_NEXTCLOUD_UPSTREAM` | Nextcloud upstream | `http://host.docker.internal:80` |
| `env.NGINX_NEXTCLOUD_DOMAIN` | Nextcloud domain | `nextcloud.local` |
| `env.NGINX_TARGET_HOST` | Target host | `nextcloud.local` |
| `env.NGINX_ROOT_DIR` | Nginx root directory | `/usr/share/nginx/html` |

### Health Check Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `healthCheck.enabled` | Enable health checks | `true` |
| `healthCheck.path` | Health check path | `/` |
| `healthCheck.initialDelaySeconds` | Initial delay | `40` |
| `healthCheck.periodSeconds` | Check period | `30` |
| `healthCheck.timeoutSeconds` | Check timeout | `10` |
| `healthCheck.failureThreshold` | Failure threshold | `3` |

### Autoscaling Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `autoscaling.enabled` | Enable HPA | `false` |
| `autoscaling.minReplicas` | Minimum replicas | `1` |
| `autoscaling.maxReplicas` | Maximum replicas | `100` |
| `autoscaling.targetCPUUtilizationPercentage` | CPU target | `80` |
| `autoscaling.targetMemoryUtilizationPercentage` | Memory target | Not set |

### Development Mode

| Parameter | Description | Default |
|-----------|-------------|---------|
| `development.enabled` | Enable development mode | `false` |
| `development.image.tag` | Development image tag | `dev` |
| `development.service.port` | Development service port | `3000` |
| `development.service.targetPort` | Development target port | `3000` |
| `development.env.FAST_REFRESH` | Enable fast refresh | `true` |

## Available Image Tags

Based on the [GitHub Container Registry](https://github.com/ConductionNL/tilburg-woo-ui/pkgs/container/tilburg-woo-ui):

- `latest` - Latest stable release
- `softwarecatalogus-7bc70ef` - Latest commit from softwarecatalogus branch
- `softwarecatalogus-253256e` - Previous commit
- `dev` - Development builds (if available)

## Examples

### Basic Production Setup

```yaml
# values-prod.yaml
replicaCount: 3

image:
  tag: "softwarecatalogus-7bc70ef"

ingress:
  enabled: true
  className: "nginx"
  hosts:
    - host: tilburg-woo.example.com
      paths:
        - path: /
          pathType: Prefix

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 250m
    memory: 256Mi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
```

### Development Setup

```yaml
# values-dev.yaml
development:
  enabled: true

image:
  tag: "dev"
  pullPolicy: Always

service:
  type: NodePort

ingress:
  enabled: true
  hosts:
    - host: tilburg-woo-ui.dev.local
      paths:
        - path: /
          pathType: Prefix
```

## Upgrading

```bash
# Upgrade to new version
helm upgrade tilburg-woo-ui ./helm/tilburg-woo-ui \
  --set image.tag=new-version

# Upgrade with new values
helm upgrade tilburg-woo-ui ./helm/tilburg-woo-ui \
  -f values-production.yaml
```

## Uninstalling

```bash
# Uninstall the release
helm uninstall tilburg-woo-ui

# Uninstall from specific namespace
helm uninstall tilburg-woo-ui --namespace production
```

## Troubleshooting

### Check Pod Status

```bash
kubectl get pods -l app.kubernetes.io/name=tilburg-woo-ui
```

### View Logs

```bash
kubectl logs -l app.kubernetes.io/name=tilburg-woo-ui -f
```

### Check Service

```bash
kubectl get svc -l app.kubernetes.io/name=tilburg-woo-ui
```

### Check Ingress

```bash
kubectl get ingress -l app.kubernetes.io/name=tilburg-woo-ui
```

## Support

For issues and questions:
- GitHub Issues: [https://github.com/ConductionNL/tilburg-woo-ui/issues](https://github.com/ConductionNL/tilburg-woo-ui/issues)
- Repository: [https://github.com/ConductionNL/tilburg-woo-ui](https://github.com/ConductionNL/tilburg-woo-ui) 
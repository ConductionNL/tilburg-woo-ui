# Multi-stage build for React application
FROM node:18.17.0-alpine as builder

# Set working directory
WORKDIR /app

# Enable Corepack for Yarn 4
RUN corepack enable

# Copy package files
COPY package.json yarn.lock .yarnrc.yml ./

# Set Yarn version
RUN yarn set version 4.1.1

# Install dependencies
RUN yarn install --immutable

# Copy source code and scripts
COPY . .

# Install curl for health checks and script execution in builder stage
RUN apk add --no-cache curl

# Note: We no longer generate container.constants.js at build time
# The file now reads from window.RUNTIME_CONFIG which is generated at container startup
# This allows runtime configuration without rebuilding the Docker image
RUN echo "ℹ️  Skipping build-time container constants generation (using runtime config instead)"

# Build the application
RUN yarn build:web

# Production stage with Nginx
FROM nginx:alpine

# Install curl for health checks, gettext for envsubst, and Node.js for runtime environment support
RUN apk add --no-cache curl gettext nodejs npm

# Remove default nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx configuration template
COPY config/nginx.conf.template /etc/nginx/nginx.conf.template

# Copy built application from builder stage
COPY --from=builder /app/public_html /usr/share/nginx/html/

# Copy scripts for runtime environment configuration
COPY --from=builder /app/scripts /usr/local/scripts/
COPY --from=builder /app/src /usr/local/src-template/

# Create startup script that generates constants, configures nginx, and starts it
RUN echo '#!/bin/sh' > /usr/local/bin/start-with-env.sh && \
    echo 'echo "🚀 Starting production server with nginx proxy..."' >> /usr/local/bin/start-with-env.sh && \
    echo 'echo "Nginx upstream: $NGINX_OPENCONNECTOR_UPSTREAM"' >> /usr/local/bin/start-with-env.sh && \
    echo 'echo "Target host: $NGINX_TARGET_HOST"' >> /usr/local/bin/start-with-env.sh && \
    echo '' >> /usr/local/bin/start-with-env.sh && \
    echo '# Create nginx directories' >> /usr/local/bin/start-with-env.sh && \
    echo 'mkdir -p /var/log/nginx /var/lib/nginx/tmp' >> /usr/local/bin/start-with-env.sh && \
    echo '' >> /usr/local/bin/start-with-env.sh && \
    echo '# Substitute environment variables in nginx config' >> /usr/local/bin/start-with-env.sh && \
    echo 'envsubst '"'"'$NGINX_OPENCONNECTOR_UPSTREAM $NGINX_NEXTCLOUD_UPSTREAM $NGINX_NEXTCLOUD_DOMAIN $NGINX_TARGET_HOST $NGINX_ROOT_DIR'"'"' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf' >> /usr/local/bin/start-with-env.sh && \
    echo '' >> /usr/local/bin/start-with-env.sh && \
    echo '# Generate runtime configuration (NOT bundled by webpack)' >> /usr/local/bin/start-with-env.sh && \
    echo 'if [ -f /usr/local/scripts/generate-runtime-config.js ]; then' >> /usr/local/bin/start-with-env.sh && \
    echo '  echo "🔧 Generating runtime configuration..."' >> /usr/local/bin/start-with-env.sh && \
    echo '  node /usr/local/scripts/generate-runtime-config.js /usr/share/nginx/html/runtime-config.js' >> /usr/local/bin/start-with-env.sh && \
    echo '  echo "✅ Runtime configuration generated at /usr/share/nginx/html/runtime-config.js"' >> /usr/local/bin/start-with-env.sh && \
    echo 'else' >> /usr/local/bin/start-with-env.sh && \
    echo '  echo "⚠️  No runtime config script found, using build-time defaults"' >> /usr/local/bin/start-with-env.sh && \
    echo 'fi' >> /usr/local/bin/start-with-env.sh && \
    echo '' >> /usr/local/bin/start-with-env.sh && \
    echo '# Start nginx' >> /usr/local/bin/start-with-env.sh && \
    echo 'echo "🌐 Starting Nginx server on port 81 with API proxy..."' >> /usr/local/bin/start-with-env.sh && \
    echo 'exec nginx -g "daemon off;"' >> /usr/local/bin/start-with-env.sh && \
    chmod +x /usr/local/bin/start-with-env.sh

# Expose port 81
EXPOSE 81

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:81/ || exit 1

# Use our startup script that supports environment configuration and nginx proxy
CMD ["/usr/local/bin/start-with-env.sh"]
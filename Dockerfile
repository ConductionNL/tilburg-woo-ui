# Multi-stage build for React application
FROM node:22-alpine as builder

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

# Generate runtime-aware container.constants.js before webpack build
# This file will contain code that reads from window.RUNTIME_CONFIG at runtime
# The generated code is bundled by webpack, but reads config dynamically from window.RUNTIME_CONFIG
RUN echo "🔧 Generating runtime-aware container constants..."
RUN node scripts/generate-container-constants.js

# Build the application with the runtime-aware constants
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

# Drop source maps from the served directory.
#
# The build emits 211 .map files (~18.7 MB, more than half the image) and nginx
# served them with a 200, so the full application source was publicly
# downloadable. No sourcemap upload is configured (the Rollbar plugin in
# config/webpack.config.prod.js is commented out), so nothing consumed them.
#
# They are still produced by the build, so CI can keep or upload them as an
# artifact; they are only excluded from the runtime image.
RUN find /usr/share/nginx/html -name '*.map' -delete && \
    find /usr/share/nginx/html -name '*.LICENSE.txt' -delete

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
    echo '# envsubst replaces an unset variable with the empty string, which turns' >> /usr/local/bin/start-with-env.sh && \
    echo '# "root ${NGINX_ROOT_DIR};" into "root ;" and "proxy_pass ${UPSTREAM}/x"' >> /usr/local/bin/start-with-env.sh && \
    echo '# into "proxy_pass /x" - nginx then aborts with a message that does not' >> /usr/local/bin/start-with-env.sh && \
    echo '# name the missing variable. Default what has a safe default, and fail' >> /usr/local/bin/start-with-env.sh && \
    echo '# fast with an actionable message for what does not.' >> /usr/local/bin/start-with-env.sh && \
    echo ': "${NGINX_ROOT_DIR:=/usr/share/nginx/html}"' >> /usr/local/bin/start-with-env.sh && \
    echo 'export NGINX_ROOT_DIR' >> /usr/local/bin/start-with-env.sh && \
    echo '' >> /usr/local/bin/start-with-env.sh && \
    echo 'missing=""' >> /usr/local/bin/start-with-env.sh && \
    echo 'for v in NGINX_NEXTCLOUD_UPSTREAM NGINX_OPENCONNECTOR_UPSTREAM NGINX_TARGET_HOST; do' >> /usr/local/bin/start-with-env.sh && \
    echo '  eval "val=\$$v"' >> /usr/local/bin/start-with-env.sh && \
    echo '  [ -z "$val" ] && missing="$missing $v"' >> /usr/local/bin/start-with-env.sh && \
    echo 'done' >> /usr/local/bin/start-with-env.sh && \
    echo 'if [ -n "$missing" ]; then' >> /usr/local/bin/start-with-env.sh && \
    echo '  echo "❌ Missing required environment variable(s):$missing" >&2' >> /usr/local/bin/start-with-env.sh && \
    echo '  echo "   nginx cannot build a valid proxy_pass without them." >&2' >> /usr/local/bin/start-with-env.sh && \
    echo '  exit 1' >> /usr/local/bin/start-with-env.sh && \
    echo 'fi' >> /usr/local/bin/start-with-env.sh && \
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
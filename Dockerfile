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

# Generate container constants from environment variables (if available)
RUN if [ -f scripts/generate-container-constants.js ]; then \
      echo "🔧 Generating container constants..." && \
      node scripts/generate-container-constants.js || echo "⚠️  Container constants generation failed, using defaults"; \
    fi

# Build the application
RUN yarn build:web

# Production stage with Apache
FROM httpd:2.4-alpine

# Install curl for health checks and Node.js for runtime environment support
RUN apk add --no-cache curl nodejs npm

# Configure Apache
RUN sed -i '/LoadModule rewrite_module/s/^#//g' /usr/local/apache2/conf/httpd.conf && \
    sed -i '/LoadModule deflate_module/s/^#//g' /usr/local/apache2/conf/httpd.conf && \
    sed -i 's#AllowOverride [Nn]one#AllowOverride All#' /usr/local/apache2/conf/httpd.conf && \
    sed -i 's/Listen 80/Listen 81/' /usr/local/apache2/conf/httpd.conf

# Copy built application from builder stage
COPY --from=builder /app/public_html /usr/local/apache2/htdocs/

# Copy scripts for runtime environment configuration
COPY --from=builder /app/scripts /usr/local/scripts/
COPY --from=builder /app/src /usr/local/src-template/

# Create startup script that generates constants and starts Apache
RUN echo '#!/bin/sh' > /usr/local/bin/start-with-env.sh && \
    echo 'echo "🚀 Starting production server with environment configuration..."' >> /usr/local/bin/start-with-env.sh && \
    echo '' >> /usr/local/bin/start-with-env.sh && \
    echo '# Create src directory structure if it doesnt exist' >> /usr/local/bin/start-with-env.sh && \
    echo 'mkdir -p /usr/local/apache2/htdocs/src/constants' >> /usr/local/bin/start-with-env.sh && \
    echo '' >> /usr/local/bin/start-with-env.sh && \
    echo '# Generate container constants from environment variables' >> /usr/local/bin/start-with-env.sh && \
    echo 'if [ -f /usr/local/scripts/generate-container-constants.js ]; then' >> /usr/local/bin/start-with-env.sh && \
    echo '  echo "🔧 Generating production container constants..."' >> /usr/local/bin/start-with-env.sh && \
    echo '  cd /usr/local' >> /usr/local/bin/start-with-env.sh && \
    echo '  node scripts/generate-container-constants.js' >> /usr/local/bin/start-with-env.sh && \
    echo '  # Copy generated constants to the served directory' >> /usr/local/bin/start-with-env.sh && \
    echo '  if [ -f /usr/local/src/constants/container.constants.js ]; then' >> /usr/local/bin/start-with-env.sh && \
    echo '    cp /usr/local/src/constants/container.constants.js /usr/local/apache2/htdocs/src/constants/' >> /usr/local/bin/start-with-env.sh && \
    echo '    echo "✅ Container constants deployed to production build"' >> /usr/local/bin/start-with-env.sh && \
    echo '  fi' >> /usr/local/bin/start-with-env.sh && \
    echo 'else' >> /usr/local/bin/start-with-env.sh && \
    echo '  echo "⚠️  No container constants script found, using build-time configuration"' >> /usr/local/bin/start-with-env.sh && \
    echo 'fi' >> /usr/local/bin/start-with-env.sh && \
    echo '' >> /usr/local/bin/start-with-env.sh && \
    echo '# Start Apache' >> /usr/local/bin/start-with-env.sh && \
    echo 'echo "🌐 Starting Apache HTTP Server on port 81..."' >> /usr/local/bin/start-with-env.sh && \
    echo 'exec httpd-foreground' >> /usr/local/bin/start-with-env.sh && \
    chmod +x /usr/local/bin/start-with-env.sh

# Create .htaccess for SPA routing
RUN echo "RewriteEngine On" > /usr/local/apache2/htdocs/.htaccess && \
    echo "RewriteCond %{REQUEST_FILENAME} !-f" >> /usr/local/apache2/htdocs/.htaccess && \
    echo "RewriteCond %{REQUEST_FILENAME} !-d" >> /usr/local/apache2/htdocs/.htaccess && \
    echo "RewriteRule . /index.html [L]" >> /usr/local/apache2/htdocs/.htaccess

# Add security headers
RUN echo "Header always set X-Content-Type-Options nosniff" >> /usr/local/apache2/htdocs/.htaccess && \
    echo "Header always set X-Frame-Options DENY" >> /usr/local/apache2/htdocs/.htaccess && \
    echo "Header always set X-XSS-Protection \"1; mode=block\"" >> /usr/local/apache2/htdocs/.htaccess

# Expose port 81
EXPOSE 81

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:81/ || exit 1

# Use our startup script that supports environment configuration
CMD ["/usr/local/bin/start-with-env.sh"]
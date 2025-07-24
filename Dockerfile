# Multi-stage build for React application
FROM node:18.17.0-alpine as builder

# Set working directory
WORKDIR /app

# Enable Corepack for Yarn 4
RUN corepack enable

# Copy package files
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# Set Yarn version
RUN yarn set version 4.1.1

# Install dependencies
RUN yarn install --immutable

# Copy source code
COPY . .

# Build the application
RUN yarn build:web

# Production stage with Apache
FROM httpd:2.4-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Configure Apache
RUN sed -i '/LoadModule rewrite_module/s/^#//g' /usr/local/apache2/conf/httpd.conf && \
    sed -i '/LoadModule deflate_module/s/^#//g' /usr/local/apache2/conf/httpd.conf && \
    sed -i 's#AllowOverride [Nn]one#AllowOverride All#' /usr/local/apache2/conf/httpd.conf && \
    sed -i 's/Listen 80/Listen 81/' /usr/local/apache2/conf/httpd.conf

# Copy built application from builder stage
COPY --from=builder /app/public_html /usr/local/apache2/htdocs/

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

# Start Apache
CMD ["httpd-foreground"]
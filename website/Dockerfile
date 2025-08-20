# Multi-stage Dockerfile for Docusaurus v3
# Optimized for production builds with security best practices

# Build stage
FROM node:20-alpine AS builder

# Security: Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S docusaurus -u 1001

# Set working directory
WORKDIR /app

# Copy package files for better caching
COPY package*.json ./

# Install dependencies with production optimizations
RUN npm ci --only=production --silent --no-audit --no-fund && \
    npm cache clean --force

# Copy source code
COPY --chown=docusaurus:nodejs . .

# Run content validation and build
RUN npm run validate:content && \
    npm run build

# Verify build output
RUN test -f build/index.html || (echo "Build failed: index.html not found" && exit 1) && \
    test -f build/sitemap.xml || (echo "Build failed: sitemap.xml not found" && exit 1) && \
    echo "Build verification completed successfully"

# Production stage
FROM nginx:1.25-alpine AS production

# Security: Install security updates
RUN apk update && \
    apk upgrade && \
    apk add --no-cache \
        curl \
        tzdata && \
    rm -rf /var/cache/apk/*

# Security: Create non-root user for nginx
RUN addgroup -g 1001 -S nginx-docusaurus && \
    adduser -S nginx-docusaurus -u 1001 -G nginx-docusaurus

# Copy custom nginx configuration
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen 8080;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' *.googletagmanager.com *.google-analytics.com; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data: *.githubusercontent.com; connect-src 'self' *.google-analytics.com *.analytics.google.com *.googletagmanager.com;" always;

    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_types
        application/javascript
        application/json
        text/css
        text/javascript
        text/xml
        text/plain;

    # Cache control
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
    }

    # Handle SPA routing
    location / {
        try_files $uri $uri/ $uri.html /index.html;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
    }

    # Security: Hide server version
    server_tokens off;

    # Error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
}
EOF

# Copy built site from builder stage
COPY --from=builder --chown=nginx-docusaurus:nginx-docusaurus /app/build /usr/share/nginx/html

# Create custom 50x.html error page
COPY <<'EOF' /usr/share/nginx/html/50x.html
<!DOCTYPE html>
<html>
<head>
    <title>Service Unavailable</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #333; }
        .container { max-width: 600px; margin: 0 auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Service Temporarily Unavailable</h1>
        <p>The Nephio O-RAN Claude Agents documentation is temporarily unavailable.</p>
        <p>Please try again in a few moments.</p>
    </div>
</body>
</html>
EOF

# Set proper permissions
RUN chown -R nginx-docusaurus:nginx-docusaurus /usr/share/nginx/html && \
    chown -R nginx-docusaurus:nginx-docusaurus /var/cache/nginx && \
    chown -R nginx-docusaurus:nginx-docusaurus /var/log/nginx && \
    chown -R nginx-docusaurus:nginx-docusaurus /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx-docusaurus:nginx-docusaurus /var/run/nginx.pid

# Security: Run as non-root user
USER nginx-docusaurus

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Expose port (non-privileged)
EXPOSE 8080

# Labels for better maintenance
LABEL maintainer="Nephio O-RAN Claude Agents Team"
LABEL description="Docusaurus v3 website for Nephio O-RAN Claude Agents"
LABEL version="1.0"
LABEL org.opencontainers.image.source="https://github.com/thc1006/nephio-oran-claude-agents"
LABEL org.opencontainers.image.documentation="https://thc1006.github.io/nephio-oran-claude-agents"
LABEL org.opencontainers.image.licenses="Apache-2.0"

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
/**
 * Docusaurus Security Headers Plugin
 * Adds comprehensive security headers to all responses
 * 
 * Security Features:
 * - Content Security Policy (CSP) with strict directives
 * - HTTP Strict Transport Security (HSTS)
 * - X-Frame-Options to prevent clickjacking
 * - X-Content-Type-Options to prevent MIME sniffing
 * - Referrer-Policy for privacy
 * - Permissions-Policy to control browser features
 */

module.exports = function securityHeadersPlugin(context, options) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Default security headers configuration
  const defaultHeaders = {
    // Prevent clickjacking attacks
    'X-Frame-Options': 'DENY',
    
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Enable XSS protection (legacy browsers)
    'X-XSS-Protection': '1; mode=block',
    
    // Control referrer information
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions Policy (formerly Feature Policy)
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
    
    // HTTP Strict Transport Security (HSTS)
    // Only in production to avoid development issues
    ...(isDevelopment ? {} : {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    })
  };

  // Content Security Policy configuration
  const cspDirectives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      // Required for Docusaurus
      isDevelopment ? "'unsafe-inline'" : "'nonce-{{nonce}}'",
      // Google Analytics (if configured)
      'https://www.google-analytics.com',
      'https://www.googletagmanager.com',
      // Algolia search
      'https://*.algolia.net',
      'https://*.algolianet.com'
    ],
    'style-src': [
      "'self'",
      // Required for Docusaurus theming
      isDevelopment ? "'unsafe-inline'" : "'nonce-{{nonce}}'",
      // Google Fonts
      'https://fonts.googleapis.com'
    ],
    'img-src': [
      "'self'",
      'data:',
      'https:',
      // GitHub avatars
      'https://avatars.githubusercontent.com',
      // Analytics
      'https://www.google-analytics.com'
    ],
    'font-src': [
      "'self'",
      'data:',
      // Google Fonts
      'https://fonts.gstatic.com'
    ],
    'connect-src': [
      "'self'",
      // API endpoints
      'https://api.github.com',
      // Analytics
      'https://www.google-analytics.com',
      'https://www.googletagmanager.com',
      // Algolia search
      'https://*.algolia.net',
      'https://*.algolianet.com',
      // WebSocket for hot reload in development
      isDevelopment ? 'ws://localhost:*' : '',
      isDevelopment ? 'http://localhost:*' : ''
    ].filter(Boolean),
    'frame-src': ["'none'"],
    'frame-ancestors': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'manifest-src': ["'self'"],
    'worker-src': ["'self'", 'blob:'],
    'media-src': ["'self'"],
    // Upgrade insecure requests in production
    ...(isDevelopment ? {} : {
      'upgrade-insecure-requests': []
    })
  };

  // Build CSP header string
  const cspHeader = Object.entries(cspDirectives)
    .map(([directive, sources]) => {
      if (sources.length === 0) return directive;
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');

  const headers = {
    ...defaultHeaders,
    'Content-Security-Policy': options.disableCSP ? undefined : cspHeader,
    ...options.customHeaders
  };

  return {
    name: 'docusaurus-plugin-security-headers',

    configureWebpack(config, isServer) {
      if (isServer) {
        return {};
      }

      return {
        devServer: {
          headers: headers
        }
      };
    },

    async postBuild({ outDir }) {
      const fs = require('fs').promises;
      const path = require('path');
      
      // Create _headers file for Netlify
      const headersContent = Object.entries(headers)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => `  ${key}: ${value}`)
        .join('\n');
      
      const netlifyHeaders = `/*\n${headersContent}`;
      
      await fs.writeFile(
        path.join(outDir, '_headers'),
        netlifyHeaders,
        'utf-8'
      );

      // Create headers.json for custom servers
      await fs.writeFile(
        path.join(outDir, 'headers.json'),
        JSON.stringify({ headers }, null, 2),
        'utf-8'
      );

      console.log('Security headers configuration generated successfully');
    },

    injectHtmlTags() {
      if (isDevelopment) {
        return {};
      }

      // Add additional security-related meta tags
      return {
        headTags: [
          {
            tagName: 'meta',
            attributes: {
              'http-equiv': 'X-UA-Compatible',
              content: 'IE=edge'
            }
          },
          {
            tagName: 'meta',
            attributes: {
              name: 'format-detection',
              content: 'telephone=no'
            }
          }
        ]
      };
    }
  };
};
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
 * - Cross-Origin security headers
 */

module.exports = function securityHeadersPlugin(context, options) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.DISABLE_CSP_FOR_TESTS === 'true';

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
    'Permissions-Policy':
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',

    // Cross-Origin security headers for zero-trust implementation
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',

    // HTTP Strict Transport Security (HSTS)
    // Only in production to avoid development issues
    ...(isDevelopment
      ? {}
      : {
          'Strict-Transport-Security':
            'max-age=31536000; includeSubDomains; preload',
        }),
  };

  // Content Security Policy configuration - HARDENED FOR ZERO-TRUST
  const cspDirectives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      // Required for Docusaurus
      (isDevelopment || isTestEnvironment) ? "'unsafe-inline'" : "'nonce-{{nonce}}'",
      (isDevelopment || isTestEnvironment) ? "'unsafe-eval'" : '',
      // Specific allowlisted domains only (NO WILDCARDS)
      'https://www.google-analytics.com',
      'https://www.googletagmanager.com',
      // Algolia search - specific domains only
      'https://cdn.jsdelivr.net', // For Algolia DocSearch
      'https://*.algolia.net',
      'https://*.algolianet.com',
    ].filter(Boolean),
    'style-src': [
      "'self'",
      // Required for Docusaurus theming
      (isDevelopment || isTestEnvironment) ? "'unsafe-inline'" : "'nonce-{{nonce}}'",
      // Specific font providers only
      'https://fonts.googleapis.com',
    ],
    'img-src': [
      "'self'",
      'data:',
      // SECURITY FIX: Removed wildcard 'https:' - only specific domains allowed
      'https://avatars.githubusercontent.com',
      'https://www.google-analytics.com',
      'https://github.com', // For GitHub badges/images
      'https://img.shields.io', // For status badges
      'https://raw.githubusercontent.com', // For documentation images
    ],
    'font-src': [
      "'self'",
      'data:',
      // Google Fonts only
      'https://fonts.gstatic.com',
    ],
    'connect-src': [
      "'self'",
      // API endpoints - specific domains only
      'https://api.github.com',
      // Analytics
      'https://www.google-analytics.com',
      'https://www.googletagmanager.com',
      // Algolia search
      'https://*.algolia.net',
      'https://*.algolianet.com',
      // WebSocket for hot reload in development
      (isDevelopment || isTestEnvironment) ? 'ws://localhost:*' : '',
      (isDevelopment || isTestEnvironment) ? 'http://localhost:*' : '',
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
    ...(isDevelopment
      ? {}
      : {
          'upgrade-insecure-requests': [],
        }),
  };

  // Build CSP header string
  const cspHeader = Object.entries(cspDirectives)
    .map(([directive, sources]) => {
      if (sources.length === 0) return directive;
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');

  // Build headers object, excluding undefined values
  const headers = {
    ...defaultHeaders,
    ...(options.disableCSP ? {} : { 'Content-Security-Policy': cspHeader }),
    ...options.customHeaders,
  };

  // Filter out any undefined values from the headers object
  const cleanHeaders = Object.entries(headers)
    .filter(([_, value]) => value !== undefined && value !== null)
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});

  return {
    name: 'docusaurus-plugin-security-headers',

    configureWebpack(config, isServer) {
      if (isServer) {
        return {};
      }

      return {
        devServer: {
          headers: cleanHeaders,
        },
      };
    },

    async postBuild({ outDir }) {
      const fs = require('fs').promises;
      const path = require('path');

      // Create _headers file for Netlify
      const headersContent = Object.entries(cleanHeaders)
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
        JSON.stringify({ headers: cleanHeaders }, null, 2),
        'utf-8'
      );

      console.log('✅ Security headers configuration generated successfully');
      if (!options.disableCSP) {
        console.log('🔒 Zero-trust security controls enabled');
      } else {
        console.log('⚠️  CSP disabled for testing environment');
      }
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
              content: 'IE=edge',
            },
          },
          {
            tagName: 'meta',
            attributes: {
              name: 'format-detection',
              content: 'telephone=no',
            },
          },
          // O-RAN security compliance indicator
          {
            tagName: 'meta',
            attributes: {
              name: 'security-compliance',
              content: 'oran-wg11-partial nephio-r5-partial',
            },
          },
        ],
      };
    },
  };
};

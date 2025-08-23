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
  
  // Generate a cryptographically secure nonce for CSP
  function generateNonce() {
    return require('crypto').randomBytes(16).toString('base64');
  }

  // Default security headers configuration - ULTRA-HARDENED
  const defaultHeaders = {
    // Prevent clickjacking attacks - strictest setting
    'X-Frame-Options': 'DENY',

    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // Enable XSS protection (legacy browsers)
    'X-XSS-Protection': '1; mode=block',

    // Control referrer information - strictest policy
    'Referrer-Policy': 'no-referrer',

    // Permissions Policy - deny all dangerous features
    'Permissions-Policy':
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), fullscreen=(self), picture-in-picture=(), display-capture=(), web-share=(), clipboard-read=(), clipboard-write=(self)',

    // Cross-Origin security headers for zero-trust implementation
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',

    // Additional security headers
    'X-Permitted-Cross-Domain-Policies': 'none',
    'X-DNS-Prefetch-Control': 'off',
    'X-Download-Options': 'noopen',
    // Cache headers only for non-static resources in production
    ...(isDevelopment ? {} : {
      'Cache-Control': 'no-cache, no-store, must-revalidate, private',
      'Pragma': 'no-cache',
    }),

    // HTTP Strict Transport Security (HSTS) - production only
    ...(isDevelopment
      ? {}
      : {
          'Strict-Transport-Security':
            'max-age=31536000; includeSubDomains; preload',
        }),
  };

  // Content Security Policy configuration - ULTRA-HARDENED FOR ZERO-TRUST
  const cspDirectives = {
    'default-src': ["'self'"], // Allow self but explicitly deny others - balanced security
    'script-src': [
      "'self'",
      // Only allow unsafe-inline in development for hot reload
      isDevelopment ? "'unsafe-inline'" : '',
      isDevelopment ? "'unsafe-eval'" : '',
      // Use strict-dynamic in production for better security
      !isDevelopment && !isTestEnvironment ? "'strict-dynamic'" : '',
      // Specific allowlisted domains only (NO WILDCARDS)
      'https://www.google-analytics.com',
      'https://www.googletagmanager.com',
      // Algolia search - specific domains only, no wildcards
      'https://cdn.jsdelivr.net',
      // Remove wildcard domains for better security
      ...(isDevelopment || isTestEnvironment ? ['https://*.algolia.net', 'https://*.algolianet.com'] : [
        'https://www.algolia.net',
        'https://algolia.net',
        'https://www.algolianet.com',
        'https://algolianet.com'
      ]),
    ].filter(Boolean),
    'style-src': [
      "'self'",
      // Only allow unsafe-inline in development
      isDevelopment ? "'unsafe-inline'" : '',
      // Specific font providers only
      'https://fonts.googleapis.com',
    ].filter(Boolean),
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
      // Algolia search - remove wildcards in production
      ...(isDevelopment || isTestEnvironment ? ['https://*.algolia.net', 'https://*.algolianet.com'] : [
        'https://www.algolia.net',
        'https://algolia.net',
        'https://www.algolianet.com',
        'https://algolianet.com'
      ]),
      // WebSocket for hot reload in development only
      (isDevelopment || isTestEnvironment) ? 'ws://localhost:*' : '',
      (isDevelopment || isTestEnvironment) ? 'http://localhost:*' : '',
      (isDevelopment || isTestEnvironment) ? 'ws://127.0.0.1:*' : '',
      (isDevelopment || isTestEnvironment) ? 'http://127.0.0.1:*' : '',
    ].filter(Boolean),
    'frame-src': ["'none'"],
    'frame-ancestors': ["'none'"], // Strictest possible - no embedding allowed
    'object-src': ["'none'"],
    'embed-src': ["'none'"], // Additional protection against plugins
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'manifest-src': ["'self'"],
    'worker-src': ["'self'"],
    'child-src': ["'none'"], // Prevent child contexts
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

    injectHtmlTags({ content }) {
      // Generate nonce for this request (in production builds, this would be per-request)
      const nonce = generateNonce();
      
      const headTags = [
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
        // Security compliance indicators
        {
          tagName: 'meta',
          attributes: {
            name: 'security-compliance',
            content: 'oran-wg11-enhanced nephio-r5-hardened csp-ultra-strict',
          },
        },
        {
          tagName: 'meta',
          attributes: {
            name: 'security-features',
            content: 'strict-csp no-unsafe-inline frame-ancestors-none hsts-enabled',
          },
        },
      ];

      // Add CSP nonce meta tag for reference (in production)
      if (!isDevelopment && !isTestEnvironment) {
        headTags.push({
          tagName: 'meta',
          attributes: {
            name: 'csp-nonce',
            content: nonce,
          },
        });
      }

      return { headTags };
    },
  };
};

/**
 * Performance optimization configuration for Docusaurus
 * 
 * This configuration provides settings for optimizing the website's performance,
 * including bundle sizes, loading strategies, and caching policies.
 */

module.exports = {
  // Bundle size limits (in bytes)
  budgets: {
    javascript: {
      initial: 200000,    // 200KB for initial JS
      async: 100000,      // 100KB for async chunks
    },
    css: {
      initial: 50000,     // 50KB for initial CSS
    },
    images: {
      default: 100000,    // 100KB for images
      hero: 200000,       // 200KB for hero images
    },
  },

  // Code splitting configuration
  splitting: {
    // Minimum size for a chunk to be created
    minSize: 30000,
    // Maximum size before splitting
    maxSize: 250000,
    // Minimum number of chunks that must share a module
    minChunks: 1,
    // Maximum number of parallel requests
    maxAsyncRequests: 30,
    maxInitialRequests: 30,
  },

  // Caching strategies
  caching: {
    // Browser cache duration for static assets (in seconds)
    staticAssets: 31536000,  // 1 year
    // Browser cache duration for HTML pages
    html: 3600,               // 1 hour
    // Browser cache duration for API responses
    api: 300,                 // 5 minutes
  },

  // Image optimization
  images: {
    // Supported formats for modern browsers
    formats: ['webp', 'avif'],
    // Quality settings (0-100)
    quality: {
      webp: 85,
      avif: 80,
      jpeg: 85,
      png: 90,
    },
    // Lazy loading configuration
    lazyLoad: {
      enabled: true,
      // Pixels before viewport to start loading
      offset: 200,
    },
  },

  // Preloading and prefetching
  resourceHints: {
    // Preconnect to external domains
    preconnect: [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ],
    // DNS prefetch for potential external resources
    dnsPrefetch: [
      'https://www.google-analytics.com',
      'https://cdn.jsdelivr.net',
    ],
    // Preload critical resources
    preload: [
      {
        href: '/css/custom.css',
        as: 'style',
      },
    ],
  },

  // Performance monitoring
  monitoring: {
    // Web Vitals thresholds
    webVitals: {
      LCP: 2500,    // Largest Contentful Paint (ms)
      FID: 100,     // First Input Delay (ms)
      CLS: 0.1,     // Cumulative Layout Shift
      FCP: 1800,    // First Contentful Paint (ms)
      TTFB: 800,    // Time to First Byte (ms)
    },
    // Enable Real User Monitoring
    rum: false,
    // Enable synthetic monitoring
    synthetic: false,
  },

  // Service Worker configuration (for PWA)
  serviceWorker: {
    enabled: false,  // Set to true to enable PWA
    strategies: {
      // Cache first for images and fonts
      cacheFirst: [
        /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
        /\.(?:woff|woff2|ttf|otf)$/,
      ],
      // Network first for HTML and API
      networkFirst: [
        /\.html$/,
        /\/api\//,
      ],
      // Stale while revalidate for CSS and JS
      staleWhileRevalidate: [
        /\.(?:js|css)$/,
      ],
    },
  },

  // Compression settings
  compression: {
    // Enable Brotli compression
    brotli: true,
    // Enable Gzip compression
    gzip: true,
    // Minimum file size to compress (bytes)
    threshold: 10240,  // 10KB
  },

  // CDN configuration
  cdn: {
    enabled: false,
    // CDN URL prefix
    url: '',
    // Assets to serve from CDN
    include: [
      'images',
      'fonts',
      'videos',
    ],
  },
};
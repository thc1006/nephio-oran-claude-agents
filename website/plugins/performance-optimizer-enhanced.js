const path = require('path');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');

module.exports = function (context, options = {}) {
  const {
    enableBundleAnalyzer = false,
    enableTerser = true,
    enableCssOptimization = true,
    enableWebVitals = true,
    enableCompression = true,
    enableServiceWorker = true,
    silent = false,
  } = options;

  return {
    name: 'performance-optimizer-enhanced',
    configureWebpack(config, isServer, utils) {
      const isProd = process.env.NODE_ENV === 'production';
      const isAnalyze = process.env.ANALYZE === 'true';

      if (!silent) {
        console.log(`🚀 Performance Optimizer: ${isProd ? 'Production' : 'Development'} mode`);
      }

      // Only apply optimizations for client-side builds
      if (isServer) {
        return {};
      }

      const performanceConfig = {
        optimization: {
          // Enable aggressive code splitting
          splitChunks: {
            chunks: 'all',
            maxInitialRequests: 25,
            minSize: 20000,
            maxSize: 244000,
            cacheGroups: {
              // Framework chunks (React ecosystem)
              react: {
                test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
                name: 'framework-react',
                priority: 40,
                enforce: true,
                reuseExistingChunk: true,
              },
              // Docusaurus core
              docusaurus: {
                test: /[\\/]node_modules[\\/]@docusaurus[\\/]/,
                name: 'framework-docusaurus',
                priority: 35,
                enforce: true,
                reuseExistingChunk: true,
              },
              // Large third-party libraries
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name(module) {
                  const packageName = module.context.match(
                    /[\\/]node_modules[\\/](.*?)([\\/]|$)/
                  )[1];
                  // Create separate chunks for large packages
                  if (['@mdx-js', 'prism-react-renderer', 'clsx'].includes(packageName)) {
                    return `vendor.${packageName.replace('@', '')}`;
                  }
                  return 'vendor.others';
                },
                priority: 20,
                reuseExistingChunk: true,
              },
              // Common shared code
              common: {
                minChunks: 2,
                priority: 10,
                reuseExistingChunk: true,
                name: 'shared-common',
              },
              // Styles
              styles: {
                name: 'styles',
                test: /\.(css|scss|sass)$/,
                chunks: 'all',
                enforce: true,
                priority: 25,
              },
            },
          },
          // Runtime chunk for better caching
          runtimeChunk: {
            name: 'runtime',
          },
          // Module IDs for better caching
          moduleIds: 'deterministic',
          // Enable sideEffects configuration for better tree shaking
          sideEffects: false,
          // Minimize in production
          minimize: isProd && enableTerser,
          minimizer: [
            // Enhanced JavaScript minification
            enableTerser && new TerserPlugin({
              parallel: true,
              extractComments: false,
              terserOptions: {
                parse: {
                  ecma: 2020,
                },
                compress: {
                  ecma: 2015,
                  warnings: false,
                  comparisons: false,
                  inline: 2,
                  drop_console: isProd,
                  drop_debugger: isProd,
                  pure_funcs: isProd 
                    ? ['console.log', 'console.info', 'console.debug', 'console.warn']
                    : [],
                  passes: 2,
                  dead_code: true,
                  unused: true,
                },
                mangle: {
                  safari10: true,
                },
                output: {
                  ecma: 2015,
                  comments: false,
                  ascii_only: true,
                },
              },
            }),
            // CSS optimization
            enableCssOptimization && new CssMinimizerPlugin({
              parallel: true,
              minimizerOptions: {
                preset: [
                  'default',
                  {
                    discardComments: { removeAll: true },
                    normalizeWhitespace: true,
                    colormin: true,
                    convertValues: true,
                    reduceIdents: true,
                    orderedValues: true,
                    minifySelectors: true,
                    calc: true,
                    minifyFontValues: true,
                  },
                ],
              },
            }),
          ].filter(Boolean),
        },
        
        // Enhanced performance hints
        performance: {
          hints: isProd ? 'warning' : false,
          maxEntrypointSize: 400000, // 400kb
          maxAssetSize: 400000, // 400kb
          assetFilter: function (assetFilename) {
            return assetFilename.endsWith('.js') || assetFilename.endsWith('.css');
          },
        },

        // Enhanced resolve configuration for better tree shaking
        resolve: {
          mainFields: ['browser', 'jsnext:main', 'module', 'main'],
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
          alias: {
            '@components': path.resolve(context.siteDir, 'src/components'),
            '@utils': path.resolve(context.siteDir, 'src/utils'),
            '@pages': path.resolve(context.siteDir, 'src/pages'),
          },
        },

        plugins: [
          // Bundle analyzer (only when requested)
          (isAnalyze || enableBundleAnalyzer) && new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: '../bundle-report.html',
            openAnalyzer: false,
            generateStatsFile: true,
            statsFilename: '../bundle-stats.json',
            statsOptions: {
              source: false,
              reasons: true,
              chunks: true,
              chunkModules: true,
              chunkOrigins: false,
              modules: true,
              modulesSort: 'size',
              chunksSort: 'size',
              assetsSort: 'size',
            },
          }),

          // Compression plugins
          enableCompression && isProd && new CompressionPlugin({
            filename: '[path][base].gz',
            algorithm: 'gzip',
            test: /\.(js|css|html|svg|json|xml|txt|md)$/,
            threshold: 8192,
            minRatio: 0.8,
            deleteOriginalAssets: false,
          }),

          // Brotli compression (better than gzip)
          enableCompression && isProd && new CompressionPlugin({
            filename: '[path][base].br',
            algorithm: 'brotliCompress',
            test: /\.(js|css|html|svg|json|xml|txt|md)$/,
            compressionOptions: {
              level: 11,
            },
            threshold: 8192,
            minRatio: 0.8,
            deleteOriginalAssets: false,
          }),

          // Service Worker for PWA capabilities
          enableServiceWorker && isProd && new WorkboxPlugin.GenerateSW({
            clientsClaim: true,
            skipWaiting: true,
            swDest: 'sw.js',
            maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB
            navigateFallback: '/index.html',
            navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],
            runtimeCaching: [
              // Google Fonts caching
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com/,
                handler: 'StaleWhileRevalidate',
                options: {
                  cacheName: 'google-fonts-stylesheets',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                  },
                },
              },
              {
                urlPattern: /^https:\/\/fonts\.gstatic\.com/,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-webfonts',
                  expiration: {
                    maxEntries: 30,
                    maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
              // Image caching
              {
                urlPattern: /\.(?:png|gif|jpg|jpeg|webp|svg|avif)$/,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'images',
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                  },
                },
              },
              // Static resource caching
              {
                urlPattern: /\.(?:js|css)$/,
                handler: 'StaleWhileRevalidate',
                options: {
                  cacheName: 'static-resources',
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
                  },
                },
              },
              // API caching (if applicable)
              {
                urlPattern: /^https:\/\/api\./,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'api-cache',
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60 * 24, // 1 day
                  },
                  networkTimeoutSeconds: 3,
                },
              },
            ],
          }),
        ].filter(Boolean),

        // Module optimization
        module: {
          rules: [
            // Optimize image loading
            {
              test: /\.(png|jpe?g|gif|svg|webp|avif)$/i,
              type: 'asset',
              parser: {
                dataUrlCondition: {
                  maxSize: 8 * 1024, // 8kb
                },
              },
              generator: {
                filename: 'assets/images/[name].[hash:8][ext]',
              },
              use: isProd ? [
                {
                  loader: 'image-webpack-loader',
                  options: {
                    mozjpeg: {
                      progressive: true,
                      quality: 80,
                    },
                    optipng: {
                      enabled: false,
                    },
                    pngquant: {
                      quality: [0.6, 0.8],
                    },
                    gifsicle: {
                      interlaced: true,
                      optimizationLevel: 3,
                    },
                    webp: {
                      quality: 80,
                    },
                    svgo: {
                      plugins: [
                        {
                          name: 'preset-default',
                          params: {
                            overrides: {
                              removeViewBox: false,
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              ] : [],
            },
            // Optimize font loading
            {
              test: /\.(woff|woff2|eot|ttf|otf)$/i,
              type: 'asset/resource',
              generator: {
                filename: 'assets/fonts/[name].[hash:8][ext]',
              },
            },
          ],
        },

        // Source maps for better debugging (only in production)
        devtool: isProd ? 'source-map' : 'eval-cheap-module-source-map',
      };

      if (!silent) {
        console.log(`📦 Code splitting: Enhanced with ${Object.keys(performanceConfig.optimization.splitChunks.cacheGroups).length} cache groups`);
        if (enableCompression && isProd) {
          console.log('🗜️  Compression: Gzip + Brotli enabled');
        }
        if (enableServiceWorker && isProd) {
          console.log('⚡ Service Worker: Enabled with aggressive caching');
        }
      }

      return performanceConfig;
    },
    
    // Enhanced PostCSS configuration
    configurePostCss(options) {
      if (process.env.NODE_ENV === 'production') {
        options.plugins.push(
          require('cssnano')({
            preset: ['default', {
              discardComments: {
                removeAll: true,
              },
              normalizeWhitespace: true,
              colormin: true,
              convertValues: true,
              calc: true,
              reduceIdents: true,
              orderedValues: true,
              minifySelectors: true,
              minifyParams: true,
              minifyFontValues: true,
              normalizeUrl: true,
              normalizeUnicode: true,
              normalizeTimingFunctions: true,
            }],
          })
        );
      }
      return options;
    },

    // Inject performance monitoring and optimization scripts
    injectHtmlTags({ content }) {
      if (process.env.NODE_ENV !== 'production') {
        return {};
      }

      return {
        headTags: [
          // Resource hints for better loading performance
          {
            tagName: 'link',
            attributes: {
              rel: 'preconnect',
              href: 'https://fonts.googleapis.com',
            },
          },
          {
            tagName: 'link',
            attributes: {
              rel: 'preconnect',
              href: 'https://fonts.gstatic.com',
              crossOrigin: 'anonymous',
            },
          },
          {
            tagName: 'link',
            attributes: {
              rel: 'dns-prefetch',
              href: 'https://fonts.googleapis.com',
            },
          },
          // Preload critical CSS
          {
            tagName: 'link',
            attributes: {
              rel: 'preload',
              as: 'style',
              href: '/assets/css/styles.css',
            },
          },
          // Add CSS loading optimization
          {
            tagName: 'style',
            innerHTML: `
              /* Critical CSS loading optimization */
              .loading-spinner {
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 3px solid #f3f3f3;
                border-top: 3px solid #25c2a0;
                border-radius: 50%;
                animation: spin 1s linear infinite;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              /* Prevent layout shifts */
              img[loading="lazy"] {
                min-height: 1px;
              }
            `,
          },
        ],
        preBodyTags: [],
        postBodyTags: [
          // Enhanced Web Vitals monitoring
          enableWebVitals && {
            tagName: 'script',
            innerHTML: `
              // Enhanced Web Vitals monitoring with real user metrics
              (function() {
                if ('PerformanceObserver' in window && 'requestIdleCallback' in window) {
                  const vitals = {};
                  
                  try {
                    // Largest Contentful Paint (LCP)
                    const lcpObserver = new PerformanceObserver((list) => {
                      const entries = list.getEntries();
                      const lastEntry = entries[entries.length - 1];
                      vitals.lcp = lastEntry.startTime;
                      if (vitals.lcp > 2500) {
                        console.warn('⚠️ LCP needs improvement:', vitals.lcp);
                      }
                    });
                    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

                    // First Input Delay (FID) / Interaction to Next Paint (INP)
                    const fidObserver = new PerformanceObserver((list) => {
                      const entries = list.getEntries();
                      entries.forEach(entry => {
                        vitals.fid = entry.processingStart - entry.startTime;
                        if (vitals.fid > 100) {
                          console.warn('⚠️ FID needs improvement:', vitals.fid);
                        }
                      });
                    });
                    fidObserver.observe({ type: 'first-input', buffered: true });

                    // Cumulative Layout Shift (CLS)
                    let clsValue = 0;
                    const clsObserver = new PerformanceObserver((list) => {
                      for (const entry of list.getEntries()) {
                        if (!entry.hadRecentInput) {
                          clsValue += entry.value;
                          vitals.cls = clsValue;
                          if (vitals.cls > 0.1) {
                            console.warn('⚠️ CLS needs improvement:', vitals.cls);
                          }
                        }
                      }
                    });
                    clsObserver.observe({ type: 'layout-shift', buffered: true });

                    // Time to First Byte (TTFB)
                    const navigationEntry = performance.getEntriesByType('navigation')[0];
                    if (navigationEntry) {
                      vitals.ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
                      if (vitals.ttfb > 600) {
                        console.warn('⚠️ TTFB needs improvement:', vitals.ttfb);
                      }
                    }

                    // Report vitals after page load
                    window.addEventListener('load', () => {
                      requestIdleCallback(() => {
                        console.log('📊 Web Vitals:', vitals);
                        // You could send this data to your analytics service
                        // analytics.track('web_vitals', vitals);
                      });
                    });

                  } catch (e) {
                    // Silently fail if not supported
                    console.debug('Web Vitals monitoring not supported');
                  }
                }

                // Prefetch important routes on hover/focus
                document.addEventListener('mouseover', (e) => {
                  if (e.target.matches('a[href^="/docs"], a[href^="/blog"]')) {
                    const link = document.createElement('link');
                    link.rel = 'prefetch';
                    link.href = e.target.href;
                    document.head.appendChild(link);
                  }
                });

                // Service Worker registration
                if ('serviceWorker' in navigator && '${enableServiceWorker}' === 'true') {
                  window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js')
                      .then(registration => {
                        console.log('🚀 SW registered:', registration.scope);
                      })
                      .catch(error => {
                        console.log('SW registration failed:', error);
                      });
                  });
                }
              })();
            `,
          },
        ].filter(Boolean),
      };
    },
  };
};
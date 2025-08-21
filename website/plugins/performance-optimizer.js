const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = function (context, options) {
  return {
    name: 'performance-optimizer',
    configureWebpack(config, isServer, utils) {
      // Only apply optimizations for client-side builds
      if (isServer) {
        return {};
      }

      const performanceConfig = {
        optimization: {
          // Enable code splitting
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              // Vendor code splitting
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                priority: 10,
                reuseExistingChunk: true,
              },
              // Common code splitting
              common: {
                minChunks: 2,
                priority: 5,
                reuseExistingChunk: true,
              },
              // React specific bundle
              react: {
                test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
                name: 'react',
                priority: 20,
                reuseExistingChunk: true,
              },
              // Docusaurus core
              docusaurus: {
                test: /[\\/]node_modules[\\/]@docusaurus[\\/]/,
                name: 'docusaurus',
                priority: 15,
                reuseExistingChunk: true,
              },
            },
            maxAsyncRequests: 30,
            maxInitialRequests: 30,
            enforceSizeThreshold: 50000,
          },
          // Runtime chunk for better caching
          runtimeChunk: {
            name: 'runtime',
          },
          // Module IDs for better caching
          moduleIds: 'deterministic',
          // Minimize in production
          minimize: process.env.NODE_ENV === 'production',
          minimizer: [
            new TerserPlugin({
              terserOptions: {
                parse: {
                  ecma: 8,
                },
                compress: {
                  ecma: 5,
                  warnings: false,
                  comparisons: false,
                  inline: 2,
                  drop_console: process.env.NODE_ENV === 'production',
                },
                mangle: {
                  safari10: true,
                },
                output: {
                  ecma: 5,
                  comments: false,
                  ascii_only: true,
                },
              },
              parallel: true,
            }),
          ],
        },
        performance: {
          hints: process.env.NODE_ENV === 'production' ? 'warning' : false,
          maxEntrypointSize: 512000, // 500kb
          maxAssetSize: 512000, // 500kb
        },
        plugins: [],
      };

      // Add Bundle Analyzer if ANALYZE env var is set
      if (process.env.ANALYZE === 'true') {
        performanceConfig.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: '../bundle-report.html',
            openAnalyzer: false,
            generateStatsFile: true,
            statsFilename: '../bundle-stats.json',
            statsOptions: {
              source: false,
              reasons: false,
              chunks: true,
              chunkModules: true,
              chunkOrigins: false,
              modules: true,
              modulesSort: 'size',
              chunksSort: 'size',
              assetsSort: 'size',
            },
          })
        );
      }

      return performanceConfig;
    },
    
    // Add performance-related headers
    configurePostCss(options) {
      options.plugins.push(
        require('cssnano')({
          preset: ['default', {
            discardComments: {
              removeAll: true,
            },
            normalizeWhitespace: process.env.NODE_ENV === 'production',
          }],
        })
      );
      return options;
    },

    // Inject performance monitoring script
    injectHtmlTags({ content }) {
      if (process.env.NODE_ENV !== 'production') {
        return {};
      }

      return {
        headTags: [
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
              rel: 'dns-prefetch',
              href: 'https://fonts.googleapis.com',
            },
          },
        ],
        preBodyTags: [],
        postBodyTags: [
          {
            tagName: 'script',
            innerHTML: `
              // Web Vitals monitoring
              if ('PerformanceObserver' in window) {
                try {
                  // Observe Largest Contentful Paint
                  const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    console.log('LCP:', lastEntry.startTime);
                  });
                  lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

                  // Observe First Input Delay
                  const fidObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                      console.log('FID:', entry.processingStart - entry.startTime);
                    });
                  });
                  fidObserver.observe({ type: 'first-input', buffered: true });

                  // Observe Cumulative Layout Shift
                  let clsValue = 0;
                  const clsObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                      if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                        console.log('CLS:', clsValue);
                      }
                    }
                  });
                  clsObserver.observe({ type: 'layout-shift', buffered: true });
                } catch (e) {
                  // Silently fail if not supported
                }
              }
            `,
          },
        ],
      };
    },
  };
};
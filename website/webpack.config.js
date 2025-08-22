/**
 * Custom Webpack Configuration for Docusaurus Performance Optimization
 * This configuration provides advanced optimizations for production builds
 */

const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const CompressionPlugin = require('compression-webpack-plugin');
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');

module.exports = function (context, options) {
  return {
    name: 'performance-optimizer',
    configureWebpack(config, isServer, utils) {
      const isProd = process.env.NODE_ENV === 'production';
      const isAnalyze = process.env.ANALYZE === 'true';

      // Only apply optimizations in production and for client-side bundles
      if (!isProd || isServer) {
        return {};
      }

      return {
        optimization: {
          minimize: true,
          minimizer: [
            // Advanced JavaScript minification
            new TerserPlugin({
              parallel: true,
              terserOptions: {
                parse: {
                  ecma: 8,
                },
                compress: {
                  ecma: 5,
                  warnings: false,
                  comparisons: false,
                  inline: 2,
                  drop_console: true,
                  drop_debugger: true,
                  pure_funcs: ['console.log', 'console.info', 'console.debug'],
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
              extractComments: false,
            }),
            // CSS optimization
            new CssMinimizerPlugin({
              minimizerOptions: {
                preset: [
                  'default',
                  {
                    discardComments: { removeAll: true },
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
                  },
                ],
              },
            }),
          ],
          // Advanced chunk splitting strategy
          splitChunks: {
            chunks: 'all',
            maxInitialRequests: 25,
            minSize: 20000,
            maxSize: 244000,
            cacheGroups: {
              // Vendor chunks
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name(module) {
                  const packageName = module.context.match(
                    /[\\/]node_modules[\\/](.*?)([\\/]|$)/
                  )[1];
                  return `vendor.${packageName.replace('@', '')}`;
                },
                priority: 20,
              },
              // React-related packages
              react: {
                test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
                name: 'react-vendor',
                priority: 30,
                enforce: true,
              },
              // Docusaurus core
              docusaurus: {
                test: /[\\/]node_modules[\\/]@docusaurus[\\/]/,
                name: 'docusaurus-core',
                priority: 25,
                enforce: true,
              },
              // Common chunks
              common: {
                minChunks: 2,
                priority: 10,
                reuseExistingChunk: true,
                enforce: true,
              },
              // Styles
              styles: {
                name: 'styles',
                test: /\.(css|scss|sass)$/,
                chunks: 'all',
                enforce: true,
                priority: 15,
              },
            },
          },
          runtimeChunk: {
            name: 'runtime',
          },
          moduleIds: 'deterministic',
        },
        plugins: [
          // Bundle analyzer (only when ANALYZE=true)
          isAnalyze &&
            new BundleAnalyzerPlugin({
              analyzerMode: 'static',
              reportFilename: '../bundle-report.html',
              openAnalyzer: false,
              generateStatsFile: true,
              statsFilename: '../bundle-stats.json',
            }),
          // Gzip compression
          new CompressionPlugin({
            filename: '[path][base].gz',
            algorithm: 'gzip',
            test: /\.(js|css|html|svg|json|xml|txt|md)$/,
            threshold: 8192,
            minRatio: 0.8,
            deleteOriginalAssets: false,
          }),
          // Brotli compression
          new CompressionPlugin({
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
          // Image optimization
          new ImageMinimizerPlugin({
            minimizer: {
              implementation: ImageMinimizerPlugin.imageminMinify,
              options: {
                plugins: [
                  ['imagemin-gifsicle', { interlaced: true, optimizationLevel: 3 }],
                  ['imagemin-mozjpeg', { progressive: true, quality: 80 }],
                  ['imagemin-pngquant', { quality: [0.6, 0.8] }],
                  [
                    'imagemin-svgo',
                    {
                      plugins: [
                        {
                          name: 'preset-default',
                          params: {
                            overrides: {
                              removeViewBox: false,
                              addAttributesToSVGElement: {
                                params: {
                                  attributes: [{ xmlns: 'http://www.w3.org/2000/svg' }],
                                },
                              },
                            },
                          },
                        },
                      ],
                    },
                  ],
                ],
              },
            },
            generator: [
              {
                type: 'asset',
                preset: 'webp-custom-name',
                implementation: ImageMinimizerPlugin.imageminGenerate,
                options: {
                  plugins: ['imagemin-webp'],
                },
              },
            ],
          }),
          // Manifest for caching
          new WebpackManifestPlugin({
            fileName: 'asset-manifest.json',
            publicPath: '/',
            generate: (seed, files, entrypoints) => {
              const manifestFiles = files.reduce((manifest, file) => {
                manifest[file.name] = file.path;
                return manifest;
              }, seed);
              const entrypointFiles = entrypoints.main.filter(
                fileName => !fileName.endsWith('.map')
              );
              return {
                files: manifestFiles,
                entrypoints: entrypointFiles,
              };
            },
          }),
          // Service Worker for PWA
          new WorkboxPlugin.GenerateSW({
            clientsClaim: true,
            skipWaiting: true,
            swDest: 'sw.js',
            maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB
            runtimeCaching: [
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
              {
                urlPattern: /\.(?:png|gif|jpg|jpeg|webp|svg)$/,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'images',
                  expiration: {
                    maxEntries: 60,
                    maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                  },
                },
              },
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
            ],
          }),
        ].filter(Boolean),
        module: {
          rules: [
            // Optimize images
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
            },
            // Optimize fonts
            {
              test: /\.(woff|woff2|eot|ttf|otf)$/i,
              type: 'asset/resource',
              generator: {
                filename: 'assets/fonts/[name].[hash:8][ext]',
              },
            },
          ],
        },
        performance: {
          hints: 'warning',
          maxEntrypointSize: 512000, // 500KB
          maxAssetSize: 512000, // 500KB
          assetFilter: function (assetFilename) {
            // Only provide hints for JS and CSS files
            return assetFilename.endsWith('.js') || assetFilename.endsWith('.css');
          },
        },
        // Enable source maps in production for debugging (optional)
        devtool: isProd ? 'source-map' : 'eval-cheap-module-source-map',
      };
    },
  };
};
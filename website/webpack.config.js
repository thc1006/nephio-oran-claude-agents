const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = function () {
  return {
    name: 'bundle-analyzer',
    configureWebpack(config, isServer) {
      if (process.env.ANALYZE === 'true' && !isServer) {
        return {
          plugins: [
            new BundleAnalyzerPlugin({
              analyzerMode: 'static',
              reportFilename: 'bundle-report.html',
              openAnalyzer: false,
              generateStatsFile: true,
              statsFilename: 'bundle-stats.json',
            }),
          ],
        };
      }
      return {};
    },
  };
};
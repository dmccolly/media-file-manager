const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      const miniCssExtractPlugin = webpackConfig.plugins.find(
        plugin => plugin.constructor.name === 'MiniCssExtractPlugin'
      );
      
      if (miniCssExtractPlugin) {
        miniCssExtractPlugin.options.filename = 'static/css/[name].[contenthash:8].css';
        miniCssExtractPlugin.options.chunkFilename = 'static/css/[name].[contenthash:8].chunk.css';
      }
      
      return webpackConfig;
    }
  }
};

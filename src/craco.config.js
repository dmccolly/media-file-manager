const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      const miniCssExtractPlugin = webpackConfig.plugins.find(
        plugin => plugin.constructor.name === 'MiniCssExtractPlugin'
      );
      
      if (miniCssExtractPlugin) {
        miniCssExtractPlugin.options.filename = 'static/css/[name].[contenthash:8].css';
        miniCssExtractPlugin.options.chunkFilename = 'static/css/[name].[contenthash:8].chunk.css';
      } else {
        webpackConfig.plugins.push(
          new MiniCssExtractPlugin({
            filename: 'static/css/[name].[contenthash:8].css',
            chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
          })
        );
      }
      
      const cssRule = webpackConfig.module.rules.find(rule => 
        rule.oneOf && rule.oneOf.some(r => r.test && r.test.toString().includes('css'))
      );
      
      if (cssRule && cssRule.oneOf) {
        cssRule.oneOf.forEach(rule => {
          if (rule.test && rule.test.toString().includes('css') && rule.use) {
            rule.use = rule.use.map(loader => {
              if (typeof loader === 'object' && loader.loader && loader.loader.includes('style-loader')) {
                return MiniCssExtractPlugin.loader;
              }
              return loader;
            });
          }
        });
      }
      
      return webpackConfig;
    }
  }
};

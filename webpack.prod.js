const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const name = require('./package.json').name;
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = merge(common, {
  mode:'production',
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: true,
        terserOptions: {
          sourceMap: true,
          compress: {
            drop_console: true
          }
        },
        test: /\.js(\?.*)?$/i
      }),
      new CssMinimizerPlugin({
        test: /\.css(\?.*)?$/i
      }),
    ],
  },
  plugins: [
    new HtmlWebPackPlugin({
      title: name,
      template: "./src/html/index.html",
      filename: "./index.html"
    }),
    new MiniCssExtractPlugin({
      filename: 'css/' + name + '.min.css'
    })
  ]
});
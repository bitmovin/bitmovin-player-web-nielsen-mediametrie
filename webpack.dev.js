const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, 'example/index.html'),
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'build'),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        use: 'html-loader',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'example/index.html'),
    }),
  ],
  devServer: {
    port: 3000,
    open: true,
    static: [
      {
        directory: path.resolve(__dirname, 'example'),
        publicPath: '/',
      },
      {
        directory: path.resolve(__dirname, 'dist'),
        publicPath: '/dist/',
      },
    ],
  },
};

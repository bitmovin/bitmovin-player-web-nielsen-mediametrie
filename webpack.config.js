const CreateFileWebpack = require('create-file-webpack');
const npmPackage = require('./package.json');
const path = require('path');

module.exports = {
  entry: './src/ts/index.ts',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.build.json',
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.tsx?$/,
        loader: 'string-replace-loader',
        options: {
          search: '{{VERSION}}',
          replace: npmPackage.version,
          flags: 'g',
        },
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'bitmovin-player-measurements-nielsen.js',
    umdNamedDefine: true,
    path: path.resolve(__dirname, 'dist'),
    library: ['bitmovin', 'player', 'measurements'],
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  devtool: 'source-map',
  plugins: [
    new CreateFileWebpack({
      path: './dist',
      fileName: 'bitmovin-player-measurements-nielsen.d.ts',
      content: "export * from './lib/index';",
    }),
  ],
  externals: {
    'bitmovin-player': {
      commonjs: 'bitmovin-player',
      commonjs2: 'bitmovin-player',
      amd: 'bitmovin-player',
      root: ['bitmovin', 'player'],
    },
  },
};

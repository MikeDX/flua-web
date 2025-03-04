const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.ts',
  mode: 'development',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.lua$/,
        type: 'asset/source'
      },
      {
        test: /\.js$/,
        type: 'javascript/auto',
        resolve: {
          fullySpecified: false
        }
      }
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      "path": require.resolve("path-browserify"),
      "fs": false,
      "stream": require.resolve("stream-browserify")
    },
    alias: {
      '@codemirror': path.resolve(__dirname, 'node_modules/@codemirror'),
      '@lezer': path.resolve(__dirname, 'node_modules/@lezer')
    }
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/index.html'
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'src'),
      publicPath: '/'
    },
    compress: true,
    port: 9000,
    hot: true,
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
    },
  },
}; 
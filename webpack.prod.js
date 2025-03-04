const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const fs = require('fs');

// Check if assets directory exists
const hasAssets = fs.existsSync(path.resolve(__dirname, 'assets'));

const plugins = [
    new HtmlWebpackPlugin({
        template: 'src/index.html',
        minify: {
            collapseWhitespace: true,
            removeComments: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            useShortDoctype: true
        }
    })
];

// Only add CopyWebpackPlugin if assets directory exists
if (hasAssets) {
    plugins.push(
        new CopyWebpackPlugin({
            patterns: [
                { 
                    from: 'assets',
                    to: 'assets',
                    globOptions: {
                        ignore: ['**/.DS_Store', '**/Thumbs.db']
                    }
                }
            ]
        })
    );
}

module.exports = {
    mode: 'production',
    entry: './src/index.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].[contenthash].js',
        clean: true,
        publicPath: '/flua-web/'
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.lua$/,
                type: 'asset/source'
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        fallback: {
            "path": require.resolve("path-browserify"),
            "fs": false,
            "stream": require.resolve("stream-browserify")
        }
    },
    plugins: plugins,
    optimization: {
        minimize: true,
        splitChunks: {
            chunks: 'all',
            maxInitialRequests: Infinity,
            minSize: 0,
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name(module) {
                        const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
                        return `vendor.${packageName.replace('@', '')}`;
                    }
                }
            }
        }
    },
    performance: {
        hints: false
    }
}; 
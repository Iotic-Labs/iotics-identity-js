const path = require('path');
const nodeExternals = require('webpack-node-externals');

const generalConfig = {
    entry: ['regenerator-runtime/runtime.js', './src/wasm_exec.js', './src/index.js'],
    mode: 'production',
    watchOptions: {
        aggregateTimeout: 600,
        ignored: /node_modules/,
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /(node_modules)/,
            use: 'babel-loader',
        }],
    },
}

const nodeConfig = {
    target: 'node',
    externals: [nodeExternals()],
    output: {
        path: path.resolve(__dirname, './dist/nodejs'),
        filename: 'ioticsIdentity.js',
        globalObject: 'this',
        libraryTarget: 'umd',
        // libraryExport: 'default',
    },
    optimization: {
        minimize: false
    }
};

const browserConfig = {
    entry: './src/index.js',
    target: 'web',
    output: {
        path: path.resolve(__dirname, './dist/browser'),
        filename: 'ioticsIdentity.js',
        library: 'ioticsIdentity',
        libraryTarget: 'umd',
        globalObject: 'this',
        umdNamedDefine: true,
    },
    resolve: {
        fallback: {
            os: require.resolve("os-browserify/browser"),
            util: require.resolve("util/"),
            crypto: require.resolve("crypto-browserify"),
            buffer: require.resolve("buffer/"),
            stream: require.resolve("stream-browserify")
        }
    }

};


module.exports = (env, argv) => {
    if (argv.mode === 'development') {
        generalConfig.devtool = 'cheap-module-source-map';
    }
    // else if (argv.mode === 'production') {
    Object.assign(nodeConfig, generalConfig);
    Object.assign(browserConfig, generalConfig);

    return [nodeConfig, browserConfig];
};

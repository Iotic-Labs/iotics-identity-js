const path = require('path');

module.exports = {
    mode: 'production',
    entry: ['regenerator-runtime/runtime.js', './src/wasm_exec.js', './src/index.js'],
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: 'ioticsIdentity.js',
        library: 'ioticsIdentity',
        libraryTarget: 'umd',
        globalObject: 'this',
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /(node_modules)/,
            use: 'babel-loader',
        }],
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
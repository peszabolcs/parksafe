const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Polyfill for Node.js modules
config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    ...config.resolver.extraNodeModules,
    stream: require.resolve("readable-stream"),
    https: require.resolve("https-browserify"),
    http: require.resolve("stream-http"),
    crypto: require.resolve("crypto-browserify"),
    net: require.resolve("net-browserify"),
    tls: require.resolve("tls-browserify"),
    events: require.resolve("events/"),
    buffer: require.resolve("buffer/"),
    url: require.resolve("url/"),
    zlib: require.resolve("browserify-zlib"),
    util: require.resolve("util/"),
    assert: require.resolve("assert/"),
    process: require.resolve("process/browser"),
    path: require.resolve("path-browserify"),
    os: require.resolve("os-browserify/browser"),
    timers: require.resolve("timers-browserify"),
    vm: require.resolve("vm-browserify"),
    "node-forge": require.resolve("node-forge"),
  },
};

module.exports = config;

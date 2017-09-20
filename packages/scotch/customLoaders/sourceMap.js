require('./sourceMapSupportFork').install({
    handleUncaughtExceptions: false,
    environment: 'node',
    hookRequire: true
});
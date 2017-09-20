module.exports = (env, config) => {
    let result = [];
    // result.push('react', 'react-dom', 'react-helmet');
    result.push('mobx');
    // result.push('mobx-react');
    // result.push('react-router');
    // result.push('react-router-dom');
    if (env.isDev) {
        result.push('mobx-react-devtools');
        if (env.isBrowser) {
            result.push('react-hot-loader/patch');
            result.push(`webpack-dev-server/client?${env.devHost}`)
        } else {
            //result.push('webpack/hot/poll?1000');
        }
    }
    // In browser everything should be bundled
    //__dirname+'/../customLoaders/sourceMap.js',
    config.entry.vendor.push(...result);
};

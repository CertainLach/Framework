const {
    optimize: {
        CommonsChunkPlugin,
        OccurrenceOrderPlugin,
        ModuleConcatenationPlugin
    },
    NormalModuleReplacementPlugin,
    HotModuleReplacementPlugin,
    NamedModulesPlugin,
    DefinePlugin,
    LoaderOptionsPlugin,
    NoEmitOnErrorsPlugin
} = require('webpack');
const ClosureCompilerPlugin = require('webpack-closure-compiler');
const {CheckerPlugin} = require('awesome-typescript-loader');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const AutoPrefixer = require('autoprefixer');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const {StatsWriterPlugin} = require("webpack-stats-plugin");
const ZopfliPlugin = require("zopfli-webpack-plugin");
const FriendlyErrors = require('friendly-errors-webpack-plugin');
const WebpackBuildNotifierPlugin = require('webpack-build-notifier');
const UglifyPlugin = require('uglifyjs-webpack-plugin');
//const ICON = path.join(__dirname, 'icon.png');

module.exports = (env, config) => {
    config.plugins.push(new WebpackBuildNotifierPlugin({
        title: env.projectName,
        suppressSuccess: true
    }));
    // config.plugins.push(new FriendlyErrors({
    //     compilationSuccessInfo: {
    //         messages: ['Well done!']
    //     },
    //     clearConsole: true
    // }));
    config.plugins.push(new DefinePlugin({
        __DEVELOPMENT__: env.isDev,
        __BROWSER__: env.isBrowser,
        __NODE__: env.isNode,
        __SERVER__: env.publicHost===null?'location.origin':'"'+env.publicHost+'"',
        __WS_SERVER__: env.publicHost===null?'location.origin.replace(\'http\',\'ws\')':'"'+env.publicHost.replace('http','ws')+'"',
        'process.env.BROWSER': env.isBrowser,
        'process.env.NODE': env.isNode,
        'process.env.NODE_ENV': JSON.stringify(env.isDev ? 'development' : 'production'),
        'process.env.ENV': JSON.stringify(env.isDev ? 'development' : 'production'),
        ENV: JSON.stringify(env.isDev ? 'development' : 'production'),
        NODE_ENV: JSON.stringify(env.isDev ? 'development' : 'production')
    }));
    config.plugins.push(new NoEmitOnErrorsPlugin());
    config.plugins.push(new OccurrenceOrderPlugin());
    config.plugins.push(new ModuleConcatenationPlugin());
    if(env.isBrowser)
        config.plugins.push(new NormalModuleReplacementPlugin(/^cluster$/,__dirname+'/../stubs/cluster.js'));

    if (env.isBrowser) {
        config.plugins.push(new CommonsChunkPlugin({
            name: 'common',
            children: true,
            minChunks: Infinity,
            filename: `[name].${env.outTargetName}.${env.isUsingHash ? `[hash].` : ''}js`
        }));
    }
    // For dev server
    if (env.isBrowser) {
        config.plugins.push(new HtmlWebpackPlugin({
            filename: 'index.html',
            inject: 'body',
        }));
    }
    // TODO: Get rid of this plugin
    config.plugins.push(new LoaderOptionsPlugin({
        minimize: env.isProd,
        debug: env.isDev,
        options: {
            context: __dirname,
            postcss: [new AutoPrefixer({browsers: ['last 3 versions']})],
        },
    }));
    if (env.isDev) {
        // config.plugins.push(new HotModuleReplacementPlugin());
        config.plugins.push(new NamedModulesPlugin());
    }
    if (env.isBrowser) {
        if (env.isProd) {
            config.plugins.push(new ExtractTextPlugin({
                filename: `[name].${env.outTargetName}.${env.isUsingHash ? `[hash].` : ''}css`
            }));
        }
    }
    config.plugins.push(new StatsWriterPlugin({
        // Different filenames for node and browser
        filename: `stats.${env.outTargetName}.json`,
        // null here = all fields
        fields: null,
        transform(stats) {
            return JSON.stringify(stats, null, 4); // I want to have good idents
        }
    }));
    if (env.isProd) {
        config.plugins.push(new UglifyPlugin({
            // output: {
            //     comments: false
            // },
            sourceMap:true,
            uglifyOptions:{
                comments:false,
                output:{
                    comments:false
                }
            }
            //comments:false,
            //test:/\.[jt]sx?($|\?)/i
            // output: {comments: false},
            // comments:false,
            // compress: {
            //     // Hope internet explorer will die soon :D
            //     'screw_ie8': true,
            //     'warnings': false,
            //     'unused': true,
            //     // Treeshake
            //     'dead_code': true,
            // }
        }));
        if(env.isBrowser)
            config.plugins.push(new ZopfliPlugin({
                asset: "[path].gz[query]",
                algorithm: "zopfli",
                threshold: 0,
                minRatio: 0
            }));
    }
};

const ExtractTextPlugin = require('extract-text-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const CssTreeShakingPlugin = require("webpack-css-treeshaking-plugin");
const BabiliPlugin = require('babili-webpack-plugin');
const PackerPlugin = require('packer-webpack-plugin');

const {join, normalize} = require('path');
const {writeFileSync, existsSync, readFileSync} = require('fs');

function createCssLoadersPipeline(env, isModules) {
    const pipelineStart=[{
        loader: env.isBrowser?'css-loader':'css-loader/locals',
        query: {
            modules: isModules,
            sourceMap: true,
            camelCase: isModules,
            minimize: env.isProd,
            localIdentName: env.isDev ? '[local]-[hash:base64:5]' : '[hash:base64:5]'
        }
    }, {
        loader: 'postcss-loader',
        options: {
            plugins: []
        }
    }, {
        // less is a extension to css, so it would work perfectly
        loader: "less-loader"
    }];
    if(env.isNode)
        return pipelineStart;
    if(env.isDev)
        return [{
            loader: 'style-loader'
        }, ...pipelineStart];
    return ExtractTextPlugin.extract({
        use: pipelineStart,
        fallback: "style-loader"
    });
}
let cssLoader = (env, config) => {
    config.resolve.extensions.push('.less', '.css');
    config.module.rules.push({
        test: /\.(css|less)$/,
        exclude: /node_modules/,
        loader: createCssLoadersPipeline(env, true)
    });
    if(env.isNode&&env.isDev)
        config.module.rules.push({
            test:  /\.(css|less)$/,
            include: /node_modules/,
            use:'null-loader'
        });
    else{
        config.module.rules.push({
            test: /\.(css|less)$/,
            include: /node_modules/,
            loader: createCssLoadersPipeline(env, false)
        });
    }
    config.plugins.push(new CssTreeShakingPlugin());
};

let typescriptLoader = (env, config) => {
    // let json = JSON.stringify({
    //     transpileOnly: env.isCheckingDisabled,
    //     compilerOptions: {
    //
    //         target: 'es6',
    //         module: "es2015",
    //         moduleResolution: "node",
    //         emitDecoratorMetadata: true,
    //         experimentalDecorators: true,
    //         allowSyntheticDefaultImports: true,
    //         sourceMap: true,
    //         noEmit: false,
    //         "jsx": "preserve",
    //         noEmitHelpers: false,
    //         importHelpers: false,
    //         strictNullChecks: false,
    //         allowUnreachableCode: true,
    //         lib: [
    //             "ES5",
    //             "ES6",
    //             "ES2015",
    //             "ES7",
    //             "ES2016",
    //             "ES2017",
    //             "ESNext"
    //         ],
    //         allowJs: true,
    //         typeRoots: [
    //             normalize(env.projectBaseDir + "/node_modules/@types")
    //         ],
    //         types: [
    //             "node",
    //             "react"
    //         ],
    //         baseUrl: join(env.projectBaseDir),
    //         paths: {
    //             "*": [
    //                 "*",
    //                 normalize(env.projectBaseDir + "/node_modules/*"),
    //                 ...env.resolveRoots.map(root => root + '/*').map(normalize)
    //             ]
    //         }
    //     }
    // }, null, 4);
    // writeFileSync(join(env.projectBaseDir, 'tsconfig.json'), json);
    let result = [];
    // Hot reloading of react components
    // if (env.isBrowser && env.isDev && env.isReact)
    //     result.push({
    //         loader: 'react-hot-loader/webpack'
    //     });
    result.push(
        // {
        //     loader: 'thread-loader',
        //     options: {
        //         // there should be 1 cpu for the fork-ts-checker-webpack-plugin
        //         workers: Math.round(require('os').cpus().length / 4),
        //     },
        // },
        {
            loader: 'babel-loader',
            options: {
                "presets":[[require('babel-preset-env'),{
                    "targets": {
                        "browsers": ">5%",
                        "node": "current"
                    },
                    modules:false,

                }],require('babel-preset-typescript')],
                "plugins": [
                    require('babel-plugin-transform-object-rest-spread'),
                    require('babel-plugin-transform-class-properties')
                ]
            }
        }
        /*,
        {
            loader: 'ts-loader',
            options: {
                //happyPackMode: true, // IMPORTANT! use happyPackMode mode to speed-up compilation and reduce errors reported to webpack
            }
        }*/
    );
    if(env.isProd) {
        // config.plugins.push(new BabiliPlugin({},{
        //     comments:false,
        //     test:/\.[jt]sx?($|\?)/i,
        //     sourceMap:true,
        //
        //
        // }));
        //config.plugins.push(new PackerPlugin());
    }
    config.resolve.extensions.push('.jsx', '.tsx', '.js', '.ts');
    config.module.rules.push({
        test: /\.[jt]sx?$/i,
        use: result,
    });
    // if (!env.isCheckingDisabled)
    //     config.plugins.push(new ForkTsCheckerWebpackPlugin());
};

let assetLoader = (env, config) => {
    config.resolve.extensions.push('.png', '.jpg', '.otf', '.gif', '.jpeg', '.svg', '.ttf', '.woff', '.eot', '.woff2');
    config.module.rules.push({
        test: /\.(png|jpg|otf|gif|jpeg|svg|ttf|woff|eot|woff2)$/,
        use: {
            loader: 'url-loader',
            query: {
                limit: 8192
            }
        }
    });
};

let pdsLoader = (env, config) => {
    config.resolve.extensions.push('.pds');
    config.module.rules.push({
        test: /\.(pds)$/,
        loader: [join(__dirname, '../customLoaders/protodefLoader')]
    });
};

module.exports = (env, config) => {
    typescriptLoader(env, config);
    cssLoader(env, config);
    assetLoader(env, config);
    pdsLoader(env, config);
};

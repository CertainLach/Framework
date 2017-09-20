import {join,normalize,relative,resolve} from 'path';

const NONE=Symbol('none');
function clearNone(from:any){
    if(from instanceof Array){
        return from.filter(e=>e!==NONE).map(clearNone);
    }else if(from instanceof Object){
        let resObj:any={};
        for(let key of from){
            let value=from[key];
            if(value!==NONE)
                resObj[key]=clearNone(value);
        }
        return resObj;
    }else{
        return from;
    }
}

export interface IBuildConfig{
    env: 'production'|'development',
    for: 'web'|'node'|'webworker',
    projectName: string,
    entryPoint: string,
    resolveRoots: string[],
    outTargetName: string,
    useHash: boolean,
    outputDirPath: string,
    projectBaseDir: string,
    moduleAliases: {[key:string]:string},
    
    externals: string[]
}

export default function mkConfig(config:IBuildConfig){

    let webpackConfig=clearNone({
        target: config.for,
        node: {
            __dirname: false,
            __filename: false,
        },
        module: {
            rules: [{
                test: /\.(png|jpg|otf|gif|jpeg|svg|ttf|woff|eot|woff2)$/,
                use: {
                    loader: 'url-loader',
                    query: {
                        limit: 16384
                    },
                    fallback: 'file-loader'
                }
            }]
        },
        devtool: 'source-map',
        entry: {
            main: config.entryPoint,
            vendor: [
                config.for==='node'?'source-map-support/register':NONE
            ]
        },
        resolve: {
            alias: {
                ...config.moduleAliases
            },
            extensions: [
                '.jsx', '.tsx', '.js', '.ts', '.json', '.yml', '.xml'
            ],
            modules: [
                ...config.resolveRoots.map(root=>join(config.projectBaseDir,root)),
                join(config.projectBaseDir,'node_modules')
            ].map(normalize)
        },
        output: {},
        plugins: [],
        externals: [
            ...config.externals.map(external=>resolve(config.projectBaseDir, external))
        ],
        cache: true,
        watchOptions: {
            // Argh
            aggregateTimeout: 0
        },
        stats: 'none'

    });
    return webpackConfig;
}
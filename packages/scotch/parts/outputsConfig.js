const {join} = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports=(env, config)=>{
    // In browser everything should be bundled
    config.output.filename = `[name].${env.outTargetName}.${env.isUsingHash?`[hash].`:''}js`;
    config.output.sourceMapFilename = `[name].${env.outTargetName}.${env.isUsingHash?`[hash].`:''}map.js`;
    config.output.path = env.outputDirPath;
    config.output.chunkFilename =`chunk[id].${env.outTargetName}.${env.isUsingHash?'[chunkhash].':''}js`;
    config.output.jsonpFunction = `${env.outTargetName}ChunkLoadingCallback`;
    config.output.pathinfo = true;
    config.output.hotUpdateMainFilename=`hot.[hash].${env.outTargetName}.json`;
    config.output.hotUpdateChunkFilename=`hot[id].[hash].${env.outTargetName}.js`;
    config.output.devtoolModuleFilenameTemplate= "[resource-path]";
    config.output.devtoolFallbackModuleFilenameTemplate = "[resource-path]?[loaders]";
    if(env.isNode){
        config.output.libraryTarget = 'commonjs';
    }else{
        config.output.publicPath = '/';
    }
};

const gulp = require('gulp');
const cp = require('child_process');
const ts = require('gulp-typescript');
const { series, parallel, src, dest } = gulp;
const sourcemaps = require('gulp-sourcemaps');
const clean = require('gulp-clean-fix');
const rename = require('gulp-rename');

const tsJsProject = ts.createProject('./tsconfig.json');
exports.compileJs = () => src('./packages/**/*.ts')
    .pipe(sourcemaps.init())
    .pipe(tsJsProject())
    .on('error', () => { })
    .pipe(sourcemaps.write())
    .pipe(dest('./packages'));
const tsMjsProject = ts.createProject('./tsconfig.mjs.json');
exports.compileMjs = () => src('./packages/**/*.ts')
    .pipe(sourcemaps.init())
    .pipe(tsMjsProject())
    .on('error', () => { })
    .pipe(sourcemaps.write())
    .pipe(rename((path) => {
        path.extname = path.extname.replace('js', 'mjs');
    }))
    .pipe(dest('./packages'));
exports.compile = parallel(exports.compileJs, exports.compileMjs);
exports.clean = () => src(['./packages/**/*.js', './packages/**/*.d.ts', '!./packages/*/node_modules/**'], { read: false })
    .pipe(clean())
exports.default = series(exports.clean, exports.compile);

# ARGV
Argument parser with automatic help generation

## Example
```js
import ArgParser from '@meteor-it/argv';

const parser = new ArgParser('NAME');

parser.command('command1')
    .callback(opts=>{
        console(opts.option);
    })
    .help("Useful command");

parser.command('sanity')
    .option('file', {
        abbr: 'f',
        help: 'Awesome file'
    })
    .option('config', {
        abbr: 'c',
        default: 'awesomeConfigFile.json',
        help: 'Useful config'
    })
    .callback(opts=> {
        console.log(opts.filename);
    })
    .help("Another useful command");

parser.help('Very useful CLI tool');
parser.parse(process.argv);

```
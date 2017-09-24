# FS
Wrapper around node.js native fs library.
Have same methods as fs, but promisified

## Addictional methods
### walkDir(dir, cb)
Asynchonously walks directory.
Returns file list when done, cb is called when any directory was discovered
```js
let filesAwaited = [];
let filesCont = [];
filesAwaited = await walkDir(__dirname, (file)=>{
    filesCont.push(file);
});

// filesAwaited will be same as filesCont
```
### exists(file)
Returns true if file exists

### isFile(file)
Returns true if 'file' is file

### isDirectory(file)
Returns true if 'file' is directory

### getReadStream/getWriteStream
Same as fs.createReadStream/fs.createWriteStream
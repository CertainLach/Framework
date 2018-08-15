import {Readable} from 'stream';

// hello, world => Hello, world!
export function firstUppercase(str:string):string {
    return str.substr(0,1).toUpperCase()+str.substr(1);
}
export function objectEquals(x:any, y:any):boolean {
    if (x === null || x === undefined || y === null || y === undefined) {
        return x === y;
    }
    if (x.constructor !== y.constructor) {
        return false;
    }
    if (x instanceof Function) {
        return x === y;
    }
    if (x instanceof RegExp) {
        return x === y;
    }
    if (x === y || x.valueOf() === y.valueOf()) {
        return true;
    }
    if (Array.isArray(x) && x.length !== y.length) {
        return false;
    }
    if (x instanceof Date) {
        return false;
    }
    if (!(x instanceof Object)) {
        return false;
    }
    if (!(y instanceof Object)) {
        return false;
    }

    let p = Object.keys(x);
    return Object.keys(y).every(i => p.indexOf(i) !== -1) && p.every(i => objectEquals(x[i], y[i]));
}
export function flatten(array:any[], result:any[] = []):any[] {
    if (!(array instanceof Array)) throw new TypeError('"array" argument is not a array!');
    for (let i = 0; i < array.length; i++) {
        const value = array[i];

        if (Array.isArray(value)) {
            flatten(value, result);
        }
        else {
            result.push(value);
        }
    }

    return result;
}
export function removeDuplicates<T>(array:T[]):T[] {
    if (!(array instanceof Array)) throw new TypeError('"array" argument is not a array!');
    return Array.from(new Set(array));
}
export function mix(array1:any[]|any, array2:any[]|any):any {
    //if (!(array1 instanceof Array) || !!(array2 instanceof Array)) throw new TypeError('One of arguments is not a array! ('+(typeof array1)+', '+(typeof array2)+')');
    if (typeof array1 !== typeof array2) throw new TypeError('Both arguments must have same types!');
    let out:any;
    if (array1 instanceof Array) {
        out = [];
        for (let index in array1) {
            // noinspection JSUnfilteredForInLoop
            out.push([array1[index], array2[index]]);
        }
        return out;
    }else if(array1 instanceof Object){
        out={};
        for(let key in array1){
            // noinspection JSUnfilteredForInLoop
            out[key]=array1[key];
        }
        for(let key in array2){
            // noinspection JSUnfilteredForInLoop
            out[key]=array2[key];
        }
        return out;
    }else{
        throw new TypeError('Unknown input type!');
    }

}
export function createPrivateEnum(...values:string[]):{[key:string]:Symbol} {
    let returnObj:any = {};
    values.map(value => value.toUpperCase());
    values.forEach(value => returnObj[value] = Symbol(value));
    return returnObj;
}
export function fixLength(string:string, length:number, insertPre = false, symbol = ' ') {
    return insertPre?string.padStart(length,symbol):string.padEnd(length,symbol);
}

declare global {
    // noinspection JSUnusedGlobalSymbols
    interface ObjectConstructor {
        values(object:any):any;
    }
}
export function objectMap(object:any,cb:(a:any,b:any,c:any)=>any):any{
    let ret = [];
    let keys=Object.keys(object);
    let values=Object.values(object);
    for(let i=0;i<keys.length;i++)
        ret.push(cb(values[i],keys[i],object));
    return ret;
}
export function arrayKVObject(keys:string[],values:any[]):any{
    let len=keys.length;
    if(len!==values.length)
        throw new Error('Both arrays must have same length!');
    let result:any={};
    for(let i=0;i<len;i++)
        result[keys[i]]=values[i];
    return result;
}
export function sleep (time:number):Promise<void> {
	return new Promise((res) => {
		setTimeout(res, time);
	});
}

/**
 * Like iterable.map(cb),
 * but cb can be async
 * @param iterable Array to process
 * @param cb Function to do with each element
 */
export function asyncEach<T,R>(iterable:T[], cb:(v:T)=>Promise<R>):R[] {
	let waitings:any = [];
	iterable.forEach(iter => {
		waitings.push(cb(iter));
	});
	return <any>Promise.all(waitings);
}

/**
 * Convert callback function to async
 * @param cbFunction Function to convert
 */
export function cb2promise (cbFunction:any):(...d:any[])=>Promise<any> {
	return (...args) => {
		return new Promise((res, rej) => {
			cbFunction(...args, (err:Error, result:any) => {
				if (err) return rej(err);
				res(result);
			});
		});
	};
}

export function hashCode(s:string){
    let hash = 0;
    if (s.length === 0) return hash;
    for (let i = 0; i < s.length; i++) {
        let character = s.charCodeAt(i);
        hash = ((hash<<5)-hash)+character;
        hash = hash & hash;
    }
    return hash;
}
export function djb2Code(str:string){
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        let char = str.charCodeAt(i);
        hash = ((hash << 5) + hash) + char; /* hash * 33 + c */
    }
    return hash;
}
export function sdbmCode(str:string){
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        let char = str.charCodeAt(i);
        hash = char + (hash << 6) + (hash << 16) - hash;
    }
    return hash;
}
export function loseCode(str:string){
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash += str.charCodeAt(i);
    }
    return hash;
}

export function encodeHtmlSpecials(str:string){
    let i = str.length;
    let aRet = [];

    while (i--) {
        let iC = str[i].charCodeAt(0);
        if (iC < 65 || iC > 127 || (iC>90 && iC<97)) {
            aRet[i] = '&#'+iC+';';
        } else {
            aRet[i] = str[i];
        }
    }
    return aRet.join('');
}

export function createReadStream(object:Buffer, options = {}):MultiStream {
    return new MultiStream(object, options);
}

export function readStream(stream:Readable): Promise<Buffer> {
    return new Promise((res, rej) => {
        const bufs:any = [];
        stream.on('data', d => {
            bufs.push(d);
        });
        stream.on('end', () => {
            let buf = Buffer.concat(bufs);
            res(buf);
        });
        stream.on('error',rej);
    });
}

export interface IMultiStreamOptions {
    highWaterMark?: number;
    encoding?: string;
}

export class MultiStream extends Readable {
    _object:Buffer;
    constructor(object:Buffer, options:IMultiStreamOptions = {}) {
        if (object instanceof Buffer || typeof object === 'string') {
            super({
                highWaterMark: options.highWaterMark,
                encoding: options.encoding
            });
        }
        else {
            super({
                objectMode: true
            });
        }
        this._object = object;
    }

    _read() {
        this.push(this._object);
        this._object = null;
    }
}

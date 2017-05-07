let isBrowserFn=new Function("try {return this===window;}catch(e){ return false;}");
let isNodeFn=new Function("try {return this===global;}catch(e){return false;}");

export const isBrowser = isBrowserFn();
export const isNode = isNodeFn();

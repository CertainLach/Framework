declare function requestAnimationFrame(func);
declare function cancelAnimationFrame(id);

export type ICallable = ()=>void;
export type IId = any;

export const timerMixin = BaseClass => class TimerMixin extends BaseClass {
    timeouts=[];
    intervals=[];
    immediates=[]
    rafs=[];

    setTimeout(func:ICallable,ms:number):IId{
        let id=setTimeout(func,ms);
        this.timeouts.push(id);
        return id;
    }
    clearTimeout(id:IId){
        let index = this.timeouts.indexOf(id);
        if (index !== -1) 
            this.timeouts.splice(index, 1);
        clearTimeout(id);
    }
    setInterval(func:ICallable,ms:number):IId{
        let id=setInterval(func,ms);
        this.intervals.push(id);
        return id;
    }
    clearInterval(id:IId){
        let index = this.intervals.indexOf(id);
        if (index !== -1) 
            this.timeouts.splice(index, 1);
        clearInterval(id);
    }
    setImmediate(func:ICallable):IId{
        let id=setImmediate(func);
        this.immediates.push(id);
        return id;
    }
    clearImmediate(id:IId){
        let index = this.immediates.indexOf(id);
        if (index !== -1) 
            this.immediates.splice(index, 1);
        clearImmediate(id);
    }
    requestAnimationFrame(func:ICallable):IId{
        let id=requestAnimationFrame(func);
        this.rafs.push(id);
        return id;
    }
    cancelAnimationFrame(id:IId){
        let index = this.rafs.indexOf(id);
        if (index !== -1) 
            this.rafs.splice(index, 1);
        cancelAnimationFrame(id);
    }

    clearAll(){
        this.timeouts.forEach(id=>clearTimeout(id));
        this.timeouts=[];
        this.intervals.forEach(id=>clearInterval(id));
        this.intervals=[];
        this.immediates.forEach(id=>clearImmediate(id));
        this.immediates=[];
        this.rafs.forEach(id=>cancelAnimationFrame(id));
        this.rafs=[];
    }
}

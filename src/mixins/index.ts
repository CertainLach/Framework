export type ICallable = ()=>void;
export type IId = any;
declare var setTimeout:any;
declare var clearTimeout:any;
declare var setInterval:any;
declare var clearInterval:any;
declare var setImmediate:any;
declare var clearImmediate:any;
declare var requestAnimationFrame:any;
declare var cancelAnimationFrame:any;

type TimerExtension<T> = T&{
    setTimeout(func:ICallable,ms:number):IId;
    clearTimeout(id:IId):void;
    setInterval(func:ICallable,ms:number):IId;
    clearInterval(id:IId):void;
    setImmediate(func:ICallable):IId;
    clearImmediate(id:IId):void;
    requestAnimationFrame(func:ICallable):IId;
    cancelAnimationFrame(id:IId):void;
    clearAll():void;
}
export function timerMixin<T>(BaseClass:T):TimerExtension<T>{
    const BaseClassO:{new (...a:any[]):any}=<any>BaseClass;
    return <any>class TimerMixin extends BaseClassO {
        timeouts:any[]=[];
        intervals:any[]=[];
        immediates:any[]=[];
        rafs:any[]=[];
    
        setTimeout(func:ICallable,ms:number):IId{
            let id=setTimeout(func,ms);
            this.timeouts.push(id);
            return id;
        }
        clearTimeout(id:IId):void{
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
        clearInterval(id:IId):void{
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
        clearImmediate(id:IId):void{
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
        cancelAnimationFrame(id:IId):void{
            let index = this.rafs.indexOf(id);
            if (index !== -1) 
                this.rafs.splice(index, 1);
            cancelAnimationFrame(id);
        }
    
        clearAll():void{
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
}
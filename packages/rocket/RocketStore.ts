import {toJS,IReactionDisposer,autorun} from 'mobx';
import {enumerable} from '@meteor-it/decorators';
import remotedev from 'mobx-remotedev';
import {timerMixin,ICallable,IId} from '@meteor-it/mixins';
import {create} from 'mobx-persist';


export type IStoreList = {[key:string]:RocketStore};
class Empty{};
export default class RocketStore extends timerMixin(Empty) {
    // @enumerable(false)
    storeName: string = null;
    // @enumerable(false)
    isClientSide: boolean = null;
    get isServerSide(): boolean{
        if(this.isClientSide===null){
            return null;
        }
        return !this.isClientSide;
    }

    // @enumerable(false)
    dehydrationRequired: boolean;

    // @enumerable(false)
    stores:IStoreList;

    constructor(stores:IStoreList, dehydrationRequired:boolean) {
        super();
        this.stores=stores;
        this.dehydrationRequired = dehydrationRequired;
    }

    // @enumerable(false)
    runningAutorunDisposer: IReactionDisposer = null;
    autorun?():void;

    onBeforeRehydrate() {

    }

    onAfterRehydrate() {

    }

    onBeforeDehydrate() {

    }

    onAfterDehydrate() {

    }

    onInit(){

    }
    onDeinit(){

    }

    setSide(isClientSide:boolean|null){
        this.isClientSide=isClientSide;
    }
    dehydrate():null|any{
        if(this.isClientSide===null)
            throw new Error('Cannot dehydrate while side is not set!');
        if(!this.dehydrationRequired)
            return null;
        this.onBeforeDehydrate();
        if(this.runningAutorunDisposer!==null&&this.autorun){
            this.runningAutorunDisposer();
            this.runningAutorunDisposer=null;
        }
        this.onDeinit();
        (<any>this).clearAll();
        let ret = toJS(this, false);
        // From timer mixin
        delete (<any>ret).timeouts;
        delete (<any>ret).intervals;
        delete (<any>ret).immediates;
        delete (<any>ret).rafs;
        // Normal
        delete ret.runningAutorunDisposer;
        delete ret.dehydrationRequired;
        delete ret.isClientSide;
        delete ret.stores;
        delete ret.storeName;
        this.onAfterDehydrate();
        return ret;
    }
    rehydrate(data:any){
        if(this.isClientSide===null)
            throw new Error('Cannot rehydrate while side is not set!');
        if(!this.dehydrationRequired)
            return;
        this.onBeforeRehydrate();
        for (const hydratedKey in data) {
            (<any>this)[hydratedKey] = data[hydratedKey];
        }
        this.onInit();
        if(this.runningAutorunDisposer===null&&this.autorun){
            this.runningAutorunDisposer=autorun(this.autorun.bind(this));
        }        
        this.onAfterRehydrate();
        if(this.isClientSide)
            remotedev(this,{
                name:this.constructor.name||'Unnamed'
            });
    }
}
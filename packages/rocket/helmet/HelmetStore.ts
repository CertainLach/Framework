import Store from '../stores/store';
import HelmetDataInstance, { HtmlSafeTag, HtmlSafeTagWithBody } from './HelmetDataInstance';

function elementFromTag(name:string,tag:HtmlSafeTag|HtmlSafeTagWithBody):Element{
    let elem = document.createElement(name);
    for(let key in tag.props){
        elem.setAttribute(key,tag.props[key]);
    }
    if((tag as any).body){
        elem.innerHTML=(tag as any).body;
    }
    return elem;
}
function recreateTags(el:Element,type:string,list:(HtmlSafeTag|HtmlSafeTagWithBody)[],applied:Element[]){
    if(list.length>0){
        for(let i=0;i<list.length;i++){
            applied.push(el.appendChild(elementFromTag(type,list[i])));
        }
    }
}
function removeAllChildren(el:Element,children:Element[]){
    for(let child of children){
        el.removeChild(child);
    }
}

function rewriteAttrs(el:Element, attrs:{[key:string]:string}){
    if(attrs===undefined||attrs===null)
        attrs = {};
    for(let attrName in attrs)
        el.setAttribute(attrName,attrs[attrName]);
    if(el.attributes.length===0)return;
    for(let attr of [...(el as any).attributes]){
        if(!(attr.name in attrs))
            el.removeAttribute(attr.name);
    }
}

export default class HelmetStore extends Store{
    static id = '$$helmet';
    instances: HelmetDataInstance[] = [];
    cleanedSsrData: boolean = false;
    appliedHead: Element[] = [];
    appliedBody: Element[] = [];
    addInstance(helmet: HelmetDataInstance){
        this.instances.push(helmet);
    }
    removeInstance(helmet: HelmetDataInstance){
        this.instances.splice(this.instances.indexOf(helmet),1);
    }
    forceUpdate(){
        
        if(process.env.BROWSER){
            // Safer way to change title without touching title node itself
            // (It is still touched internally, but we don't care)
            document.title = this.fullTitle;

            // Store added elements on client side
            let appliedHead:any = [];
            let appliedBody:any = [];
            this.instances.forEach(instance=>{
                recreateTags(document.head,'meta',instance.meta,appliedHead);
                recreateTags(document.head,'link',instance.link,appliedHead);
                recreateTags(document.head,'style',instance.style,appliedHead);
                recreateTags(document.body,'script',instance.script,appliedBody);
            });

            removeAllChildren(document.head,this.appliedHead);
            removeAllChildren(document.body,this.appliedBody);
            this.appliedHead=appliedHead;
            this.appliedBody=appliedBody;

            rewriteAttrs(document.body.parentElement,this.htmlAttrs.props);
            rewriteAttrs(document.body,this.bodyAttrs.props);

            // Remove all SSR elements, since client data is applied already
            if(!this.cleanedSsrData){
                removeAllChildren(document.head,this.ssrData.rht.reverse().map(e=>document.head.children[e]));
                removeAllChildren(document.body,this.ssrData.rbt.reverse().map(e=>document.body.children[e]));
                delete this.ssrData;
                this.cleanedSsrData = true;
            }
        }
        // No need to do anything on server
    }
    

    // Page title
    titleTemplate:null|((title:string)=>string) = null;

    ssrData:{rht:number[],rbt:number[],preloadModules:number[]} = {
        rht: [],
        rbt: [],
        preloadModules: []
    };
    
    get title(){
        for(let i=this.instances.length-1;i>=0;i--){
            if(this.instances[i].title!==null){
                return this.instances[i].title;
            }
        }
        return 'null';
    }

    get fullTitle(){
        if(this.titleTemplate===null){
            return this.title;
        }
        return this.titleTemplate(this.title);
    }

    get meta(){
        return [].concat(...this.instances.map(i=>i.meta).filter(m=>m!==null));
    }

    get link(){
        return [].concat(...this.instances.map(i=>i.link).filter(m=>m!==null));
    }

    get htmlAttrs(){
        return Object.assign({},...this.instances.map(i=>i.htmlAttrs));
    }

    get bodyAttrs(){
        return Object.assign({},...this.instances.map(i=>i.bodyAttrs));
    }

    get script(){
        return [].concat(...this.instances.map(i=>i.script).filter(m=>m!==null)); 
    }

    get style(){
        return [].concat(...this.instances.map(i=>i.style).filter(m=>m!==null)); 
    }

    async init(){
        // TODO: Get rid of this costyl
        if(process.env.NODE_ENV==='development'&&process.env.BROWSER){
            this.ssrData=(window as any).__SSR_STORE__.helmet.ssrData;
        }
    }
}
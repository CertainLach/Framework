import RocketStore from '../RocketStore';
import {observable, computed, action} from 'mobx';

declare const document;

export default class HeaderStore extends RocketStore{
    constructor(defaultSiteName,defaultPageName){
        super(null,true);
        this.siteName=defaultSiteName;
        this.pageName=defaultPageName;
    }

    @observable pageName:string;
    @observable siteName:string;
    @observable description:string='';
    @observable keywords:string[]=[];
    @observable metaTags:any[]=[];

    @computed get title(){
        return `${this.siteName} - ${this.pageName}`;
    }

    @action
    setSiteName(siteName){
        this.siteName=siteName;
    }
    
    @action
    setPageName(pageName:string){
        this.pageName=pageName;
    }

    autorun(){
        if(this.isClientSide){
            document.title = this.title;
            (document.querySelector("meta[name='description']") as any).content = this.description;
            (document.querySelector("meta[name='keywords']") as any).content = this.keywords.join(',');
            
        }
    }
}
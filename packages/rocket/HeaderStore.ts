import Store from './Store';
import {observable, computed, action} from "./mobx";

export default class HeaderStore extends Store{
    @observable pageName:string;
    @observable pageNameTemplate:string;
    @observable description:string='';
    @observable keywords:string[]=[];

    @computed get title(){
        return this.pageNameTemplate.replace('%s',this.pageName);
    }

    @action
    setPageName(pageName:string){
        this.pageName=pageName;
    }
    @action
    setTemplate(pageNameTemplate){
        if(!pageNameTemplate.includes('%s'))
            throw new Error('page name template doesn\'t includes placeholder (%s)!');
        this.pageNameTemplate=pageNameTemplate;
    }

    constructor(pageNameTemplate = 'Unnamed - %s',defaultPageName){
        super(true);
        if(!pageNameTemplate.includes('%s'))
            throw new Error('page name template doesn\'t includes placeholder (%s)!');
        this.pageName=defaultPageName;
        this.pageNameTemplate=pageNameTemplate;
    }
    autorun(){
        if(this.isClientSide){
            document.title = this.title;
            (document.querySelector("meta[name='description']") as any).content = this.description;
            (document.querySelector("meta[name='keywords']") as any).content = this.keywords.join(',');
        }
    }
}
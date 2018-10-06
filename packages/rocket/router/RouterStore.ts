import Store from '../stores/store';
import { observable } from '../reactive';

export default class RouterStore extends Store{
    query: {[key:string]:string};
    path: string;
}
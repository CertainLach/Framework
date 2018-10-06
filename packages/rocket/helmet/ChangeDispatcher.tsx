import {Component} from 'inferno';
import HelmetDataInstance from './HelmetDataInstance';
import { inject } from '../reactive';
import { IDefaultStores } from '../stores';

@inject('helmet')
export class ChangeDispatcher extends Component<{data:HelmetDataInstance}&IDefaultStores>{
    rendered = false;
    helmetDataInstance: HelmetDataInstance|null = null;
    componentDidUpdate(){
        this.props.helmet.forceUpdate();
    }
    componentWillUnmount(){
        this.props.helmet.removeInstance(this.helmetDataInstance);
        this.props.helmet.forceUpdate();
    }
    render():null{
        if(this.rendered){
            for(let key of Object.getOwnPropertyNames(this.helmetDataInstance))
                (this.helmetDataInstance as any)[key] = null;
            for(let key of Object.getOwnPropertyNames(this.props.data))
                (this.helmetDataInstance as any)[key] = (this.props.data as any)[key];
            this.props.helmet.forceUpdate();
            return null;
        }
        if(this.helmetDataInstance===null)
            this.helmetDataInstance = {...this.props.data};
        this.rendered = true;
        this.props.helmet.addInstance(this.helmetDataInstance);
        this.props.helmet.forceUpdate();
        return null;
    }
}
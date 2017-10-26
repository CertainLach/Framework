import {boxed,IObservableValue,observer} from './mobx';
import RocketComponent from './RocketComponent';
import {r} from './r';

export class Input extends RocketComponent<{value:IObservableValue<string>}>{
    render(){
        let {value} = this.props;
        return r('input',{
            value:value.get(),
            onChange(t){
                value.set(t.target.value)
            }
        })
    }
}

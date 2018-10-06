import { Component } from 'inferno';
import { inject } from '../reactive';
import { IDefaultStores } from '../stores';
import hoistStatics from 'hoist-non-inferno-statics';

export default function withStyles(...styles: IIsomorphicStyleLoaderMethods[]) {
    return (InnerComponent:any) => {
        @inject('isomorphicStyleLoader')
        class StyledComponent extends Component<IDefaultStores> {
            private removeCss: any;
            static displayName: string;
            componentWillMount(){
                this.props.isomorphicStyleLoader.insertCss(...styles);
            }
            componentWillUnmount(){
                if(this.removeCss){
                    setTimeout(this.removeCss, 0);
                }
            }

            render() {
                return <InnerComponent {...this.props} />;
            }
        };
        return hoistStatics(StyledComponent, InnerComponent);
    };
}
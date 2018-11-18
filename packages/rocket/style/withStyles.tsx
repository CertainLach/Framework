import { Component } from 'react';
import { inject } from '../reactive';
import { IDefaultStores } from '../stores';
import * as hoistStatics from 'hoist-non-react-statics';
import * as React from 'react';
import { IReactComponent } from 'mobx-react';

export default function withStyles(...styles: any[]) {
    return (InnerComponent:IReactComponent) => {
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
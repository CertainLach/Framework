import { Router, Route, IndexRoute, RouterContext, match, doAllAsyncBefore } from 'inferno-router';
import {renderToString} from 'inferno-server';
import createBrowserHistory from 'history/createBrowserHistory';
import createMemoryHistory from 'history/createMemoryHistory';
import { RouterStore, syncHistoryWithStore } from './RouterStore';
import {action, observable, observe, connect,observer, Provider} from './mobx';


function createRenderer(isClient:boolean=false,storesCreator:()=>any,RootComponent){
    let stores=storesCreator();
    if(!(stores.router instanceof RouterStore))
        throw new Error('stores.router must be instance of RouterStore');
    let linkHistory=isClient?createBrowserHistory():createMemoryHistory();

    const history = syncHistoryWithStore(linkHistory, stores.router);
    const root=<Provider {...stores}>
        <Router history={history}>
            <RootComponent />
        </Router>
    </Provider>;
}
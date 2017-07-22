import Logger from '@meteor-it/logger';
import {Component} from 'react';
import {Connection} from 'rethinkdb-websocket-server/Connection';
import {QueryValidator} from 'rethinkdb-websocket-server/QueryValidator';
import {decorate as decorateWithMixin} from 'react-mixin';
import ReactRethinkdb,{DefaultMixin,r} from 'react-rethinkdb';

export function connectRethink(socketUrl,database,reconnectInterval,observe){
    return (WrappedComponent)=>decorateWithMixin(DefaultMixin)(class RethinkConnectedComponent extends Component {
        static displayName = `RethinkWrapped${WrappedComponent.name}`;
        observe(props, state) {
            return observe(ReactRethinkdb,r,this);
        }
        render(){
            return (<WrappedComponent {...this.props} data={this.data} socketState={this.state.socketState} socket={this.state.socket}/>);
        }
    });
}

export class RethinkDBServer {
    logger;
    queryValidator;
    constructor(name){
        this.logger=new Logger(name);
    }
    whitelist=[];
    allow(condition){
        this.whitelist.push(condition);
        return this;
    }
    deny(){
        throw new Error('Only whitelist left for security reasons!');
    }
    initialized=false;
    initializeRethink(rethinkdbConfig){
        if(!rethinkdbConfig)
            throw new Error('RethinkDB config is not provided!');
        if(!rethinkdbConfig.servers)
            throw new Error('RethinkDB config.servers is not provided!');
        // TODO: Balance between multiple servers?
        if(!rethinkdbConfig.servers[0])
            throw new Error('No one RethinkDB server was provided!');
        let rethinkDbServer = rethinkdbConfig.servers[0];
        if(rethinkDbServer.ssl)
            throw new Error('No SSL is supported! Listen db only on localhost, it is more secure!');
        if(!rethinkDbServer.host||!rethinkDbServer.port)
            throw new Error('No host/port is defined in RethinkDB server config!');
        this.rethinkDbServer=rethinkDbServer;
        // https://github.com/mikemintz/rethinkdb-websocket-server/blob/master/src/index.js
        // But suitable for xpress.js
        let unsafelyAllowAnyQuery=false;
        if(this.whitelist.length===0){
            this.logger.warn('No whitelist entitys are defined! Every call will be allowed!');
            unsafelyAllowAnyQuery=true;
        }
        this.queryValidator = new QueryValidator({
            queryWhitelist:this.whitelist,
            unsafelyAllowAnyQuery,
            loggingMode:'all'
         });
         this.initialized=true;
    }
    handle(req,socket){
        // Session validation will be done with middlewares.
        // But allow user to use req object for validation while validating queries
        const sessionCreator=Promise.resolve(req);
        if(!this.initialized)
            throw new Error('Connection to unitialized rethinkdb socket! Call initializeRethink() before allowing clients to connect!');
        const connection = new Connection(this.queryValidator, socket, 'all');
        connection.start({
            sessionCreator,
            dbHost: this.rethinkDbServer.host,
            dbPort: this.rethinkDbServer.port,
            dbAuthKey: '',
            dbSsl: false
        });
    }
}
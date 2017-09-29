import {inject} from './mobx';
import RocketComponent from './RocketComponent';
import HeaderStore from './HeaderStore';

export interface IHtmlProps{
    headerStore: HeaderStore;
    jsFiles: string[];
    cssFiles: string[];
    rendered: string;
    jsInjections: string[];
}

@inject("state")
export default class Html extends RocketComponent<IHtmlProps> {
    render() {
        const {headerStore,jsFiles,rendered,jsInjections,cssFiles} = this.props;
        return (<html>
            <head>
                <title>{headerStore.title}</title>
                <meta charSet="utf-8" />
                <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="description" content={headerStore.description} />
                <meta name="keywords" content={headerStore.keywords.join(',')} />
                {cssFiles.map(file=><link href={file} rel="stylesheet"/>)}
                {jsInjections.map(injection=><script dangerouslySetInnerHTML={{__html: injection}}/>)}
            </head>
            <body>
                <div id="root" style={{
                    "left": "0",
                    "top": "0",
                    "position": "absolute",
                    "width": "100%",
                    "height": "100%",
                    "right": "0",
                    "bottom": "0",
                    "overflow-y": "scroll"
                }} dangerouslySetInnerHTML={rendered}/>
                {jsFiles.map(file=><script src={file} defer/>)}
            </body>
        </html>)
    }
}
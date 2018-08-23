import RocketStore from '../RocketStore';
export default class HeaderStore extends RocketStore {
    constructor(defaultSiteName: string, defaultPageName: string);
    pageName: string;
    siteName: string;
    description: string;
    keywords: string[];
    metaTags: any[];
    readonly title: string;
    setSiteName(siteName: string): void;
    setPageName(pageName: string): void;
    autorun(): void;
}

import Store from './Store';
export default class HeaderStore extends Store {
    pageName: string;
    pageNameTemplate: string;
    description: string;
    keywords: string[];
    readonly title: string;
    setPageName(pageName: string): void;
    setTemplate(pageNameTemplate: any): void;
    constructor(pageNameTemplate: string, defaultPageName: any);
    autorun(): void;
}

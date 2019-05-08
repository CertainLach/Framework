
export class HtmlSafeTag {
    props: { [key: string]: string };
}
export class HtmlSafeTagWithBody {
    props: { [key: string]: string };
    body: string;
}

export default class HelmetDataInstance {
    title?: string = null;

    meta?: HtmlSafeTag[] = [];
    link?: HtmlSafeTag[] = [];

    htmlAttrs?: HtmlSafeTag = null;
    bodyAttrs?: HtmlSafeTag = null;

    script?: HtmlSafeTagWithBody[] = [];
    style?: HtmlSafeTagWithBody[] = [];

    appliedHead?: Element[] = [];
}

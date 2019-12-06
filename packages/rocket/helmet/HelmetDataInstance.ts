
export interface HtmlSafeTag {
    props: { [key: string]: string };
}
export interface HtmlSafeTagWithBody {
    props: { [key: string]: string };
    body: string;
}

export default class HelmetDataInstance {
    title: string | null = null;

    meta: HtmlSafeTag[] = [];
    link: HtmlSafeTag[] = [];

    htmlAttrs: HtmlSafeTag | null = null;
    bodyAttrs: HtmlSafeTag | null = null;

    script: HtmlSafeTagWithBody[] = [];
    style: HtmlSafeTagWithBody[] = [];

    appliedHead?: Element[] = [];
}

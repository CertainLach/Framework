export declare type IEmoji = {
    name: string;
    text?: string;
    hexcode: string;
    shortcodes: string[];
    emoji: string;
    type: number;
    order: number;
    group: number;
    subgroup: number;
    version: number;
    gender?: number;
    annotation: string;
    tags?: string[];
    emoticon?: string;
    skins?: (IEmoji & {
        tone: number;
    })[];
};
declare const EMOJIS: IEmoji[];
export default EMOJIS;

/**
 * Describes methods/fields plugin must have
 */
export default interface IPlugin {
    name:string;
    author?:string;
    description?:string;
    file:string;

    init?():Promise<void>
    deinit?():Promise<void>
}
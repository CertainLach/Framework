export default class AJSON {
    static stringify(object: any, replacer?: any, space?: any, advancedTypes?: {}): string;
    static parse(string?: string, reviver?: any, advancedTypes?: {}): any;
    static deserialize(object: any, advancedTypes?: {}): any;
    static serialize(object: any, advancedTypes?: {}): any;
    static defineType(name: any, typeDef: any): void;
    static getDefindedTypes(): {};
}

/**
 * AJSON is a Advanced JSON.
 * = JSON with types
 * Supports some types by default
 */
export default class AJSON {
    /**
     * Same as JSON.stringify(), but adds new argument: advancedTypes
     * @param object Object to stringify
     * @param replacer Replacer function
     * @param space Spaces
     * @param advancedTypes Custom types to serialize
     */
    static stringify(object: any, replacer?: any, space?: any, advancedTypes?: {}): string;
    /**
     * Same as JSON.parse(), but adds new argument: advancedTypes
     * @param string
     * @param reviver
     * @param advancedTypes
     */
    static parse(string?: string, reviver?: any, advancedTypes?: {}): any;
    /**
     * Only deserialize, dont de-stringify
     */
    static deserialize(object: any, advancedTypes?: {}): any;
    /**
     * Only serialize, dont stringify
     */
    static serialize(object: any, advancedTypes?: {}): any;
    /**
     * Adds new type to parser
     * @param name must be unique
     */
    static defineType(name: any, typeDef: any): void;
    static getDefindedTypes(): {};
}

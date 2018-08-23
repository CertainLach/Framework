export declare enum FieldType {
    TEXT = 0,
    SELECT = 1,
    NUMBER = 2,
    MULTIFIELD = 3,
}
export declare enum ValidationErrorType {
    INNER_FORM = 0,
    INNER_MULTI = 1,
    TYPE = 2,
    MIN_LENGTH = 3,
    MAX_LENGTH = 4,
    NOT_IN_POSSIBLE = 5,
    MIN = 6,
    MAX = 7,
    MIN_MULTI = 8,
    MAX_MULTI = 9,
    NO_KEY = 10,
    REGEX = 11,
}
export interface ValidationError {
    name: ValidationErrorType;
    value?: any;
    field?: string;
}
export interface FieldData {
    type: FieldType;
    placeholder: string | null;
    defaultValue?: any;
}
export interface TextFieldData extends FieldData {
    type: FieldType.TEXT;
    min: number | null;
    max: number | null;
    regex?: RegExp | null;
}
export interface SelectData extends FieldData {
    type: FieldType.SELECT;
    possible: {
        [key: number]: string;
    };
}
export interface NumberData extends FieldData {
    type: FieldType.NUMBER;
    min: number | null;
    max: number | null;
}
export interface MultiFieldData extends FieldData {
    type: FieldType.MULTIFIELD;
    min: number | null;
    max: number | null;
    inner: FormInputData;
}
export declare type AnyFieldData = TextFieldData | SelectData | NumberData | MultiFieldData;
export declare type FormInputData = {
    [key: string]: AnyFieldData;
};
export declare type FormData = {
    [key: string]: FieldValidator;
};
export declare class FieldValidator {
    type: FieldType;
    min: number;
    max: number;
    regex: RegExp;
    possible: {
        [key: number]: string;
    };
    inner: FormValidator;
    defaultValue: any;
    placeholder: string | null;
    constructor(data: AnyFieldData);
    validate(data: any): ValidationError | true;
    getDefaultValue(): any;
}
export default class FormValidator {
    fields: FormData;
    constructor(fields: FormInputData);
    static text(placeholder: string, [min, max]: [number, number], regex?: RegExp, defaultValue?: string): TextFieldData;
    static number(placeholder: string, [min, max]: [number, number], defaultValue?: number): NumberData;
    static select(placeholder: string, possible: {
        [key: number]: string;
    }, defaultValue?: number): SelectData;
    static multi(placeholder: string, [min, max]: [number, number], inner: FormInputData): MultiFieldData;
    validate(data: FormInputData): ValidationError | true;
    getDefaultValue(): any;
}
export declare function stringifyError(error: ValidationError, returnKey: boolean): string;

// TODO: Translations

export enum FieldType{
    TEXT,
    SELECT,
    NUMBER,
    MULTIFIELD
}
export enum ValidationErrorType{
    INNER_FORM,
    INNER_MULTI,
    TYPE,
    MIN_LENGTH,
    MAX_LENGTH,
    NOT_IN_POSSIBLE,
    MIN,
    MAX,
    MIN_MULTI,
    MAX_MULTI,
    NO_KEY,
    REGEX
}
export interface ValidationError{
    name: ValidationErrorType;
    value?: any;
    field?: string;
}
export interface FieldData {
    type:FieldType;
    placeholder:string|null
    defaultValue?:any;
}
export interface TextFieldData extends FieldData{
    type:FieldType.TEXT;
    min:number|null;
    max:number|null;
    regex?:RegExp|null;
}
export interface SelectData extends FieldData{
    type:FieldType.SELECT;
    possible:{[key:number]:string};
}
export interface NumberData extends FieldData{
    type:FieldType.NUMBER;
    min:number|null;
    max:number|null;
}
export interface MultiFieldData extends FieldData{
    type:FieldType.MULTIFIELD;
    min:number|null;
    max:number|null;
    inner:FormInputData;
}
export type AnyFieldData=TextFieldData|SelectData|NumberData|MultiFieldData;
export type FormInputData={[key:string]:AnyFieldData};
export type FormData={[key:string]:FieldValidator};

export class FieldValidator {
    type: FieldType;

    min: number;
    max: number;
    regex: RegExp;

    possible: {[key:number]:string};

    inner:FormValidator;

    defaultValue: any;
    placeholder: string|null;

    constructor(data:AnyFieldData){
        this.type=data.type;
        this.defaultValue=data.defaultValue;
        this.placeholder=data.placeholder;
        switch(this.type){
            case FieldType.TEXT:
                data=<TextFieldData>data;
                this.min=data.min;
                this.max=data.max;
                this.regex=data.regex;
                return;
            case FieldType.SELECT:
                data=<SelectData>data;
                this.possible=data.possible;
                return;
            case FieldType.NUMBER:
                data=<NumberData>data;
                this.min=data.min;
                this.max=data.max;
                return;
            case FieldType.MULTIFIELD:
                data=<MultiFieldData>data;
                this.min=data.min;
                this.max=data.max;
                this.inner=new FormValidator(data.inner);
                return;
            default:
                throw new Error('Form construction error!');
        }
    }
    validate(data:any):ValidationError|true{
        switch(this.type){
            case FieldType.TEXT:
                if(typeof data!=='string')
                    return {name:ValidationErrorType.TYPE};
                if(this.min!==null&&data.length<this.min)
                    return {name:ValidationErrorType.MIN_LENGTH,value:this.min};
                if(this.max!==null&&data.length>this.max)
                    return {name:ValidationErrorType.MAX_LENGTH,value:this.max};
                if(this.regex!==null&&!this.regex.test(data))
                    return {name:ValidationErrorType.REGEX};
                return true;
            case FieldType.SELECT:
                if(typeof data!=='number')
                    return {name:ValidationErrorType.TYPE};
                if(data in this.possible)
                    return {name:ValidationErrorType.NOT_IN_POSSIBLE,value:data};
                return true;
            case FieldType.NUMBER:
                if(typeof data!=='number')
                    return {name:ValidationErrorType.TYPE};
                if(data<this.min&&this.min!==null)
                    return {name:ValidationErrorType.MIN,value:this.min};
                if(data>this.max&&this.max!==null)
                    return {name:ValidationErrorType.MAX,value:this.max};
                return true;
            case FieldType.MULTIFIELD:
                if(!(data instanceof Array))
                    return {name:ValidationErrorType.TYPE};
                if(data.length<this.min&&this.min!==null)
                    return {name:ValidationErrorType.MIN_MULTI,value:this.min};
                if(data.length>this.max&&this.max!==null)
                    return {name:ValidationErrorType.MAX_MULTI,value:this.max};
                let i=0;
                for(let inner of data){
                    let test=this.inner.validate(inner);
                    if(test!==true)
                        return {name:ValidationErrorType.INNER_MULTI,field:i.toString(),value:test};
                    i++;
                }
                return true;
            default:
                throw new Error('Form construction error!');
        }
    }
    getDefaultValue(){
        switch(this.type){
            case FieldType.TEXT:
                return this.defaultValue;
            case FieldType.SELECT:
                return this.defaultValue;
            case FieldType.NUMBER:
                return this.defaultValue;
            case FieldType.MULTIFIELD:
                return [this.inner.getDefaultValue()];
            default:
                throw new Error('Form construction error!');
        }
    }
}
export default class FormValidator {
    fields: FormData;
    constructor(fields:FormInputData){
        this.fields={};
        for(let key of Object.keys(fields))
            this.fields[key]=new FieldValidator(fields[key]);
    }
    static text(placeholder:string,[min=null,max=null]:[number,number],regex:RegExp=null,defaultValue=''):TextFieldData{
        return {
            type:FieldType.TEXT,
            placeholder,
            regex,
            defaultValue,
            min,
            max
        }
    }
    static number(placeholder:string,[min=null,max=null]:[number,number],defaultValue=0):NumberData{
        return {
            type:FieldType.NUMBER,
            min,
            max,
            placeholder,
            defaultValue
        }
    }
    static select(placeholder:string,possible:{[key:number]:string},defaultValue:number=null):SelectData{
        if(defaultValue===null)
            defaultValue=+Object.keys(possible)[0];
        return {
            type:FieldType.SELECT,
            possible,
            defaultValue,
            placeholder
        }
    }
    static multi(placeholder:string,[min,max]:[number,number],inner:FormInputData):MultiFieldData{
        return {
            type:FieldType.MULTIFIELD,
            min,
            max,
            inner,
            placeholder
        }
    }
    validate(data:FormInputData):ValidationError|true{
        for(let key of Object.keys(this.fields)){
            if(!(key in data))
                return {name:ValidationErrorType.NO_KEY,field:key};
            let test=this.fields[key].validate(key);
            if(test!==true)
                return {name:ValidationErrorType.INNER_FORM,field:key,value:test};
        }
        return true;
    }
    getDefaultValue(){
        let ret:any={};
        for(let key of Object.keys(this.fields))
            ret[key]=this.fields[key].getDefaultValue();
        return ret;
    }
}
export function stringifyError(error:ValidationError,returnKey:boolean){
    let key=[];
    while(error.name in [ValidationErrorType.INNER_FORM,ValidationErrorType.INNER_MULTI]){
        key.push(error.field);
        error=error.value;
    }
    let keyString=key.join('.');
    let errorString='';
    switch(error.name){
        case ValidationErrorType.MAX:
            errorString=`Число в поле не должно превышать ${error.value}!`;
            break;
        case ValidationErrorType.MIN:
            errorString=`Число в поле должно быть не меньше ${error.value}!`;
            break;
        case ValidationErrorType.TYPE:
            errorString=`Неверный тип!`;
            break;
        case ValidationErrorType.NOT_IN_POSSIBLE:
            errorString=`Значение не принадлежит множеству допустимых!`;
            break;
        case ValidationErrorType.MAX_LENGTH:
            errorString=`Длина строки не должна превышать ${error.value}!`;
            break;
        case ValidationErrorType.MIN_LENGTH:
            errorString=`Длина строки должна быть не менее ${error.value}!`;
            break;
        case ValidationErrorType.MAX_MULTI:
            errorString=`Количество записей в этом поле не должно превышать ${error.value}!`;
            break;
        case ValidationErrorType.MIN_MULTI:
            errorString=`Количество записей в этом поле должно быть не менее ${error.value}!`;
            break;
        case ValidationErrorType.NO_KEY:
            errorString=`Ключ отсутствует в исходной форме!`;
            break;
        case ValidationErrorType.REGEX:
            errorString=`Ошибка ввода!`;
            break;
        case ValidationErrorType.INNER_FORM:
        case ValidationErrorType.INNER_MULTI:
            errorString=`Системная ошибка!`;
            break;
        default:
            throw new Error(`Неверный тип поля: ${error.name}!`);
    }
    if(returnKey)
        return `${keyString}: ${errorString}`;
    else
        return errorString;
}
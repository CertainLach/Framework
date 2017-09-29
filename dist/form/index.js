"use strict";
var FieldType;
(function (FieldType) {
    FieldType[FieldType["TEXT"] = 0] = "TEXT";
    FieldType[FieldType["SELECT"] = 1] = "SELECT";
    FieldType[FieldType["NUMBER"] = 2] = "NUMBER";
    FieldType[FieldType["MULTIFIELD"] = 3] = "MULTIFIELD";
})(FieldType = exports.FieldType || (exports.FieldType = {}));
var ValidationErrorType;
(function (ValidationErrorType) {
    ValidationErrorType[ValidationErrorType["INNER_FORM"] = 0] = "INNER_FORM";
    ValidationErrorType[ValidationErrorType["INNER_MULTI"] = 1] = "INNER_MULTI";
    ValidationErrorType[ValidationErrorType["TYPE"] = 2] = "TYPE";
    ValidationErrorType[ValidationErrorType["MIN_LENGTH"] = 3] = "MIN_LENGTH";
    ValidationErrorType[ValidationErrorType["MAX_LENGTH"] = 4] = "MAX_LENGTH";
    ValidationErrorType[ValidationErrorType["NOT_IN_POSSIBLE"] = 5] = "NOT_IN_POSSIBLE";
    ValidationErrorType[ValidationErrorType["MIN"] = 6] = "MIN";
    ValidationErrorType[ValidationErrorType["MAX"] = 7] = "MAX";
    ValidationErrorType[ValidationErrorType["MIN_MULTI"] = 8] = "MIN_MULTI";
    ValidationErrorType[ValidationErrorType["MAX_MULTI"] = 9] = "MAX_MULTI";
    ValidationErrorType[ValidationErrorType["NO_KEY"] = 10] = "NO_KEY";
    ValidationErrorType[ValidationErrorType["REGEX"] = 11] = "REGEX";
})(ValidationErrorType = exports.ValidationErrorType || (exports.ValidationErrorType = {}));
class FieldValidator {
    constructor(data) {
        this.type = data.type;
        this.defaultValue = data.defaultValue;
        this.placeholder = data.placeholder;
        switch (this.type) {
            case FieldType.TEXT:
                data = data;
                this.min = data.min;
                this.max = data.max;
                this.regex = data.regex;
                return;
            case FieldType.SELECT:
                data = data;
                this.possible = data.possible;
                return;
            case FieldType.NUMBER:
                data = data;
                this.min = data.min;
                this.max = data.max;
                return;
            case FieldType.MULTIFIELD:
                data = data;
                this.min = data.min;
                this.max = data.max;
                this.inner = new FormValidator(data.inner);
                return;
            default:
                throw new Error('Form construction error!');
        }
    }
    validate(data) {
        switch (this.type) {
            case FieldType.TEXT:
                if (typeof data !== 'string')
                    return { name: ValidationErrorType.TYPE };
                if (this.min !== null && data.length < this.min)
                    return { name: ValidationErrorType.MIN_LENGTH, value: this.min };
                if (this.max !== null && data.length > this.max)
                    return { name: ValidationErrorType.MAX_LENGTH, value: this.max };
                if (this.regex !== null && !this.regex.test(data))
                    return { name: ValidationErrorType.REGEX };
                return true;
            case FieldType.SELECT:
                if (typeof data !== 'number')
                    return { name: ValidationErrorType.TYPE };
                if (data in this.possible)
                    return { name: ValidationErrorType.NOT_IN_POSSIBLE, value: data };
                return true;
            case FieldType.NUMBER:
                if (typeof data !== 'number')
                    return { name: ValidationErrorType.TYPE };
                if (data < this.min && this.min !== null)
                    return { name: ValidationErrorType.MIN, value: this.min };
                if (data > this.max && this.max !== null)
                    return { name: ValidationErrorType.MAX, value: this.max };
                return true;
            case FieldType.MULTIFIELD:
                if (!(data instanceof Array))
                    return { name: ValidationErrorType.TYPE };
                if (data.length < this.min && this.min !== null)
                    return { name: ValidationErrorType.MIN_MULTI, value: this.min };
                if (data.length > this.max && this.max !== null)
                    return { name: ValidationErrorType.MAX_MULTI, value: this.max };
                let i = 0;
                for (let inner of data) {
                    let test = this.inner.validate(inner);
                    if (test !== true)
                        return { name: ValidationErrorType.INNER_MULTI, field: i.toString(), value: test };
                    i++;
                }
                return true;
            default:
                throw new Error('Form construction error!');
        }
    }
    getDefaultValue() {
        switch (this.type) {
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
exports.FieldValidator = FieldValidator;
class FormValidator {
    constructor(fields) {
        this.fields = {};
        for (let key of Object.keys(fields))
            this.fields[key] = new FieldValidator(fields[key]);
    }
    static text(placeholder, [min = null, max = null], regex = null, defaultValue = '') {
        return {
            type: FieldType.TEXT,
            placeholder,
            regex,
            defaultValue,
            min,
            max
        };
    }
    static number(placeholder, [min = null, max = null], defaultValue = 0) {
        return {
            type: FieldType.NUMBER,
            min,
            max,
            placeholder,
            defaultValue
        };
    }
    static select(placeholder, possible, defaultValue = null) {
        if (defaultValue === null)
            defaultValue = Object.keys(possible)[0];
        return {
            type: FieldType.SELECT,
            possible,
            defaultValue,
            placeholder
        };
    }
    static multi(placeholder, [min, max], inner) {
        return {
            type: FieldType.MULTIFIELD,
            min,
            max,
            inner,
            placeholder
        };
    }
    validate(data) {
        for (let key of Object.keys(this.fields)) {
            if (!(key in data))
                return { name: ValidationErrorType.NO_KEY, field: key };
            let test = this.fields[key].validate(key);
            if (test !== true)
                return { name: ValidationErrorType.INNER_FORM, field: key, value: test };
        }
        return true;
    }
    getDefaultValue() {
        let ret = {};
        for (let key of Object.keys(this.fields))
            ret[key] = this.fields[key].getDefaultValue();
        return ret;
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FormValidator;
function stringifyError(error, returnKey) {
    let key = [];
    while (error.name in [ValidationErrorType.INNER_FORM, ValidationErrorType.INNER_MULTI]) {
        key.push(error.field);
        error = error.value;
    }
    let keyString = key.join('.');
    let errorString = '';
    switch (error.name) {
        case ValidationErrorType.MAX:
            errorString = `Число в поле не должно превышать ${error.value}!`;
            break;
        case ValidationErrorType.MIN:
            errorString = `Число в поле должно быть не меньше ${error.value}!`;
            break;
        case ValidationErrorType.TYPE:
            errorString = `Неверный тип!`;
            break;
        case ValidationErrorType.NOT_IN_POSSIBLE:
            errorString = `Значение не принадлежит множеству допустимых!`;
            break;
        case ValidationErrorType.MAX_LENGTH:
            errorString = `Длина строки не должна превышать ${error.value}!`;
            break;
        case ValidationErrorType.MIN_LENGTH:
            errorString = `Длина строки должна быть не менее ${error.value}!`;
            break;
        case ValidationErrorType.MAX_MULTI:
            errorString = `Количество записей в этом поле не должно превышать ${error.value}!`;
            break;
        case ValidationErrorType.MIN_MULTI:
            errorString = `Количество записей в этом поле должно быть не менее ${error.value}!`;
            break;
        case ValidationErrorType.NO_KEY:
            errorString = `Ключ отсутствует в исходной форме!`;
            break;
        case ValidationErrorType.REGEX:
            errorString = `Ошибка ввода!`;
            break;
        case ValidationErrorType.INNER_FORM:
        case ValidationErrorType.INNER_MULTI:
            errorString = `Системная ошибка!`;
            break;
        default:
            throw new Error(`Неверный тип поля: ${error.name}!`);
    }
    if (returnKey)
        return `${keyString}: ${errorString}`;
    else
        return errorString;
}
exports.stringifyError = stringifyError;
//# sourceMappingURL=index.js.map
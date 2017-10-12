export var FieldType;
(function (FieldType) {
    FieldType[FieldType["TEXT"] = 0] = "TEXT";
    FieldType[FieldType["SELECT"] = 1] = "SELECT";
    FieldType[FieldType["NUMBER"] = 2] = "NUMBER";
    FieldType[FieldType["MULTIFIELD"] = 3] = "MULTIFIELD";
})(FieldType || (FieldType = {}));
export var ValidationErrorType;
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
})(ValidationErrorType || (ValidationErrorType = {}));
var FieldValidator = /** @class */ (function () {
    function FieldValidator(data) {
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
    FieldValidator.prototype.validate = function (data) {
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
                var i = 0;
                for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
                    var inner = data_1[_i];
                    var test = this.inner.validate(inner);
                    if (test !== true)
                        return { name: ValidationErrorType.INNER_MULTI, field: i.toString(), value: test };
                    i++;
                }
                return true;
            default:
                throw new Error('Form construction error!');
        }
    };
    FieldValidator.prototype.getDefaultValue = function () {
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
    };
    return FieldValidator;
}());
export { FieldValidator };
var FormValidator = /** @class */ (function () {
    function FormValidator(fields) {
        this.fields = {};
        for (var _i = 0, _a = Object.keys(fields); _i < _a.length; _i++) {
            var key = _a[_i];
            this.fields[key] = new FieldValidator(fields[key]);
        }
    }
    FormValidator.text = function (placeholder, _a, regex, defaultValue) {
        var _b = _a[0], min = _b === void 0 ? null : _b, _c = _a[1], max = _c === void 0 ? null : _c;
        if (regex === void 0) { regex = null; }
        if (defaultValue === void 0) { defaultValue = ''; }
        return {
            type: FieldType.TEXT,
            placeholder: placeholder,
            regex: regex,
            defaultValue: defaultValue,
            min: min,
            max: max
        };
    };
    FormValidator.number = function (placeholder, _a, defaultValue) {
        var _b = _a[0], min = _b === void 0 ? null : _b, _c = _a[1], max = _c === void 0 ? null : _c;
        if (defaultValue === void 0) { defaultValue = 0; }
        return {
            type: FieldType.NUMBER,
            min: min,
            max: max,
            placeholder: placeholder,
            defaultValue: defaultValue
        };
    };
    FormValidator.select = function (placeholder, possible, defaultValue) {
        if (defaultValue === void 0) { defaultValue = null; }
        if (defaultValue === null)
            defaultValue = Object.keys(possible)[0];
        return {
            type: FieldType.SELECT,
            possible: possible,
            defaultValue: defaultValue,
            placeholder: placeholder
        };
    };
    FormValidator.multi = function (placeholder, _a, inner) {
        var min = _a[0], max = _a[1];
        return {
            type: FieldType.MULTIFIELD,
            min: min,
            max: max,
            inner: inner,
            placeholder: placeholder
        };
    };
    FormValidator.prototype.validate = function (data) {
        for (var _i = 0, _a = Object.keys(this.fields); _i < _a.length; _i++) {
            var key = _a[_i];
            if (!(key in data))
                return { name: ValidationErrorType.NO_KEY, field: key };
            var test = this.fields[key].validate(key);
            if (test !== true)
                return { name: ValidationErrorType.INNER_FORM, field: key, value: test };
        }
        return true;
    };
    FormValidator.prototype.getDefaultValue = function () {
        var ret = {};
        for (var _i = 0, _a = Object.keys(this.fields); _i < _a.length; _i++) {
            var key = _a[_i];
            ret[key] = this.fields[key].getDefaultValue();
        }
        return ret;
    };
    return FormValidator;
}());
export default FormValidator;
export function stringifyError(error, returnKey) {
    var key = [];
    while (error.name in [ValidationErrorType.INNER_FORM, ValidationErrorType.INNER_MULTI]) {
        key.push(error.field);
        error = error.value;
    }
    var keyString = key.join('.');
    var errorString = '';
    switch (error.name) {
        case ValidationErrorType.MAX:
            errorString = "\u0427\u0438\u0441\u043B\u043E \u0432 \u043F\u043E\u043B\u0435 \u043D\u0435 \u0434\u043E\u043B\u0436\u043D\u043E \u043F\u0440\u0435\u0432\u044B\u0448\u0430\u0442\u044C " + error.value + "!";
            break;
        case ValidationErrorType.MIN:
            errorString = "\u0427\u0438\u0441\u043B\u043E \u0432 \u043F\u043E\u043B\u0435 \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u043D\u0435 \u043C\u0435\u043D\u044C\u0448\u0435 " + error.value + "!";
            break;
        case ValidationErrorType.TYPE:
            errorString = "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0442\u0438\u043F!";
            break;
        case ValidationErrorType.NOT_IN_POSSIBLE:
            errorString = "\u0417\u043D\u0430\u0447\u0435\u043D\u0438\u0435 \u043D\u0435 \u043F\u0440\u0438\u043D\u0430\u0434\u043B\u0435\u0436\u0438\u0442 \u043C\u043D\u043E\u0436\u0435\u0441\u0442\u0432\u0443 \u0434\u043E\u043F\u0443\u0441\u0442\u0438\u043C\u044B\u0445!";
            break;
        case ValidationErrorType.MAX_LENGTH:
            errorString = "\u0414\u043B\u0438\u043D\u0430 \u0441\u0442\u0440\u043E\u043A\u0438 \u043D\u0435 \u0434\u043E\u043B\u0436\u043D\u0430 \u043F\u0440\u0435\u0432\u044B\u0448\u0430\u0442\u044C " + error.value + "!";
            break;
        case ValidationErrorType.MIN_LENGTH:
            errorString = "\u0414\u043B\u0438\u043D\u0430 \u0441\u0442\u0440\u043E\u043A\u0438 \u0434\u043E\u043B\u0436\u043D\u0430 \u0431\u044B\u0442\u044C \u043D\u0435 \u043C\u0435\u043D\u0435\u0435 " + error.value + "!";
            break;
        case ValidationErrorType.MAX_MULTI:
            errorString = "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u0437\u0430\u043F\u0438\u0441\u0435\u0439 \u0432 \u044D\u0442\u043E\u043C \u043F\u043E\u043B\u0435 \u043D\u0435 \u0434\u043E\u043B\u0436\u043D\u043E \u043F\u0440\u0435\u0432\u044B\u0448\u0430\u0442\u044C " + error.value + "!";
            break;
        case ValidationErrorType.MIN_MULTI:
            errorString = "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u0437\u0430\u043F\u0438\u0441\u0435\u0439 \u0432 \u044D\u0442\u043E\u043C \u043F\u043E\u043B\u0435 \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u043D\u0435 \u043C\u0435\u043D\u0435\u0435 " + error.value + "!";
            break;
        case ValidationErrorType.NO_KEY:
            errorString = "\u041A\u043B\u044E\u0447 \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u0435\u0442 \u0432 \u0438\u0441\u0445\u043E\u0434\u043D\u043E\u0439 \u0444\u043E\u0440\u043C\u0435!";
            break;
        case ValidationErrorType.REGEX:
            errorString = "\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0432\u043E\u0434\u0430!";
            break;
        case ValidationErrorType.INNER_FORM:
        case ValidationErrorType.INNER_MULTI:
            errorString = "\u0421\u0438\u0441\u0442\u0435\u043C\u043D\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430!";
            break;
        default:
            throw new Error("\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0442\u0438\u043F \u043F\u043E\u043B\u044F: " + error.name + "!");
    }
    if (returnKey)
        return keyString + ": " + errorString;
    else
        return errorString;
}
//# sourceMappingURL=index.js.map
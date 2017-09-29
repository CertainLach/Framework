"use strict";
const react_1 = require("react");
const _1 = require("../");
const reactstrap_1 = require("reactstrap");
class Field extends react_1.Component {
    render() {
        let field = this.props.field;
        let success = field.validate(this.props.value);
        let color = success === true ? 'success' : 'danger';
        let error = success !== true ? success : null;
        switch (field.type) {
            case _1.FieldType.TEXT:
                return react_1.default.createElement(reactstrap_1.FormGroup, { color: color },
                    react_1.default.createElement(reactstrap_1.Label, null, field.placeholder),
                    react_1.default.createElement(reactstrap_1.Input, { value: this.props.value, onChange: e => this.props.onChange(e.target.value), state: color }),
                    error !== null && react_1.default.createElement(reactstrap_1.FormFeedback, null, _1.stringifyError(error, false)));
            case _1.FieldType.MULTIFIELD:
                return react_1.default.createElement(reactstrap_1.FormGroup, null,
                    react_1.default.createElement(reactstrap_1.Label, null, field.placeholder),
                    react_1.default.createElement(Form, { form: field.inner }));
            case _1.FieldType.SELECT:
                return react_1.default.createElement(reactstrap_1.FormGroup, { color: color },
                    react_1.default.createElement(reactstrap_1.Label, null, field.placeholder),
                    react_1.default.createElement(reactstrap_1.Input, { type: "select", value: this.props.value, onChange: e => this.props.onChange(e.target.value), state: color }, Object.keys(field.possible).map(key => react_1.default.createElement("option", { value: key }, field.possible[key]))),
                    error !== null && react_1.default.createElement(reactstrap_1.FormFeedback, null, _1.stringifyError(error, false)));
        }
        throw new Error('Form rendering error');
    }
}
exports.Field = Field;
class Form extends react_1.Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.form = props.form;
        this.state = this.form.getDefaultValue();
        console.log(this.state);
    }
    render() {
        let fields = [];
        for (let fieldKey of Object.keys(this.form.fields)) {
            let field = this.form.fields[fieldKey];
            fields.push(react_1.default.createElement(Field, { key: fieldKey, value: this.state[fieldKey], onChange: (value) => this.setState({ [fieldKey]: value }), field: field }));
        }
        return react_1.default.createElement("div", null, fields);
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Form;
//# sourceMappingURL=React.js.map
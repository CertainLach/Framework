"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const inferno_1 = require("inferno");
const reactive_1 = require("../reactive");
let ChangeDispatcher = class ChangeDispatcher extends inferno_1.Component {
    constructor() {
        super(...arguments);
        this.rendered = false;
        this.helmetDataInstance = null;
    }
    componentDidUpdate() {
        this.props.helmet.forceUpdate();
    }
    componentWillUnmount() {
        this.props.helmet.removeInstance(this.helmetDataInstance);
        this.props.helmet.forceUpdate();
    }
    render() {
        if (this.rendered) {
            for (let key of Object.getOwnPropertyNames(this.helmetDataInstance))
                this.helmetDataInstance[key] = null;
            for (let key of Object.getOwnPropertyNames(this.props.data))
                this.helmetDataInstance[key] = this.props.data[key];
            this.props.helmet.forceUpdate();
            return null;
        }
        if (this.helmetDataInstance === null)
            this.helmetDataInstance = { ...this.props.data };
        this.rendered = true;
        this.props.helmet.addInstance(this.helmetDataInstance);
        this.props.helmet.forceUpdate();
        return null;
    }
};
ChangeDispatcher = __decorate([
    reactive_1.inject('helmet')
], ChangeDispatcher);
exports.ChangeDispatcher = ChangeDispatcher;
//# sourceMappingURL=ChangeDispatcher.jsx.map
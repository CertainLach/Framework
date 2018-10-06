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
const hoist_non_inferno_statics_1 = require("hoist-non-inferno-statics");
function withStyles(...styles) {
    return (InnerComponent) => {
        let StyledComponent = class StyledComponent extends inferno_1.Component {
            componentWillMount() {
                this.props.isomorphicStyleLoader.insertCss(...styles);
            }
            componentWillUnmount() {
                if (this.removeCss) {
                    setTimeout(this.removeCss, 0);
                }
            }
            render() {
                return <InnerComponent {...this.props}/>;
            }
        };
        StyledComponent = __decorate([
            reactive_1.inject('isomorphicStyleLoader')
        ], StyledComponent);
        ;
        return hoist_non_inferno_statics_1.default(StyledComponent, InnerComponent);
    };
}
exports.default = withStyles;
//# sourceMappingURL=withStyles.jsx.map
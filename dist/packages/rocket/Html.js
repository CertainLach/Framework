"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
const mobx_1 = require("./mobx");
const RocketComponent_1 = require("./RocketComponent");
let Html = class Html extends RocketComponent_1.default {
    render() {
        const { headerStore, jsFiles, rendered, jsInjections, cssFiles } = this.props;
        return (React.createElement("html", null,
            React.createElement("head", null,
                React.createElement("title", null, headerStore.title),
                React.createElement("meta", { charSet: "utf-8" }),
                React.createElement("meta", { httpEquiv: "X-UA-Compatible", content: "IE=edge" }),
                React.createElement("meta", { name: "viewport", content: "width=device-width, initial-scale=1" }),
                React.createElement("meta", { name: "description", content: headerStore.description }),
                React.createElement("meta", { name: "keywords", content: headerStore.keywords.join(',') }),
                cssFiles.map(file => React.createElement("link", { href: file, rel: "stylesheet" })),
                jsInjections.map(injection => React.createElement("script", { dangerouslySetInnerHTML: { __html: injection } }))),
            React.createElement("body", null,
                React.createElement("div", { id: "root", style: {
                        "left": "0",
                        "top": "0",
                        "position": "absolute",
                        "width": "100%",
                        "height": "100%",
                        "right": "0",
                        "bottom": "0",
                        "overflow-y": "scroll"
                    }, dangerouslySetInnerHTML: rendered }),
                jsFiles.map(file => React.createElement("script", { src: file, defer: true })))));
    }
};
Html = __decorate([
    mobx_1.inject("state"),
    __metadata("design:paramtypes", [])
], Html);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Html;
//# sourceMappingURL=Html.js.map
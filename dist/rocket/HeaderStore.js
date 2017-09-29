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
const Store_1 = require("./Store");
const mobx_1 = require("./mobx");
class HeaderStore extends Store_1.default {
    constructor(pageNameTemplate = 'Unnamed - %s', defaultPageName) {
        super(true);
        this.description = '';
        this.keywords = [];
        if (!pageNameTemplate.includes('%s'))
            throw new Error('page name template doesn\'t includes placeholder (%s)!');
        this.pageName = defaultPageName;
        this.pageNameTemplate = pageNameTemplate;
    }
    get title() {
        return this.pageNameTemplate.replace('%s', this.pageName);
    }
    setPageName(pageName) {
        this.pageName = pageName;
    }
    setTemplate(pageNameTemplate) {
        if (!pageNameTemplate.includes('%s'))
            throw new Error('page name template doesn\'t includes placeholder (%s)!');
        this.pageNameTemplate = pageNameTemplate;
    }
    autorun() {
        if (this.isClientSide) {
            document.title = this.title;
            document.querySelector("meta[name='description']").content = this.description;
            document.querySelector("meta[name='keywords']").content = this.keywords.join(',');
        }
    }
}
__decorate([
    mobx_1.observable,
    __metadata("design:type", String)
], HeaderStore.prototype, "pageName", void 0);
__decorate([
    mobx_1.observable,
    __metadata("design:type", String)
], HeaderStore.prototype, "pageNameTemplate", void 0);
__decorate([
    mobx_1.observable,
    __metadata("design:type", String)
], HeaderStore.prototype, "description", void 0);
__decorate([
    mobx_1.observable,
    __metadata("design:type", Array)
], HeaderStore.prototype, "keywords", void 0);
__decorate([
    mobx_1.computed,
    __metadata("design:type", Object),
    __metadata("design:paramtypes", [])
], HeaderStore.prototype, "title", null);
__decorate([
    mobx_1.action,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HeaderStore.prototype, "setPageName", null);
__decorate([
    mobx_1.action,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], HeaderStore.prototype, "setTemplate", null);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = HeaderStore;
//# sourceMappingURL=HeaderStore.js.map
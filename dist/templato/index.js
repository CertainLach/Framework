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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const logger_1 = require("@meteor-it/logger");
const queue_1 = require("@meteor-it/queue");
const p = {};
p.fa = p.id = p.ja = p.ko = p.lo = p.ms = p.th = p.tr = p.zh = n => 0;
p.da = p.de = p.en = p.es = p.fi = p.el = p.he = p.hu = p.it = p.nl = p.no = p.pt = p.sv = n => n !== 1 ? 1 : 0;
p.fr = p.tl = p['pt-br'] = n => n > 1 ? 1 : 0;
p.hr = p.ru = n => n % 10 === 1 && n % 100 !== 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2;
p.cs = n => (n === 1) ? 0 : (n >= 2 && n <= 4) ? 1 : 2;
p.pl = n => (n === 1 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2);
p.is = n => (n % 10 !== 1 || n % 100 === 11) ? 1 : 0;
let DATA_REGEX = /{{([a-zA-Z]+)}}/g;
let NUMERAL_REGEX = /(%[1-9\-]+(?::[a-zA-Zа-яА-Я\s]*)+%)/g;
let template = 'В коризне %{{count}}:фрукт::а:ов%';
let data = {
    count: 141
};
class Templato {
    constructor() {
        this.logger = new logger_1.default('translate');
        this.languages = {};
    }
    addLanguage(folder, family) {
        return __awaiter(this, void 0, void 0, function* () {
            let language = { plural: null };
            if (!p[family]) {
                this.logger.warn('Unknown language family: %s!\nSupported families is %s', family, Object.keys[p].join(', '));
                language.plural = n => 0;
            }
            else {
                language.plural = p[family];
            }
            this.logger.ident('Walking dir and searching for yml...');
            this.logger.deent();
        });
    }
}
__decorate([
    queue_1.queue,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Templato.prototype, "addLanguage", null);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Templato;
//# sourceMappingURL=index.js.map
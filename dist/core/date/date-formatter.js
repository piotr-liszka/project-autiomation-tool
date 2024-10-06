var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _DateFormatter_timeDeltaFormatter;
import { Inject, Service } from "typedi";
import timeDelta from "time-delta";
import { Config } from "../config/config.js";
let DateFormatter = class DateFormatter {
    constructor(config) {
        this.config = config;
        _DateFormatter_timeDeltaFormatter.set(this, void 0);
        __classPrivateFieldSet(this, _DateFormatter_timeDeltaFormatter, timeDelta.create({
            locale: config.get('dateFormatter.locale') ?? 'en',
        }), "f");
    }
    formatDate(date) {
        return date.toLocaleDateString('en', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    }
    formatDiff(date, compareTo) {
        return __classPrivateFieldGet(this, _DateFormatter_timeDeltaFormatter, "f").format(date, compareTo ?? new Date());
    }
    formatCombined(date, compareTo) {
        return this.formatDate(date) + ' (' + this.formatDiff(date, compareTo) + ')';
    }
};
_DateFormatter_timeDeltaFormatter = new WeakMap();
DateFormatter = __decorate([
    Service(),
    __param(0, Inject()),
    __metadata("design:paramtypes", [Config])
], DateFormatter);
export { DateFormatter };

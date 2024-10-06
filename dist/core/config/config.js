var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
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
var _Config_configPath, _Config_configStore;
import { Service } from "typedi";
import fs from "node:fs";
import Configstore from "configstore";
let Config = class Config {
    constructor() {
        _Config_configPath.set(this, './config.json');
        _Config_configStore.set(this, void 0);
    }
    setConfigPath(configPath) {
        __classPrivateFieldSet(this, _Config_configPath, configPath, "f");
    }
    get config() {
        if (!__classPrivateFieldGet(this, _Config_configStore, "f")) {
            const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
            __classPrivateFieldSet(this, _Config_configStore, new Configstore(packageJson.name, { foo: 'bar' }, {
                configPath: __classPrivateFieldGet(this, _Config_configPath, "f")
            }), "f");
        }
        return __classPrivateFieldGet(this, _Config_configStore, "f");
    }
    get(key) {
        return this.config.get(key);
    }
};
_Config_configPath = new WeakMap();
_Config_configStore = new WeakMap();
Config = __decorate([
    Service()
], Config);
export { Config };

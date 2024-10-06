var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Logger_nativeConsole, _Logger_logger;
import { Service } from "typedi";
import { Console } from "node:console";
import { Logger as TsLog } from "tslog";
let Logger = class Logger {
    constructor() {
        _Logger_nativeConsole.set(this, new Console({ stdout: process.stdout, stderr: process.stderr }));
        _Logger_logger.set(this, new TsLog({
            prettyLogTemplate: "{{hh}}:{{MM}}:{{ss}}:{{ms}}\t{{logLevelName}}\t[{{fileNameWithLine}}{{name}}]\t",
            overwrite: {
                transportFormatted: (msg, logArgs, logErrors) => {
                    __classPrivateFieldGet(this, _Logger_nativeConsole, "f").log(msg, ...logArgs, ...logErrors);
                }
            }
        }));
    }
    print(string) {
        __classPrivateFieldGet(this, _Logger_nativeConsole, "f").log(string);
    }
    register() {
        console = {
            ...console,
            log: (...args) => __classPrivateFieldGet(this, _Logger_logger, "f").log(0, 'LOG', ...args),
            debug: (...args) => __classPrivateFieldGet(this, _Logger_logger, "f").debug(args),
            error: (...args) => __classPrivateFieldGet(this, _Logger_logger, "f").error(args),
            info: (...args) => __classPrivateFieldGet(this, _Logger_logger, "f").info(args),
        };
        console.log("Logger initialized");
    }
};
_Logger_nativeConsole = new WeakMap();
_Logger_logger = new WeakMap();
Logger = __decorate([
    Service()
], Logger);
export { Logger };

import {Service} from "typedi";
import {Console} from "node:console";
import {Logger as TsLog} from "tslog";

@Service()
export class Logger {
  #nativeConsole = new Console({stdout: process.stdout, stderr: process.stderr});

  #logger = new TsLog({
    prettyLogTemplate: "{{hh}}:{{MM}}:{{ss}}:{{ms}}\t{{logLevelName}}\t[{{fileNameWithLine}}{{name}}]\t",
    overwrite: {
      transportFormatted: (msg, logArgs, logErrors) => {
        this.#nativeConsole.log(msg, ...logArgs, ...logErrors);
      }
    }
  });

  print(string: string) {
    this.#nativeConsole.log(string);
  }

  register() {
    console = {
      ...console,
      log: (...args) => this.#logger.log(0, 'LOG', ...args),
      debug: (...args) => this.#logger.debug(args),
      error: (...args) => this.#logger.error(args),
      info: (...args) => this.#logger.info(args),
    }

    console.log("Logger initialized");
  }
}
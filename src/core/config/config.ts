import {Service} from "typedi";
import fs from "node:fs";
import Configstore from "configstore";

@Service()
export class Config {
  #configPath: string = './config.json';
  #configStore?: Configstore;

  setConfigPath(configPath: string) {
    this.#configPath = configPath;
  }

  private get config(): Configstore {
    if (!this.#configStore) {
      const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

      this.#configStore = new Configstore(packageJson.name, {foo: 'bar'}, {
        configPath: this.#configPath
      });
    }

    return this.#configStore;
  }

  get(key: string): any {
    return this.config.get(key);
  }
}
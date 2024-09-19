#!/usr/bin/env node
import {program} from 'commander';
import clear from "clear";
// import chalk from "chalk";
import figlet from "figlet";
import i18n from "./assets/i18n.js";
import {Logger} from "tslog";
import {Console} from "node:console";
import * as fs from "node:fs";
import Configstore from 'configstore';
import {GithubClient} from "./core/github-repository.js";
import {timeInStatus} from "./time-in-status/command.js";

clear();

const consoleNode = new Console({stdout: process.stdout, stderr: process.stderr});
consoleNode.log(figlet.textSync('Project Automation Tool', {
  font: 'Mini',
  horizontalLayout: 'full',
}));

const logger = new Logger({
  prettyLogTemplate: "{{hh}}:{{MM}}:{{ss}}:{{ms}}\t{{logLevelName}}\t[{{fileNameWithLine}}{{name}}]\t",
  overwrite: {
    transportFormatted: (msg, logArgs, logErrors) => {
      consoleNode.log(msg, ...logArgs, ...logErrors);
    }
  }
});

console = {
  ...console,
  log: (...args) => logger.log(0, 'LOG', ...args),
  debug: (...args) => logger.debug(args),
  error: (...args) => logger.error(args),
  info: (...args) => logger.info(args),
}

console.log("Logger initialized");


program
  .version('1.0.0')
  .description(
    `Project Automation Tool (PAT).
Simply use the following commands to interact with the tool.
Use directly using node or install globally to use the command gat.`
  );

const catchErrors = async (param: () => Promise<void>) => {
  try {
    await param();
  } catch (e) {
    console.error(e);
  }
}

const initializeConfig = (configPath: string) => {

  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

  return new Configstore(packageJson.name, {foo: 'bar'}, {
    configPath: configPath
  });
}

const fromArgsOrConfig = (args: any, configStore: Configstore, key: string) => {
  if (args[key]) {
    const value = args[key];

    configStore.set(key, value);
    return value;
  } else {
    return configStore.get(key);
  }
}

program
  .command('time-in-status')
  .option('-c, --configFile <configFile>', i18n.configFilePath)
  .option('-gt, --ghToken <ghToken>', i18n.ghToken)
  .option('-go, --ghOrganizationName <ghOrganizationName>', i18n.ghOrganizationName)
  .option('-gp, --ghProjectNumber <ghProjectNumber>', i18n.ghProjectNumber)
  .argument('<query>', 'Query to search')
  .action(async (query, args, command) => {
    await catchErrors(async () => {
      const configStore = initializeConfig(args?.configFile ?? './config.json');
      const organizationName = fromArgsOrConfig(args, configStore, 'ghOrganizationName');
      const projectNumber = fromArgsOrConfig(args, configStore, 'ghProjectNumber');

      const client = GithubClient.fromToken(args.ghToken);

      await timeInStatus({
          query,
          organizationName,
          projectNumber
        },
        client
      );
    })
  });

try {
  program.parse(process.argv);
} catch (e) {
  console.error(e)
}
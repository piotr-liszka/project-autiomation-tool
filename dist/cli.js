#!/usr/bin/env node
import 'reflect-metadata';
import { program } from 'commander';
import clear from "clear";
import figlet from "figlet";
import i18n from "./assets/i18n.js";
import { TimeInStatusCommand } from "./times/times.command.js";
import { ValidationError } from "./core/utils/error.js";
import { Container } from "typedi";
import { Config } from "./core/config/config.js";
import { Logger } from "./core/logger/logger.js";
import { GithubClient } from "./core/github-repository.js";
clear();
const logger = Container.get(Logger);
logger.register();
logger.print(figlet.textSync('Project Automation Tool', {
    font: 'Mini',
    horizontalLayout: 'full',
}));
program
    .version('1.0.0')
    .description(`Project Automation Tool (PAT).
Simply use the following commands to interact with the tool.
Use directly using node or install globally to use the command gat.`);
const catchErrors = async (param) => {
    try {
        await param();
    }
    catch (e) {
        console.error(e);
    }
};
program
    .command('time-in-status')
    .description(i18n.timeInStatus)
    .option('-c, --configFile <configFile>', i18n.configFilePath)
    .option('-gt, --ghToken <ghToken>', i18n.ghToken)
    .option('-go, --ghOrganizationName <ghOrganizationName>', i18n.ghOrganizationName)
    .option('-gp, --ghProjectNumber <ghProjectNumber>', i18n.ghProjectNumber)
    .argument('<query>', i18n.queryToStart)
    .action(async (query, args) => {
    await catchErrors(async () => {
        const config = Container.get(Config);
        if (args?.configFile) {
            config.setConfigPath(args.configFile);
        }
        const organizationName = args.ghOrganizationName || config.get('github.organizationName');
        const projectNumber = Number(args.ghProjectNumber || config.get('github.projectNumber'));
        if (!args.ghToken) {
            throw ValidationError.fromString(i18n.ghTokenRequired);
        }
        if (!organizationName) {
            throw ValidationError.fromString(i18n.ghOrganizationName);
        }
        if (!projectNumber) {
            throw ValidationError.fromString(i18n.projectNumberRequired);
        }
        const githubClient = Container.get(GithubClient);
        githubClient.authorize(args.ghToken);
        const command = Container.get(TimeInStatusCommand);
        await command.run({
            query,
            organizationName,
            projectNumber
        });
    });
});
try {
    program.parse(process.argv);
}
catch (e) {
    console.error(e);
}

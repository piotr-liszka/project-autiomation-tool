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
import { GithubClient } from "../core/github-repository.js";
import { Inject, Service } from "typedi";
import { Config } from "../core/config/config.js";
import { TimeInStatus } from "./models/time-in-status.js";
import { DateFormatter } from "../core/date/date-formatter.js";
import { markdown } from "markdown-doc-builder/lib/markdown/Markdown.js";
let TimeInStatusCommand = class TimeInStatusCommand {
    constructor(configstore, dateFormatter, githubClient) {
        this.configstore = configstore;
        this.dateFormatter = dateFormatter;
        this.githubClient = githubClient;
    }
    async run(queryParams) {
        const projectDetails = await this.githubClient.getProjectV2Info(queryParams.organizationName, queryParams.projectNumber);
        const startDateEnabled = Boolean(this.configstore.get('startDate.enabled'));
        const etaEnabled = Boolean(this.configstore.get('eta.enabled'));
        let index = 0;
        for await (const response of this.githubClient.findIssues(projectDetails, queryParams)) {
            if (response.status === 'error') {
                console.error(response.error);
                continue;
            }
            const issue = response.model;
            console.log(`${++index}/${response.total} start processing ${issue.ref}`);
            if (startDateEnabled && issue.statusEqualsTo(this.configstore.get('startDate.status')) && !issue.params.startDate) {
                const startDate = projectDetails.params.fields.find(item => item.name === 'start date');
                if (startDate) {
                    await this.githubClient.updateField(issue, startDate.id, new Date());
                    console.log(`Start date updated`);
                }
            }
            const comment = issue.getMetadataComment('time-in-status');
            const times = TimeInStatus.fromComment(comment, issue.params.status, issue.params.startDate, issue.params.eta);
            const periods = times.recalculateDeltaTimes();
            const body = markdown.newBuilder().headerOrdered(false);
            if (startDateEnabled || etaEnabled) {
                body.h3('Actual values').newline();
            }
            if (startDateEnabled && times.actualStartDate) {
                body.text('🚀 Start date: ' + this.dateFormatter.formatCombined(times.actualStartDate)).newline();
            }
            if (etaEnabled && times.actualEta) {
                const indicator = times.isPastActualEta() ? '🔴' : '🟢';
                body.text(indicator + ' ETA: ' + this.dateFormatter.formatCombined(times.actualEta)).newline();
            }
            if (etaEnabled && times.isPastActualEta()) {
                body.text('⚠️ Issue is past ETA').newline();
            }
            if ((startDateEnabled || etaEnabled) && (times.originalEtaChanged() || times.originalStartChanged())) {
                body.h3('Original values');
                body.newline();
                if (startDateEnabled && times.originalStartChanged() && times.metadata.originalStart) {
                    body.text('🚀 Original start date: ' + this.dateFormatter.formatCombined(times.metadata.originalStart));
                    body.newline();
                }
                if (etaEnabled && times.originalEtaChanged() && times.metadata.originalEta) {
                    const indicator = times.isPastOriginalEta() ? '🔴' : '🟢';
                    body.text(indicator + ' Original ETA: ' + this.dateFormatter.formatCombined(times.metadata.originalEta));
                    body.newline();
                }
            }
            body.h3('Time in status');
            const headers = ['ID', 'Status', 'Time in Status'];
            if (etaEnabled) {
                headers.push('Past Original ETA', 'Past Actual ETA');
            }
            const table = markdown.newTableBuilder(0, 5)
                .header(headers);
            Array.from(periods).forEach((period, index) => {
                const row = [
                    String(index + 1),
                    period.status.name,
                    this.dateFormatter.formatDiff(period.from, period.to)
                ];
                if (etaEnabled) {
                    row.push(period.pastOriginalEta ? '⚠️' : '');
                    row.push(period.pastActualEta ? '⚠️' : '');
                }
                table.appendRow(row);
            });
            body.table(table);
            comment.params.content.setMetadata(times.metadata);
            comment.params.content.params.body = body.toMarkdown();
            await this.githubClient.saveComment(issue, comment);
            console.log(`Issue processed`);
        }
    }
};
TimeInStatusCommand = __decorate([
    Service(),
    __param(0, Inject()),
    __param(1, Inject()),
    __param(2, Inject()),
    __metadata("design:paramtypes", [Config,
        DateFormatter,
        GithubClient])
], TimeInStatusCommand);
export { TimeInStatusCommand };

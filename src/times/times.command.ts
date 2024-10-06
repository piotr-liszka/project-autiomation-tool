import {GithubClient} from "../core/github-repository.js";
import {Inject, Service} from "typedi";
import {Config} from "../core/config/config.js";
import {TimeInStatus, TimeInStatusMetadata} from "./models/time-in-status.js";
import {DateFormatter} from "../core/date/date-formatter.js";
import {markdown} from "markdown-doc-builder/lib/markdown/Markdown.js"

type CommandParams = {
  query: string,
  organizationName: string,
  projectNumber: number
};

@Service()
export class TimeInStatusCommand {
  constructor(
    @Inject() private configstore: Config,
    @Inject() private dateFormatter: DateFormatter,
    @Inject() private githubClient: GithubClient,
  ) {
  }

  async run(
    queryParams: CommandParams
  ) {
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
        const startDate = projectDetails.params.fields.find(
          item => item.name === 'start date'
        );

        if (startDate) {
          await this.githubClient.updateField(issue, startDate.id, new Date());
          console.log(`Start date updated`);
        }
      }

      const comment = issue.getMetadataComment<TimeInStatusMetadata>('time-in-status');
      const times = TimeInStatus.fromComment(
        comment,
        issue.params.status,
        issue.params.startDate,
        issue.params.eta
      );
      const periods = times.recalculateDeltaTimes();

      const body = markdown.newBuilder().headerOrdered(false);

      if(startDateEnabled || etaEnabled) {
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
        .header(headers)

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
}
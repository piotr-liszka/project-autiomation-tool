import {GithubClient} from "../core/github-repository.js";
import {CommentModel} from "../core/models/comment.js";
import {ContentModel} from "../core/models/content.js";
import {TimeInStatus, TimeInStatusMetadata} from "./models/time-in-status.js";
import {formatDate} from "../core/utils/date.js";
import Configstore from "configstore";

type CommandParams = {
  query: string,
  organizationName: string,
  projectNumber: number
};

export const timeInStatus = async (
  configstore: Configstore,
  queryParams: CommandParams,
  githubClient: GithubClient
) => {
  const projectDetails = await githubClient.getProjectV2Info(queryParams.organizationName, queryParams.projectNumber);

  let i = 0;

  for await (const response of githubClient.findIssues(projectDetails, queryParams)) {
    if (response.status === 'error') {
      console.error(response.error);
      continue;
    }

    const issue = response.model;
    console.log(`${++i}/${response.total} start processing ${issue.ref}`);

    const startStatusName = configstore.get('startStatus');
    const isStartStatus = startStatusName && issue.params.status.name.toLowerCase().includes(startStatusName);

    if (isStartStatus && !issue.params.startDate) {
      const startDate = projectDetails.params.fields.find(item => item.name === 'start date');

      if (startDate) {
        await githubClient.updateField(issue, startDate.id, new Date());
        console.log(`Start date updated`);
      }
    }

    const comments = issue.params.comments;
    let timeInStatusComment = comments.find(comment => comment.params.content.params.type === 'time-in-status')

    if (!timeInStatusComment) {
      timeInStatusComment = CommentModel.fromContent(
        ContentModel.empty('time-in-status')
      );
    }

    const content = timeInStatusComment.params.content as ContentModel<TimeInStatusMetadata>;
    const times = TimeInStatus.fromIssue(issue, content.params.metadata);

    if (times.statusChanged()) {
      times.addCurrentStatus();
      console.log('New status detected ' + issue.params.status.name);
      content.setMetadata(times.metadata);
    }

    const periods = times.recalculateDeltaTimes();
    let body = '';

    body += '### Actual values \n';

    if (times.actualStart) {
      body += '🚀 Start date: ' + formatDate(times.actualStart, 'combined') + '\n';
    }

    if (times.actualEta) {
      if(times.isPastActualEta()) {
        body += '🔴 '
      } else {
        body += '🟢 '
      }
      body += 'ETA: ' + formatDate(times.actualEta, 'combined') + '\n';
    }

    if (times.isPastActualEta()) {
      body += '⚠️ Issue is past ETA\n';
    }

    if (times.originalEtaChanged() || times.originalStartChanged()) {
      body += '### Original values \n';

      if (times.originalStartChanged() && times.metadata.originalStart) {
        body += '🚀 Original Start: ' + formatDate(times.metadata.originalStart, 'combined') + '\n';
      }

      if (times.originalEtaChanged() && times.metadata.originalEta) {
        if(times.isPastOriginalEta()) {
          body += '🔴 '
        } else {
          body += '🟢 '
        }
        body += 'Original ETA: ' + formatDate(times.metadata.originalEta, 'combined') + '\n';
      }
    }

    body += '## Status history \n';
    body += '| id | status | time in status | past original ETA | past actual ETA | \n| :---:   | :---: | :---: | :---: | :--: |\n';

    Array.from(periods).forEach((period, index) => {
      body += `| ${index + 1} | ${period.status.name} |  ${period.delta} | ${period.pastOriginalEta ? '⚠️' : ''} | ${period.pastActualEta ? '⚠️' : ''} |\n`;
    });
    content.params.body = body
    await githubClient.saveComment(issue, timeInStatusComment);

    console.log(`Issue processed`);
    console.log(body);
  }
}

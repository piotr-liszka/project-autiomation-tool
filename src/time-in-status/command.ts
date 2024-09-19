import {GithubClient} from "../core/github-repository.js";
import {CommentModel} from "../core/models/comment.js";
import {ContentModel} from "../core/models/content.js";
import {TimeInStatus, TimeInStatusMetadata} from "./time-in-status.js";
import {format} from "../core/utils/date.js";

export const timeInStatus = async (queryParams: {
  query: string,
  organizationName: string,
  projectNumber: number
}, githubClient: GithubClient) => {

  console.debug('Start with', queryParams.query);

  const config = {
    workDays: [0, 1, 2, 3, 4],
    workHours: [8, 17],
  }
  let i = 0;

  for await (const response of githubClient.findIssues(queryParams)) {
    if (response.status === 'error') {
      console.error(response.error);
      continue;
    }

    const issue = response.model;
    console.log(`${++i}/${response.total} start processing ${issue.ref}`);

    const comments = issue.params.comments;

    let timeInStatusComment = comments.find(comment => comment.params.content.params.type === 'time-in-status')

    if (!timeInStatusComment) {
      const newContent = ContentModel.empty('time-in-status');
      timeInStatusComment = CommentModel.fromContent(newContent);
    }

    const content = timeInStatusComment.params.content;
    const times = TimeInStatus.fromIssue(issue, (content.params.metadata as Partial<TimeInStatusMetadata>));


    if (times.statusChanged()) {
      times.addCurrentStatus();
      content.params.metadata = times.getMetadata();

      let body = '| id | status | period | time in status | past ETA | \n| :---:   | :---: | :---: | :---: | :--: |\n';

      const periods = times.recalculateDeltaTimes();

      Array.from(periods).forEach((period, index) => {
        body += `| ${index + 1} | ${period.status.name} | ${format(period.from)} - ${format(period.to)} |  ${period.delta} | ${period.pastEta ? '⚠️' : ''} |\n`;
      });
      content.params.body = body

      await githubClient.saveComment(issue, timeInStatusComment);
      console.log('Updated: ' + issue.ref)
    } else {
      console.log('Nothing changed for: ' + issue.ref)
    }
  }

}

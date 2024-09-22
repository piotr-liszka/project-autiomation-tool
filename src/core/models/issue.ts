import {ContentModel} from './content.js';
import {UserModel} from "./user.js";
import {CommentModel} from "./comment.js";
import {ProjectModel} from "./project.js";

export type IssuePriority = 'high' | 'medium' | 'low';
export type IssueType = 'bug' | 'story' | 'epic';

export type IssueStatus = {
  type: 'todo' | 'in_progress' | 'done';
  name: string;
  updatedAt: Date | null;
}

export class IssueModel {
  constructor(
    public params: {
      id: {
        v2: string;
        number: number
      }
      author: UserModel;
      type: IssueType;
      title: string;
      status: IssueStatus;
      priority: IssuePriority;
      project?: ProjectModel,
      labels: string[];
      mondayUrl?: string;
      freshdeskUrl?: string;
      assignees: UserModel[];
      content?: ContentModel;
      url: string;
      comments: CommentModel[];
      eta?: Date;
      startDate?: Date;
    },
    public id: string,
    public createdAt?: Date,
    public updatedAt?: Date,
  ) {
  }

  get ref() {
    return `#${this.params.id.number}: ${this.params.title} (${this.params.url}})`
  }
}

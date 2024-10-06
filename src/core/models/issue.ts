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

  getMetadataComment<T>(type: 'time-in-status'): CommentModel<T> {
    const comments = this.params.comments;
    let timeInStatusComment = comments.find(
      comment => comment.params.content.params.type === type
    )

    if (!timeInStatusComment) {
      return CommentModel.fromContent(
        ContentModel.empty('time-in-status')
      );
    }

    return timeInStatusComment as CommentModel<T>;
  }

  statusEqualsTo(status?: string, strict: boolean = false) {
    if (!status) {
      return false;
    }
    if (strict) {
      return this.params.status.name.toLowerCase() === status?.toLowerCase();
    }
    return this.params.status.name.toLowerCase().includes(status)
  }
}

import { ContentModel } from './content.js';
import { CommentModel } from "./comment.js";
export class IssueModel {
    constructor(params, id, createdAt, updatedAt) {
        this.params = params;
        this.id = id;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    get ref() {
        return `#${this.params.id.number}: ${this.params.title} (${this.params.url}})`;
    }
    getMetadataComment(type) {
        const comments = this.params.comments;
        let timeInStatusComment = comments.find(comment => comment.params.content.params.type === type);
        if (!timeInStatusComment) {
            return CommentModel.fromContent(ContentModel.empty('time-in-status'));
        }
        return timeInStatusComment;
    }
    statusEqualsTo(status, strict = false) {
        if (!status) {
            return false;
        }
        if (strict) {
            return this.params.status.name.toLowerCase() === status?.toLowerCase();
        }
        return this.params.status.name.toLowerCase().includes(status);
    }
}

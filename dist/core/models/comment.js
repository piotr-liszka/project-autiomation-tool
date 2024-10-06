export class CommentModel {
    constructor(params, id, createdAt, updatedAt) {
        this.params = params;
        this.id = id;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    static fromContent(content) {
        return new CommentModel({
            content
        });
    }
}

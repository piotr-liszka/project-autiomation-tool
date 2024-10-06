export class PullRequestModel {
    constructor(params, id) {
        this.params = params;
        this.id = id;
    }
    setBody(contentModel) {
        this.params.body = contentModel;
    }
}

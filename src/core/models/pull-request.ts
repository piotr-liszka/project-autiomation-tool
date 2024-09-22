import {ContentModel} from "./content";

export class PullRequestModel {
  constructor(
    public params: {
      title: string;
      body?: ContentModel
    },
    public id?: string,
  ) {
  }

  setBody<T>(contentModel: ContentModel<T>) {
    this.params.body = contentModel;
  }
}
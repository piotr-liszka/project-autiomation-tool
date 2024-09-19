import {ContentModel} from "./content.js";
import {UserModel} from "./user.js";

export class CommentModel {
  constructor(
    public params: {
      content: ContentModel,
      author?: UserModel,
    },
    public id?: string,
    public createdAt?: Date,
    public updatedAt?: Date,
  ) {
  }

  static fromContent(content: ContentModel) {
    return new CommentModel({
      content
    })
  }
}
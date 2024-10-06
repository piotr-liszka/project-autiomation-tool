import {ContentModel} from "./content.js";
import {UserModel} from "./user.js";

export class CommentModel<METADATA = unknown> {
  constructor(
    public params: {
      content: ContentModel<METADATA>,
      author?: UserModel,
    },
    public id?: string,
    public createdAt?: Date,
    public updatedAt?: Date,
  ) {
  }

  static fromContent<T>(content: ContentModel<T>) {
    return new CommentModel<T>({
      content
    })
  }
}
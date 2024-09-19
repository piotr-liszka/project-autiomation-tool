export class UserModel {
  constructor(
    public params: {
      name: string | null;
    },
    public id?: string,
    public createdAt?: Date,
    public updatedAt?: Date,
  ) {
  }
}
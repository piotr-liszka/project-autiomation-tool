export class UserModel {
  constructor(
    public params: {
      uniqName: string | null;
    },
    public id?: string,
    public createdAt?: Date,
    public updatedAt?: Date,
  ) {
  }
}
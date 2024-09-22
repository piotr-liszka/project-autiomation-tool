export class ProjectModel {
  constructor(
    public params: {
      title: string,
      number?: number,
      fields: {
        name: string;
        id: string;
      }[],
      organization: {
        id?: string,
        uniqName: string,
        name: string
      }
    },
    public id?: string,
  ) {
  }
}
export class IssueMetadata {
  constructor(
    private metadata = new Map<string, any>(),
  ) {
  }

  setMetadata(key: string, value: any) {
    this.metadata.set(key, value);
  }

  toString() {
    return JSON.stringify(Array.from(this.metadata.entries()));
  }

  get(type: string) {
    return this.metadata.get(type);
  }

  static fromString(metadata: string) {
    if(!metadata) {
      return new IssueMetadata();
    }

    const array = JSON.parse(metadata);

    if(Array.isArray(array)) {
      return new IssueMetadata(new Map(array));
    }

    return new IssueMetadata();
  }
}

import {IssueStatus} from "../../core/models/issue.js";
import {CommentModel} from "../../core/models/comment.js";

export type TimeInStatusMetadata = {
  originalStart?: Date,
  originalEta?: Date,
  statusChanges?: {
    status: IssueStatus,
  }[]
}

export class TimeInStatus {
  constructor(
    public metadata: TimeInStatusMetadata = {},
    public actualStartDate?: Date,
    public actualEta?: Date,
  ) {
  }

  static fromComment(
    comment: CommentModel<TimeInStatusMetadata>,
    currentStatus: IssueStatus,
    startDate?: Date,
    eta?: Date,
  ) {
    const metadata = comment.params.content.params.metadata;
    const statuses = metadata?.statusChanges ?? [];

    if(metadata && statuses.length > 0 && statuses[statuses.length - 1].status.name !== currentStatus.name) {
      metadata.statusChanges?.push({
        status: currentStatus,
      })
    }

    return new TimeInStatus(
      metadata,
      startDate,
      eta
    )
  }

  get #statusChanges() {
    return this.metadata.statusChanges ?? [];
  }

  recalculateDeltaTimes() {
    const periods = new Set<{
      from: Date,
      to: Date,
      status: IssueStatus,
      pastOriginalEta: boolean
      pastActualEta: boolean
    }>()

    this.#statusChanges.forEach((item, index) => {
      if (!item.status.updatedAt) {
        return;
      }

      const nextUpdatedAt = this.#statusChanges[index + 1]?.status?.updatedAt;

      const from = new Date(item.status.updatedAt);
      const to = nextUpdatedAt ? new Date(nextUpdatedAt) : new Date();
      periods.add({
        from,
        to,
        status: item.status,
        pastOriginalEta: Boolean(this.metadata.originalEta && to > this.metadata.originalEta),
        pastActualEta: Boolean(this.actualEta && to > this.actualEta),
      })
    })

    return periods;
  }

  isPastOriginalEta() {
    if (!this.metadata.originalEta) {
      return false;
    }

    return new Date() > this.metadata.originalEta;
  }

  isPastActualEta() {
    if (!this.actualEta) {
      return false;
    }

    return new Date() > this.actualEta;
  }

  originalEtaChanged() {
    return this.metadata.originalEta !== this.actualEta;
  }

  originalStartChanged() {
    return this.metadata.originalStart !== this.actualStartDate;
  }
}

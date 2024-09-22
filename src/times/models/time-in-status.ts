import {IssueModel, IssueStatus} from "../../core/models/issue.js";
import {formatDate} from "../../core/utils/date.js";

export type TimeInStatusMetadata = {
  originalStart?: Date,
  originalEta?: Date,
  statusChanges?: {
    status: IssueStatus,
  }[]
}

export class TimeInStatus {
  constructor(
    public currentStatus: IssueStatus,
    private commentMetadata: Partial<TimeInStatusMetadata>,
    public actualStart?: Date,
    public actualEta?: Date,
  ) {
  }

  get statusChanges() {
    return this.commentMetadata.statusChanges ?? [];
  }

  static fromIssue(issue: IssueModel, metadata?: Partial<TimeInStatusMetadata>) {
    if (!issue.params.id) {
      throw new Error('Issue id is required to create a TimeInStatus');
    }

    return new TimeInStatus(
      issue.params.status,
      {
        ...metadata,
        originalEta: metadata?.originalEta ?? issue.params.eta,
        originalStart: metadata?.originalStart ?? issue.params.startDate,
      },
      issue.params.startDate,
      issue.params.eta,
    )
  }

  statusChanged() {
    if (this.statusChanges.length === 0) {
      return true;
    }

    if (this.currentStatus.name !== this.statusChanges[this.statusChanges.length - 1]?.status.name) {
      return true;
    }

    return false;
  }

  addCurrentStatus() {
    this.statusChanges.push({
      status: this.currentStatus,
    })
  }

  get metadata(): TimeInStatusMetadata {
    return {
      originalStart: this.commentMetadata.originalStart,
      originalEta: this.commentMetadata.originalEta,
      statusChanges: this.statusChanges
    };
  }


  recalculateDeltaTimes() {
    const periods = new Set<{
      from: Date,
      to: Date,
      status: IssueStatus,
      delta: string,
      pastOriginalEta: boolean
      pastActualEta: boolean
    }>()

    this.statusChanges.forEach((item, index) => {
      if (!item.status.updatedAt) {
        return;
      }

      const nextUpdatedAt = this.statusChanges[index + 1]?.status?.updatedAt;

      const from = new Date(item.status.updatedAt);
      const to = nextUpdatedAt ? new Date(nextUpdatedAt) : new Date();
      periods.add({
        from,
        to,
        status: item.status,
        delta: formatDate(from, 'delta', to),
        pastOriginalEta: Boolean(this.metadata.originalEta && to > this.metadata.originalEta),
        pastActualEta: Boolean(this.actualEta && to > this.actualEta),
      })
    })

    return periods;
  }

  isPastOriginalEta() {
    if(!this.metadata.originalEta) {
      return false;
    }

    return new Date() > this.metadata.originalEta;
  }

  isPastActualEta() {
    if(!this.actualEta) {
      return false;
    }

    return new Date() > this.actualEta;
  }


  originalEtaChanged() {
    return this.metadata.originalEta !== this.actualEta;
  }

  originalStartChanged() {
    return this.metadata.originalStart !== this.actualStart;
  }

}

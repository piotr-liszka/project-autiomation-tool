import {IssueModel, IssueStatus} from "../core/models/issue.js";
import timeDelta from "time-delta";

export type TimeInStatusMetadata = {
  statusChanges?: {
    status: IssueStatus,
  }[]
}

export class TimeInStatus {
  constructor(
    private currentStatus: IssueStatus,
    private commentMetadata: Partial<TimeInStatusMetadata>,
    private eta?: Date,
  ) {
  }

  get statusChanges() {
    return this.commentMetadata.statusChanges ?? [];
  }

  static fromIssue(issue: IssueModel, metadata: Partial<TimeInStatusMetadata>) {
    if (!issue.params.id) {
      throw new Error('Issue id is required to create a TimeInStatus');
    }

    return new TimeInStatus(
      issue.params.status,
      metadata,
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

  get timeInStatus() {
    const statuses = new Map<string, { from: Date, to: Date }>()

    return '';
  }

  getMetadata(): TimeInStatusMetadata {
    return {
      statusChanges: this.statusChanges
    };
  }


  recalculateDeltaTimes() {

    const periods = new Set<{
      from: Date,
      to: Date,
      status: IssueStatus,
      delta: string,
      pastEta: boolean
    }>()

    const instance = timeDelta.create({
      locale: 'en', // default
    });
    let etaPlus: Date;
    if(this.eta) {
      etaPlus = new Date(this.eta);
      etaPlus.setHours(20, 0, 0, 0);
    }

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
        delta: instance.format(from, to),
        pastEta: Boolean(etaPlus && to > etaPlus),
      })
    })

    return periods;
  }
}

var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _TimeInStatus_instances, _TimeInStatus_statusChanges_get;
export class TimeInStatus {
    constructor(metadata = {}, actualStartDate, actualEta) {
        _TimeInStatus_instances.add(this);
        this.metadata = metadata;
        this.actualStartDate = actualStartDate;
        this.actualEta = actualEta;
    }
    static fromComment(comment, currentStatus, startDate, eta) {
        const metadata = comment.params.content.params.metadata;
        const statuses = metadata?.statusChanges ?? [];
        if (metadata && statuses.length > 0 && statuses[statuses.length - 1].status.name !== currentStatus.name) {
            metadata.statusChanges?.push({
                status: currentStatus,
            });
        }
        return new TimeInStatus(metadata, startDate, eta);
    }
    recalculateDeltaTimes() {
        const periods = new Set();
        __classPrivateFieldGet(this, _TimeInStatus_instances, "a", _TimeInStatus_statusChanges_get).forEach((item, index) => {
            if (!item.status.updatedAt) {
                return;
            }
            const nextUpdatedAt = __classPrivateFieldGet(this, _TimeInStatus_instances, "a", _TimeInStatus_statusChanges_get)[index + 1]?.status?.updatedAt;
            const from = new Date(item.status.updatedAt);
            const to = nextUpdatedAt ? new Date(nextUpdatedAt) : new Date();
            periods.add({
                from,
                to,
                status: item.status,
                pastOriginalEta: Boolean(this.metadata.originalEta && to > this.metadata.originalEta),
                pastActualEta: Boolean(this.actualEta && to > this.actualEta),
            });
        });
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
_TimeInStatus_instances = new WeakSet(), _TimeInStatus_statusChanges_get = function _TimeInStatus_statusChanges_get() {
    return this.metadata.statusChanges ?? [];
};

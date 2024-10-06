import {Inject, Service} from "typedi";
import timeDelta, {Formatter} from "time-delta";
import {Config} from "../config/config.js";

@Service()
export class DateFormatter {
  #timeDeltaFormatter: Formatter;

  constructor(@Inject() private config: Config) {
    this.#timeDeltaFormatter = timeDelta.create({
      locale: config.get('dateFormatter.locale') ?? 'en',
    });
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  formatDiff(date: Date, compareTo?: Date): string {
    return this.#timeDeltaFormatter.format(date, compareTo ?? new Date());
  }

  formatCombined(date: Date, compareTo?: Date): string {
    return this.formatDate(date) + ' (' + this.formatDiff(date, compareTo) + ')';
  }
}
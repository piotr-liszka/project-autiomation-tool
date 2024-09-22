import timeDelta from "time-delta";

const timeDeltaFormatter = timeDelta.create({
  locale: 'en',
});

export const formatDate = (date: Date, format: 'yy-mm-dd hh:ss' | 'delta' | 'combined' = 'yy-mm-dd hh:ss', compareTo?: Date): string => {
  switch (format) {
    case 'delta':
      return timeDeltaFormatter.format(date, compareTo ?? new Date());
    case 'combined':
      return formatDate(date) + ' (' + formatDate(date, 'delta') + ')'
    default:
      return date.toLocaleDateString('en', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
  }
}


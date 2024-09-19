export const format = (date: Date) => {
  return date.toLocaleDateString('en', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
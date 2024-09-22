const reviewer = (key: string, value: unknown) => {
  if (typeof value === 'string') {
    const date = new Date(value);
    if(!isNaN(date.getTime())) {
      return date;
    }
  }
  return value;
}

export const serialize = <T = Object | unknown>(val: T) => {
  return JSON.stringify(val);
}

export const unserialize = <T = Object | unknown>(val: string): T => {
  return JSON.parse(val, reviewer);
}

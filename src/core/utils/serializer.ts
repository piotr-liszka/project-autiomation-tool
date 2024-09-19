const reviewer = (key: string, value: unknown) => {
  let a;
  if (typeof value === 'string') {
    a = /\/Date\((\d*)\)\//.exec(value);
    if (a) {
      return new Date(+a[1]);
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

const reviewer = (key, value) => {
    if (typeof value === 'string') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            return date;
        }
    }
    return value;
};
export const serialize = (val) => {
    return JSON.stringify(val);
};
export const unserialize = (val) => {
    return JSON.parse(val, reviewer);
};

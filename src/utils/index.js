export const isNullish = (v) => v === undefined || v === null;
export const isEmpty = (v) => !v || !v.length;
export const flatMap = (arr, func) => [].concat.apply([], arr.map(func));

/**
 * Split a string by separator, trim whitespace and filter empty values
 *
 * @example
 * // splits on , by default
 * smartSplit('1, 2, 3') // ['1', '2', '3']
 * smartSplit('1, 2, 3, ') // ['1', '2', '3']
 * smartSplit('1, 2  ,, ,  , 3  ') // ['1', '2', '3']
 * // custom separator
 * smartSplit('1; 2; 3', ';') // ['1', '2', '3']
 *
 * @param {string} string
 * @param {string} separator - default is comma ( , )
 * @returns {Array}
 */
export const smartSplit = (string, separator = ',') => {
  if (!string) {
    return;
  }

  return string
    .trim()
    .split(new RegExp(` *${separator} *`))
    .filter(Boolean);
};

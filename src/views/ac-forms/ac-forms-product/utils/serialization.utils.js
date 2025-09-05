/**
 * stripLocalIds
 * Recursively removes UI-only fields (like _localId, standaardnaam) from a value
 * before sending to the API.
 *
 * @param {any} value - Arbitrary value to sanitize
 * @returns {any} A sanitized deep copy of the input value
 */
export const stripLocalIds = (value) => {
  if (Array.isArray(value)) {
    return value.map(stripLocalIds).filter((v) => v != null);
  }
  if (value && typeof value === 'object') {
    const out = {};
    Object.keys(value).forEach((k) => {
      if (k === '_localId') return;
      // Remove UI-only fields from compliancy objects
      if (k === 'standaardnaam') return;
      out[k] = stripLocalIds(value[k]);
    });
    return out;
  }
  return value;
};

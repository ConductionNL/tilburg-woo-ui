/**
 * stripLocalIds
 * Recursively removes UI-only fields (like _localId, standaardnaam, bewijsFilename, aanbieder*) from a value
 * before sending to the API. Preserves existing IDs by converting them back to the 'id' field.
 * Also filters compliancy array to only include entries whose standaardversie is in the standaardVersies array.
 *
 * @param {any} value - Arbitrary value to sanitize
 * @returns {any} A sanitized deep copy of the input value
 */
export const stripLocalIds = (value) => {
  if (Array.isArray(value)) {
    return value.map(stripLocalIds).filter((v) => v != null);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const out = {};

  Object.keys(value).forEach((k) => {
    if (k === '_localId') {
      if (typeof value[k] === 'string' && value[k].startsWith('existing_')) {
        out.id = value[k].replace('existing_', '');
      }
      return;
    }

    if (k === 'standaardnaam' || k === 'bewijsFilename') {
      return;
    }

    if (k === 'compliancy' && Array.isArray(value[k])) {
      const standaardVersiesArray = Array.isArray(value.standaardVersies)
        ? value.standaardVersies.map(String)
        : [];
      const legacyStandaardenArray = Array.isArray(value.standaarden)
        ? value.standaarden.map(String)
        : [];
      const validIds = new Set([...standaardVersiesArray, ...legacyStandaardenArray]);

      const filteredCompliancy = value[k].filter((compliancy) => {
        if (!compliancy?.standaardversie) return false;
        return validIds.size === 0 || validIds.has(String(compliancy.standaardversie));
      });

      out[k] = filteredCompliancy.map(stripLocalIds);
      return;
    }

    out[k] = stripLocalIds(value[k]);
  });

  return out;
};

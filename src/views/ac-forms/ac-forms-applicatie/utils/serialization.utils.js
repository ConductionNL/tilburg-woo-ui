/**
 * stripLocalIds
 * Recursively removes UI-only fields (like _localId, standaardnaam, bewijsFilename, aanbieder*) from a value
 * before sending to the API. Preserves existing IDs by converting them back to the 'id' field.
 * Also filters compliancy array to only include entries whose standaardversie is in the standaarden array.
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
      if (k === '_localId') {
        // ✅ FIXED: Preserve existing IDs by converting them back to 'id' field
        if (typeof value[k] === 'string' && value[k].startsWith('existing_')) {
          const existingId = value[k].replace('existing_', '');
          out.id = existingId;
        }
        // Skip local IDs that don't represent existing objects
        return;
      }
      // Remove UI-only fields from compliancy objects
      if (k === 'standaardnaam') return;
      // ✅ NEW: Remove filename field before saving
      if (k === 'bewijsFilename') return;

      // Special handling for compliancy array: filter to only include compliant entries
      if (
        k === 'compliancy' &&
        Array.isArray(value[k]) &&
        Array.isArray(value.standaarden)
      ) {
        const standaardenSet = new Set(value.standaarden.map(String));
        const filteredCompliancy = value[k].filter((compliancy) => {
          if (!compliancy || !compliancy.standaardversie) return false;
          return standaardenSet.has(String(compliancy.standaardversie));
        });
        out[k] = filteredCompliancy.map(stripLocalIds);
        return;
      }

      out[k] = stripLocalIds(value[k]);
    });
    return out;
  }
  return value;
};

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
      // Check both standaardVersies (new camelCase) and standaarden (legacy) arrays
      if (k === 'compliancy' && Array.isArray(value[k])) {
        // Build a set of all valid standaardversie IDs from both arrays
        const standaardVersiesArray = Array.isArray(value.standaardVersies)
          ? value.standaardVersies.map(String)
          : [];
        const legacyStandaardenArray = Array.isArray(value.standaarden)
          ? value.standaarden.map(String)
          : [];
        const allValidIds = new Set([
          ...standaardVersiesArray,
          ...legacyStandaardenArray,
        ]);

        // Only filter if we have valid IDs to check against
        if (allValidIds.size > 0) {
          const filteredCompliancy = value[k].filter((compliancy) => {
            if (!compliancy || !compliancy.standaardversie) return false;
            return allValidIds.has(String(compliancy.standaardversie));
          });
          out[k] = filteredCompliancy.map(stripLocalIds);
        } else {
          // If no valid IDs, keep all compliancy entries
          out[k] = value[k].map(stripLocalIds);
        }
        return;
      }

      out[k] = stripLocalIds(value[k]);
    });
    return out;
  }
  return value;
};

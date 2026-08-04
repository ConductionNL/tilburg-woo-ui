/**
 * stripLocalIds
 * Recursively removes UI-only fields (like _localId, standaardnaam) from a value
 * Recursively removes UI-only fields (like _localId, standaardnaam, bewijsFilename, aanbieder*) from a value
 * before sending to the API. Preserves existing IDs by converting them back to the 'id' field.
 *
 * NOTE: bewijsFilename is NOT removed here because it's needed during the upload process.
 * It will be removed after files are uploaded in uploadCompliancyEvidence.
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
      // Remove filename field before saving
      if (k === 'bewijsFilename') return;
      // Remove raw File object (uploaded separately via multipart)
      if (k === 'bewijsFile') return;
      // ✅ NEW: Remove aanbieder* fields (only used for creating new organization)
      if (
        [
          'aanbiederNaam',
          'aanbiederType',
          'aanbiederWebsite',
          'aanbiederBeschrijvingKort',
          'aanbiederBeschrijvingLang',
          'aanbiederEmail',
          'aanbiederTelefoonnummer',
          'aanbiederKvkNummer',
          'aanbiederLogo',
        ].includes(k)
      )
        return;
      out[k] = stripLocalIds(value[k]);
    });
    return out;
  }
  return value;
};

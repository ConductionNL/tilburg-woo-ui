/**
 * Maps Dutch link slugs (e.g., "applicaties") to schema slugs (e.g., "module").
 * This is the reverse of normalizeSchemaName - it converts URL path segments to API schema identifiers.
 * @param {string} linkSlug - The slug from a menu link (e.g., "applicaties" from "/beheer/applicaties")
 * @returns {string} The corresponding schema slug for API calls
 */
export const normalizeLinkToSchemaSlug = (linkSlug) => {
  if (!linkSlug) return '';
  const key = String(linkSlug).toLowerCase();
  switch (key) {
    case 'producten':
      return 'product';
    case 'applicaties':
      return 'module';
    case 'applicatieversie':
    case 'applicatiesversie':
    case 'moduleversie':
      return 'moduleversie';
    case 'diensten':
      return 'dienst';
    case 'gebruik':
      return 'gebruik';
    case 'versie':
      return 'versie';
    case 'contracten':
      return 'contract';
    case 'overeenkomsten':
      return 'overeenkomst';
    case 'organisaties':
      return 'organisatie';
    case 'kwetsbaarheden':
      return 'kwetsbaarheid';
    case 'koppelingen':
      return 'koppeling';
    case 'contactpersonen':
      return 'contactpersoon';
    // Handle singular forms that might appear in links
    case 'product':
    case 'module':
    case 'dienst':
    case 'contract':
    case 'overeenkomst':
    case 'organisatie':
    case 'kwetsbaarheid':
    case 'koppeling':
    case 'contactpersoon':
      return key;
    default:
      return linkSlug;
  }
};

/**
 * Returns the singular Dutch label for a given header key or label.
 * Falls back to the provided name when no mapping exists.
 */
export const normalizeSchemaName = (name) => {
  if (!name) return '';
  const key = String(name).toLowerCase();
  switch (key) {
    case 'product':
    case 'producten':
      return 'Product';
    case 'module':
    case 'applicaties':
      return 'Applicatie';
    case 'dienst':
    case 'diensten':
      return 'Dienst';
    case 'gebruik':
      return 'Gebruik';
    case 'versie':
      return 'Versie';
    case 'contract':
    case 'contracten':
      return 'Contract';
    case 'overeenkomst':
    case 'overeenkomsten':
      return 'Overeenkomst';
    case 'organisatie':
    case 'organisaties':
      return 'Organisatie';
    case 'kwetsbaarheid':
    case 'kwetsbaarheden':
      return 'Kwetsbaarheid';
    case 'koppeling':
    case 'koppelingen':
      return 'Koppeling';
    case 'contactpersoon':
    case 'contactpersonen':
      return 'Contactpersoon';
    default:
      return name;
  }
};

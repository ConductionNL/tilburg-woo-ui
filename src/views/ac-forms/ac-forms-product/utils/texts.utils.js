/**
 * getPageTitle
 * Returns the localized page title based on the form type.
 *
 * @param {string} formType - One of 'eigen', 'ontbrekend', or ''
 * @returns {string} Localized title
 */
export const getPageTitle = (formType) => {
  switch (formType) {
    case 'eigen':
      return 'Eigen product aanmelden';
    case 'ontbrekend':
      return 'Ontbrekend product melden';
    default:
      return 'Product Aanmelden';
  }
};

/**
 * getPageDescription
 * Returns the localized page description based on the form type.
 *
 * @param {string} formType - One of 'eigen', 'ontbrekend', or ''
 * @returns {string} Localized description
 */
export const getPageDescription = (formType) => {
  switch (formType) {
    case 'eigen':
      return 'Vul dit formulier in om uw eigen product aan te melden in onze Softwarecatalogus.';
    case 'ontbrekend':
      return 'Vul dit formulier in om een ontbrekend product te melden dat toegevoegd zou moeten worden aan onze Softwarecatalogus.';
    default:
      return 'Vul dit formulier in om een product aan te melden in onze Softwarecatalogus.';
  }
};

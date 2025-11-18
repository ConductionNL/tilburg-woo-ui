import { VISUALS } from './visuals.constants';
import { PATHS } from './routes.constants';

/**
 * Configuration for dashboard wizard tiles
 *
 * Each wizard has:
 * - id: unique identifier
 * - name: display name in Dutch
 * - description: short description of what the wizard does
 * - icon: visual icon component
 * - path: route path to the wizard
 * - requiresAuth: whether user needs to be logged in
 * - requiresOrganization: whether user needs to belong to an organization
 * - groupTypes: array of user group types that can access this wizard
 */

export const DASHBOARD_WIZARDS = {
  // EIGEN_PRODUCT: {
  //   id: 'eigen-product',
  //   name: 'Product aanbieden',
  //   description: 'Voeg een product van uw eigen organisatie toe aan de catalogus',
  //   icon: VISUALS.CUBES,
  //   path: PATHS.FORMS_PRODUCT,
  //   requiresAuth: true,
  //   requiresOrganization: true,
  //   groupTypes: ['leverancier', 'gemeente', 'samenwerking'],
  //   params: { type: 'eigen' },
  //   color: 'blue',
  //   schema: 'product',
  // },
  // ONTBREKEND_PRODUCT: {
  //   id: 'ontbrekend-product',
  //   name: 'Product melden en registreren',
  //   description: 'Meld een product dat nog niet in de catalogus staat',
  //   icon: VISUALS.PLUS,
  //   path: PATHS.FORMS_PRODUCT,
  //   requiresAuth: true,
  //   requiresOrganization: false,
  //   groupTypes: ['leverancier', 'gemeente', 'samenwerking', 'community'],
  //   params: { type: 'ontbrekend' },
  //   color: 'blue',
  //   schema: 'product',
  // },
  EIGEN_APPLICATIE: {
    id: 'eigen-applicatie',
    name: 'Applicatie publiceren',
    description: 'Voeg een applicatie van uw eigen organisatie toe aan de catalogus',
    icon: VISUALS.CUBE,
    path: PATHS.FORMS_APPLICATIE,
    requiresAuth: true,
    requiresOrganization: true,
    groupTypes: ['leverancier', 'gemeente', 'samenwerking'],
    params: { type: 'eigen' },
    color: 'blue',
    schema: 'applicatie',
  },
  ONTBREKEND_APPLICATIE: {
    id: 'ontbrekend-applicatie',
    name: 'Applicatie toevoegen',
    description: 'Meld een applicatie dat nog niet in de catalogus staat',
    icon: VISUALS.CUBE,
    path: PATHS.FORMS_APPLICATIE,
    requiresAuth: true,
    requiresOrganization: false,
    groupTypes: ['leverancier', 'gemeente', 'samenwerking', 'community'],
    params: { type: 'ontbrekend-applicatie' },
    color: 'blue',
    schema: 'applicatie',
  },
  DIENST: {
    id: 'dienst',
    name: 'Dienst publiceren',
    description: 'Publiceer een nieuwe dienst in de catalogus',
    icon: VISUALS.HAND_SHAKE,
    path: PATHS.FORMS_DIENST, // or separate dienst form if it exists
    requiresAuth: true,
    requiresOrganization: true,
    groupTypes: ['leverancier', 'gemeente', 'samenwerking'],
    params: { type: 'dienst' },
    color: 'blue',
    schema: 'dienst',
  },
  DIENST_TOEVOEGEN: {
    id: 'dienst-ontbrekend',
    name: 'Dienst toevoegen',
    description: 'Meld een dienst dat nog niet in de catalogus staat',
    icon: VISUALS.HAND_SHAKE,
    path: PATHS.FORMS_DIENST,
    requiresAuth: true,
    requiresOrganization: false,
    groupTypes: ['leverancier', 'gemeente', 'samenwerking', 'community'],
    params: { type: 'ontbrekend-dienst' },
    color: 'blue',
    schema: 'dienst',
  },
  GEBRUIK: {
    id: 'gebruik',
    name: 'Gebruik registreren',
    description: 'Registreer het gebruik van een product of dienst',
    icon: VISUALS.CLIPBOARD_CHECK,
    path: PATHS.FORMS_GEBRUIK,
    requiresAuth: true,
    requiresOrganization: true,
    groupTypes: ['gemeente', 'samenwerking', 'community'],
    params: {},
    color: 'blue',
    schema: 'gebruik',
  },
  GEBRUIK_TOEVOEGEN: {
    id: 'gebruik-ontbrekend',
    name: 'Gebruik toevoegen',
    description: 'Meld een gebruik dat nog niet in de catalogus staat',
    icon: VISUALS.CLIPBOARD_CHECK,
    path: PATHS.FORMS_GEBRUIK,
    requiresAuth: true,
    requiresOrganization: false,
    groupTypes: ['gemeente', 'samenwerking', 'community'],
    params: { type: 'ontbrekend-organisatie' },
    color: 'blue',
    schema: 'gebruik',
  },
  KOPPELING_PUBLICEEREN: {
    id: 'koppeling-publiceren',
    name: 'Koppeling publiceren',
    description: 'Publiceer een koppeling tussen een product en een dienst',
    icon: VISUALS.LINK,
    path: PATHS.FORMS_KOPPELING,
    requiresAuth: true,
    requiresOrganization: true,
    groupTypes: ['gemeente', 'samenwerking', 'community'],
    params: { type: 'eigen-organisatie' },
    color: 'blue',
    schema: 'koppeling',
  },
  KOPPELING_TOEVOEGEN: {
    id: 'koppeling-toevoegen',
    name: 'Koppeling toevoegen',
    description: 'Meld een koppeling dat nog niet in de catalogus staat',
    icon: VISUALS.LINK,
    path: PATHS.FORMS_KOPPELING,
    requiresAuth: true,
    requiresOrganization: false,
    groupTypes: ['gemeente', 'samenwerking', 'community'],
    params: { type: 'aanbieden-koppeling' },
    color: 'blue',
    schema: 'koppeling',
  },
};

/**
 * Get wizards that are available for the dashboard (excludes registers)
 * Filters based on user authentication and organization status
 */
// eslint-disable-next-line no-unused-vars -- it'll get used... eventually
export const getDashboardWizards = (user = null, userOrganization = null) => {
  // Always show all wizards - no filtering

  const wizards = Object.values(DASHBOARD_WIZARDS);

  if (
    userOrganization.type === 'Gemeente' ||
    userOrganization.type === 'Samenwerking'
  ) {
    return wizards.filter(
      (wizard) => wizard !== DASHBOARD_WIZARDS.KOPPELING_AANBIEDEN
    );
  }

  if (
    userOrganization.type === 'Leverancier' ||
    userOrganization.type === 'Community'
  ) {
    return wizards.filter(
      (wizard) => wizard !== DASHBOARD_WIZARDS.KOPPELING_EIGEN_ORGANISATIE
    );
  }

  return wizards;
};

/**
 * Get the full URL for a wizard, including any required parameters
 */
export const getWizardUrl = (wizard, useParams = true) => {
  if (!wizard) return null;
  let url = wizard.path;

  if (wizard.params && useParams && Object.keys(wizard.params).length > 0) {
    const params = new URLSearchParams(wizard.params);
    url += `?${params.toString()}`;
  }

  return url;
};

/**
 * gets the active wizard based on the current path + params
 * @returns {{
 *   icon: LoadableComponent<any>,
 *   name: string,
 *   description: string,
 *   path: string,
 *   requiresAuth: boolean,
 *   requiresOrganization: boolean,
 *   groupTypes: string[],
 *   params: Record<string, any>,
 *   color: string,
 *   schema: string
 * } | null} the active wizard or null if no wizard is found
 */
export const getActiveWizard = () => {
  const path = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  const urlParamKeys = Array.from(searchParams.keys());

  const allWizards = Object.values(DASHBOARD_WIZARDS);

  // Try to find an exact match: path + matching number of params + all param keys and values match
  const exactMatchWizard = allWizards.find((wizard) => {
    if (wizard.path !== path) return false;

    const wizardParamKeys = wizard.params ? Object.keys(wizard.params) : [];
    // Both must have no params
    if (wizardParamKeys.length === 0 && urlParamKeys.length === 0) {
      return true;
    }
    // If amount and presence of param keys do not match, not an exact match
    if (wizardParamKeys.length !== urlParamKeys.length) {
      return false;
    }
    // All params and values must match
    return wizardParamKeys.every(
      (key) => searchParams.get(key) === String(wizard.params[key])
    );
  });

  if (exactMatchWizard) {
    return exactMatchWizard;
  }

  // Fallback: return first wizard whose path matches, ignoring params
  const fallbackWizard = allWizards.find((wizard) => wizard.path === path);

  if (fallbackWizard) {
    return fallbackWizard;
  }
  return null;
};

/**
 * Software catalog concept explanations in Dutch for the welcome section
 */
export const SOFTWARE_CATALOG_CONCEPTS = {
  PRODUCT: {
    title: 'Product',
    description:
      'Een softwareproduct is een complete oplossing die door een organisatie wordt aangeboden. Dit kan bijvoorbeeld een website, applicatie of systeem zijn.',
  },
  DIENST: {
    title: 'Dienst',
    description:
      'Een dienst is een specifieke functionaliteit of service die wordt aangeboden, vaak als onderdeel van een groter product.',
  },
  APPLICATIE: {
    title: 'Applicatie',
    description:
      'Een applicatie is een specifieke software-implementatie die onderdeel kan zijn van een product en concrete functionaliteiten biedt.',
  },
  GEBRUIK: {
    title: 'Gebruik',
    description:
      'Gebruik registreert hoe organisaties producten, diensten of applicaties inzetten binnen hun processen en werkwijzen.',
  },
};

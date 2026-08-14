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
  EIGEN_APPLICATIE: {
    id: 'eigen-applicatie',
    name: 'Applicatie publiceren',
    description:
      'Voeg een applicatie van uw eigen organisatie toe aan de softwarecatalogus',
    icon: VISUALS.CUBE,
    path: PATHS.FORMS_APPLICATIE,
    requiresAuth: true,
    requiresOrganization: true,
    groupTypes: ['leverancier', 'gemeente', 'samenwerking'],
    params: { type: 'eigen' },
    color: '#0078c8',
    schema: 'module',
  },
  DIENST: {
    id: 'dienst',
    name: 'Dienst publiceren',
    description: 'Publiceer een nieuwe dienst in de softwarecatalogus',
    icon: VISUALS.HAND_SHAKE,
    path: PATHS.FORMS_DIENST,
    requiresAuth: true,
    requiresOrganization: true,
    groupTypes: ['leverancier', 'gemeente', 'samenwerking'],
    params: { type: 'dienst' },
    color: '#0078c8',
    schema: 'dienst',
  },
  DIENST_TOEVOEGEN: {
    id: 'dienst-ontbrekend',
    name: 'Dienst toevoegen',
    description: 'Meld een dienst dat nog niet in de softwarecatalogus staat',
    icon: VISUALS.HAND_SHAKE,
    path: PATHS.FORMS_GEBRUIK_DIENST,
    requiresAuth: true,
    requiresOrganization: false,
    groupTypes: ['leverancier', 'gemeente', 'samenwerking', 'community'],
    params: { type: 'ontbrekend-dienst' },
    color: '#0078c8',
    schema: 'dienst',
  },
  GEBRUIK: {
    id: 'gebruik',
    name: 'Applicatie toevoegen',
    description: 'Voeg een applicatie toe aan uw applicatielandschap.',
    icon: VISUALS.CUBE,
    path: PATHS.FORMS_GEBRUIK_APPLICATIE,
    requiresAuth: true,
    requiresOrganization: true,
    groupTypes: ['gemeente', 'samenwerking', 'community'],
    params: {},
    color: '#0078c8',
    schema: 'gebruik',
  },
  GEBRUIK_TOEVOEGEN: {
    id: 'gebruik-ontbrekend',
    name: 'Applicatiegebruik melden',
    description:
      'Meld bij welke klant uw applicatie wordt gebruikt, zodat de klant deze eenvoudig in het eigen applicatielandschap kan opnemen.',
    icon: VISUALS.CLIPBOARD_CHECK,
    path: PATHS.FORMS_GEBRUIK_APPLICATIE,
    requiresAuth: true,
    requiresOrganization: false,
    groupTypes: ['gemeente', 'samenwerking', 'community'],
    params: { type: 'ontbrekend-organisatie' },
    color: '#0078c8',
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
    color: '#0078c8',
    schema: 'koppeling',
  },
  KOPPELING_TOEVOEGEN: {
    id: 'koppeling-toevoegen',
    name: 'Koppeling toevoegen',
    description: 'Meld een koppeling dat nog niet in de softwarecatalogus staat',
    icon: VISUALS.LINK,
    path: PATHS.FORMS_GEBRUIK_KOPPELING,
    requiresAuth: true,
    requiresOrganization: false,
    groupTypes: ['gemeente', 'samenwerking', 'community'],
    params: { type: 'aanbieden-koppeling' },
    color: '#0078c8',
    schema: 'koppeling',
  },
  SUITE: {
    id: 'suite',
    name: 'Suite publiceren',
    description: 'Publiceer een nieuwe suite in de catalogus',
    icon: VISUALS.CUBES,
    path: PATHS.FORMS_SUITE,
    requiresAuth: true,
    requiresOrganization: true,
    groupTypes: ['leverancier', 'gemeente', 'samenwerking'],
    params: { type: 'suite' },
    color: 'blue',
    schema: 'suite',
    visible: false, // does nothing right now since visible wizards are hardcoded
  },
  SUITE_TOEVOEGEN: {
    id: 'suite-ontbrekend',
    name: 'Suite toevoegen',
    description: 'Meld een suite dat nog niet in de catalogus staat',
    icon: VISUALS.CUBES,
    path: PATHS.FORMS_SUITE,
    requiresAuth: true,
    requiresOrganization: false,
    groupTypes: ['leverancier', 'gemeente', 'samenwerking', 'community'],
    params: { type: 'ontbrekend-suite' },
    color: 'blue',
    schema: 'suite',
    visible: false, // does nothing right now since visible wizards are hardcoded
  },
};

/**
 * Get wizards that are available for the dashboard (excludes registers)
 * Filters based on user groups
 */
export const getDashboardWizards = (user = null) => {
  // Get user groups from the user object
  const userGroups = user?.user?.groups || [];

  // Define which wizards are available for each group
  const aanbodBeheerderWizards = [
    DASHBOARD_WIZARDS.EIGEN_APPLICATIE,
    DASHBOARD_WIZARDS.KOPPELING_PUBLICEEREN,
    DASHBOARD_WIZARDS.DIENST,
    DASHBOARD_WIZARDS.GEBRUIK_TOEVOEGEN,
  ];

  const gebruikBeheerderWizards = [
    DASHBOARD_WIZARDS.GEBRUIK,
    DASHBOARD_WIZARDS.KOPPELING_TOEVOEGEN,
    DASHBOARD_WIZARDS.DIENST_TOEVOEGEN,
  ];

  // Check which groups the user has
  const hasAanbodBeheerder = userGroups.includes('aanbod-beheerder');
  const hasGebruikBeheerder = userGroups.includes('gebruik-beheerder');

  // Return appropriate wizards based on user groups
  if (hasAanbodBeheerder && hasGebruikBeheerder) {
    // User has both groups - show all wizards
    return [...aanbodBeheerderWizards, ...gebruikBeheerderWizards];
  } else if (hasAanbodBeheerder) {
    // User only has aanbod-beheerder group
    return aanbodBeheerderWizards;
  } else if (hasGebruikBeheerder) {
    // User only has gebruik-beheerder group
    return gebruikBeheerderWizards;
  }

  // No relevant groups - return empty array
  return [];
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

  const allWizards = Object.values(DASHBOARD_WIZARDS);

  // Sort wizards by number of params descending to prefer most specific match
  const sortedWizards = [...allWizards]
    .filter((wizard) => wizard.path === path)
    .sort((a, b) => {
      const aParams = a.params ? Object.keys(a.params).length : 0;
      const bParams = b.params ? Object.keys(b.params).length : 0;
      return bParams - aParams;
    });

  // Find the most specific wizard: all of its params must match in the search (URL may have extras)
  const matchingWizard = sortedWizards.find((wizard) => {
    const wizardParamKeys = wizard.params ? Object.keys(wizard.params) : [];
    return wizardParamKeys.every(
      (key) =>
        searchParams.has(key) && searchParams.get(key) === String(wizard.params[key])
    );
  });

  if (matchingWizard) {
    return matchingWizard;
  }

  // Fallback: return first wizard whose path matches, ignoring params
  if (sortedWizards.length > 0) {
    return sortedWizards[0];
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

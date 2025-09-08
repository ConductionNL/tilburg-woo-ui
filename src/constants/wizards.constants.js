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
  EIGEN_PRODUCT: {
    id: 'eigen-product',
    name: 'Product aanbieden',
    description: 'Voeg een product van uw eigen organisatie toe aan de catalogus',
    icon: VISUALS.CUBE,
    path: PATHS.FORMS_PRODUCT,
    requiresAuth: true,
    requiresOrganization: true,
    groupTypes: ['leverancier', 'gemeente', 'samenwerking'],
    params: { type: 'eigen' },
    color: 'blue',
    schema: 'product',
  },
  ONTBREKEND_PRODUCT: {
    id: 'ontbrekend-product',
    name: 'Product melden en registreren',
    description: 'Meld een product dat nog niet in de catalogus staat',
    icon: VISUALS.PLUS,
    path: PATHS.FORMS_PRODUCT,
    requiresAuth: true,
    requiresOrganization: false,
    groupTypes: ['leverancier', 'gemeente', 'samenwerking', 'community'],
    params: { type: 'ontbrekend' },
    color: 'blue',
    schema: 'product',
  },
  DIENST: {
    id: 'dienst',
    name: 'Dienst registreren',
    description: 'Registreer een nieuwe dienst in de catalogus',
    icon: VISUALS.HAND_SHAKE,
    path: PATHS.FORMS_DIENST, // or separate dienst form if it exists
    requiresAuth: true,
    requiresOrganization: true,
    groupTypes: ['leverancier', 'gemeente', 'samenwerking'],
    params: { type: 'dienst' },
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
  KOPPELING: {
    id: 'koppeling',
    name: 'Koppeling registreren',
    description: 'Registreer een koppeling tussen een product en een dienst',
    icon: VISUALS.LINK,
    path: PATHS.FORMS_KOPPELING,
    requiresAuth: true,
    requiresOrganization: true,
    groupTypes: ['gemeente', 'samenwerking', 'community'],
    params: {},
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
  return Object.values(DASHBOARD_WIZARDS);
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

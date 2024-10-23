// Imports => Constants
import { TITLES } from './titles.constants';

// Imports => Utilities
import { AcUUID } from '@utils/ac-uuid';
import { AcLockObject } from '@utils/ac-lock-object';

// Imports => Views
import { AcHome, AcPublication, AcSearch, AcSubjects, AcThemes } from '@views';
import { LABELS } from '@constants/labels.constants';

export const PATHS = AcLockObject({
  HOME: '/',
  PUBLICATION: '/publicatie/:id',
  SEARCH: '/zoeken/:query?',
  THEMES: '/onderwerpen',
  ABOUT: '/over-ons',
  CONTACT: '/contact',
  ACCESSIBILITY: '/toegankelijkheid',
  SEARCH_STATIC: '/zoeken',
});

export const ROUTES = {
  HOME: {
    id: AcUUID(),
    name: 'Home',
    label: TITLES.HOME,
    path: PATHS.HOME,
    title: 'Home | Open Tilburg',
    component: AcHome,
  },
  PUBLICATION: {
    id: AcUUID(),
    name: 'Publication',
    label: TITLES.PUBLICATION,
    path: PATHS.PUBLICATION,
    title: 'Open Tilburg | Publicatie',
    component: AcPublication,
  },
  SEARCH: {
    id: AcUUID(),
    name: 'Search',
    label: LABELS.SEARCH_EXTENSIVE,
    path: PATHS.SEARCH_STATIC,
    title: 'Open Tilburg | Zoeken',
    component: AcSearch,
  },
  THEMES: {
    id: AcUUID(),
    name: 'Themes',
    label: TITLES.THEMES,
    path: PATHS.THEMES,
    title: 'Open Tilburg | Onderwerpen',
    component: AcThemes,
  },
  ABOUT: {
    id: AcUUID(),
    name: 'Over Open Tilburg',
    label: TITLES.ABOUT,
    path: PATHS.ABOUT,
    title: 'Open Tilburg | Onderwerpen',
  },
  CONTACT: {
    id: AcUUID(),
    name: 'Contact',
    label: TITLES.CONTACT,
    path: PATHS.CONTACT,
  },
  ACCESSIBILITY: {
    id: AcUUID(),
    name: 'Toegankelijkheid',
    label: TITLES.ACCESSIBILITY,
    path: PATHS.ACCESSIBILITY,
  },
};

const ROUTES_EXTERNAL = {
  TILBURG: {
    label: 'Tilburg',
    href: 'https://www.tilburg.nl/',
  },
  PRIVACY: {
    label: 'Privacy',
    href: 'https://www.tilburg.nl/privacystatement/',
  },
  PROCLAIMER: {
    label: 'Proclaimer',
    href: 'https://www.tilburg.nl/proclaimer/',
  },
  COOKIES: {
    label: 'Cookies',
    href: 'https://www.tilburg.nl/cookies/',
  },
};

export const NAVIGATION_ITEMS = [ROUTES.HOME];

export const FOOTER_ITEMS = [
  ROUTES.ABOUT,
  ROUTES.CONTACT,
  ROUTES.ACCESSIBILITY,
  ROUTES.SEARCH,
  ROUTES.THEMES,
];

export const EXTERNAL_LINKS = [
  ROUTES_EXTERNAL.TILBURG,
  ROUTES_EXTERNAL.PRIVACY,
  ROUTES_EXTERNAL.PROCLAIMER,
  ROUTES_EXTERNAL.COOKIES,
];

export const SUB_NAVIGATION_ITEMS = [];

export const AUTHENTICATION_ROUTES = [];

export const DEFAULT_ROUTE = ROUTES.HOME;
export const REDIRECT_ROUTE = ROUTES.HOME;

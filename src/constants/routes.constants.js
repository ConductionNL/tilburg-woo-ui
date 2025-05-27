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
  ABOUT: '/over-ons',
  ACCESSIBILITY: '/toegankelijkheid',
  CONTACT: '/contact',
  COOKIES: 'https://www.tilburg.nl/cookies/',
  FAQ: '/contact',
  ORGANIZATION: 'https://www.werkenvoortilburg.nl/over-ons/afdelingen/',
  PRIVACY: 'https://www.tilburg.nl/privacystatement/',
  PROCLAIMER: 'https://www.tilburg.nl/proclaimer/',
  PUBLICATION: '/publicatie/:id',
  REACH_OUT: 'https://www.tilburg.nl/contact/',
  SEARCH: '/zoeken/:query?',
  SEARCH_STATIC: '/zoeken',
  // THEMES: '/onderwerpen',
  WEBSITE: 'https://www.tilburg.nl/',
  WOO: 'https://www.tilburg.nl/gemeente/wet-open-overheid-woo/',
});

export const NAVIGATE_TO = AcLockObject({
  PUBLICATION: (id) => PATHS.PUBLICATION.replace(':id', id),
});

export const ROUTES = {
  ABOUT: {
    id: AcUUID(),
    name: 'About',
    label: TITLES.ABOUT,
    path: PATHS.ABOUT,
    title: `${TITLES.BASE} | ${TITLES.ABOUT}`,
  },
  ACCESSIBILITY: {
    id: AcUUID(),
    name: 'Accessibility',
    label: TITLES.ACCESSIBILITY,
    path: PATHS.ACCESSIBILITY,
    title: `${TITLES.BASE} | ${TITLES.ACCESSIBILITY}`,
  },
  CONTACT: {
    id: AcUUID(),
    name: 'Contact',
    label: TITLES.CONTACT,
    path: PATHS.CONTACT,
    title: `${TITLES.BASE} | ${TITLES.CONTACT}`,
  },
  COOKIES: {
    id: AcUUID(),
    name: 'Cookies',
    label: TITLES.COOKIES,
    href: PATHS.COOKIES,
    isExternal: true,
  },
  FAQ: {
    id: AcUUID(),
    name: 'FAQ',
    label: TITLES.FAQ,
    path: PATHS.FAQ,
    title: `${TITLES.BASE} | ${TITLES.FAQ}`,
  },
  HOME: {
    id: AcUUID(),
    name: 'Home',
    label: TITLES.HOME,
    path: PATHS.HOME,
    title: `${TITLES.BASE} | ${TITLES.HOME}`,
    component: AcHome,
  },
  ORGANIZATION: {
    id: AcUUID(),
    name: 'Organization',
    label: LABELS.ORGANIZATION,
    href: PATHS.ORGANIZATION,
    isExternal: true,
    title: `${TITLES.BASE} | ${TITLES.ORGANIZATION}`,
  },
  PRIVACY: {
    id: AcUUID(),
    name: 'Privacy',
    label: TITLES.PRIVACY,
    href: PATHS.PRIVACY,
    isExternal: true,
  },
  PROCLAIMER: {
    id: AcUUID(),
    name: 'Proclaimer',
    label: TITLES.PROCLAIMER,
    href: PATHS.PROCLAIMER,
    isExternal: true,
  },
  PUBLICATION: {
    id: AcUUID(),
    name: 'Publication',
    label: TITLES.PUBLICATION,
    path: PATHS.PUBLICATION,
    title: `${TITLES.BASE} | ${TITLES.PUBLICATION}`,
    component: AcPublication,
  },
  SEARCH: {
    id: AcUUID(),
    name: 'Search',
    label: LABELS.SEARCH_EXTENSIVE,
    path: PATHS.SEARCH_STATIC,
    title: `${TITLES.BASE} | ${TITLES.SEARCH}`,
    component: AcSearch,
  },
  // THEMES: {
  //   id: AcUUID(),
  //   name: 'Themes',
  //   label: TITLES.THEMES,
  //   path: PATHS.THEMES,
  //   title: `${TITLES.BASE} | ${TITLES.THEMES}`,
  //   component: AcThemes,
  // },
  WEBSITE: {
    id: AcUUID(),
    name: 'Website',
    label: TITLES.WEBSITE,
    href: PATHS.WEBSITE,
    isExternal: true,
    title: `${TITLES.BASE} | ${TITLES.WEBSITE}`,
  },
  WOO: {
    id: AcUUID(),
    name: 'WOO',
    label: TITLES.WOO,
    href: PATHS.WOO,
    isExternal: true,
    title: `${TITLES.BASE} | ${TITLES.WOO}`,
  },
  REACH_OUT: {
    id: AcUUID(),
    name: 'ReachOut',
    label: TITLES.REACH_OUT,
    href: PATHS.REACH_OUT,
    isExternal: true,
    title: `${TITLES.BASE} | ${TITLES.REACH_OUT}`,
  },
};

export const NAVIGATION_ITEMS = [ROUTES.HOME];

export const FOOTER_PRIMARY_ABOUT = [
  ROUTES.ABOUT,
  ROUTES.SEARCH,
  // ROUTES.THEMES,
  ROUTES.FAQ,
  ROUTES.CONTACT,
];

export const FOOTER_PRIMARY_QUICK = [
  ROUTES.WEBSITE,
  ROUTES.WOO,
  ROUTES.REACH_OUT,
  ROUTES.ORGANIZATION,
];

export const FOOTER_SECONDARY = [
  ROUTES.ACCESSIBILITY,
  ROUTES.PROCLAIMER,
  ROUTES.COOKIES,
  ROUTES.PRIVACY,
];

export const SUB_NAVIGATION_ITEMS = [];

export const AUTHENTICATION_ROUTES = [];

export const DEFAULT_ROUTE = ROUTES.HOME;
export const REDIRECT_ROUTE = ROUTES.HOME;

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

export const VNG_ROUTES_SITEMAP = {
  ONDERWERPEN: {
    label: 'Onderwerpen',
    href: 'https://vng.nl/rubrieken',
  },
  NIEUWS: {
    label: 'Nieuws',
    href: 'https://vng.nl/nieuws',
  },
  AGENDA: {
    label: 'Agenda',
    href: 'https://vng.nl/agenda',
  },
  A_Z_INDEX: {
    label: 'A-Z index',
    href: 'https://vng.nl/a-z',
  },
  VNG_MAGAZINE: {
    label: 'VNG Magazine',
    href: 'https://vng.nl/magazines',
  },
};

export const VNG_ROUTES_INFORMATIE = {
  CONTACT: {
    label: 'Contact',
    href: 'https://vng.nl/contact',
  },
  OVER_ONS: {
    label: 'Over Ons',
    href: 'https://vng.nl/rubrieken/vereniging',
  },
  WERKEN_BIJ_DE_VNG: {
    label: 'Werken bij de VNG',
    href: 'https://vng.nl/werken-bij-de-vng',
  },
};

export const VNG_ROUTES_BEDRIJVEN = {
  VNG_INTERNATIONAL: {
    label: 'VNG International',
    href: 'https://www.vng-international.nl/',
  },
  VNG_CONNECT: {
    label: 'VNG Connect',
    href: 'https://www.vngconnect.nl/',
  },
  VNG_REALISATIE: {
    label: 'VNG Realisatie',
    href: 'https://vng.nl/artikelen/vng-realisatie',
  },
  VNG_RISICOBEHEER: {
    label: 'VNGRisicobeheer',
    href: 'https://vng.nl/rubrieken/risicobeheer',
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

export const VNG_FOOTER_ITEMS_SITEMAP = [
  VNG_ROUTES_SITEMAP.ONDERWERPEN,
  VNG_ROUTES_SITEMAP.NIEUWS,
  VNG_ROUTES_SITEMAP.AGENDA,
  VNG_ROUTES_SITEMAP.A_Z_INDEX,
  VNG_ROUTES_SITEMAP.VNG_MAGAZINE,
];
export const VNG_FOOTER_ITEMS_INFORMATIE = [
  VNG_ROUTES_INFORMATIE.CONTACT,
  VNG_ROUTES_INFORMATIE.OVER_ONS,
  VNG_ROUTES_INFORMATIE.WERKEN_BIJ_DE_VNG,
];
export const VNG_FOOTER_ITEMS_BEDRIJVEN = [
  VNG_ROUTES_BEDRIJVEN.VNG_INTERNATIONAL,
  VNG_ROUTES_BEDRIJVEN.VNG_CONNECT,
  VNG_ROUTES_BEDRIJVEN.VNG_REALISATIE,
  VNG_ROUTES_BEDRIJVEN.VNG_RISICOBEHEER,
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

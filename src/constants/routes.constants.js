// Imports => Constants
import { TITLES } from './titles.constants';
import { VISUALS } from './visuals.constants';

// Imports => Utilities
import { AcUUID } from '@utils/ac-uuid';
import { AcLockObject } from '@utils/ac-lock-object';

// Imports => Views
import {
  AcHome,
  AcPublication,
  AcSearch,
  AcThemes,
  AcAuthentication,
  AcMijnOmgeving,
  AcGemma,
  AcNextcloudAuthorization,
  AcBeheer,
  AcRegister,
  AcViews,
} from '@views';
import { LABELS } from '@constants/labels.constants';
import { AcCheckIfSpecificHostname } from '@src/services/ac-check-if-specific-hostname';

export const PATHS = AcLockObject({
  HOME: '/',
  ABOUT: '/over-ons',
  ACCESSIBILITY: '/toegankelijkheid',
  CONTACT: '/contact',
  COOKIES: 'https://www.tilburg.nl/cookies/',
  FAQ: '/veelgestelde-vragen',
  ORGANIZATION: '/organisatie-en-werkwijze',
  PRIVACY: 'https://www.tilburg.nl/privacystatement/',
  PROCLAIMER: 'https://www.tilburg.nl/proclaimer/',
  PUBLICATION: '/publicatie/:id',
  REACH_OUT: '/bereikbaarheidsgegeverns',
  SEARCH: '/zoeken/:query?',
  SEARCH_STATIC: '/zoeken',
  AUTHENTICATION_STATIC: '/login',
  MIJN_OMGEVING_STATIC: '/mijn-omgeving',
  GEMMA_STATIC: '/gemma',
  THEMES: '/onderwerpen',
  WEBSITE: 'https://www.tilburg.nl/',
  WOO: '/woo-verzoek',
  NEXTCLOUD_LOGIN: '/login',
  NEXTCLOUD_AUTHORIZATION: '/authorization',
  BEHEER: '/beheer',
  BEHEER_TYPE: '/beheer/:type',
  BEHEER_TYPE_DETAILS: '/beheer/:type/:id',
  REGISTER: '/register',
  AANMELDEN: '/aanmelden',
  VIEWS: '/views/:id',
});

export const NAVIGATE_TO = AcLockObject({
  PUBLICATION: (id) => PATHS.PUBLICATION.replace(':id', id),
  BEHEER_TYPE: (type) => PATHS.BEHEER_TYPE.replace(':type', type),
  BEHEER_TYPE_DETAILS: (type, id) =>
    PATHS.BEHEER_TYPE_DETAILS.replace(':type', type).replace(':id', id),
  VIEWS: (id) => PATHS.VIEWS.replace(':id', id),
});

const getTitle = () => {
  const hostname = window.location.hostname;

  switch (hostname) {
    case 'vng.opencatalogi.nl':
    case 'vng.test.opencatalogi.nl':
      return 'Softwarecatalogus';
    case 'open-tilburg.accept.commonground.nu':
      return 'Open Tilburg';
    case 'open-dimpact.accept.commonground.nu':
    case 'dimpact.opencatalogi.nl':
      return 'Producten catalogus';
    case 'open-rotterdam.accept.commonground.nu':
      return 'Open Rotterdam';
    case 'open-migrato.accept.commonground.nu':
      return 'Open Migrato';
    case 'opencatalogi.nl':
    case 'developer.opencatalogi.nl':
    case 'test.opencatalogi.nl':
      return 'OpenCatalogi';
    case 'opencatalogi.open-regels.nl':
      return 'OpenRegels';
    case 'localhost':
      return 'Localhost catalogus';
    case 'horstadmaas.accept.opencatalogi.nl':
      return 'Horst aan de Maas';
    default:
      return 'Open Tilburg';
  }
};

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
    href: PATHS.FAQ,
    title: `${TITLES.BASE} | ${TITLES.FAQ}`,
  },
  HOME: {
    id: AcUUID(),
    name: 'Home',
    label: TITLES.HOME,
    path: PATHS.HOME,
    title: `${AcCheckIfSpecificHostname() ? getTitle() : 'Open Tilburg'} | ${
      TITLES.HOME
    }`,
    component: AcHome,
  },
  ORGANIZATION: {
    id: AcUUID(),
    name: 'Organization',
    label: LABELS.ORGANIZATION,
    href: PATHS.ORGANIZATION,
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
    title: `${AcCheckIfSpecificHostname() ? getTitle() : 'Open Tilburg'} | ${
      TITLES.PUBLICATION
    }`,
    component: AcPublication,
  },
  SEARCH: {
    id: AcUUID(),
    name: 'Search',
    label: LABELS.SEARCH_EXTENSIVE,
    path: PATHS.SEARCH_STATIC,
    title: `${AcCheckIfSpecificHostname() ? getTitle() : 'Open Tilburg'} | ${
      TITLES.SEARCH
    }`,
    component: AcSearch,
  },
  AUTHENTICATION: {
    id: AcUUID(),
    name: 'Authentication',
    label: LABELS.AUTHENTICATION,
    path: PATHS.AUTHENTICATION_STATIC,
    title: `${AcCheckIfSpecificHostname() ? getTitle() : 'Open Tilburg'} | Login`,
    component: AcAuthentication,
  },
  MIJN_OMGEVING: {
    id: AcUUID(),
    name: 'Mijn omgeving',
    label: LABELS.MIJN_OMGEVING,
    path: PATHS.MIJN_OMGEVING_STATIC,
    title: `${
      AcCheckIfSpecificHostname() ? getTitle() : 'Open Tilburg'
    } | Mijn omgeving`,
    component: AcMijnOmgeving,
  },
  GEMMA: {
    id: AcUUID(),
    name: 'GEMMA',
    label: LABELS.GEMMA,
    path: PATHS.GEMMA_STATIC,
    title: `${AcCheckIfSpecificHostname() ? getTitle() : 'Open Tilburg'} | GEMMA`,
    component: AcGemma,
  },
  THEMES: {
    id: AcUUID(),
    name: 'Themes',
    label: TITLES.THEMES,
    path: PATHS.THEMES,
    title: `${AcCheckIfSpecificHostname() ? getTitle() : 'Open Tilburg'} | ${
      TITLES.THEMES
    }`,
    component: AcThemes,
  },
  ABOUT: {
    id: AcUUID(),
    name: 'Over Open Tilburg',
    label: TITLES.ABOUT,
    path: PATHS.ABOUT,
    title: `${AcCheckIfSpecificHostname() ? getTitle() : 'Open Tilburg'} | Over`,
  },
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
  ACCESSIBILITY: {
    id: AcUUID(),
    name: 'Toegankelijkheid',
    label: TITLES.ACCESSIBILITY,
    path: PATHS.ACCESSIBILITY,
    title: `${TITLES.BASE} | ${TITLES.ACCESSIBILITY}`,
  },
  NEXTCLOUD_LOGIN: {
    id: AcUUID(),
    name: 'Nextcloud Login',
    label: LABELS.NEXTCLOUD_LOGIN,
    path: PATHS.NEXTCLOUD_LOGIN,
    title: `${
      AcCheckIfSpecificHostname() ? getTitle() : 'Open Tilburg'
    } | Nextcloud Login`,
  },
  NEXTCLOUD_AUTHORIZATION: {
    id: AcUUID(),
    name: 'Nextcloud Authorization',
    label: LABELS.NEXTCLOUD_AUTHORIZATION,
    path: PATHS.NEXTCLOUD_AUTHORIZATION,
    title: 'Nextcloud Authorization',
    component: AcNextcloudAuthorization,
  },
  BEHEER: {
    id: AcUUID(),
    name: 'Beheer',
    label: LABELS.BEHEER,
    path: PATHS.BEHEER,
    title: 'Beheer',
    component: AcBeheer,
  },
  BEHEER_TYPE: {
    id: AcUUID(),
    name: 'Beheer Type List',
    label: LABELS.BEHEER_TYPE,
    path: PATHS.BEHEER_TYPE,
    title: 'Beheer Type List',
    component: AcBeheer,
  },
  BEHEER_TYPE_DETAILS: {
    id: AcUUID(),
    name: 'Beheer Type Details',
    label: LABELS.BEHEER_TYPE_DETAILS,
    path: PATHS.BEHEER_TYPE_DETAILS,
    title: 'Beheer Type Details',
    component: AcBeheer,
  },
  AANMELDEN: {
    id: AcUUID(),
    name: 'Aanmelden',
    label: LABELS.REGISTER,
    path: PATHS.AANMELDEN,
    title: `${
      AcCheckIfSpecificHostname() ? getTitle() : 'Open Tilburg'
    } | Aanmelden`,
    component: AcRegister,
  },
  REGISTER: {
    id: AcUUID(),
    name: 'Aanmelden',
    label: LABELS.REGISTER,
    path: PATHS.REGISTER,
    title: `${
      AcCheckIfSpecificHostname() ? getTitle() : 'Open Tilburg'
    } | Aanmelden`,
    component: AcRegister,
  },
  VIEWS: {
    id: AcUUID(),
    name: 'Views',
    label: LABELS.VIEWS,
    path: PATHS.VIEWS,
    title: `${AcCheckIfSpecificHostname() ? getTitle() : 'Open Tilburg'} | Views`,
    component: AcViews,
  },
};

export const VNG_ROUTES_SITEMAP = {
  FAQ: {
    label: 'FAQ',
    href: '/over-ons',
  },
  ONDERWERPEN: {
    label: 'Onderwerpen VNG',
    href: 'https://vng.nl/rubrieken',
  },
  PRIVACYVERKLARING: {
    label: 'Privacyverklaring',
    href: 'https://www.softwarecatalogus.nl/Privacyverklaring%20softwarecatalogus',
  },
  OVER_VNG_REALISATIE: {
    label: 'Over VNG Realisatie',
    href: 'https://vng.nl/artikelen/vng-realisatie',
  },
  VACATURES: {
    label: 'Vacatures',
    href: 'https://vng.nl/artikelen/werken-bij-de-vng',
  },
};

export const VNG_ROUTES_INFORMATIE = {
  AGENDA: {
    label: 'Agenda VNG',
    href: 'https://vng.nl/agenda',
  },
  NIEUWS: {
    label: 'Nieuws',
    href: 'https://vng.nl/nieuws',
  },
  CONTACT: {
    label: 'Contact',
    href: 'https://vng.nl/contact',
  },
  MELD_AAN_VNG_REALISATIE: {
    label: 'Meld aan VNG Realisatie',
    href: 'mailto:softwarecatalogus@vng.nl?subject=Softwarecatalogus: Terugmelding GEMMA Softwarecatalogus&amp;body=Hierbij ontvangt u mijn op- en aanmerkingen over de pagina https://www.softwarecatalogus.nl/swchome in de GEMMA softwarecatalogus.',
  },
};

export const VNG_ROUTES_BEDRIJVEN = {
  TWITTER: {
    label: 'Twitter',
    href: 'https://twitter.com/VNGRealisatie',
  },
  LINKEDIN: {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/vng-realisatie/',
  },
  YOUTUBE: {
    label: 'Youtube',
    href: 'https://www.youtube.com/channel/UCg0bWcCn9Shnt57-L7hSbow',
  },
  GEMMA_NIEUWSBRIEF: {
    label: 'Nieuwsbrief GEMMA',
    href: 'https://www.gemmaonline.nl/index.php/GEMMA_nieuwsbrief',
  },
};

export const DIMPACT_ROUTES_WHAT_WE_DO = {
  WHAT_WE_DO: {
    label: 'Wat we doen',
    style: 'italic',
  },
  SERVICES: {
    label: 'Diensten',
    href: 'https://www.dimpact.nl/diensten',
    iconLocation: 'left',
  },
  EVENTS: {
    label: 'Evenementen',
    href: 'https://www.dimpact.nl/evenementen',
    iconLocation: 'left',
  },
  YEAR_REPORTS: {
    label: 'Jaarverslagen',
    href: 'https://www.dimpact.nl/over-ons/jaarverslagen',
    iconLocation: 'left',
  },
  NEWS: {
    label: 'Nieuws',
    href: 'https://www.dimpact.nl/nieuws',
    iconLocation: 'left',
  },
};
export const DIMPACT_ROUTES_WHO_WE_ARE = {
  WHO_WE_ARE: {
    label: 'Wie we zijn',
    style: 'italic',
  },
  ABOUT_US: {
    label: 'Over ons',
    href: 'https://www.dimpact.nl/over-ons',
    iconLocation: 'left',
  },
  VACANCIES: {
    label: 'Werken bij',
    href: 'https://www.dimpact.nl/vacatures',
    iconLocation: 'left',
  },
};
export const DIMPACT_ROUTES_INFORMATION = {
  PHONE_NUMBER: {
    label: '088 346 0000',
    href: 'tel:0883460000',
    iconLocation: 'left',
    icon: VISUALS.PHONE,
  },
  EMAIL: {
    label: 'info@dimpact.nl',
    href: 'mailto:info@dimpact.nl',
    iconLocation: 'left',
    icon: VISUALS.CONTACT,
  },
  KVK: {
    label: 'KvK nummer: 0815 4067',
    iconLocation: 'left',
    icon: VISUALS.HOUSE,
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

export const FOOTER_PRIMARY_ABOUT = [
  ROUTES.ABOUT,
  ROUTES.SEARCH,
  ROUTES.THEMES,
  ROUTES.ORGANIZATION,
  ROUTES.FAQ,
  ROUTES.CONTACT,
];

export const VNG_FOOTER_ITEMS_SITEMAP = [
  VNG_ROUTES_SITEMAP.FAQ,
  VNG_ROUTES_SITEMAP.ONDERWERPEN,
  VNG_ROUTES_SITEMAP.PRIVACYVERKLARING,
  VNG_ROUTES_SITEMAP.OVER_VNG_REALISATIE,
  VNG_ROUTES_SITEMAP.VACATURES,
];
export const VNG_FOOTER_ITEMS_INFORMATIE = [
  VNG_ROUTES_INFORMATIE.CONTACT,
  VNG_ROUTES_INFORMATIE.AGENDA,
  VNG_ROUTES_INFORMATIE.NIEUWS,
  VNG_ROUTES_INFORMATIE.MELD_AAN_VNG_REALISATIE,
];
export const VNG_FOOTER_ITEMS_BEDRIJVEN = [
  VNG_ROUTES_BEDRIJVEN.TWITTER,
  VNG_ROUTES_BEDRIJVEN.LINKEDIN,
  VNG_ROUTES_BEDRIJVEN.YOUTUBE,
  VNG_ROUTES_BEDRIJVEN.GEMMA_NIEUWSBRIEF,
];

export const DIMPACT_FOOTER_ITEMS_WHAT_WE_DO = [
  DIMPACT_ROUTES_WHAT_WE_DO.WHAT_WE_DO,
  DIMPACT_ROUTES_WHAT_WE_DO.SERVICES,
  DIMPACT_ROUTES_WHAT_WE_DO.EVENTS,
  DIMPACT_ROUTES_WHAT_WE_DO.YEAR_REPORTS,
  DIMPACT_ROUTES_WHAT_WE_DO.NEWS,
];
export const DIMPACT_FOOTER_ITEMS_WHO_WE_ARE = [
  DIMPACT_ROUTES_WHO_WE_ARE.WHO_WE_ARE,
  DIMPACT_ROUTES_WHO_WE_ARE.ABOUT_US,
  DIMPACT_ROUTES_WHO_WE_ARE.VACANCIES,
];
export const DIMPACT_FOOTER_ITEMS_INFORMATION = [
  DIMPACT_ROUTES_INFORMATION.PHONE_NUMBER,
  DIMPACT_ROUTES_INFORMATION.EMAIL,
  DIMPACT_ROUTES_INFORMATION.KVK,
];

export const EXTERNAL_LINKS = [
  ROUTES_EXTERNAL.TILBURG,
  ROUTES_EXTERNAL.PRIVACY,
  ROUTES_EXTERNAL.PROCLAIMER,
  ROUTES_EXTERNAL.COOKIES,
];

export const FOOTER_PRIMARY_QUICK = [ROUTES.WEBSITE, ROUTES.WOO, ROUTES.REACH_OUT];

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

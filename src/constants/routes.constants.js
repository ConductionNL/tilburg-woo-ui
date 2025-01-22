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
} from '@views';
import { LABELS } from '@constants/labels.constants';
import { AcCheckIfSpecificHostname } from '@src/services/ac-check-if-specific-hostname';

export const PATHS = AcLockObject({
  HOME: '/',
  PUBLICATION: '/publicatie/:id',
  SEARCH: '/zoeken/:query?',
  THEMES: '/onderwerpen',
  ABOUT: '/over-ons',
  CONTACT: '/contact',
  ACCESSIBILITY: '/toegankelijkheid',
  SEARCH_STATIC: '/zoeken',
  AUTHENTICATION_STATIC: '/login',
  MIJN_OMGEVING_STATIC: '/mijn-omgeving',
  GEMMA_STATIC: '/gemma',
});

const getTitle = () => {
  const hostname = window.location.hostname;

  switch (hostname) {
    case 'vng.opencatalogi.nl':
      return 'Softwarecatalogus';
    case 'open-tilburg.accept.commonground.nu':
      return 'Open Tilburg';
    case 'open-dimpact.accept.commonground.nu':
      return 'Producten catalogus';
    case 'open-rotterdam.accept.commonground.nu':
      return 'Open Rotterdam';
    case 'opencatalogi.nl':
      return 'OpenCatalogi';
    case 'localhost':
      return 'Localhost catalogus';
    default:
      return 'Open Tilburg';
  }
};

export const ROUTES = {
  HOME: {
    id: AcUUID(),
    name: 'Home',
    label: TITLES.HOME,
    path: PATHS.HOME,
    title: `Home | ${AcCheckIfSpecificHostname() ? getTitle() : 'Open Tilburg'}`,
    component: AcHome,
  },
  PUBLICATION: {
    id: AcUUID(),
    name: 'Publication',
    label: TITLES.PUBLICATION,
    path: PATHS.PUBLICATION,
    title: `${
      AcCheckIfSpecificHostname() ? getTitle() : 'Open Tilburg'
    } | Publicatie`,
    component: AcPublication,
  },
  SEARCH: {
    id: AcUUID(),
    name: 'Search',
    label: LABELS.SEARCH_EXTENSIVE,
    path: PATHS.SEARCH_STATIC,
    title: `${AcCheckIfSpecificHostname() ? getTitle() : 'Open Tilburg'} | Zoeken`,
    component: AcSearch,
  },
  AUTHENTICATION: {
    id: AcUUID(),
    name: 'Authentication',
    label: LABELS.AUTHENTICATION,
    path: PATHS.AUTHENTICATION_STATIC,
    title: 'Open Tilburg | Login',
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
    name: 'Gemma',
    label: LABELS.GEMMA,
    path: PATHS.GEMMA_STATIC,
    title: `${AcCheckIfSpecificHostname() ? getTitle() : 'Open Tilburg'} | Gemma`,
    component: AcGemma,
  },
  THEMES: {
    id: AcUUID(),
    name: 'Themes',
    label: TITLES.THEMES,
    path: PATHS.THEMES,
    title: `${
      AcCheckIfSpecificHostname() ? getTitle() : 'Open Tilburg'
    } | Onderwerpen`,
    component: AcThemes,
  },
  ABOUT: {
    id: AcUUID(),
    name: 'Over Open Tilburg',
    label: TITLES.ABOUT,
    path: PATHS.ABOUT,
    title: `${AcCheckIfSpecificHostname() ? getTitle() : 'Open Tilburg'} | Over`,
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

export const FOOTER_ITEMS = [
  ROUTES.ABOUT,
  ROUTES.CONTACT,
  ROUTES.ACCESSIBILITY,
  ROUTES.SEARCH,
  ROUTES.THEMES,
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

export const SUB_NAVIGATION_ITEMS = [];

export const AUTHENTICATION_ROUTES = [];

export const DEFAULT_ROUTE = ROUTES.HOME;
export const REDIRECT_ROUTE = ROUTES.HOME;

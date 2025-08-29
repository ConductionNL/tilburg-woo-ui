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
  AcMijnOmgeving,
  AcGemma,
  AcNextcloudAuthorization,
  AcBeheer,
  AcRegister,
  AcViews,
  AcMyAccount,
  AcLogin,
  ConDirectory,
  AcFormsGebruik,
  AcFormsProduct,
  AcFormsKoppeling,
  ConFormsDienst,
} from '@views';
import { LABELS } from '@constants/labels.constants';
import { AcCheckIfSpecificHostname } from '@src/services/ac-check-if-specific-hostname';

export const PATHS = AcLockObject({
  HOME: '/',
  // CMS-driven routes removed: ABOUT, ACCESSIBILITY, CONTACT, FAQ, ORGANIZATION, COOKIES, PRIVACY, PROCLAIMER, WEBSITE, WOO, REACH_OUT
  PUBLICATION: '/publicatie/:id',
  SEARCH: '/zoeken/:query?',
  SEARCH_STATIC: '/zoeken',
  AUTHENTICATION_STATIC: '/login',
  MIJN_OMGEVING_STATIC: '/mijn-omgeving',
  GEMMA_STATIC: '/gemma',
  THEMES: '/onderwerpen',
  NEXTCLOUD_LOGIN: '/login',
  NEXTCLOUD_AUTHORIZATION: '/authorization',
  BEHEER: '/beheer',
  BEHEER_TYPE: '/beheer/:type',
  BEHEER_TYPE_DETAILS: '/beheer/:type/:id',
  REGISTER: '/register',
  AANMELDEN: '/aanmelden',
  FORMS_REGISTER: '/forms/register',
  FORMS_GEBRUIK: '/forms/gebruik',
  FORMS_PRODUCT: '/forms/product',
  FORMS_KOPPELING: '/forms/koppeling',
  FORMS_DIENST: '/forms/dienst',
  VIEWS: '/views/:id',
  MY_ACCOUNT: '/account',
  DIRECTORY: '/directory',
});

export const NAVIGATE_TO = AcLockObject({
  PUBLICATION: (id) => PATHS.PUBLICATION.replace(':id', id),
  BEHEER_TYPE: (type) => PATHS.BEHEER_TYPE.replace(':type', type),
  BEHEER_TYPE_DETAILS: (type, id) =>
    PATHS.BEHEER_TYPE_DETAILS.replace(':type', type).replace(':id', id),
  VIEWS: (id) => PATHS.VIEWS.replace(':id', id),
});

// Try to import container constants (generated at runtime)
let containerConfig;
try {
  containerConfig = require('@constants/container.constants');
} catch (error) {
  console.warn(
    'Container constants not available, falling back to hostname-based logic'
  );
  containerConfig = null;
}

const getTitle = () => {
  // Use container config if available
  if (containerConfig && containerConfig.getTitle) {
    return containerConfig.getTitle();
  }

  // Fallback to hostname-based logic for production builds
  const hostname = window.location.hostname;

  switch (hostname) {
    case 'vng.opencatalogi.nl':
    case 'acceptatie.softwarecatalogus.nl':
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
    case 'verwerkingsregister.horstaandemaas.nl':
      return 'Horst aan de Maas';
    case 'verwerkingsregister.venray.nl':
      return 'Venray';
    default:
      return 'Open Tilburg';
  }
};

export const ROUTES = {
  // CMS-driven routes removed: ABOUT, ACCESSIBILITY, CONTACT, COOKIES, FAQ
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
  // CMS-driven routes removed: ORGANIZATION, PRIVACY, PROCLAIMER
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
    component: AcLogin,
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
  // CMS-driven routes removed: ABOUT (duplicate), WEBSITE, WOO, REACH_OUT, ACCESSIBILITY (duplicate)
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
  FORMS_REGISTER: {
    id: AcUUID(),
    name: 'Formulier Aanmelden',
    label: 'Formulier Aanmelden',
    path: PATHS.FORMS_REGISTER,
    title: `${
      AcCheckIfSpecificHostname() ? getTitle() : 'Open Tilburg'
    } | Formulier Aanmelden`,
    component: AcRegister,
  },
  FORMS_GEBRUIK: {
    id: AcUUID(),
    name: 'Formulier Gebruik',
    label: 'Formulier Gebruik',
    path: PATHS.FORMS_GEBRUIK,
    title: `${
      AcCheckIfSpecificHostname() ? getTitle() : 'Open Tilburg'
    } | Formulier Gebruik`,
    component: AcFormsGebruik,
  },
  FORMS_PRODUCT: {
    id: AcUUID(),
    name: 'Formulier Product',
    label: 'Formulier Product',
    path: PATHS.FORMS_PRODUCT,
    title: `${
      AcCheckIfSpecificHostname() ? getTitle() : 'Open Tilburg'
    } | Formulier Product`,
    component: AcFormsProduct,
  },
  FORMS_KOPPELING: {
    id: AcUUID(),
    name: 'Formulier Koppeling',
    label: 'Formulier Koppeling',
    path: PATHS.FORMS_KOPPELING,
    title: `${
      AcCheckIfSpecificHostname() ? getTitle() : 'Open Tilburg'
    } | Formulier Koppeling`,
    component: AcFormsKoppeling,
  },
  FORMS_DIENST: {
    id: AcUUID(),
    name: 'Formulier Dienst',
    label: 'Formulier Dienst',
    path: PATHS.FORMS_DIENST,
    title: `${
      AcCheckIfSpecificHostname() ? getTitle() : 'Open Tilburg'
    } | Formulier Dienst`,
    component: ConFormsDienst,
  },
  VIEWS: {
    id: AcUUID(),
    name: 'Views',
    label: LABELS.VIEWS,
    path: PATHS.VIEWS,
    title: `${AcCheckIfSpecificHostname() ? getTitle() : 'Open Tilburg'} | Views`,
    component: AcViews,
  },
  ACCOUNT: {
    id: AcUUID(),
    name: 'Beheer Mijn Account',
    label: LABELS.MIJN_ACCOUNT,
    path: PATHS.MY_ACCOUNT,
    title: 'Mijn account',
    component: AcMyAccount,
  },
  DIRECTORY: {
    id: AcUUID(),
    name: 'Directory',
    label: LABELS.DIRECTORY,
    path: PATHS.DIRECTORY,
    title: 'Directory',
    component: ConDirectory,
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

// CMS-driven external routes removed - now managed by OpenCatalogi

export const NAVIGATION_ITEMS = [ROUTES.HOME];

export const FOOTER_PRIMARY_ABOUT = [
  // CMS-driven routes removed from footer - now managed by OpenCatalogi
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

// CMS-driven external links removed - now managed by OpenCatalogi
export const EXTERNAL_LINKS = [];

// CMS-driven footer links removed - now managed by OpenCatalogi
export const FOOTER_PRIMARY_QUICK = [];

export const FOOTER_SECONDARY = [];

export const SUB_NAVIGATION_ITEMS = [];

export const AUTHENTICATION_ROUTES = [];

// Routes that require user authentication
export const AUTHENTICATION_REQUIRED_ROUTES = [
  PATHS.BEHEER,
  PATHS.BEHEER_TYPE,
  PATHS.BEHEER_TYPE_DETAILS,
  PATHS.MY_ACCOUNT,
];

export const DEFAULT_ROUTE = ROUTES.HOME;
export const REDIRECT_ROUTE = ROUTES.HOME;

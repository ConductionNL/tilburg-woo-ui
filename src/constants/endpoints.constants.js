import { AcLockObject } from '@utils/ac-lock-object';

const API = '/api';
const FAQS = '/faqs';
const PUBLIC = '/public';
const PAGES = '/pages';
const PUBLICATIONS = '/publications';
const SEARCH = '/search';
const ATTACHMENTS = '/attachments';
const CATALOG = '/catalogi';
const THEMES = '/themes';
const AUTHENTICATION = '/authentication';
const MIJN_OMGEVING = '/mijn-omgeving';
const GEMMA = '/gemma';
const MENUS = '/menu';
const OBJECTS = '/objects';

const OPENCONNECTOR = '/openconnector';
const OPENCATALOGI_PREFIX = '/apps/opencatalogi';
const NO_PREFIX = '';
const ENDPOINT = '/endpoint';
const VIEWS = '/views';
const ELEMENTS = '/elements';
const VOORZIENING_GEBRUIK = '/voorzieninggebruiken';
const HOSTNAME = window.location.hostname;

// Try to import container constants (generated at runtime)
let containerConfig;
try {
  containerConfig = require('@constants/container.constants');
} catch (error) {
  console.warn('Container constants not available, falling back to hostname-based logic');
  containerConfig = null;
}

const getGemmaEndpoint = () => {
  // Use container config if available
  if (containerConfig && containerConfig.getGemmaEndpoint) {
    return containerConfig.getGemmaEndpoint();
  }

  // Fallback to hostname-based logic for production builds
  switch (HOSTNAME) {
    // return 'http://localhost:8080';
    case 'vng.test.opencatalogi.nl':
      return 'https://vng.test.commonground.nu';
    case 'localhost':
    case 'vng.opencatalogi.nl':
    case 'acceptatie.softwarecatalogus.nl':
      return 'https://vng.accept.commonground.nu';
    default:
      return 'https://vng.accept.commonground.nu';
  }
};

export const ENDPOINTS = AcLockObject({
  OAUTH: {
    LOGIN: `${NO_PREFIX}${API}/oauth/login`,
    REGISTER: `${NO_PREFIX}${API}/oauth/register`,
    FORGOT_PASSWORD: `${NO_PREFIX}${API}/oauth/forgot-password`,
    RESET_PASSWORD: `${NO_PREFIX}${API}/oauth/reset-password`,
    REFRESH: `${NO_PREFIX}${API}/oauth/refresh`,
    LOGOUT: `${OPENCATALOGI_PREFIX}${API}/oauth/logout`,
  },
  OPENCONNECTOR: {
    USER_LOGIN: `${NO_PREFIX}/openconnector/user/login`,
    USER_LOGOUT: `${NO_PREFIX}/openconnector/user/logout`,
    USER_PROFILE: `${NO_PREFIX}/openconnector/user/me`,
  },
  PUBLICATIONS: {
    SEARCH: `${OPENCATALOGI_PREFIX}${API}${PUBLICATIONS}`, // GET
    SINGLE: (_id) =>
      `${OPENCATALOGI_PREFIX}${API}${PUBLICATIONS}/${_id}?extend[]=themes&extend[]=catalog&extend[]=publicationType&extend[]=organization&extend[]=@self.schema`, // GET
    RELATIONS: (_uri) =>
      `${OPENCATALOGI_PREFIX}${API}${PUBLICATIONS}?extend[]=publicationType&extend[]=catalog&_relations=${_uri}`, // GET
    ATTACHMENTS: (_id) =>
      `${OPENCATALOGI_PREFIX}${API}${PUBLICATIONS}/${_id}${ATTACHMENTS}`, // GET
  },
  MIJN_OMGEVING: {
    SEARCH: `${OPENCATALOGI_PREFIX}${API}${MIJN_OMGEVING}`, // GET
    SINGLE: (_id) =>
      `${OPENCATALOGI_PREFIX}${API}${SEARCH}${MIJN_OMGEVING}/${_id}?extend=all`, // GET
  },
  AUTHENTICATION: {
    SEARCH: `${OPENCATALOGI_PREFIX}${API}${SEARCH}${PUBLICATIONS}`, // GET
    SINGLE: (_id) =>
      `${OPENCATALOGI_PREFIX}${API}${SEARCH}${PUBLICATIONS}/${_id}?extend=all`, // GET
  },
  FAQS: {
    INDEX: `${OPENCATALOGI_PREFIX}${API}${PUBLIC}${FAQS}`, // GET
    SHOW: (_id) => `${OPENCATALOGI_PREFIX}${API}${PUBLIC}${FAQS}${_id}`, // GET
  },
  PAGES: {
    INDEX: `${OPENCATALOGI_PREFIX}${API}${PAGES}`, // GET
    SHOW: (_slug) => `${OPENCATALOGI_PREFIX}${API}${PAGES}/${_slug}`, // GET
  },
  THEMES: {
    INDEX: `${OPENCATALOGI_PREFIX}${API}${THEMES}`, // GET
  },
  GEMMA: {
    // VIEWS: `${OPENCONNECTOR}${API}${ENDPOINT}${VIEWS}`,
    VIEWS: `${getGemmaEndpoint()}/apps/openconnector/api/endpoint/views?_fields[]=name&_fields[]=id&_fields[]=identifier&_fields[]=properties`,
    // VIEW: (_id) => `${OPENCONNECTOR}${API}${ENDPOINT}${VIEWS}/${_id}?extend=all`,
    VIEW: (_id) =>
      `${getGemmaEndpoint()}/apps/openconnector/api/endpoint/views/${_id}`,
    // ELEMENTS: (_id) =>
    //   `${OPENCONNECTOR}${API}${ENDPOINT}${ELEMENTS}/${_id}?extend=all`,
    ELEMENT_REFERENCES: (_id) =>
      `${getGemmaEndpoint()}/apps/openconnector/api/endpoint/elements?identifier=${_id}`,

    // VOORZIENING_GEBRUIK: (_id) =>
    //   `${OPENCONNECTOR}${API}${ENDPOINT}${VOORZIENING_GEBRUIK}`,
    VOORZIENING_GEBRUIK: (_id) =>
      `${getGemmaEndpoint()}/apps/openconnector/api/endpoint/voorzieninggebruiken?extend[]=voorzieningId`,
  }, // GET
  MENU: {
    INDEX: `${OPENCATALOGI_PREFIX}${API}${MENUS}s`, // GET
    SINGLE: (_id) => `${OPENCATALOGI_PREFIX}${API}${MENUS}s/${_id}`, // GET
  },
});

export default ENDPOINTS;

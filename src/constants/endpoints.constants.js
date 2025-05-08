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
const OPENCATALOGI = '/opencatalogi';
const ENDPOINT = '/endpoint';
const VIEWS = '/views';
const ELEMENTS = '/elements';
const VOORZIENING_GEBRUIK = '/voorzieninggebruiken';
const HOSTNAME = window.location.hostname;

const getGemmaEndpoint = () => {
  switch (HOSTNAME) {
    // return 'http://localhost:8080';
    case 'vng.test.opencatalogi.nl':
      return 'https://vng.test.commonground.nu';
    case 'localhost':
    case 'vng.opencatalogi.nl':
      return 'https://vng.accept.commonground.nu';
    default:
      return 'https://vng.accept.commonground.nu';
  }
};

const PAGES_ENDPOINT =
  HOSTNAME === 'horstadmaas.accept.opencatalogi.nl'
    ? `${OPENCATALOGI}${API}${PAGES}`
    : `${OPENCATALOGI}${API}${PUBLIC}${PAGES}`;

const MENUS_ENDPOINT =
  HOSTNAME === 'horstadmaas.accept.opencatalogi.nl'
    ? `${OPENCATALOGI}${API}${MENUS}`
    : `${OPENCATALOGI}${API}${PUBLIC}${MENUS}`;

const THEMES_ENDPOINT =
  HOSTNAME === 'horstadmaas.accept.opencatalogi.nl'
    ? `${OPENCATALOGI}${API}${THEMES}`
    : `${OPENCATALOGI}${API}${PUBLIC}${THEMES}`;

export const ENDPOINTS = AcLockObject({
  PUBLICATIONS: {
    SEARCH: `${OPENCATALOGI}${API}${PUBLICATIONS}`, // GET
    SINGLE: (_id) =>
      `${OPENCATALOGI}${API}${PUBLICATIONS}/${_id}?extend[]=themes&extend[]=catalog&extend[]=publicationType&extend[]=organization`, // GET
    RELATIONS: (_uri) =>
      `${OPENCATALOGI}${API}${PUBLICATIONS}?extend[]=publicationType&extend[]=catalog&_relations=${_uri}`, // GET
    ATTACHMENTS: (_id) =>
      `${OPENCATALOGI}${API}${PUBLICATIONS}/${_id}${ATTACHMENTS}`, // GET
  },
  MIJN_OMGEVING: {
    SEARCH: `${OPENCATALOGI}${API}${MIJN_OMGEVING}`, // GET
    SINGLE: (_id) =>
      `${OPENCATALOGI}${API}${SEARCH}${MIJN_OMGEVING}/${_id}?extend=all`, // GET
  },
  AUTHENTICATION: {
    SEARCH: `${OPENCATALOGI}${API}${SEARCH}${PUBLICATIONS}`, // GET
    SINGLE: (_id) =>
      `${OPENCATALOGI}${API}${SEARCH}${PUBLICATIONS}/${_id}?extend=all`, // GET
  },
  FAQS: {
    INDEX: `${OPENCATALOGI}${API}${PUBLIC}${FAQS}`, // GET
    SHOW: (_id) => `${OPENCATALOGI}${API}${PUBLIC}${FAQS}${_id}`, // GET
  },
  PAGES: {
    INDEX: `${PAGES_ENDPOINT}`, // GET
    SHOW: (_slug) => `${PAGES_ENDPOINT}${_slug}`, // GET
  },
  THEMES: {
    INDEX: `${THEMES_ENDPOINT}`, // GET
  },
  GEMMA: {
    // VIEWS: `${OPENCONNECTOR}${API}${ENDPOINT}${VIEWS}`,
    VIEWS: `${getGemmaEndpoint()}/apps/openconnector/api/endpoint/views`,
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
      `${getGemmaEndpoint()}/apps/openconnector/api/endpoint/voorzieninggebruiken`,
  }, // GET
  MENU: {
    INDEX: `${MENUS_ENDPOINT}`, // GET
    SINGLE: (_id) => `${MENUS_ENDPOINT}/${_id}`, // GET
  },
});

export default ENDPOINTS;

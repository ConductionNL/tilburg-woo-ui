import { AcLockObject } from '@utils/ac-lock-object';

const HOSTNAME = window.location.hostname;

// Try to import container constants (generated at runtime)
let containerConfig;
let getApiUrl;
try {
  const containerConstants = require('@constants/container.constants');
  containerConfig = containerConstants;
  getApiUrl = containerConstants.getApiUrl;
} catch (error) {
  console.warn('Container constants not available, falling back to hostname-based logic');
  containerConfig = null;
  getApiUrl = () => '/api';
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
    LOGIN: `/oauth/login`,
    REGISTER: `/oauth/register`,
    FORGOT_PASSWORD: `/oauth/forgot-password`,
    RESET_PASSWORD: `/oauth/reset-password`,
    REFRESH: `/oauth/refresh`,
    LOGOUT: `/oauth/logout`,
  },
  OPENCONNECTOR: {
    USER_LOGIN: `/openconnector/api/user/login`,
    USER_LOGOUT: `/openconnector/api/user/logout`,
    USER_PROFILE: `/openconnector/api/user/me`,
  },
  PUBLICATIONS: {
    SEARCH: `/opencatalogi/api/publications`, // GET
    SINGLE: (_id) =>
      `/opencatalogi/api/publications/${_id}?extend[]=themes&extend[]=catalog&extend[]=publicationType&extend[]=organization&extend[]=@self.schema`, // GET
    RELATIONS: (_uri) =>
      `/opencatalogi/api/publications?extend[]=publicationType&extend[]=catalog&_relations=${_uri}`, // GET
    ATTACHMENTS: (_id) =>
      `/opencatalogi/api/publications/${_id}/attachments`, // GET
  },
  MIJN_OMGEVING: {
    SEARCH: `/mijn-omgeving`, // GET
    SINGLE: (_id) =>
      `/mijn-omgeving/${_id}?extend=all`, // GET
  },
  AUTHENTICATION: {
    SEARCH: `/publications`, // GET
    SINGLE: (_id) =>
      `/publications/${_id}?extend=all`, // GET
  },
  FAQS: {
    INDEX: `/faqs`, // GET
    SHOW: (_id) => `/faqs/${_id}`, // GET
  },
  PAGES: {
    INDEX: `/opencatalogi/api/pages`, // GET
    SHOW: (_slug) => `/opencatalogi/api/pages/${_slug}`, // GET
  },
  THEMES: {
    INDEX: `/opencatalogi/api/themes`, // GET
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
    INDEX: `/opencatalogi/api/menus`, // GET
    SINGLE: (_id) => `/opencatalogi/api/menus/${_id}`, // GET
  },
});

export default ENDPOINTS;

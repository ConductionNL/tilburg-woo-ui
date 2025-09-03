import { AcLockObject } from '@utils/ac-lock-object';

// Note: Using relative endpoints for GEMMA; base resolved by proxy configuration

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
    ATTACHMENTS: (_id) => `/opencatalogi/api/publications/${_id}/attachments`, // GET
  },
  MIJN_OMGEVING: {
    SEARCH: `/mijn-omgeving`, // GET
    SINGLE: (_id) => `/mijn-omgeving/${_id}`, // GET
  },
  AUTHENTICATION: {
    SEARCH: `/publications`, // GET
    SINGLE: (_id) => `/publications/${_id}`, // GET
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
    VIEWS: `/openconnector/api/endpoint/views`,
    VIEW: (_id) => `/openconnector/api/endpoint/views/${_id}`,
    ELEMENT_REFERENCES: (_id) =>
      `/openconnector/api/endpoint/elements?identifier=${_id}`,
    RELATIONSHIPS: (_id) =>
      `/openconnector/api/endpoint/relationships?identifier=${_id}`,
  }, // GET
  MENU: {
    INDEX: `/opencatalogi/api/menus`, // GET
    SINGLE: (_id) => `/opencatalogi/api/menus/${_id}`, // GET
  },
});

export default ENDPOINTS;

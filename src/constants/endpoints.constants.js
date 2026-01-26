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
    USER_LOGIN: `/openregister/api/user/login`,
    USER_LOGOUT: `/openregister/api/user/logout`,
    USER_PROFILE: `/openregister/api/user/me`,
  },
  PUBLICATIONS: {
    SEARCH: `/opencatalogi/api/publications`, // GET
    SINGLE: (_id) => `/opencatalogi/api/publications/${_id}?_extend=_schema,_register,themes,contactpersoon`, // GET
    RELATIONS: (_uri) =>
      `/opencatalogi/api/publications?_extend[]=publicationType&_extend[]=catalog&_relations=${_uri}`, // GET
    ATTACHMENTS: (_id) => `/opencatalogi/api/publications/${_id}/attachments`, // GET
    USED: (_id) => `/opencatalogi/api/publications/${_id}/used?_extend[]=_schema`, // GET
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
    SHOW: (_slug) => `/opencatalogi/api/pages${_slug}`, // GET
  },
  THEMES: {
    INDEX: `/opencatalogi/api/themes`, // GET
  },
  GEMMA: {
    VIEWS: `/openregister/api/objects/vng-gemma/view`,
    VIEW: (_id) => `/openregister/api/objects/vng-gemma/view/${_id}`,
    ELEMENT_REFERENCES: (_id) =>
      `/openregister/api/objects/vng-gemma/element?identifier=${_id}`,
    RELATIONSHIPS: (_id) =>
      `/openregister/api/objects/vng-gemma/relationships?identifier=${_id}`,
  }, // GET
  MENU: {
    INDEX: `/opencatalogi/api/menus`, // GET
    SINGLE: (_id) => `/opencatalogi/api/menus/${_id}`, // GET
  },
  AANGEBODEN_GEBRUIK: {
    AANBOD: `/softwarecatalog/api/aanbod`, // GET
    ACCEPT: (_id) => `/softwarecatalog/api/aanbod/${_id}/accept`, // PUT
    DENY: (_id) => `/softwarecatalog/api/aanbod/${_id}/deny`, // DELETE
    AFNEMER: `/softwarecatalog/api/aangeboden-gebruik/afnemer`, // GET
    DEELNEMERS: `/softwarecatalog/api/aangeboden-gebruik/deelnemers`, // GET
    SET_SELF: (_id) => `/softwarecatalog/api/aangeboden-gebruik/${_id}/set-self`, // PUT
    DENY_OLD: (_id) => `/softwarecatalog/api/aangeboden-gebruik/${_id}/deny`, // DELETE
    KOPPELING: (_id) => `/softwarecatalog/api/koppelingen-gebruik/${_id}`, // GET
    DOCS: `/softwarecatalog/api/aangeboden-gebruik/docs`, // GET
  },
});

export default ENDPOINTS;

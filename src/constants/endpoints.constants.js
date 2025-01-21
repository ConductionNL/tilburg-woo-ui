import { AcLockObject } from '@utils/ac-lock-object';

const API = '/api';
const FAQS = '/faqs';
const PUBLIC = '/public';
const PAGES = '/pages';
const PUBLICATIONS = '/publications';
const SEARCH = '/search';
const ATTACHMENTS = '/attachments';
const THEMES = '/themes';
const AUTHENTICATION = '/authentication';
const MIJN_OMGEVING = '/mijn-omgeving';
const GEMMA = '/gemma';

export const ENDPOINTS = AcLockObject({
  PUBLICATIONS: {
    SEARCH: `${API}${SEARCH}${PUBLICATIONS}`, // GET
    SINGLE: (_id) => `${API}${SEARCH}${PUBLICATIONS}/${_id}?extend=all`, // GET
    RELATIONS: (_uri) =>
      `${API}${SEARCH}${PUBLICATIONS}?extend[]=publicationType&extend[]=catalog&_relations=${_uri}`, // GET
    ATTACHMENTS: (_id) => `${API}${SEARCH}${PUBLICATIONS}/${_id}${ATTACHMENTS}`, // GET
  },
  MIJN_OMGEVING: {
    SEARCH: `${API}${SEARCH}${PUBLICATIONS}`, // GET
    SINGLE: (_id) => `${API}${SEARCH}${PUBLICATIONS}/${_id}?extend=all`, // GET
  },
  AUTHENTICATION: {
    SEARCH: `${API}${SEARCH}${PUBLICATIONS}`, // GET
    SINGLE: (_id) => `${API}${SEARCH}${PUBLICATIONS}/${_id}?extend=all`, // GET
  },
  FAQS: {
    INDEX: `${API}${PUBLIC}${FAQS}`, // GET
    SHOW: (_id) => `${API}${PUBLIC}${FAQS}${_id}`, // GET
  },
  PAGES: {
    INDEX: `${API}${PUBLIC}${PAGES}`, // GET
    SHOW: (_slug) => `${API}${PUBLIC}${PAGES}${_slug}`, // GET
  },
  THEMES: {
    INDEX: `${API}${SEARCH}${THEMES}`,
  }, // GET
  GEMMA: {
    LIST: `${API}${SEARCH}${GEMMA}`,
    SINGLE: (_id) => `${API}${SEARCH}${GEMMA}/${_id}?extend=all`,
  }, // GET
});

export default ENDPOINTS;

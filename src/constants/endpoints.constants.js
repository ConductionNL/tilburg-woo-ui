import { AcLockObject } from '@utils/ac-lock-object';

const API = '/api';
const FAQS = '/faqs';
const PUBLIC = '/public';
const PAGES = '/pages';
const PUBLICATIONS = '/publications';
const SEARCH = '/search';
const ATTACHMENTS = '/attachments';
const THEMES = '/themes';
const CATEGORIES = '/categories';
const TERMS = '/terms';

// For Conduction API, so publications/themes
const API_CONDUCTION = '';

export const ENDPOINTS = AcLockObject({
  PUBLICATIONS: {
    SEARCH: `${API_CONDUCTION}${SEARCH}${PUBLICATIONS}`, // GET
    SINGLE: (_id) =>
      `${API_CONDUCTION}${SEARCH}${PUBLICATIONS}/${_id}?extend%5B%5D=themes&extend%5B%5D=catalog`, // GET
    ATTACHMENTS: (_id) =>
      `${API_CONDUCTION}${SEARCH}${PUBLICATIONS}/${_id}${ATTACHMENTS}`, // GET
  },
  THEMES: {
    INDEX: `${API_CONDUCTION}${SEARCH}${THEMES}`,
  },
  FAQS: {
    INDEX: `${API}${PUBLIC}${FAQS}`, // GET
    SHOW: (_id) => `${API}${PUBLIC}${FAQS}${_id}`, // GET
  },
  PAGES: {
    INDEX: `${API}${PUBLIC}${PAGES}`, // GET
    SHOW: (_slug) => `${API}${PUBLIC}${PAGES}${_slug}`, // GET
  },
  CATEGORIES: {
    INDEX: `${API}${PUBLIC}${CATEGORIES}`, // GET
    SHOW: (_id) => `${API}${PUBLIC}${CATEGORIES}/${_id}`, // GET
  },
  TERMS: {
    INDEX: `${API}${PUBLIC}${TERMS}`, // GET
    SHOW: (_id) => `${API}${PUBLIC}${TERMS}/${_id}`, // GET
  },
});

export default ENDPOINTS;

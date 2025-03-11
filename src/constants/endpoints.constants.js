import { AcLockObject } from '@utils/ac-lock-object';

const API = '/api';
const FAQS = '/faqs';
const PUBLIC = '/public';
const PAGES = '/pages';
const PUBLICATIONS = '/publications';
const SEARCH = '/search';
const ATTACHMENTS = '/attachments';
const THEMES = '/themes';

export const ENDPOINTS = AcLockObject({
  PUBLICATIONS: {
    SEARCH: `${API}${SEARCH}${PUBLICATIONS}`, // GET
    SINGLE: (_id) =>
      `${API}${SEARCH}${PUBLICATIONS}/${_id}?extend[]=themes&extend[]=catalog`, // GET
    ATTACHMENTS: (_id) => `${API}${SEARCH}${PUBLICATIONS}/${_id}${ATTACHMENTS}`, // GET
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
});

export default ENDPOINTS;

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
  DOCUMENTS: {
    SEARCH: `${API}${SEARCH}`, // GET
    SINGLE: (_id) => `${API}${SEARCH}/${_id}`, // GET
    ATTACHMENTS: (_id) => `${API}${PUBLICATIONS}/${_id}${ATTACHMENTS}`, // GET
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
    INDEX: `${API}${THEMES}`, // GET
  },
});

export default ENDPOINTS;

import { AcLockObject } from '@utils/ac-lock-object';

const API = '/api';
const FAQS = '/faqs';
const PUBLIC = '/public';
const PAGES = '/pages';
const PUBLICATIONS = '/publications';
const SEARCH = '/search';
const ATTACHMENTS = '/attachments';

export const ENDPOINTS = AcLockObject({
  DOCUMENTS: {
    SEARCH: `${API}${SEARCH}${PUBLICATIONS}`, // GET
    SINGLE: (_id) => `${API}${SEARCH}${PUBLICATIONS}/${_id}?extend=all`, // GET
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
});

export default ENDPOINTS;

import { AcLockObject } from '@utils/ac-lock-object';

const API = '/api';
const FAQS = '/faqs';
const PUBLIC = '/public';
const PAGES = '/pages';
const PUBLICATIONS_NL = '/publicaties';

// V1
export const ENDPOINTS = AcLockObject({
  DOCUMENTS: {
    SEARCH: (_params) => `${API}${PUBLICATIONS_NL}?${_params}`, // GET
    SINGLE: (_id) => `${API}${PUBLICATIONS_NL}/${_id}`, // GET
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

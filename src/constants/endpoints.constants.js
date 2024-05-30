import {AcLockObject} from '@utils/ac-lock-object';

const API = '/api';
const FAQS = '/faqs';
const PUBLIC = '/public';
const PAGES = '/pages'

// V1
export const ENDPOINTS = AcLockObject({
    FAQS: {
        INDEX: `${API}${PUBLIC}${FAQS}`, // GET
        SHOW: (_id) => `${API}${PUBLIC}${FAQS}${_id}`, // GET
    },
    PAGES: {
        INDEX: `${API}${PUBLIC}${PAGES}`, // GET
        SHOW: (_slug) => `${API}${PUBLIC}${PAGES}${_slug}`, // GET
    }
});

export default ENDPOINTS;

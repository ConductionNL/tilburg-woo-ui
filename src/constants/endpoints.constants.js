import {AcLockObject} from '@utils/ac-lock-object';

const API = '/api';
const FAQS = '/faqs';
const PUBLIC = '/public';

// V1
export const ENDPOINTS = AcLockObject({
    FAQS: {
        INDEX: `${API}${PUBLIC}${FAQS}`, // GET
        SHOW: (_id) => `${API}${PUBLIC}${FAQS}${_id}`, // GET
    },
});

export default ENDPOINTS;

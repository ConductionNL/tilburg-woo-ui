import { AcLockObject } from '@utils/ac-lock-object';

const API = '/api';
const AUTH = '/auth';
const CONVERSATIONS = '/conversations';
const DOCUMENTS = '/documents';
const DOCUMENT = '/document';
const DOWNLOAD = '/download';
const FORGOT_PASSWORD = '/forgot-password';
const LOGOUT = '/logout';
const MARK_AS_READ = '/mark-as-read';
const MEDIA = '/media';
const MESSAGES = '/messages';
const NEWS = '/news-items';
const OAUTH = '/oauth';
const PORTAL = '/portal';
const PROFILE = '/profile';
const RESET_PASSWORD = '/reset-password';
const SUBSCRIPTIONS = '/subscriptions';
const TOKEN = '/token';
const UPDATE_PASSWORD = '/password';

// V1
export const ENDPOINTS = AcLockObject({
	OAUTH: {
		FORGOT_PASSWORD: `${API}${AUTH}${FORGOT_PASSWORD}`, // POST
		LOGIN: `${OAUTH}${TOKEN}`, // POST
		LOGOUT: `${API}${LOGOUT}`, // POST
		RESET_PASSWORD: `${API}${AUTH}${RESET_PASSWORD}`, // POST
	},
	PROFILE: {
		EXTEND_SUBSCRIPTION: `${API}${PROFILE}${SUBSCRIPTIONS}`, // GET
		UPDATE_PASSWORD: `${API}${AUTH}${UPDATE_PASSWORD}`, // POST
		WHOAMI: `${API}${PROFILE}`, // GET
	},
	CONVERSATIONS: {
		INDEX: `${API}${CONVERSATIONS}`, // GET
		MARK_AS_READ: (_id) => `${API}${CONVERSATIONS}/${_id}${MARK_AS_READ}`, // POST
		REPLY: (_id) => `${API}${CONVERSATIONS}/${_id}${MESSAGES}`, // POST
		STORE: `${API}${CONVERSATIONS}`, // POST
		SHOW: (_id) => `${API}${CONVERSATIONS}/${_id}`, // GET
	},
	NEWS: {
		INDEX: `${API}${NEWS}`, // GET
		SHOW: (_id) => `${API}${NEWS}/${_id}`, // GET
	},
	FILES: {
		INDEX: `${API}${DOCUMENTS}`, // GET
		DOWNLOAD: (_id) => `${API}${MEDIA}/${_id}${DOWNLOAD}`, // GET
	},
	DOCUMENTS: {
		DOWNLOAD: (_id) => `${API}${DOCUMENTS}/${_id}`, // GET
	},
});

export default ENDPOINTS;

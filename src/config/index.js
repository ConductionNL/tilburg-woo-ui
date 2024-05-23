// Imports => Utilities
import { AcGetAccessToken, AcLockObject } from '@utils';

// Get ENV variables
const _api_ = process.env.API_URL;
const _site_ = process.env.SITE;
const _mode_ = process.env.MODE;
const _provider_ = process.env.PROVIDER;

const _auto_logout = process.env.AUTO_LOGOUT;
const _auto_logout_time = process.env.AUTO_LOGOUT_TIME;

const _register_uri_ = process.env.REGISTER_URL;

export default {
	mode: _mode_,
	autologout: {
		active: !!_auto_logout,
		time: +_auto_logout_time || 0,
	},
	rollbar: AcLockObject({
		accessToken: process.env.ROLLBAR_KEY,
		captureUncaught: true,
		captureUnhandledRejections: true,
		verbose: false,
		environment: process.env.ROLLBAR_ENVIRONMENT,
	}),
	api: {
		baseURL: `${_api_}`,
		timeout: 1000 * 60,
		maxContentLength: 10000,
		responseType: 'json',
		responseEncoding: 'utf8',
		credentials: true,
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		transformRequest: [
			(data, headers) => {
				const token = AcGetAccessToken();
				if (token) headers['authorization'] = `Bearer ${token}`;
				return JSON.stringify(data);
			},
		],
	},
	download: {
		baseURL: `${_api_}`,
		timeout: 1000 * 60,
		maxContentLength: 10000,
		responseType: 'blob',
		responseEncoding: 'utf8',
		credentials: true,
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/pdf',
		},
		transformRequest: [
			(data, headers) => {
				const token = AcGetAccessToken();
				if (token) headers['authorization'] = `Bearer ${token}`;
				return JSON.stringify(data);
			},
		],
	},
	upload: {
		baseURL: `${_api_}`,
		timeout: 1000 * 60,
		maxContentLength: 10000,
		responseType: 'json',
		responseEncoding: 'utf8',
		credentials: true,
		headers: {
			'Content-Type': 'multipart/form-data',
			Accept: 'application/json',
			type: 'formData',
		},
		transformRequest: [
			(data, headers) => {
				const token = AcGetAccessToken();
				if (token) headers['authorization'] = `Bearer ${token}`;
				return data;
			},
		],
	},
};

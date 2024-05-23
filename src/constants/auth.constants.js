import { AcLockObject } from '@utils/ac-lock-object';

const _grant_type = process.env.GRANT_TYPE;
const _client_id = process.env.CLIENT_ID;
const _client_secret = process.env.CLIENT_SECRET;
const _provider = process.env.PROVIDER;

export const AUTH_KEYS = AcLockObject({
	GRANT_TYPE: _grant_type,
	CLIENT_ID: _client_id,
	CLIENT_SECRET: _client_secret,
	PROVIDER: _provider,
});

export const AUTH_MODES = AcLockObject({
	FORGOT_PASSWORD: 'forgot-password',
	FORGOT_PASSWORD_SUCCESS: 'forgot-password-success',
	RESET_PASSWORD: 'reset-password',
	RESET_PASSWORD_SUCCESS: 'reset-password-success',
	ACTIVATE_AWAIT: 'activate-await',
	ACTIVATE_SUCCESS: 'activate-success',
	LOGIN: 'login',
	REGISTER: 'register',
});

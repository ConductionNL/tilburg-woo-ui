import { AcLockObject } from '@utils/ac-lock-object';

export const ENVIRONMENTS = AcLockObject({
	DEV: 'dev',
	TEST: 'test',
	ACCEPT: 'accept',
	STAGING: 'staging',
	PRODUCTION: 'production',
	LOCAL: 'local',
});

// Imports => Constants
import { KEYS } from '@constants';

// Imports => Utilities
import { AcIsSet, AcIsEmptyString, AcGetState, AcSaveState } from '@utils';

export const AcGetAccessToken = () => {
	const impersonated_accesstoken = AcGetState(KEYS.IMPERSONATED_ACCESS_TOKEN);
	return AcIsSet(impersonated_accesstoken)
		? impersonated_accesstoken
		: AcGetState(KEYS.ACCESS_TOKEN);
};

export const AcSetAccessToken = (data, impersonating = false) => {
	if (impersonating) {
		return AcSaveState(KEYS.IMPERSONATED_ACCESS_TOKEN, data);
	}
	return AcSaveState(KEYS.ACCESS_TOKEN, data);
};

export const AcGetXUSRToken = () => {
	return AcGetState(KEYS.XUSR_TOKEN);
};

export const AcSetXUSRToken = (data) => {
	return AcSaveState(KEYS.XUSR_TOKEN, data);
};

export const AcRequestTransformer = (data, headers, json = true) => {
	const access_token = AcGetAccessToken();

	if (AcIsSet(access_token) && !AcIsEmptyString(access_token)) {
		headers['authorization'] = `Bearer ${access_token}`;
	}

	return json ? JSON.stringify(data) : data;
};

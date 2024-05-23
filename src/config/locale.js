// Imports => Moment
import dayjs from 'dayjs';

// Imports => Constants
import { KEYS } from '@constants';

// Imports => Utilities
import { AcGetState } from '@utils';

export const getLocale = () => {
	return window.navigator.userLanguage || window.navigator.language || 'nl-NL';
};

export const setLocale = (_locale) => {
	const locale = _locale || getLocale();

	dayjs.locale(locale);
};

export default {
	getLocale,
	setLocale,
};

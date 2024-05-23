// Imports => Config
import config from '@config';

// Imports => Constants
import { TITLES } from '@constants';

// Imports => Utilities
import { AcIsSet, AcIsEmptyString } from '@utils';

export const AcSetDocumentTitle = (title) => {
	let result = TITLES.BASE;

	if (
		AcIsSet(config) &&
		AcIsSet(config.appName) &&
		!AcIsEmptyString(config.appName)
	) {
		result = config.appName;
	}

	if (AcIsSet(title)) {
		result = `${title} - ${result}`;
	}

	document.title = result;
};

export const AcGetDocumentTitle = (title) => {
	let result = TITLES.BASE;

	if (
		AcIsSet(config) &&
		AcIsSet(config.appName) &&
		!AcIsEmptyString(config.appName)
	) {
		result = config.appName;
	}

	if (AcIsSet(title)) {
		result = `${title} - ${result}`;
	}

	return result;
};

export default AcSetDocumentTitle;

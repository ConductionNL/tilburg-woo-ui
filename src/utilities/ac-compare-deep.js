import { AcIsSet, AcIsArray, AcIsObject, AcIsBoolean } from './ac-get-type-of';

const AcCompareByType = (initial, final) => {
	let result = false;
	let type = null;

	if (AcIsArray(initial)) {
		type = 'Array';
	} else if (AcIsObject(initial)) {
		type = 'Object';
	} else if (AcIsBoolean(initial)) {
		type = 'Boolean';
	} else {
		type = 'String';
	}

	switch (type) {
		case 'Array':
			const len = initial.length;
			let n = 0;

			for (n; n < len; n++) {
				if (initial[n] !== final[n]) {
					result = true;
					break;
				}
			}
			break;

		case 'Object':
			for (let key in initial) {
				if (initial[key] !== final[key]) {
					result = true;
					break;
				}
			}
			break;

		case 'Boolean':
		case 'String':
		case 'Numeric':
		case 'Email':
			result = initial !== final;
			break;

		default:
	}

	return result;
};

export const AcCompareDeep = (initial, final) => {
	let result = false;

	if (!AcIsSet(initial) || !AcIsSet(final)) return;

	for (let key in initial) {
		if (AcIsSet(initial[key]) && AcIsSet(final[key])) {
			if (AcCompareByType(initial[key], final[key])) {
				result = true;
				break;
			}
		}
	}

	return result;
};

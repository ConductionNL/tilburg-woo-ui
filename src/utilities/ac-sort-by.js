// Imports => Constants
import { KEYS } from '@constants';

// Imports => Utilities
import { AcIsSet, AcIsArray, AcIsString } from './ac-get-type-of';

export const AcSortBy = ({ collection, field, direction = KEYS.ASCENDING }) => {
	if (!AcIsSet(collection) || !AcIsArray(collection)) return collection;
	if (!AcIsSet(field)) return collection;

	let _direction = AcIsSet(direction) ? direction : KEYS.ASCENDING;

	const result = collection.slice().sort((a, b) => {
		const aField = AcIsString(a[field]) ? a[field].toLowerCase() : a[field];
		const bField = AcIsString(b[field]) ? b[field].toLowerCase() : b[field];

		if (!AcIsSet(aField) || !AcIsSet(bField)) return 0;

		if (_direction === KEYS.ASCENDING) {
			return a[field] > b[field] ? 1 : a[field] < b[field] ? -1 : 0;
		} else {
			return a[field] > b[field] ? -1 : a[field] < b[field] ? 1 : 0;
		}
	});

	return result;
};

export default AcSortBy;

// Imports => Constants
import { ICONS, KEYS } from '@constants';

export const AcGetEquipmentIcon = (type) => {
	let result = null;
	if (!type) return result;

	const entity = type.replace('-', '_').replace(/ /g, '_').toLowerCase();

	switch (entity) {
		case KEYS.CONTROL_UNIT:
		case KEYS.CONTROL_UNITS:
			result = ICONS.CONTROL_UNIT;
			break;

		case KEYS.HAMMER:
		case KEYS.HAMMERS:
			result = ICONS.HAMMER;
			break;

		case KEYS.POWERPACK:
		case KEYS.POWERPACKS:
		case KEYS.POWER_PACKS:
			result = ICONS.POWERPACK;
			break;

		default:
	}

	return result;
};

export default AcGetEquipmentIcon;

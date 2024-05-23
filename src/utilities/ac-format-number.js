export const AcFormatNumber = (num, options) => {
	if (isNaN(num)) return 0;

	const units = ['k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
	let decimal = 0;
	let result = null;

	const precision = options.precision;
	const unit = options.unit;
	const prefix = options.prefix;

	for (let i = units.length - 1; i >= 0; i--) {
		decimal = Math.pow(1000, i + 1);

		// if (num <= -decimal || num >= decimal) {
		result = +(num / decimal).toFixed(precision);
		if (unit) {
			if (units.indexOf(unit) > -1) result += units[i];
			else result += unit;
		}
		if (prefix) result = prefix + result;

		return result;
		// }
	}

	return num;
};

export default AcFormatNumber;

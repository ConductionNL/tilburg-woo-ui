export const AcFormatPercentage = (num, options) => {
	const value = isNaN(num) ? 0 : num;

	const precision = options.precision;
	const unit = options.unit || options.unit === false ? options.unit : '%';

	let result = ((value / 100) * 100).toFixed(precision);

	if (unit) {
		result = parseFloat(result);
		result += unit;
	} else {
		result = parseFloat(result);
	}

	return result;
};

export default AcFormatPercentage;

import parsePhoneNumber, { isValidPhoneNumber } from 'libphonenumber-js';

export const AcFormatPhonenumber = (input) => {
	if (!input) return input;

	const value = input.trim().replace(/\s/g, '');
	const valid = isValidPhoneNumber(value);
	const parsed = parsePhoneNumber(value, 'NL');

	return valid
		? parsed.formatNational()
		: parsed && parsed?.number
		? parsed.number
		: value;
};

export default AcFormatPhonenumber;

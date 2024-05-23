const ibantools = require('ibantools');

export const AcFormatIban = (input) => {
	if (!input || input === '-') return input;

	let result = input;
	let entry = input;

	const valid = ibantools.isValidIBAN(input);

	if (valid) {
		const print = ibantools.friendlyFormatIBAN(input);
		const electronic = ibantools.electronicFormatIBAN(input);

		entry = electronic;
	}

	const ibanRegExp = /\w{4}(.*)\w{3}/g;
	const match = ibanRegExp.exec(entry);
	const part = match[1];
	const mask = new Array(part.length + 1).join('*');

	result = entry.replace(part, mask);

	return result;
};

export default AcFormatIban;

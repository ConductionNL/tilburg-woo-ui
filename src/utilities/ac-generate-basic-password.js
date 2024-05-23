const shuffle = (o) => {
	for (
		let j, x, i = o.length;
		i;
		j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x
	);
	return o;
};
export const AcGenerateBasicPassword = () => {
	// Do not include a leading zero
	let digits = '123456789'.split('');
	const first = shuffle(digits).pop();
	// Add "0" to the array
	digits.push('0');
	let result = parseInt(first + shuffle(digits).join('').substring(0, 3), 10);

	if ('123456789'.indexOf(result) > -1 || '987654321'.indexOf(result) > -1) {
		result = AcGenerateBasicPassword();
	}

	return result;
};

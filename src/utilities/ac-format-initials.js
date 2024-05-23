export const AcFormatInitials = (name) => {
	const arr = name.split(' ');
	const first_letter = arr[0][0];
	const last_letter = arr.length > 1 ? arr[arr.length - 1][0] : arr[0][1];

	return `${first_letter}${last_letter}`;
};

export default AcFormatInitials;

export const AcFormatSecondsToHms = (d) => {
	const input = Number(d);
	const hours = Math.floor(input / 3600);
	const minutes = Math.floor((input % 3600) / 60);

	let result = '';

	if (hours > 0) result += `${hours}h `;
	if (hours > 0 && minutes > 0) result += `${minutes}min`;
	else result += `${minutes}min`;

	return result;
};

export default AcFormatSecondsToHms;

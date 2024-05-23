import { AcIsSet } from './ac-get-type-of';

export const AcFormatMapURL = (location) => {
	if (!AcIsSet(location)) return;
	if (!AcIsSet(location.lat) || !AcIsSet(location.lng)) return;

	const value = [location.lat, location.lng].join(',');
	const base_url = `https://www.google.com/maps/search/?api=1&`;
	const parameters = [];

	parameters.push(`query=${value.replace(/ /g, '')}`);
	parameters.push('zoom=15');

	const url = `${base_url}${parameters.join('&')}`;

	return url;
};

export default AcFormatMapURL;

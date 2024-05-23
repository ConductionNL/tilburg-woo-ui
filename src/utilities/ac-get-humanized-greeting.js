import dayjs from 'dayjs';

// Import => Config
import config from '@config';

export const AcGetHumanizedGreeting = (m) => {
	dayjs.locale(config.locale);

	m = m || dayjs();
	let g = null; //return g

	if (!m || !m.isValid()) {
		return;
	} //if we can't find a valid or filled dayjs, we return.

	const split_afternoon = 12; //24hr time to split the afternoon
	const split_evening = 17; //24hr time to split the evening
	const current_hour = parseFloat(m.format('HH'));

	if (current_hour >= split_afternoon && current_hour <= split_evening) {
		g = 'Goedemiddag';
	} else if (current_hour >= split_evening) {
		g = 'Goedenavond';
	} else {
		g = 'Goedemorgen';
	}

	return g;
};

export default AcGetHumanizedGreeting;

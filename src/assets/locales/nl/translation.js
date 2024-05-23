import { Translations } from '../translations';

let locale_nl = {};
Translations.forEach(item => {
	locale_nl[item.en] = item.nl;
});

export default locale_nl;

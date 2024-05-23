import { Translations } from '../translations';

let locale_en = {};
Translations.forEach(item => {
	locale_en[item.nl] = item.en;
});

export default locale_en;

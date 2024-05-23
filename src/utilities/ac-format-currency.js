import SYMBOLS from '@config/currencymap';

export const AcGetCurrencySymbol = currency => {
	return SYMBOLS[currency.toUpperCase()].symbol_native;
};

export const AcFormatCurrency = (
	num,
	decimals = 0,
	locale = 'nl-NL',
	currency = 'EUR'
) => {
	return num.toLocaleString(locale, {
		style: 'currency',
		currency,
		minimumFractionDigits: decimals,
	});
};

export default AcFormatCurrency;

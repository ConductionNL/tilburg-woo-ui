// Imports => Utilities
import {AcIsSet} from './ac-get-type-of';

export const AcFormatLocalCurrency = (
  value,
  options = {
    style: 'currency',
    currency: 'EUR',
    currencyDisplay: 'code',
  },
  locale = 'nl-NL'
) => {
  if (!AcIsSet(options)) return value;
  if (!AcIsSet(value)) return value;

  const _options = {
    style: 'currency',
    currency: 'EUR',
    currencyDisplay: 'code',
    ...options,
  };

  const formatter = new Intl.NumberFormat(locale, _options);

  const result = formatter.format(value);

  return result && result.replace(/^(\D+)/, '$1');
};

export default AcFormatLocalCurrency;

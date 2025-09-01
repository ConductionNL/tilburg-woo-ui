// Imports => Moment
import dayjs from 'dayjs';

export const getLocale = () => {
  return window.navigator.userLanguage || window.navigator.language || 'nl-NL';
};

export const setLocale = (_locale) => {
  const locale = _locale || getLocale();

  dayjs.locale(locale);
};

export default {
  getLocale,
  setLocale,
};

import i18n from 'i18next';
import { reactI18nextModule } from 'react-i18next';

// Imports => Constants
import { KEYS } from '@constants';

// Imports => Utilities
import { AcGetState, AcSaveState } from '@utils';

// Imports => Assets
import translationEN from '@assets/locales/en/translation';
import translationNL from '@assets/locales/nl/translation';

// Define translations
const resources = {
  en: {
    translation: translationEN,
  },
  nl: {
    translation: translationNL,
  },
};

// Default language setting
const lng = () => {
  const locale = AcGetState(KEYS.LOCALE);
  if (locale) return locale;

  AcSaveState(KEYS.LOCALE, 'nl');
  return 'nl';
};

i18n
  .use(reactI18nextModule) // passes i18n down to react-i18next
  .init({
    resources,
    lng: lng(),
    nsSeparator: false,
    keySeparator: false, // we do not use keys in form messages.welcome
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;

import { VISUALS } from '@constants';

export const getTabHeaderIcon = (headerName) => {
  switch (headerName) {
    case 'product':
      return VISUALS.CUBES;
    case 'module':
      return VISUALS.CUBE;
    case 'dienst':
      return VISUALS.HAND_HOLDING;
    case 'gebruik':
      return VISUALS.CLOUD;
    case 'versie':
      return VISUALS.INFO;
    case 'moduleversie':
      return VISUALS.INFO;
    case 'contract':
      return VISUALS.HAND_SHAKE;
    case 'overeenkomst':
      return VISUALS.HAND_SHAKE;
    case 'organisatie':
      return VISUALS.BUILDING;
    case 'kwetsbaarheid':
      return VISUALS.TRIANGLE_EXCLAMATION;
    case 'koppeling':
      return VISUALS.LINK;
    case 'contactpersoon':
      return VISUALS.USERS;
    default:
      return VISUALS.CHART_LINE;
  }
};

export const getTabHeaderName = (headerName, singular = false) => {
  const translations = {
    product: ['Product', 'Producten'],
    module: ['Applicatie', 'Applicaties'], 
    dienst: ['Dienst', 'Diensten'],
    gebruik: ['Gebruik', 'Gebruik'],
    versie: ['Versie', 'Versies'],
    contract: ['Contract', 'Contracten'],
    overeenkomst: ['Overeenkomst', 'Overeenkomsten'],
    organisatie: ['Organisatie', 'Organisaties'],
    kwetsbaarheid: ['Kwetsbaarheid', 'Kwetsbaarheden'],
    koppeling: ['Koppeling', 'Koppelingen'],
    contactpersoon: ['Contactpersoon', 'Contactpersonen'],
    moduleversie: ['Applicatieversie', 'Applicatieversies'],
    moduleVersie: ['Applicatieversie', 'Applicatieversies'],
    Moduleversie: ['Applicatieversie', 'Applicatieversies']
  };

  const translation = translations[headerName];
  if (!translation) return headerName;

  return singular ? translation[0] : translation[1];
};

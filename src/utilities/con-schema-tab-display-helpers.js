import { VISUALS } from '@constants';

export const getTabHeaderIcon = (headerName) => {
  switch (headerName) {
    case 'Product':
      return VISUALS.CUBE;
    case 'Module':
      return VISUALS.CUBE;
    case 'Dienst':
      return VISUALS.HAND_HOLDING;
    case 'Gebruik':
      return VISUALS.CLOUD;
    case 'Versie':
      return VISUALS.INFO;
    case 'Contract':
      return VISUALS.HAND_SHAKE;
    case 'Overeenkomst':
      return VISUALS.HAND_SHAKE;
    case 'Organisatie':
      return VISUALS.BUILDING;
    case 'Kwetsbaarheid':
      return VISUALS.TRIANGLE_EXCLAMATION;
    case 'Koppeling':
      return VISUALS.LINK;
    case 'Contactpersoon':
      return VISUALS.USERS;
  }
};

export const getTabHeaderName = (headerName) => {
  switch (headerName) {
    case 'Product':
      return 'Producten';
    case 'Module':
      return 'Applicaties';
    case 'Dienst':
      return 'Diensten';
    case 'Gebruik':
      return 'Gebruik';
    case 'Versie':
      return 'Versie';
    case 'Contract':
      return 'Contracten';
    case 'Overeenkomst':
      return 'Overeenkomsten';
    case 'Organisatie':
      return 'Organisaties';
    case 'Kwetsbaarheid':
      return 'Kwetsbaarheden';
    case 'Koppeling':
      return 'Koppelingen';
    case 'Contactpersoon':
      return 'Contactpersonen';
  }
};

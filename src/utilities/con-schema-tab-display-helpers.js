import { VISUALS } from '@constants';

export const getTabHeaderIcon = (headerName) => {
  switch (headerName) {
    case 'product':
      return VISUALS.CUBE;
    case 'module':
      return VISUALS.CUBES;
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

export const getTabHeaderName = (headerName) => {
  switch (headerName) {
    case 'product':
      return 'Producten';
    case 'module':
      return 'Applicaties';
    case 'dienst':
      return 'Diensten';
    case 'gebruik':
      return 'Gebruik';
    case 'versie':
      return 'Versie';
    case 'contract':
      return 'Contracten';
    case 'overeenkomst':
      return 'Overeenkomsten';
    case 'organisatie':
      return 'Organisaties';
    case 'kwetsbaarheid':
      return 'Kwetsbaarheden';
    case 'koppeling':
      return 'Koppelingen';
    case 'contactpersoon':
      return 'Contactpersonen';
    case 'moduleversie':
    case 'Moduleversie':
      return 'Applicatie versies';
    default:
      return headerName;
  }
};

import { AcLockObject } from '@utils/ac-lock-object';
import { AcCheckIfSpecificHostname } from '@src/services/ac-check-if-specific-hostname';

const getTitle = () => {
  const hostname = window.location.hostname;

  switch (hostname) {
    case 'vng.opencatalogi.nl':
    case 'vng.test.opencatalogi.nl':
      return 'Softwarecatalogus';
    case 'open-tilburg.accept.commonground.nu':
      return 'Open Tilburg';
    case 'open-dimpact.accept.commonground.nu':
    case 'dimpact.opencatalogi.nl':
      return 'Producten catalogus';
    case 'open-rotterdam.accept.commonground.nu':
      return 'Open Rotterdam';
    case 'open-migrato.accept.commonground.nu':
      return 'Open Migrato';
    case 'opencatalogi.nl':
    case 'developer.opencatalogi.nl':
    case 'test.opencatalogi.nl':
      return 'OpenCatalogi';
    case 'opencatalogi.open-regels.nl':
      return 'OpenRegels';
    case 'localhost':
      return 'Localhost catalogus';
    default:
      return 'Open Tilburg';
  }
};

export const TITLES = AcLockObject({
  ACTIVATE: 'Activeren',
  BASE: AcCheckIfSpecificHostname() ? getTitle() : 'Open Tilburg',
  CONVERSATIONS: 'Meldingen',
  DOCUMENTS: 'Documenten',
  FAQ: 'Veelgestelde vragen',
  THEMES: 'Onderwerpen',
  HOME: 'Overzicht',
  NEWS: 'Nieuws',
  NEW_CONVERSATION: 'Nieuwe melding',
  PROFILE: 'Profiel',
  SEARCH: 'Zoeken',
  TERMS_CONDITIONS: 'Algemene voorwaarden',
  ABOUT: 'Over Open Tilburg',
  ACCESSIBILITY: 'Toegankelijkheid',
  CONTACT: 'Contact',
  COOKIES: 'Cookies',
  FAQ: 'Veelgestelde vragen',
  HOME: 'Overzicht',
  ORGANIZATION: 'Organisatie en werkwijze',
  PRIVACY: 'Privacy',
  PROCLAIMER: 'Proclaimer',
  PUBLICATION: 'Publicatie',
  REACH_OUT: 'Beschikbaarheidsgegevens',
  SEARCH: 'Zoeken',
  THEMES: 'Onderwerpen',
  WEBSITE: 'www.tilburg.nl',
  WOO: 'WOO verzoek indienen',
});

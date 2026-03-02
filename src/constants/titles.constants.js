import { AcLockObject } from '@utils/ac-lock-object';
import { AcCheckIfSpecificHostname } from '@src/services/ac-check-if-specific-hostname';

// Try to import container constants (generated at runtime)
let containerConfig;
try {
  containerConfig = require('@constants/container.constants');
} catch (error) {
  console.warn('Container constants not available, falling back to hostname-based logic');
  containerConfig = null;
}

const getTitle = () => {
  // Use container config if available
  if (containerConfig && containerConfig.getTitle) {
    return containerConfig.getTitle();
  }

  // Fallback to hostname-based logic for production builds
  const hostname = window.location.hostname;

  switch (hostname) {
    case 'vng.opencatalogi.nl':
    case 'acceptatie.softwarecatalogus.nl':
    case 'vng.test.opencatalogi.nl':
      return 'softwarecatalogus';
    case 'open-tilburg.accept.commonground.nu':
      return 'Open Tilburg';
    case 'open-dimpact.accept.commonground.nu':
    case 'dimpact.opencatalogi.nl':
      return 'Producten softwarecatalogus';
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
      return 'Development softwarecatalogus - WATCH TEST';
    case 'horstadmaas.accept.opencatalogi.nl':
    case 'verwerkingsregister.horstaandemaas.nl':
      return 'Horst aan de Maas';
    case 'verwerkingsregister.venray.nl':
      return 'Venray';
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
  ORGANIZATION: 'Organisatie en werkwijze',
  PRIVACY: 'Privacy',
  PROCLAIMER: 'Proclaimer',
  PUBLICATION: 'Publicatie',
  REACH_OUT: 'Beschikbaarheidsgegevens',
  DIRECTORY: 'Directory',
  WEBSITE: 'www.tilburg.nl',
  WOO: 'WOO verzoek indienen',
});

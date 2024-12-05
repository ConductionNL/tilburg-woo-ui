import { AcLockObject } from '@utils/ac-lock-object';

const hostname = window.location.hostname;

export const TITLES = AcLockObject({
  ACTIVATE: 'Activeren',
  BASE: hostname === 'vng.opencatalogi.nl' ? 'Softwarecatalogus' : 'Open Tilburg',
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
  SUBJECTS: 'Onderwerpen',
});

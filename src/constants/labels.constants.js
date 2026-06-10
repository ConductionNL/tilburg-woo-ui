export const LABELS = {
  APP_NAME: 'Open Tilburg',
  CLOSE: 'Sluiten',
  CLOSE_SINGULAR: 'Sluit',
  CONCEPTS_LIST: 'Begrippenlijst',
  ENTER_QUERY: 'Zoek op naam of trefwoord',
  FILTER: 'Filter & sorteer',
  MENU: 'Menu',
  SEARCH: 'Zoeken',
  SEARCH_EXTENSIVE: 'Zoeken',
  SEARCH_RESULTS: 'Resultaten',
  CATEGORY: 'Categorie',
  CATEGORIES: 'Categorieën',
  CATEGORIES_EXPLAIN: 'Bekijk de verschillende categorieën',
  TO_MAIN_CONTENT: 'Direct naar de inhoud',
  HIGHLIGHTED: 'Uitgelicht',
  SUBJECTS: 'Onderwerpen',
  SORT: 'Sorteren',
  CHOSEN_FILTERS: 'Gekozen filters',
  NO_RESULTS: 'Geen resultaten gevonden',
  REFINE_SEARCH: 'Probeer een andere zoekterm of pas de filters aan.',
  WHAT_ARE_YOU_LOOKING_FOR: 'Waar bent u naar op zoek?',
  READ_MORE_ABOUT: 'Lees meer over',
  VIEW_RESULTS: 'Bekijk resultaten',
  ADDITIONAL_INFO: 'Aanvullende informatie',
  CASE_NUMBER: 'Zaaknummer',
  DATE_PUBLICATION: 'Publicatiedatum',
  UNKNOWN: 'Onbekend',
  SUMMARY: 'Samenvatting',
  SUMMARY_UNAVAILABLE: 'Samenvatting niet beschikbaar',
  DOCUMENTS_PRIMARY: 'Hoofddocumenten',
  DOCUMENTS_SECONDARY: 'Bijlagen',

  DOCUMENT: 'Document',
  TYPE: 'Type',
  DATE: 'Datum',
  SIZE: 'Grootte',
  DOCUMENTS: 'Documenten',
  DOCUMENTS_EXPLAIN: 'Bekijk alle documenten',
  SEARCH_RESULTS_LOADING: 'Zoekresultaten worden geladen',
  SEARCH_RESULTS_LOADED: 'Zoekresultaten geladen',
  FOUND: 'Gevonden',
  RESULT: 'Resultaat',
  RESULTS: 'Resultaten',
  SHARE: 'Link naar publicatie delen',
  SHARE_MODAL: 'Link kopiëren',
  COPY_LINK: 'Kopieer link',
  COPY_LINK_SUCCESS: 'Link gekopieerd!',
  COPY_LINK_ERROR: 'Kopiëren mislukt',
  VIEW_ALL_THEMES: 'Bekijk alle onderwerpen',

  THIS_WEBSITE: 'Deze website',
  QUICK_LINKS: 'Snel naar',
  SHOW_ALL_SUBJECTS: 'Toon alle onderwerpen',
  VIEW_DOCUMENTS: 'Bekijk de documenten',

  THEMES: 'Onderwerpen',

  AUTHENTICATION: 'Login',
  MIJN_OMGEVING: 'Mijn omgeving',
  GEMMA: 'GEMMA',
  ABOUT_CATEGORIES: 'Over categorieën',

  WRONG_PAGE: '404 | Deze pagina bestaat niet',

  // Navigation & Footer Labels
  ORGANIZATION: 'Organisatie en werkwijze',
  EXTERNAL_LINK: 'Opent in een nieuw tabblad',

  // Nextcloud Labels
  NEXTCLOUD_LOGIN: 'Nextcloud Login',
  NEXTCLOUD_AUTHORIZATION: 'Nextcloud Autorisatie',

  // Beheer Account
  MIJN_ACCOUNT: 'Mijn account',

  // Beheer labels
  BEHEER: 'Beheer',
  BEHEER_TYPE: 'Beheer Type',
  BEHEER_TYPE_DETAILS: 'Beheer Type Details',

  // Register labels
  REGISTER: 'Aanmelden',

  // Directory labels
  DIRECTORY: 'Directory',

  // Forgot password labels
  FORGOT_PASSWORD: 'Wachtwoord vergeten',
};

export const LABELS_DYNAMIC = {
  RESULTS: (count) => (count === 1 ? LABELS.RESULT : LABELS.RESULTS),
};

export const LABELS = {
  APP_NAME: 'Open Tilburg',
  CLOSE: 'Sluiten',
  ENTER_QUERY: 'Vul je zoekterm in',
  FILTER: 'Filter & sorteer',
  MENU: 'Menu',
  SEARCH: 'Zoeken',
  SEARCH_EXTENSIVE: 'Uitgebreid zoeken',
  CATEGORY: 'Categorie',
  CATEGORIES: 'Categorieën',
  CATEGORIES_EXPLAIN: 'Bekijk de verschillende categorieën',
  TO_MAIN_CONTENT: 'Direct naar de inhoud',
  HIGHLIGHTED: 'Uitgelicht',

  CHOSEN_FILTERS: 'Gekozen filters',
  NO_RESULTS: 'Geen resultaten gevonden',
  REFINE_SEARCH: 'Probeer een andere zoekterm of pas de filters aan.',
  WHAT_ARE_YOU_LOOKING_FOR: 'Waar ben je naar op zoek?',
  READ_MORE_ABOUT: 'Lees meer over',

  DATE_PUBLICATION: 'Publicatiedatum',
  UNKNOWN: 'Onbekend',
  SUMMARY: 'Samenvatting',
  SUMMARY_UNAVAILABLE: 'Samenvatting niet beschikbaar',
  DOCUMENTS_PRIMARY: 'Hoofddocumenten',

  DOCUMENT: 'Document',
  TYPE: 'Type',
  DATE: 'Datum',
  DOCUMENTS: 'Documenten',
  DOCUMENTS_EXPLAIN: 'Bekijk alle documenten',
  SEARCH_RESULTS_LOADING: 'Zoekresultaten worden geladen',
  SEARCH_RESULTS_LOADED: 'Zoekresulten geladen',
  FOUND: 'Gevonden',
  RESULT: 'Resultaat',
  RESULTS: 'Resultaten',
};

export const LABELS_DYNAMIC = {
  RESULTS: (count) => (count === 1 ? LABELS.RESULT : LABELS.RESULTS),
};

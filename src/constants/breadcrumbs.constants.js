export const BREADCRUMB_ITEMS = {
  HOME: { label: 'Home', href: '/' },
  SEARCH: { label: 'Zoeken', href: '/zoeken' },
  THEMES: { label: 'Onderwerpen', href: '/onderwerpen' },
  LOGIN: { label: 'Inloggen', href: '/login' },
  MIJN_OMGEVING: { label: 'Mijn omgeving', href: '/mijn-omgeving' },
};

export const BREADCRUMBS = {
  HOME: [],
  SEARCH: (label) => {
    const items = [BREADCRUMB_ITEMS.SEARCH];
    if (label) {
      items.push({ label });
    }
    return items;
  },
  CONTENT: (label) => [{ label }],
  THEMES: [BREADCRUMB_ITEMS.THEMES],
  LOGIN: [BREADCRUMB_ITEMS.LOGIN],
  MIJN_OMGEVING: [BREADCRUMB_ITEMS.MIJN_OMGEVING],
  PUBLICATION: (label) => [BREADCRUMB_ITEMS.SEARCH, { label }],
};

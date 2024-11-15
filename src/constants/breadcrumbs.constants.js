export const BREADCRUMB_ITEMS = {
  HOME: { label: 'Home', href: '/' },
  SEARCH: { label: 'Zoeken', href: '/zoeken' },
  THEMES: { label: 'Onderwerpen', href: '/onderwerpen' },
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
  PUBLICATION: (label) => [BREADCRUMB_ITEMS.SEARCH, { label }],
};

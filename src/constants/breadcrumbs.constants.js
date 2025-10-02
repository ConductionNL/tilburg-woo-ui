// pretify a pathname part
const prettifyPathname = (name) =>
  name && name.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

export const BREADCRUMB_ITEMS = {
  HOME: { label: 'Home', href: '/' },
  SEARCH: { label: 'Zoeken', href: '/zoeken' },
  THEMES: { label: 'Onderwerpen', href: '/onderwerpen' },
  LOGIN: { label: 'Inloggen', href: '/login' },
  MIJN_OMGEVING: { label: 'Mijn omgeving', href: '/mijn-omgeving' },
  GEMMA: { label: 'GEMMA', href: '/gemma' },
  NEXTCLOUD_LOGIN: { label: 'Nextcloud Login', href: '/login' },
  BEHEER: { label: 'Beheer', href: '/beheer' },
  BEHEER_MY_ACCOUNT: (type) => ({
    label: 'Mijn account',
    href: '/beheer/my-account',
    isActive: type === 'my-account',
  }),
  BEHEER_MY_ORGANISATION: {
    label: 'Mijn Organisatie',
    href: '/beheer/my-organisation',
  },
  BEHEER_LIST: (type) => ({
    label: prettifyPathname(type),
    href: `/beheer/${type}`,
    isActive: type !== 'my-account' && type !== 'my-organisation',
  }),
  REGISTER: { label: 'Aanmelden', href: '/register' },
  VIEWS: { label: 'Views' },
  VIEWS_LIST: { label: 'GEMMA weergaven', href: '/views' },
  BEHEER_VIEWS: { label: 'GEMMA weergaven beheer' },
  MY_ACCOUNT: { label: 'Mijn account' },
  DIRECTORY: { label: 'Directory', href: '/directory' },
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
  GEMMA: [BREADCRUMB_ITEMS.GEMMA],
  NEXTCLOUD_LOGIN: [BREADCRUMB_ITEMS.NEXTCLOUD_LOGIN],
  PUBLICATION: (label) => [BREADCRUMB_ITEMS.SEARCH, { label }],
  BEHEER: (label) => {
    const items = [BREADCRUMB_ITEMS.BEHEER];
    if (label) {
      items.push({ label });
    }
    return items;
  },
  BEHEER_LIST: (type, label) => {
    const items = [BREADCRUMB_ITEMS.BEHEER, BREADCRUMB_ITEMS.BEHEER_LIST(type)];
    if (label) {
      items.push({ label });
    }
    return items;
  },
  BEHEER_MY_ORGANISATION: [
    BREADCRUMB_ITEMS.BEHEER,
    BREADCRUMB_ITEMS.BEHEER_MY_ORGANISATION,
  ],
  REGISTER: [BREADCRUMB_ITEMS.REGISTER],
  VIEWS: (label) => {
    const items = [BREADCRUMB_ITEMS.VIEWS];
    if (label) {
      items.push({ label });
    }
    return items;
  },
  VIEWS_LIST: [BREADCRUMB_ITEMS.VIEWS_LIST],
  BEHEER_VIEWS: [BREADCRUMB_ITEMS.BEHEER_VIEWS],
  MY_ACCOUNT: [BREADCRUMB_ITEMS.MY_ACCOUNT],
  DIRECTORY: [BREADCRUMB_ITEMS.DIRECTORY],
};

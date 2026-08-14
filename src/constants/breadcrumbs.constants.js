import { normalizeSchemaName } from '@utils';

// pretify a pathname part
const prettifyPathname = (name) =>
  name && name.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

export const BREADCRUMB_ITEMS = {
  HOME: { label: 'Home', href: '/' },
  SEARCH: { label: 'Zoeken', href: '/zoeken' },
  THEMES: { label: 'Onderwerpen', href: '/onderwerpen' },
  LOGIN: { label: 'Inloggen', href: '/login' },
  FORGOT_PASSWORD: { label: 'Wachtwoord vergeten', href: '/reminder' },
  MIJN_OMGEVING: { label: 'Mijn omgeving', href: '/mijn-omgeving' },
  GEMMA: { label: 'GEMMA', href: '/gemma' },
  NEXTCLOUD_LOGIN: { label: 'Nextcloud Login', href: '/login' },
  BEHEER: { label: 'Beheer', href: '/beheer' },
  BEHEER_MY_ACCOUNT: {
    label: 'Mijn account',
    href: '/beheer/my-account',
  },
  BEHEER_MODULE: {
    label: 'Applicatie',
    href: '/beheer/module',
  },
  BEHEER_MY_ORGANISATION: {
    label: 'Mijn organisatie',
    href: '/beheer/my-organisation',
  },
  BEHEER_LIST: (type) => ({
    label:
      type === 'module'
        ? 'Applicatie'
        : type === 'moduleversion' || type === 'moduleversie'
        ? 'Applicatieversie'
        : prettifyPathname(type),
    href: `/beheer/${type}`,
    isActive: type !== 'my-account' && type !== 'my-organisation',
  }),
  REGISTER: { label: 'Aanmelden', href: '/register' },
  VIEWS: { label: 'Views' },
  VIEWS_LIST: { label: 'GEMMA weergaven', href: '/views' },
  BEHEER_VIEWS: { label: 'GEMMA weergaven beheer' },
  DIRECTORY: { label: 'Directory', href: '/directory' },
  PUBLICATIE: { label: 'Publicatie' },
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
  FORGOT_PASSWORD: [BREADCRUMB_ITEMS.FORGOT_PASSWORD],
  MIJN_OMGEVING: [BREADCRUMB_ITEMS.MIJN_OMGEVING],
  GEMMA: [BREADCRUMB_ITEMS.GEMMA],
  NEXTCLOUD_LOGIN: [BREADCRUMB_ITEMS.NEXTCLOUD_LOGIN],
  PUBLICATION: (label, schema) => {
    const items = [BREADCRUMB_ITEMS.SEARCH];

    // If we have a schema, use the schema name from normalizeSchemaName
    // Otherwise, use "Publicatie" as fallback
    if (schema?.slug) {
      const schemaName = normalizeSchemaName(schema.slug);
      // If normalizeSchemaName returns the original slug (no mapping found), use "Publicatie"
      const displayName = schemaName === schema.slug ? 'Publicatie' : schemaName;
      items.push({ label: displayName });
    } else {
      items.push(BREADCRUMB_ITEMS.PUBLICATIE);
    }

    // If we have a specific label (publication title), add it as the final breadcrumb
    if (label) {
      items.push({ label });
    }

    return items;
  },
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
  BEHEER_MY_ACCOUNT: [BREADCRUMB_ITEMS.BEHEER, BREADCRUMB_ITEMS.BEHEER_MY_ACCOUNT],
  BEHEER_MY_ORGANISATION: [
    BREADCRUMB_ITEMS.BEHEER,
    BREADCRUMB_ITEMS.BEHEER_MY_ORGANISATION,
  ],
  BEHEER_MODULE: [BREADCRUMB_ITEMS.BEHEER, BREADCRUMB_ITEMS.BEHEER_MODULE],
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
  BEHEER_VIEW_DETAIL: (viewName) => {
    const items = [
      BREADCRUMB_ITEMS.BEHEER,
      { label: 'View', href: '/beheer/views' },
    ];
    if (viewName) items.push({ label: viewName });
    return items;
  },
  DIRECTORY: [BREADCRUMB_ITEMS.DIRECTORY],
};

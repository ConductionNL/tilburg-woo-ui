// Imports => Constants
import { TITLES } from './titles.constants';
import { ICONS } from './icons.constants';

// Imports => Utilities
import { AcUUID } from '@utils/ac-uuid';
import { AcLockObject } from '@utils/ac-lock-object';

// Imports => Views
import { AcHome, AcPublication, AcSearch, AcSubjects } from '@views';

export const PATHS = AcLockObject({
  HOME: '/',
  PUBLICATION: '/publicatie/:id',
  SEARCH: '/zoeken/:query?',
  SUBJECTS: '/onderwerpen',
});

export const ROUTES = {
  HOME: {
    id: AcUUID(),
    name: 'Home',
    label: TITLES.HOME,
    path: PATHS.HOME,
    component: AcHome,
    title: 'Home | Open Tilburg',
  },
  PUBLICATION: {
    id: AcUUID(),
    name: 'Publication',
    label: TITLES.PUBLICATION,
    path: PATHS.PUBLICATION,
    component: AcPublication,
    title: 'Open Tilburg | Publicatie',
  },
  SEARCH: {
    id: AcUUID(),
    name: 'Search',
    label: TITLES.SEARCH,
    path: PATHS.SEARCH,
    component: AcSearch,
    title: 'Open Tilburg | Zoeken',
  },
  SUBJECTS: {
    id: AcUUID(),
    name: 'Subjects',
    label: TITLES.SUBJECTS,
    path: PATHS.SUBJECTS,
    component: AcSubjects,
    title: 'Open Tilburg | Onderwerpen',
  },
};

export const NAVIGATION_ITEMS = [ROUTES.HOME];

export const SUB_NAVIGATION_ITEMS = [];

export const AUTHENTICATION_ROUTES = [];

export const DEFAULT_ROUTE = ROUTES.HOME;
export const REDIRECT_ROUTE = ROUTES.HOME;

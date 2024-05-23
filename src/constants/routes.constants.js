// Imports => Constants
import { TITLES } from './titles.constants';
import { ICONS } from './icons.constants';

// Imports => Utilities
import { AcUUID } from '@utils/ac-uuid';
import { AcLockObject } from '@utils/ac-lock-object';

// Imports => Views
import { AcHome } from '@views';

export const PATHS = AcLockObject({
	HOME: '/',
});

export const ROUTES = {
	HOME: {
		id: AcUUID(),
		name: 'Home',
		label: TITLES.HOME,
		path: PATHS.HOME,
		component: AcHome,
		title: 'Jouw overzicht',
		icon: ICONS.HOME,
		$ref: null,
		roles: null,
		forbidden: true,
	},
};

export const NAVIGATION_ITEMS = [ROUTES.HOME];

export const SUB_NAVIGATION_ITEMS = [];

export const AUTHENTICATION_ROUTES = [];

export const DEFAULT_ROUTE = ROUTES.HOME;
export const REDIRECT_ROUTE = ROUTES.HOME;

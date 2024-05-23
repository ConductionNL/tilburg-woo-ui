// Imports => Constants
import { TITLES } from './titles.constants';
import { ICONS } from './icons.constants';

// Imports => Utilities
import { AcUUID } from '@utils/ac-uuid';
import { AcLockObject } from '@utils/ac-lock-object';

// Imports => Views
import {
	AcActivate,
	AcConversations,
	AcDocuments,
	AcForgotPassword,
	AcLogin,
	AcHome,
	AcNews,
	AcNewsDetail,
	AcProfile,
	AcResetPassword,
} from '@views';

export const PATHS = AcLockObject({
	AUTH: {
		LOGIN: '/inloggen',
		FORGOT_PASSWORD: '/wachtwoord-vergeten',
		RESET_PASSWORD: '/wachtwoord-herstellen/:token',
		ACTIVATE: '/activeren',
	},
	FAQ: '/veelgestelde-vragen',
	HOME: '/',
	CONVERSATIONS: '/berichten',
	CONVERSATION: '/berichten/:id',
	DOCUMENTS: '/documenten',
	NEWS: '/nieuws',
	NEWS_DETAIL: '/nieuws/:id',
	PROFILE: '/profiel',
});

export const ROUTES = {
	ACTIVATE: {
		id: AcUUID(),
		name: 'Activate',
		label: TITLES.ACTIVATE,
		path: PATHS.AUTH.ACTIVATE,
		component: AcActivate,
		$ref: null,
		roles: null,
		forbidden: false,
	},
	CONVERSATIONS: {
		id: AcUUID(),
		name: 'Conversations',
		label: TITLES.CONVERSATIONS,
		path: PATHS.CONVERSATIONS,
		component: AcConversations,
		title: 'Jouw persoonlijke berichtenbox',
		icon: ICONS.EMAIL_OUTLINE,
		$ref: null,
		roles: null,
		forbidden: true,
	},
	CONVERSATION: {
		id: AcUUID(),
		name: 'Conversations',
		label: TITLES.CONVERSATIONS,
		path: PATHS.CONVERSATION,
		component: AcConversations,
		title: 'Jouw persoonlijke berichtenbox',
		$ref: null,
		roles: null,
		forbidden: true,
	},
	DOCUMENTS: {
		id: AcUUID(),
		name: 'DOCUMENTS',
		label: TITLES.DOCUMENTS,
		path: PATHS.DOCUMENTS,
		component: AcDocuments,
		title: 'Belangrijke documenten',
		icon: ICONS.TEXT_BOX_OUTLINE,
		$ref: null,
		resident: true,
		roles: null,
		forbidden: true,
	},
	FORGOT_PASSWORD: {
		id: AcUUID(),
		name: 'Forgot password',
		label: TITLES.FORGOT_PASSWORD,
		path: PATHS.AUTH.FORGOT_PASSWORD,
		component: AcForgotPassword,
		$ref: null,
		roles: null,
		forbidden: false,
	},
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
	LOGIN: {
		id: AcUUID(),
		name: 'Login',
		label: TITLES.LOGIN,
		path: PATHS.AUTH.LOGIN,
		component: AcLogin,
		$ref: null,
		roles: null,
		forbidden: false,
	},
	NEWS: {
		id: AcUUID(),
		name: 'News',
		label: TITLES.NEWS,
		path: PATHS.NEWS,
		component: AcNews,
		icon: ICONS.NEWSPAPER_O,
		title: 'Al het nieuws op 1 plek',
		resident: true,
		$ref: null,
		roles: null,
		forbidden: true,
	},
	NEWS_DETAIL: {
		id: AcUUID(),
		name: 'News Detail',
		label: TITLES.NEWS,
		path: PATHS.NEWS_DETAIL,
		component: AcNewsDetail,
		resident: true,
		$ref: null,
		roles: null,
		forbidden: true,
	},
	PROFILE: {
		id: AcUUID(),
		name: 'Profile',
		label: TITLES.PROFILE,
		path: PATHS.PROFILE,
		component: AcProfile,
		icon: ICONS.ACCOUNT_CIRCLE_OUTLINE,
		title: 'Jouw profiel en instellingen',
		$ref: null,
		roles: null,
		forbidden: true,
	},
	RESET_PASSWORD: {
		id: AcUUID(),
		name: 'Reset password',
		label: TITLES.RESET_PASSWORD,
		path: PATHS.AUTH.RESET_PASSWORD,
		component: AcResetPassword,
		$ref: null,
		roles: null,
		forbidden: false,
	},
};

export const NAVIGATION_ITEMS = [
	ROUTES.HOME,
	ROUTES.CONVERSATIONS,
	ROUTES.NEWS,
	ROUTES.DOCUMENTS,
];

export const SUB_NAVIGATION_ITEMS = [ROUTES.PROFILE];

export const AUTHENTICATION_ROUTES = [
	PATHS.AUTH.ACTIVATE,
	PATHS.AUTH.FORGOT_PASSWORD,
	PATHS.AUTH.LOGIN,
	PATHS.AUTH.RESET_PASSWORD,
];

export const DEFAULT_ROUTE = ROUTES.HOME;
export const REDIRECT_ROUTE = ROUTES.LOGIN;

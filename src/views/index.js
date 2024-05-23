import loadable from '@loadable/component';

// Imports => Views
const AcActivate = loadable(() => import('@views/ac-activate/ac-activate'));
const AcDocuments = loadable(() => import('@views/ac-documents/ac-documents'));
const AcForgotPassword = loadable(() =>
	import('@views/ac-forgot-password/ac-forgot-password')
);
const AcHome = loadable(() => import('@views/ac-home/ac-home'));
const AcLogin = loadable(() => import('@views/ac-login/ac-login'));
const AcConversations = loadable(() =>
	import('@views/ac-conversations/ac-conversations')
);
const AcNews = loadable(() => import('@views/ac-news/ac-news'));
const AcNewsDetail = loadable(() => import('@views/ac-news-detail/ac-news-detail'));
const AcProfile = loadable(() => import('@views/ac-profile/ac-profile'));
const AcResetPassword = loadable(() =>
	import('@views/ac-reset-password/ac-reset-password')
);

export {
	AcActivate,
	AcConversations,
	AcDocuments,
	AcForgotPassword,
	AcHome,
	AcLogin,
	AcNews,
	AcNewsDetail,
	AcProfile,
	AcResetPassword,
};

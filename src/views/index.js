import loadable from '@loadable/component';

const AcHome = loadable(() => import('@views/ac-home/ac-home'));
const AcSearch = loadable(() => import('@views/ac-search/ac-search'));
const AcThemes = loadable(() => import('@views/ac-themes/ac-themes'));
const AcPublication = loadable(() => import('@views/ac-publication/ac-publication'));
const AcAuthentication = loadable(() =>
  import('@views/ac-authentication/ac-authentication')
);
const AcMijnOmgeving = loadable(() =>
  import('@views/ac-mijn-omgeving/ac-mijn-omgeving')
);
const AcGemma = loadable(() => import('@views/ac-gemma/ac-gemma'));
const AcNextcloudAuthorization = loadable(() =>
  import('@views/ac-nextcloud-authorization/ac-nextcloud-authorization')
);
const AcBeheer = loadable(() => import('@views/ac-beheer/ac-beheer'));
const AcFallbackErrorPage = loadable(() =>
  import('@views/ac-fallback-error-page/ac-fallback-error-page')
);
const AcRegister = loadable(() => import('@views/ac-register/ac-register'));
const AcViews = loadable(() => import('@views/ac-views/ac-views'));
const AcMyAccount = loadable(() => import('@views/ac-my-account/ac-my-account'));
const ConDirectory = loadable(() => import('@views/con-directory/con-directory'));

export {
  AcHome,
  AcSearch,
  AcThemes,
  AcPublication,
  AcAuthentication,
  AcMijnOmgeving,
  AcGemma,
  AcNextcloudAuthorization,
  AcBeheer,
  AcFallbackErrorPage,
  AcRegister,
  AcViews,
  AcMyAccount,
  ConDirectory,
};

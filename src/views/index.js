import loadable from '@loadable/component';

const AcHome = loadable(() => import('@views/ac-home/ac-home'));
const AcSearch = loadable(() => import('@views/ac-search/ac-search'));
const AcThemes = loadable(() => import('@views/ac-themes/ac-themes'));
const AcPublication = loadable(() => import('@views/ac-publication/ac-publication'));
const AcMijnOmgeving = loadable(() =>
  import('@views/ac-mijn-omgeving/ac-mijn-omgeving')
);
const AcGemma = loadable(() => import('@views/ac-gemma/ac-gemma'));
const AcNextcloudAuthorization = loadable(() =>
  import('@views/ac-nextcloud-authorization/ac-nextcloud-authorization')
);
const AcBeheer = loadable(() =>
  import('@views/ac-beheer/core/components/ac-beheer')
);
const AcFallbackErrorPage = loadable(() =>
  import('@views/ac-fallback-error-page/ac-fallback-error-page')
);
const AcRegister = loadable(() => import('@views/ac-register/ac-register'));
const AcViews = loadable(() => import('@views/ac-views/ac-views'));
const AcMyAccount = loadable(() => import('@views/ac-my-account/ac-my-account'));
const AcLogin = loadable(() => import('@views/ac-login/ac-login'));
const ConDirectory = loadable(() => import('@views/con-directory/con-directory'));
const AcObjects = loadable(() => import('@views/ac-beheer/ac-objects'));
const AcFormsGebruik = loadable(() =>
  import('@views/ac-forms/ac-forms-gebruik/ac-forms-gebruik')
);
const AcFormsProduct = loadable(() =>
  import('@views/ac-forms/ac-forms-product/ac-forms-product')
);
const AcFormsKoppeling = loadable(() =>
  import('@views/ac-forms/ac-forms-koppeling/ac-forms-koppeling')
);
const ConFormsDienst = loadable(() =>
  import('@views/ac-forms/con-forms-dienst/con-forms-dienst')
);
const ConFormsIndex = loadable(() =>
  import('@views/ac-forms/con-forms-index/con-forms-index')
);
const ConViewsList = loadable(() => import('@views/con-views-list/con-views-list'));
const ConBeheerViews = loadable(() =>
  import('@views/con-beheer-views/con-beheer-views')
);
const ConPasswordReminder = loadable(() =>
  import('@views/ac-password-reminder/ac-password-reminder')
);

export {
  AcHome,
  AcSearch,
  AcThemes,
  AcPublication,
  AcMijnOmgeving,
  AcGemma,
  AcNextcloudAuthorization,
  AcBeheer,
  AcFallbackErrorPage,
  AcRegister,
  AcViews,
  AcMyAccount,
  AcLogin,
  ConDirectory,
  AcObjects,
  AcFormsGebruik,
  AcFormsProduct,
  AcFormsKoppeling,
  ConFormsDienst,
  ConFormsIndex,
  ConViewsList,
  ConBeheerViews,
  ConPasswordReminder,
};

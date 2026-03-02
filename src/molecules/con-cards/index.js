import loadable from '@loadable/component';

const ConCardOrganisationApplication = loadable(() =>
  import(
    '@src/molecules/con-cards/con-card-organisation-application/con-card-organisation-application'
  )
);
const ConCardDienst = loadable(() =>
  import('@molecules/con-cards/con-card-dienst/con-card-dienst')
);
const ConCardContactpersoon = loadable(() =>
  import('@molecules/con-cards/con-card-contactpersoon/con-card-contactpersoon')
);
const ConCardGebruik = loadable(() =>
  import('@molecules/con-cards/con-card-gebruik/con-card-gebruik')
);
const ConCardKoppeling = loadable(() =>
  import('@molecules/con-cards/con-card-koppeling/con-card-koppeling')
);
const ConCardModuleVersie = loadable(() =>
  import('@molecules/con-cards/con-card-moduleversie/con-card-moduleversie')
);

export {
  ConCardOrganisationApplication,
  ConCardDienst,
  ConCardContactpersoon,
  ConCardGebruik,
  ConCardKoppeling,
  ConCardModuleVersie,
};

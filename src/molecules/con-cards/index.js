import loadable from '@loadable/component';

const ConCardOrganisation = loadable(() =>
  import('@molecules/con-cards/con-card-organisation/con-card-organisation')
);
const ConCardApplication = loadable(() =>
  import('@molecules/con-cards/con-card-application/con-card-application')
);
const ConCardDienst = loadable(() =>
  import('@molecules/con-cards/con-card-dienst/con-card-dienst')
);

export { ConCardOrganisation, ConCardApplication, ConCardDienst };

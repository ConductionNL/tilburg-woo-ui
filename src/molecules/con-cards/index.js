import loadable from '@loadable/component';

const ConCardOrganisationApplication = loadable(() =>
  import('@src/molecules/con-cards/con-card-organisation-application/con-card-organisation-application')
);
const ConCardDienst = loadable(() =>
  import('@molecules/con-cards/con-card-dienst/con-card-dienst')
);

export { ConCardOrganisationApplication, ConCardDienst };

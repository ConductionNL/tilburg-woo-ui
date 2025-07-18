import loadable from '@loadable/component';

const ConCardOrganisation = loadable(() =>
  import('@molecules/con-cards/con-card-organisation/con-card-organisation')
);
const ConCardApplication = loadable(() =>
  import('@molecules/con-cards/con-card-application/con-card-application')
);

export { ConCardOrganisation, ConCardApplication };

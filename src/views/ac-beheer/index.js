import loadable from '@loadable/component';

// standard pages
const AcBeheerError = loadable(() =>
  import('@src/views/ac-beheer/ac-standard-pages/ac-beheer-error')
);
const AcBeheerLoading = loadable(() =>
  import('@src/views/ac-beheer/ac-standard-pages/ac-beheer-loading')
);

// list pages
const AcDashboard = loadable(() => import('@views/ac-beheer/ac-dashboard'));
const AcBeheerVoorzieningenAanbod = loadable(() =>
  import(
    '@src/views/ac-beheer/ac-voorzieningen-aanbod/pages/ac-voorzieningen-aanbod'
  )
);
const AcBeheerVoorzieningenGebruik = loadable(() =>
  import('@views/ac-beheer/ac-voorzieningen-gebruik/ac-voorzieningen-gebruik')
);
const AcBeheerVoorzieningenVersie = loadable(() =>
  import('@views/ac-beheer/ac-voorzieningen-versie/ac-voorzieningen-versie')
);
const AcBeheerContracten = loadable(() =>
  import('@views/ac-beheer/ac-contracten/ac-contracten')
);
const AcBeheerOrganisaties = loadable(() =>
  import('@views/ac-beheer/ac-organisatie/ac-organisatie')
);
const AcBeheerKwetsbaarheden = loadable(() =>
  import('@views/ac-beheer/ac-kwetsbaarheid/ac-kwetsbaarheid')
);
const AcBeheerVoorzieningen = loadable(() =>
  import('@views/ac-beheer/ac-voorzieningen/ac-voorzieningen')
);

// detail pages
const AcBeheerVoorzieningenAanbodDetails = loadable(() =>
  import(
    '@src/views/ac-beheer/ac-voorzieningen-aanbod/pages/ac-voorzieningen-aanbod-details'
  )
);

export {
  AcBeheerVoorzieningenAanbod,
  AcBeheerVoorzieningenGebruik,
  AcBeheerVoorzieningenVersie,
  AcBeheerContracten,
  AcBeheerOrganisaties,
  AcBeheerKwetsbaarheden,
  AcDashboard,
  AcBeheerVoorzieningenAanbodDetails,
  AcBeheerError,
  AcBeheerLoading,
  AcBeheerVoorzieningen,
};

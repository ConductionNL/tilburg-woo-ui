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
  import(
    '@src/views/ac-beheer/ac-voorzieningen-gebruik/pages/ac-voorzieningen-gebruik'
  )
);
const AcBeheerVoorzieningenVersie = loadable(() =>
  import(
    '@src/views/ac-beheer/ac-voorzieningen-versie/pages/ac-voorzieningen-versie'
  )
);
const AcBeheerContracten = loadable(() =>
  import('@src/views/ac-beheer/ac-contracten/pages/ac-contracten')
);
const AcBeheerOrganisaties = loadable(() =>
  import('@src/views/ac-beheer/ac-organisatie/pages/ac-organisatie')
);
const AcBeheerKwetsbaarheden = loadable(() =>
  import('@src/views/ac-beheer/ac-kwetsbaarheid/pages/ac-kwetsbaarheid')
);
const AcBeheerVoorzieningen = loadable(() =>
  import('@src/views/ac-beheer/ac-voorzieningen/pages/ac-voorzieningen')
);
const AcBeheerGebruikers = loadable(() =>
  import('@src/views/ac-beheer/ac-gebruikers/pages/ac-gebruikers')
);

// detail pages
const AcBeheerVoorzieningenDetails = loadable(() =>
  import('@src/views/ac-beheer/ac-voorzieningen/pages/ac-voorzieningen-details')
);
const AcBeheerVoorzieningenAanbodDetails = loadable(() =>
  import(
    '@src/views/ac-beheer/ac-voorzieningen-aanbod/pages/ac-voorzieningen-aanbod-details'
  )
);
const AcBeheerVoorzieningenGebruikDetails = loadable(() =>
  import(
    '@src/views/ac-beheer/ac-voorzieningen-gebruik/pages/ac-voorzieningen-gebruik-details'
  )
);
const AcBeheerVoorzieningenVersieDetails = loadable(() =>
  import(
    '@src/views/ac-beheer/ac-voorzieningen-versie/pages/ac-voorzieningen-versie-details'
  )
);
const AcBeheerContractenDetails = loadable(() =>
  import('@src/views/ac-beheer/ac-contracten/pages/ac-contracten-details')
);
const AcBeheerOrganisatieDetails = loadable(() =>
  import('@src/views/ac-beheer/ac-organisatie/pages/ac-organisatie-details')
);
const AcBeheerKwetsbaarheidDetails = loadable(() =>
  import('@src/views/ac-beheer/ac-kwetsbaarheid/pages/ac-kwetsbaarheid-details')
);
const AcBeheerGebruikerDetails = loadable(() =>
  import('@src/views/ac-beheer/ac-gebruikers/pages/ac-gebruikers-details')
);

export {
  AcBeheerVoorzieningenAanbod,
  AcBeheerVoorzieningenGebruik,
  AcBeheerVoorzieningenVersie,
  AcBeheerContracten,
  AcBeheerOrganisaties,
  AcBeheerKwetsbaarheden,
  AcDashboard,
  AcBeheerError,
  AcBeheerLoading,
  AcBeheerVoorzieningen,
  AcBeheerGebruikers,
  AcBeheerVoorzieningenAanbodDetails,
  AcBeheerVoorzieningenDetails,
  AcBeheerVoorzieningenGebruikDetails,
  AcBeheerVoorzieningenVersieDetails,
  AcBeheerContractenDetails,
  AcBeheerOrganisatieDetails,
  AcBeheerKwetsbaarheidDetails,
  AcBeheerGebruikerDetails,
};

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
const AcBeheerDienst = loadable(() =>
  import('@src/views/ac-beheer/ac-dienst/pages/ac-dienst')
);
const AcBeheerGebruiken = loadable(() =>
  import('@src/views/ac-beheer/ac-gebruiken/pages/ac-gebruiken')
);
const AcBeheerVoorzieningenVersie = loadable(() =>
  import(
    '@src/views/ac-beheer/ac-voorzieningen-versie/pages/ac-voorzieningen-versie'
  )
);
const AcBeheerOvereenkomsten = loadable(() =>
  import('@src/views/ac-beheer/ac-overeenkomsten/pages/ac-overeenkomsten')
);
const AcBeheerOrganisaties = loadable(() =>
  import('@src/views/ac-beheer/ac-organisatie/pages/ac-organisatie')
);
const AcBeheerKwetsbaarheden = loadable(() =>
  import('@src/views/ac-beheer/ac-kwetsbaarheid/pages/ac-kwetsbaarheid')
);
const AcBeheerApplicaties = loadable(() =>
  import('@src/views/ac-beheer/ac-applicaties/pages/ac-applicaties')
);
const AcBeheerGebruikers = loadable(() =>
  import('@src/views/ac-beheer/ac-contactpersonen/pages/ac-contactpersonen')
);

// detail pages
const AcBeheerApplicatiesDetails = loadable(() =>
  import('@src/views/ac-beheer/ac-applicaties/pages/ac-applicaties-details')
);
const AcBeheerDienstDetails = loadable(() =>
  import('@src/views/ac-beheer/ac-dienst/pages/ac-dienst-details')
);
const AcBeheerVoorzieningenVersieDetails = loadable(() =>
  import(
    '@src/views/ac-beheer/ac-voorzieningen-versie/pages/ac-voorzieningen-versie-details'
  )
);
const AcBeheerGebruikenDetails = loadable(() =>
  import('@src/views/ac-beheer/ac-gebruiken/pages/ac-gebruiken-details')
);
const AcBeheerOvereenkomstenDetails = loadable(() =>
  import('@src/views/ac-beheer/ac-overeenkomsten/pages/ac-overeenkomsten-details')
);
const AcBeheerOrganisatieDetails = loadable(() =>
  import('@src/views/ac-beheer/ac-organisatie/pages/ac-organisatie-details')
);
const AcBeheerKwetsbaarheidDetails = loadable(() =>
  import('@src/views/ac-beheer/ac-kwetsbaarheid/pages/ac-kwetsbaarheid-details')
);
const AcBeheerGebruikerDetails = loadable(() =>
  import('@src/views/ac-beheer/ac-contactpersonen/pages/ac-contactpersonen-details')
);

export {
  AcBeheerDienst,
  AcBeheerGebruiken,
  AcBeheerVoorzieningenVersie,
  AcBeheerOvereenkomsten,
  AcBeheerOrganisaties,
  AcBeheerKwetsbaarheden,
  AcDashboard,
  AcBeheerError,
  AcBeheerLoading,
  AcBeheerApplicaties,
  AcBeheerGebruikers,
  AcBeheerDienstDetails,
  AcBeheerApplicatiesDetails,
  AcBeheerVoorzieningenVersieDetails,
  AcBeheerGebruikenDetails,
  AcBeheerOvereenkomstenDetails,
  AcBeheerOrganisatieDetails,
  AcBeheerKwetsbaarheidDetails,
  AcBeheerGebruikerDetails,
};

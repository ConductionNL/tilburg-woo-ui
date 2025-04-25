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
const AcBeheerOvereenkomsten = loadable(() =>
  import('@src/views/ac-beheer/ac-overeenkomsten/pages/ac-overeenkomsten')
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
const AcBeheerDienstDetails = loadable(() =>
  import('@src/views/ac-beheer/ac-dienst/pages/ac-dienst-details')
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
  import('@src/views/ac-beheer/ac-gebruikers/pages/ac-gebruikers-details')
);

export {
  AcBeheerDienst,
  AcBeheerVoorzieningenGebruik,
  AcBeheerVoorzieningenVersie,
  AcBeheerOvereenkomsten,
  AcBeheerOrganisaties,
  AcBeheerKwetsbaarheden,
  AcDashboard,
  AcBeheerError,
  AcBeheerLoading,
  AcBeheerVoorzieningen,
  AcBeheerGebruikers,
  AcBeheerDienstDetails,
  AcBeheerVoorzieningenDetails,
  AcBeheerVoorzieningenGebruikDetails,
  AcBeheerVoorzieningenVersieDetails,
  AcBeheerOvereenkomstenDetails,
  AcBeheerOrganisatieDetails,
  AcBeheerKwetsbaarheidDetails,
  AcBeheerGebruikerDetails,
};

import loadable from '@loadable/component';

// standard pages
const AcBeheerError = loadable(() =>
  import('@views/ac-beheer/core/components/ac-standard-pages/ac-beheer-error')
);
const AcBeheerLoading = loadable(() =>
  import('@views/ac-beheer/core/components/ac-standard-pages/ac-beheer-loading')
);

// list pages
const AcDashboard = loadable(() =>
  import('@views/ac-beheer/core/components/ac-dashboard')
);

// detail pages
const AcBeheerApplicatiesDetails = loadable(() =>
  import('@views/ac-beheer/domains/ac-applicaties/pages/ac-applicaties-details')
);
const AcBeheerDienstDetails = loadable(() =>
  import('@views/ac-beheer/domains/ac-dienst/pages/ac-dienst-details')
);
const AcBeheerVoorzieningenVersieDetails = loadable(() =>
  import(
    '@views/ac-beheer/domains/ac-voorzieningen-versie/pages/ac-voorzieningen-versie-details'
  )
);
const AcBeheerGebruikenDetails = loadable(() =>
  import('@views/ac-beheer/domains/ac-gebruiken/pages/ac-gebruiken-details')
);
const AcBeheerOvereenkomstenDetails = loadable(() =>
  import(
    '@views/ac-beheer/domains/ac-overeenkomsten/pages/ac-overeenkomsten-details'
  )
);
const AcBeheerOrganisatieDetails = loadable(() =>
  import('@views/ac-beheer/domains/ac-organisatie/pages/ac-organisatie-details')
);
const AcBeheerKwetsbaarheidDetails = loadable(() =>
  import('@views/ac-beheer/domains/ac-kwetsbaarheid/pages/ac-kwetsbaarheid-details')
);
const AcBeheerContactpersoonDetails = loadable(() =>
  import(
    '@views/ac-beheer/domains/ac-contactpersonen/pages/ac-contactpersonen-details'
  )
);

export {
  AcDashboard,
  AcBeheerError,
  AcBeheerLoading,
  AcBeheerDienstDetails,
  AcBeheerApplicatiesDetails,
  AcBeheerVoorzieningenVersieDetails,
  AcBeheerGebruikenDetails,
  AcBeheerOvereenkomstenDetails,
  AcBeheerOrganisatieDetails,
  AcBeheerKwetsbaarheidDetails,
  AcBeheerContactpersoonDetails,
};

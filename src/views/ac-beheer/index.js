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
const AcBeheerVoorzieningenVersieDetails = loadable(() =>
  import(
    '@views/ac-beheer/domains/ac-voorzieningen-versie/pages/ac-voorzieningen-versie-details'
  )
);
const AcBeheerOvereenkomstenDetails = loadable(() =>
  import(
    '@views/ac-beheer/domains/ac-overeenkomsten/pages/ac-overeenkomsten-details'
  )
);

export {
  AcDashboard,
  AcBeheerError,
  AcBeheerLoading,
  AcBeheerVoorzieningenVersieDetails,
  AcBeheerOvereenkomstenDetails,
};

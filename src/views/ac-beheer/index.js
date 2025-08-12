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

export {
  AcDashboard,
  AcBeheerError,
  AcBeheerLoading,
};

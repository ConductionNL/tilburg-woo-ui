import loadable from '@loadable/component';

const TilburgCardCategory = loadable(() =>
  import('@molecules/tilburg-card-category/tilburg-card-category')
);
const TilburgCardIntro = loadable(() =>
  import('@molecules/tilburg-card-intro/tilburg-card-intro')
);
const TilburgCta = loadable(() => import('@molecules/tilburg-cta/tilburg-cta'));
const TilburgButton = loadable(() =>
  import('@molecules/tilburg-button/tilburg-button')
);
const TilburgLink = loadable(() => import('@molecules/tilburg-link/tilburg-link'));
const TilburgSearchResult = loadable(() =>
  import('@molecules/tilburg-search-result/tilburg-search-result')
);
const TilburgBreadcrumbs = loadable(() =>
  import('@molecules/tilburg-breadcrumbs/tilburg-breadcrumbs')
);
const TilburgSearchFilters = loadable(() =>
  import('@molecules/tilburg-search-filters/tilburg-search-filters')
);
const TilburgCheckbox = loadable(() =>
  import('@molecules/tilburg-checkbox/tilburg-checkbox')
);
export {
  TilburgBreadcrumbs,
  TilburgCardCategory,
  TilburgCardIntro,
  TilburgCta,
  TilburgButton,
  TilburgLink,
  TilburgSearchResult,
  TilburgSearchFilters,
  TilburgCheckbox,
};

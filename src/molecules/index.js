import loadable from '@loadable/component';

const TilburgCardCategory = loadable(() =>
  import('@molecules/tilburg-card-category/tilburg-card-category')
);
const TilburgCardIntro = loadable(() =>
  import('@molecules/tilburg-card-intro/tilburg-card-intro')
);
const TilburgButton = loadable(() =>
  import('@molecules/tilburg-button/tilburg-button')
);
const TilburgCta = loadable(() => import('@molecules/tilburg-cta/tilburg-cta'));
const TilburgFormField = loadable(() =>
  import('@molecules/tilburg-form-field/tilburg-form-field')
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
const TilburgSelect = loadable(() =>
  import('@molecules/tilburg-select/tilburg-select')
);
const TilburgTable = loadable(() =>
  import('@molecules/tilburg-table/tilburg-table')
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
  TilburgSelect,
  TilburgFormField,
  TilburgTable,
};

import loadable from '@loadable/component';
import { createElement } from 'preact/compat';

const AcCardCategory = loadable(() =>
  import('@molecules/ac-card-category/ac-card-category')
);
const AcCardIntro = loadable(() => import('@molecules/ac-card-intro/ac-card-intro'));
const AcButton = loadable(() => import('@molecules/ac-button/ac-button'));
const AcCta = loadable(() => import('@molecules/ac-cta/ac-cta'));
const AcFormField = loadable(() => import('@molecules/ac-form-field/ac-form-field'));
const AcLink = loadable(() => import('@molecules/ac-link/ac-link'));
const AcSearchResult = loadable(() =>
  import('@molecules/ac-search-result/ac-search-result')
);
const AcBreadcrumbs = loadable(() =>
  import('@molecules/ac-breadcrumbs/ac-breadcrumbs')
);
const AcSearchFilters = loadable(() =>
  import('@molecules/ac-search-filters/ac-search-filters')
);
const AcCheckbox = loadable(() => import('@molecules/ac-checkbox/ac-checkbox'));
const AcSelect = loadable(() => import('@molecules/ac-select/ac-select'));
const AcTable = loadable(() => import('@molecules/ac-table/ac-table'));
const ConFacetsFilters = loadable(() =>
  import('@molecules/con-facets-filters/con-facets-filters')
);
const AcTile = loadable(() => import('@molecules/ac-tile/ac-tile'));

// ConAccordion: keep compound API under lazy loading
const ConAccordionLoadable = loadable(() =>
  import('@molecules/con-accordion/con-accordion')
);
const ConAccordionItemLoadable = loadable(() =>
  import('@molecules/con-accordion/con-accordion').then((m) => ({
    default: m.default.Item,
  }))
);
const ConAccordion = (props) => createElement(ConAccordionLoadable, props);
ConAccordion.Item = (props) => createElement(ConAccordionItemLoadable, props);

export {
  AcBreadcrumbs,
  AcCardCategory,
  AcCardIntro,
  AcCta,
  AcButton,
  AcLink,
  AcSearchResult,
  AcSearchFilters,
  AcCheckbox,
  AcSelect,
  AcFormField,
  AcTable,
  ConFacetsFilters,
  AcTile,
  ConAccordion,
};

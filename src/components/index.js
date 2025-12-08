import loadable from '@loadable/component';

const AcAbout = loadable(() => import('@components/ac-about/ac-about'));
const AcDrawer = loadable(() => import('@components/ac-drawer/ac-drawer'));
const AcFaq = loadable(() => import('@components/ac-faq/ac-faq'));
const AcFeatured = loadable(() => import('@components/ac-featured/ac-featured'));
const AcFooter = loadable(() => import('@components/ac-footer/ac-footer'));
const AcHeader = loadable(() => import('@components/ac-header/ac-header'));
const AcHero = loadable(() => import('@components/ac-hero/ac-hero'));
const AcIntro = loadable(() => import('@components/ac-intro/ac-intro'));
const AcLoader = loadable(() => import('@components/ac-loader/ac-loader'));
const AcModal = loadable(() => import('@components/ac-modal/ac-modal'));
const AcNavigation = loadable(() =>
  import('@components/ac-navigation/ac-navigation')
);
const AcSearchBox = loadable(() =>
  import('@components/ac-search-box/ac-search-box')
);
const AcSectionsHandler = loadable(() =>
  import('@components/ac-sections-handler/ac-sections-handler')
);
const AcSearchCategories = loadable(() =>
  import('@components/ac-search-categories/ac-search-categories')
);
const AcSearchDate = loadable(() =>
  import('@components/ac-search-date/ac-search-date')
);
const AcSearchFilter = loadable(() =>
  import('@components/ac-search-filter/ac-search-filter')
);
const AcSearchSort = loadable(() =>
  import('@components/ac-search-sort/ac-search-sort')
);
const AcSearchSubjects = loadable(() =>
  import('@components/ac-search-subjects/ac-search-subjects')
);
const AcCNavigation = loadable(() =>
  import('@components/ac-c-navigation/ac-c-navigation')
);
const AcTabList = loadable(() => import('@components/ac-tablist/ac-tablist'));

const AcSideNav = loadable(() => import('@components/ac-sidenav/ac-side-nav'));
const ConHorizontalOverflowWrapper = loadable(() =>
  import(
    '@components/con-horizontal-overflow-wrapper/con-horizontal-overflow-wrapper'
  )
);
const ConSpinLoader = loadable(() =>
  import('@src/components/con-spin-loader/con-spin-loader')
);
const ConDynamicSchemaForm = loadable(() =>
  import('@src/components/con-dynamic-schema-form/con-dynamic-schema-form')
);
const ConSchemaEnhancedField = loadable(() =>
  import('@src/components/con-schema-enhanced-field/con-schema-enhanced-field')
);
const ConApiSelectField = loadable(() =>
  import('@src/components/con-api-select-field/con-api-select-field')
);

const ConMarkdown = loadable(() =>
  import('@src/components/con-markdown/con-markdown')
);
const ConTableSearch = loadable(() =>
  import('@src/components/con-table-search/con-table-search')
);
const ConTemplateText = loadable(() =>
  import('@src/components/con-template-text/con-template-text')
);
const ConDynamicSidenav = loadable(() =>
  import('@src/components/con-dynamic-sidenav/con-dynamic-sidenav')
);
const ConPublicationActions = loadable(() =>
  import('@src/components/con-publication-actions/con-publication-actions')
);

const ConDetailsActionsMenu = loadable(() =>
  import('@src/components/con-details-actions-menu/con-details-actions-menu')
);

const ConUuidResolver = loadable(() =>
  import('@src/components/con-uuid-resolver/con-uuid-resolver')
);

const ConStandardsResolver = loadable(() =>
  import('@src/components/con-standards-resolver/con-standards-resolver')
);

const ConStandardsTable = loadable(() =>
  import('@src/components/con-standards-table/con-standards-table')
);

const ConRelatedObjectsLinks = loadable(() =>
  import('@src/components/con-related-objects-links/con-related-objects-links')
);

const ConExistingModulesInfoBox = loadable(() =>
  import(
    '@src/components/con-existing-modules-info-box/con-existing-modules-info-box'
  )
);

const ConModulesChoiceSwitch = loadable(() =>
  import('@src/components/con-modules-choice-switch/con-modules-choice-switch')
);

const ConDebugViewer = loadable(() =>
  import('@src/components/con-debug-viewer/con-debug-viewer')
);

const ConOrganizationSelector = loadable(() =>
  import('@src/components/con-organization-selector/con-organization-selector')
);

const ConAangebodenSuggestiesTable = loadable(() =>
  import('@src/components/con-aangeboden-gebruik-table/con-aangeboden-gebruik-table')
);



export {
  AcAbout,
  AcCNavigation,
  AcDrawer,
  AcFaq,
  AcFeatured,
  AcFooter,
  AcHeader,
  AcHero,
  AcIntro,
  AcLoader,
  AcModal,
  AcNavigation,
  AcSearchBox,
  AcSectionsHandler,
  AcSearchCategories,
  AcSearchDate,
  AcSearchFilter,
  AcSearchSort,
  AcSearchSubjects,
  AcTabList,
  AcSideNav,
  ConHorizontalOverflowWrapper,
  ConSpinLoader,
  ConDynamicSchemaForm,
  ConSchemaEnhancedField,
  ConApiSelectField,
  ConMarkdown,
  ConTableSearch,
  ConTemplateText,
  ConDynamicSidenav,
  ConPublicationActions,
  ConDetailsActionsMenu,
  ConUuidResolver,
  ConStandardsResolver,
  ConStandardsTable,
  ConRelatedObjectsLinks,
  ConExistingModulesInfoBox,
  ConModulesChoiceSwitch,
  ConDebugViewer,
  ConOrganizationSelector,
  ConAangebodenSuggestiesTable,
};

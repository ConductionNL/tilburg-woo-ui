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
const AcTabList = loadable(() =>
  import('@components/ac-tablist/ac-tablist')
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
};

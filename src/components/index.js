import loadable from '@loadable/component';

const TilburgAbout = loadable(() => import('@components/tilburg-about/tilburg-about'));
const TilburgFaq = loadable(() => import('@components/tilburg-faq/tilburg-faq'));
const TilburgFeatured = loadable(() => import('@components/tilburg-featured/tilburg-featured'));
const TilburgFooter = loadable(() => import('@components/tilburg-footer/tilburg-footer'));
const TilburgHeader = loadable(() => import('@components/tilburg-header/tilburg-header'));
const TilburgHero = loadable(() => import('@components/tilburg-hero/tilburg-hero'));
const TilburgIntro = loadable(() => import('@components/tilburg-intro/tilburg-intro'));
const TilburgLoader = loadable(() => import('@components/tilburg-loader/tilburg-loader'));
const TilburgNavigation = loadable(() => import('@components/tilburg-navigation/tilburg-navigation'));
const TilburgSearchbox = loadable(() => import('@components/tilburg-searchbox/tilburg-searchbox'));
const TilburgSectionsHandler = loadable(() => import('@components/tilburg-sections-handler/tilburg-sections-handler'));
const TilburgSubjects = loadable(() => import('@components/tilburg-subjects/tilburg-subjects'));

export {
    TilburgAbout,
    TilburgFaq,
    TilburgFeatured,
    TilburgFooter,
    TilburgHeader,
    TilburgHero,
    TilburgIntro,
    TilburgLoader,
    TilburgNavigation,
    TilburgSearchbox,
    TilburgSectionsHandler,
    TilburgSubjects,
};

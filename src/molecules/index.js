import loadable from '@loadable/component';

const TilburgCardCategory = loadable(() => import('@molecules/tilburg-card-category/tilburg-card-category'));
const TilburgCardIntro = loadable(() => import('@molecules/tilburg-card-intro/tilburg-card-intro'));
const TilburgCta = loadable(() => import('@molecules/tilburg-cta/tilburg-cta'));
const TilburgLink = loadable(() => import('@molecules/tilburg-link/tilburg-link'));
const TilburgSearchResult = loadable(() => import('@molecules/tilburg-search-result/tilburg-search-result'));

export {
    TilburgCardCategory,
    TilburgCardIntro,
    TilburgCta,
    TilburgLink,
    TilburgSearchResult,
}

import loadable from '@loadable/component';

const TilburgCard = loadable(() => import('@atoms/tilburg-card/tilburg-card'));
const TilburgContainer = loadable(() => import('@atoms/tilburg-container/tilburg-container'));
const TilburgDataList = loadable(() => import('@atoms/tilburg-data-list/tilburg-data-list'));
const TilburgFlex = loadable(() => import('@atoms/tilburg-flex/tilburg-flex'));
const TilburgImage = loadable(() => import('@atoms/tilburg-image/tilburg-image'));
const TilburgRichText = loadable(() => import('@atoms/tilburg-rich-text/tilburg-rich-text'));
const TilburgSection = loadable(() => import('@atoms/tilburg-section/tilburg-section'));

export {
    TilburgCard,
    TilburgContainer,
    TilburgDataList,
    TilburgFlex,
    TilburgImage,
    TilburgRichText,
    TilburgSection,
}

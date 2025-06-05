import loadable from '@loadable/component';

const AcCard = loadable(() => import('@atoms/ac-card/ac-card'));
const AcContainer = loadable(() => import('@atoms/ac-container/ac-container'));
const AcColumn = loadable(() => import('@atoms/ac-column/ac-column'));
const AcGrid = loadable(() => import('@atoms/ac-grid/ac-grid'));
const AcDataList = loadable(() => import('@atoms/ac-data-list/ac-data-list'));
const AcFlex = loadable(() => import('@atoms/ac-flex/ac-flex'));
const AcImage = loadable(() => import('@atoms/ac-image/ac-image'));
const AcRichText = loadable(() => import('@atoms/ac-rich-text/ac-rich-text'));
const AcRow = loadable(() => import('@atoms/ac-row/ac-row'));
const AcSection = loadable(() => import('@atoms/ac-section/ac-section'));

export {
  AcCard,
  AcContainer,
  AcColumn,
  AcGrid,
  AcDataList,
  AcFlex,
  AcImage,
  AcRichText,
  AcRow,
  AcSection,
};

import loadable from '@loadable/component';

const AcCard = loadable(() => import('@atoms/ac-card/ac-card'));
const AcContainer = loadable(() => import('@atoms/ac-container/ac-container'));
const AcDataList = loadable(() => import('@atoms/ac-data-list/ac-data-list'));
const AcFlex = loadable(() => import('@atoms/ac-flex/ac-flex'));
const AcImage = loadable(() => import('@atoms/ac-image/ac-image'));
const AcRichText = loadable(() => import('@atoms/ac-rich-text/ac-rich-text'));
const AcSection = loadable(() => import('@atoms/ac-section/ac-section'));

export { AcCard, AcContainer, AcDataList, AcFlex, AcImage, AcRichText, AcSection };

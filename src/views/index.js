import loadable from '@loadable/component';

const AcHome = loadable(() => import('@views/ac-home/ac-home'));
const AcSearch = loadable(() => import('@views/ac-search/ac-search'));
const AcThemes = loadable(() => import('@views/ac-themes/ac-themes'));
const AcPublication = loadable(() => import('@views/ac-publication/ac-publication'));

export { AcHome, AcSearch, AcThemes, AcPublication };

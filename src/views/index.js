import loadable from '@loadable/component';

// Imports => Views

const AcHome = loadable(() => import('@views/ac-home/ac-home'));
const AcSearch = loadable(() => import('@views/ac-search/ac-search'));

export { AcHome, AcSearch };

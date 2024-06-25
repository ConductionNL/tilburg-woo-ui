import loadable from '@loadable/component';

const AcHome = loadable(() => import('@views/ac-home/ac-home'));
const AcSearch = loadable(() => import('@views/ac-search/ac-search'));
const AcSubjects = loadable(() => import('@views/ac-subjects/ac-subjects'));
const AcPublication = loadable(() => import('@views/ac-publication/ac-publication'));

export { AcHome, AcSearch, AcSubjects, AcPublication };

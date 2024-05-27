import loadable from '@loadable/component';

/* eslint react-app/import/no-webpack-loader-syntax: off */
const CHEVRON_RIGHT = loadable(() => import('-!svg-react-loader!@assets/images/chevron-right.svg'));
const LOGO = loadable(() => import('-!svg-react-loader!@assets/images/logo.svg'));
const CONTACT = loadable(() => import('-!svg-react-loader!@assets/images/contact.svg'));
const EXTERNAL_LINK = loadable(() => import('-!svg-react-loader!@assets/images/external-link.svg'));
const INFO = loadable(() => import('-!svg-react-loader!@assets/images/info.svg'));
const LIST = loadable(() => import('-!svg-react-loader!@assets/images/list.svg'));
const MENU = loadable(() => import('-!svg-react-loader!@assets/images/menu.svg'));
// const SEARCH = loadable(() => import('-!svg-react-loader!@assets/images/search.svg'));

export const VISUALS = {
    CHEVRON_RIGHT,
    CONTACT,
    EXTERNAL_LINK,
    INFO,
    LIST,
    LOGO,
    MENU,
    // SEARCH,
};

export default {};

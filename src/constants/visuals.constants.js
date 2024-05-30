import loadable from '@loadable/component';

/* eslint react-app/import/no-webpack-loader-syntax: off */
const ARROW_RIGHT = loadable(() => import('-!svg-react-loader!@assets/images/arrow-right.svg'));
const CHEVRON_RIGHT = loadable(() => import('-!svg-react-loader!@assets/images/chevron-right.svg'));
const CLOSE = loadable(() => import('-!svg-react-loader!@assets/images/close.svg'));
const CONTACT = loadable(() => import('-!svg-react-loader!@assets/images/contact.svg'));
const EXTERNAL_LINK = loadable(() => import('-!svg-react-loader!@assets/images/external-link.svg'));
const INFO = loadable(() => import('-!svg-react-loader!@assets/images/info.svg'));
const LIST = loadable(() => import('-!svg-react-loader!@assets/images/list.svg'));
const LIST_BLUE = loadable(() => import('-!svg-react-loader!@assets/images/list-blue.svg'));
const LOGO = loadable(() => import('-!svg-react-loader!@assets/images/logo.svg'));
const MENU = loadable(() => import('-!svg-react-loader!@assets/images/menu.svg'));
const QUESTION_MARK = loadable(() => import('-!svg-react-loader!@assets/images/question-mark.svg'));
const SEARCH = loadable(() => import('-!svg-react-loader!@assets/images/search.svg'));

export const VISUALS = {
    ARROW_RIGHT,
    CHEVRON_RIGHT,
    CLOSE,
    CONTACT,
    EXTERNAL_LINK,
    INFO,
    LIST,
    LIST_BLUE,
    LOGO,
    MENU,
    QUESTION_MARK,
    SEARCH,
};

export default {};

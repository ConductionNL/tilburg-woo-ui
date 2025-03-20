import loadable from '@loadable/component';

/* eslint react-app/import/no-webpack-loader-syntax: off */
const ARROW_RIGHT = loadable(() =>
  import('-!svg-react-loader!@assets/images/arrow-right.svg')
);
const CHECK = loadable(() => import('-!svg-react-loader!@assets/images/check.svg'));
const CHEVRON_RIGHT = loadable(() =>
  import('-!svg-react-loader!@assets/images/chevron-right.svg')
);
const CLOSE = loadable(() => import('-!svg-react-loader!@assets/images/close.svg'));
const CLOSE_SMALL = loadable(() =>
  import('-!svg-react-loader!@assets/images/close-small.svg')
);
const CONTACT = loadable(() =>
  import('-!svg-react-loader!@assets/images/contact.svg')
);
const CONVENANT = loadable(() =>
  import('-!svg-react-loader!@assets/images/convenant.svg')
);
const ELLIPSE = loadable(() =>
  import('-!svg-react-loader!@assets/images/ellipse.svg')
);
const EXTERNAL_LINK = loadable(() =>
  import('-!svg-react-loader!@assets/images/external-link.svg')
);
const EXTERNAL_LINK_BLUE = loadable(() =>
  import('-!svg-react-loader!@assets/images/external-link-blue.svg')
);
const EXTERNAL_LINK_PINK = loadable(() =>
  import('-!svg-react-loader!@assets/images/external-link-pink.svg')
);
const FILTER = loadable(() =>
  import('-!svg-react-loader!@assets/images/filter.svg')
);
const GOVERNANCE_DOCUMENT = loadable(() =>
  import('-!svg-react-loader!@assets/images/bestuursstuk.svg')
);
const INFO = loadable(() => import('-!svg-react-loader!@assets/images/info.svg'));
const INFO_BLUE = loadable(() =>
  import('-!svg-react-loader!@assets/images/info-blue.svg')
);
const LIST = loadable(() => import('-!svg-react-loader!@assets/images/list.svg'));
const LIST_ALT = loadable(() =>
  import('-!svg-react-loader!@assets/images/list-alt.svg')
);
const LIST_BLUE = loadable(() =>
  import('-!svg-react-loader!@assets/images/list-blue.svg')
);
const LOGO = loadable(() => import('-!svg-react-loader!@assets/images/logo.svg'));
const MENU = loadable(() => import('-!svg-react-loader!@assets/images/menu.svg'));
const ORGANIZATION = loadable(() =>
  import('-!svg-react-loader!@assets/images/organisatie.svg')
);
const PARTICLES = loadable(() =>
  import('-!svg-react-loader!@assets/images/particles.svg')
);
const QUESTION_MARK = loadable(() =>
  import('-!svg-react-loader!@assets/images/question-mark.svg')
);
const REACHABILITY = loadable(() =>
  import('-!svg-react-loader!@assets/images/bereikbaarheidsgegevens.svg')
);
const COUNCIL_DOCUMENT = loadable(() =>
  import('-!svg-react-loader!@assets/images/raadsstuk.svg')
);
const SEARCH = loadable(() =>
  import('-!svg-react-loader!@assets/images/search.svg')
);
const SEARCH_ALT = loadable(() =>
  import('-!svg-react-loader!@assets/images/search-alt.svg')
);
const DOCUMENT = loadable(() =>
  import('-!svg-react-loader!@assets/images/document.svg')
);
const SHARE = loadable(() => import('-!svg-react-loader!@assets/images/share.svg'));
const THEMES = loadable(() =>
  import('-!svg-react-loader!@assets/images/themes.svg')
);
const WOO_REQUEST = loadable(() =>
  import('-!svg-react-loader!@assets/images/woo-verzoek.svg')
);

export const VISUALS = {
  ARROW_RIGHT,
  CHEVRON_RIGHT,
  CLOSE,
  CLOSE_SMALL,
  CONTACT,
  CONVENANT,
  CHECK,
  DOCUMENT,
  ELLIPSE,
  EXTERNAL_LINK,
  EXTERNAL_LINK_BLUE,
  EXTERNAL_LINK_PINK,
  FILTER,
  GOVERNANCE_DOCUMENT,
  INFO,
  INFO_BLUE,
  LIST,
  LIST_ALT,
  LIST_BLUE,
  LOGO,
  MENU,
  ORGANIZATION,
  PARTICLES,
  QUESTION_MARK,
  REACHABILITY,
  COUNCIL_DOCUMENT,
  SEARCH,
  SEARCH_ALT,
  SHARE,
  THEMES,
  WOO_REQUEST,
};

export default {};

import loadable from '@loadable/component';

/* eslint-disable import/no-unresolved */
// this is some weird stuff that Acato made, and I have no clue how it works, but it works...
const ARROW_RIGHT = loadable(() =>
  import('-!svg-react-loader!@assets/images/arrow-right.svg')
);
const ARROW_LEFT = loadable(() =>
  import('-!svg-react-loader!@assets/images/arrow-left.svg')
);
const CHECK = loadable(() => import('-!svg-react-loader!@assets/images/check.svg'));
const CHEVRON_RIGHT = loadable(() =>
  import('-!svg-react-loader!@assets/images/chevron-right.svg')
);
const CHEVRON_LEFT = loadable(() =>
  import('-!svg-react-loader!@assets/images/chevron-left.svg')
);
const CLOSE = loadable(() => import('-!svg-react-loader!@assets/images/close.svg'));
const CLOSE_SMALL = loadable(() =>
  import('-!svg-react-loader!@assets/images/close-small.svg')
);
const CONTACT = loadable(() =>
  import('-!svg-react-loader!@assets/images/contact.svg')
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

const QUESTION_MARK = loadable(() =>
  import('-!svg-react-loader!@assets/images/question-mark.svg')
);
const QUESTION_MARK_VNG = loadable(() =>
  import('-!svg-react-loader!@assets/images/question-mark-vng.svg')
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
const GITHUB = loadable(() =>
  import('-!svg-react-loader!@assets/images/github.svg')
);
const COMMON_GROUND = loadable(() =>
  import('-!svg-react-loader!@assets/images/commonground.svg')
);

const KEY = loadable(() => import('-!svg-react-loader!@assets/images/key.svg'));

const PERSON_ADD = loadable(() =>
  import('-!svg-react-loader!@assets/images/person_add.svg')
);

const WORLD = loadable(() => import('-!svg-react-loader!@assets/images/world.svg'));
const USER = loadable(() => import('-!svg-react-loader!@assets/images/user.svg'));
const USERS = loadable(() => import('-!svg-react-loader!@assets/images/users.svg'));
const USER_PLUS = loadable(() =>
  import('-!svg-react-loader!@assets/images/user-plus.svg')
);
const USER_XMARK = loadable(() =>
  import('-!svg-react-loader!@assets/images/user-xmark.svg')
);
const USER_CHECK = loadable(() =>
  import('-!svg-react-loader!@assets/images/user-check.svg')
);
const BUILDING = loadable(() =>
  import('-!svg-react-loader!@assets/images/building.svg')
);
const TRUCK = loadable(() => import('-!svg-react-loader!@assets/images/truck.svg'));
const CUBE = loadable(() => import('-!svg-react-loader!@assets/images/cube.svg'));
const CUBES = loadable(() => import('-!svg-react-loader!@assets/images/cubes.svg'));
const HAND_HOLDING = loadable(() =>
  import('-!svg-react-loader!@assets/images/hand-holding.svg')
);
const HOUSE = loadable(() => import('-!svg-react-loader!@assets/images/house.svg'));
const PHONE = loadable(() => import('-!svg-react-loader!@assets/images/phone.svg'));
const SHARE = loadable(() => import('-!svg-react-loader!@assets/images/share.svg'));
const PARTICLES = loadable(() =>
  import('-!svg-react-loader!@assets/images/particles.svg')
);

const THEMES = loadable(() =>
  import('-!svg-react-loader!@assets/images/themes.svg')
);

const DOWNLOAD = loadable(() =>
  import('-!svg-react-loader!@assets/images/download.svg')
);

const UPLOAD = loadable(() =>
  import('-!svg-react-loader!@assets/images/upload.svg')
);

const CLOUD = loadable(() => import('-!svg-react-loader!@assets/images/cloud.svg'));

const CIRCLE_CHECK = loadable(() =>
  import('-!svg-react-loader!@assets/images/circle-check.svg')
);

const CIRCLE_EXCLAMATION = loadable(() =>
  import('-!svg-react-loader!@assets/images/circle-exclamation.svg')
);

const HAND_SHAKE = loadable(() =>
  import('-!svg-react-loader!@assets/images/handshake.svg')
);

const SAVE = loadable(() => import('-!svg-react-loader!@assets/images/save.svg'));

const TRASHCAN = loadable(() =>
  import('-!svg-react-loader!@assets/images/trash-can.svg')
);

const TRIANGLE_EXCLAMATION = loadable(() =>
  import('-!svg-react-loader!@assets/images/triangle-exclamation.svg')
);

const RIGHT_FROM_BRACKET = loadable(() =>
  import('-!svg-react-loader!@assets/images/right-from-bracket.svg')
);

const PLUS = loadable(() => import('-!svg-react-loader!@assets/images/plus.svg'));

const PENCIL = loadable(() =>
  import('-!svg-react-loader!@assets/images/pencil.svg')
);

const CHART_LINE = loadable(() =>
  import('-!svg-react-loader!@assets/images/chart-line.svg')
);

const SPINNER = loadable(() =>
  import('-!svg-react-loader!@assets/images/spinner.svg')
);

const CIRCLE_XMARK = loadable(() =>
  import('-!svg-react-loader!@assets/images/circle-xmark.svg')
);

const EYE = loadable(() => import('-!svg-react-loader!@assets/images/eye.svg'));

const ELLIPSIS = loadable(() =>
  import('-!svg-react-loader!@assets/images/ellipsis.svg')
);

const SORT = loadable(() => import('-!svg-react-loader!@assets/images/sort.svg'));
const SORT_UP = loadable(() =>
  import('-!svg-react-loader!@assets/images/sort-up.svg')
);
const SORT_DOWN = loadable(() =>
  import('-!svg-react-loader!@assets/images/sort-down.svg')
);

const CLIPBOARD_CHECK = loadable(() =>
  import('-!svg-react-loader!@assets/images/clipboard-check.svg')
);

const PAPER_PLANE = loadable(() =>
  import('-!svg-react-loader!@assets/images/paper-plane.svg')
);

const XMARK = loadable(() => import('-!svg-react-loader!@assets/images/xmark.svg'));

const PUBLISH = loadable(() =>
  import('-!svg-react-loader!@assets/images/publish.svg')
);

const PUBLISH_OFF = loadable(() =>
  import('-!svg-react-loader!@assets/images/publish-off.svg')
);

const LINK = loadable(() => import('-!svg-react-loader!@assets/images/link.svg'));

const MINUS = loadable(() => import('-!svg-react-loader!@assets/images/minus.svg'));

const ENVELOPE = loadable(() =>
  import('-!svg-react-loader!@assets/images/envelope.svg')
);

const ENVELOPES_BULK = loadable(() =>
  import('-!svg-react-loader!@assets/images/envelopes-bulk.svg')
);

const WAND_SPARKLES_SOLID = loadable(() =>
  import('-!svg-react-loader!@assets/images/wand-sparkles-solid.svg')
);

const ROTATE_RIGHT = loadable(() =>
  import('-!svg-react-loader!@assets/images/rotate-right.svg')
);

const USER_CIRCLE = loadable(() =>
  import('-!svg-react-loader!@assets/images/user-circle.svg')
);

export const VISUALS = {
  ARROW_RIGHT,
  ARROW_LEFT,
  CHEVRON_RIGHT,
  CHEVRON_LEFT,
  CLOSE,
  CLOSE_SMALL,
  CONTACT,
  CHECK,
  DOCUMENT,
  ELLIPSE,
  EXTERNAL_LINK,
  EXTERNAL_LINK_BLUE,
  EXTERNAL_LINK_PINK,
  FILTER,
  INFO,
  INFO_BLUE,
  LIST,
  LIST_ALT,
  LIST_BLUE,
  LOGO,
  MENU,
  QUESTION_MARK,
  QUESTION_MARK_VNG,
  SEARCH,
  GITHUB,
  COMMON_GROUND,
  KEY,
  PERSON_ADD,
  WORLD,
  USER,
  USERS,
  USER_PLUS,
  USER_XMARK,
  USER_CHECK,
  BUILDING,
  TRUCK,
  CUBE,
  CUBES,
  HAND_HOLDING,
  HOUSE,
  PHONE,
  SEARCH_ALT,
  SHARE,
  PARTICLES,
  THEMES,
  DOWNLOAD,
  UPLOAD,
  CLOUD,
  CIRCLE_CHECK,
  CIRCLE_EXCLAMATION,
  HAND_SHAKE,
  SAVE,
  TRASHCAN,
  TRIANGLE_EXCLAMATION,
  RIGHT_FROM_BRACKET,
  PLUS,
  PENCIL,
  CHART_LINE,
  SPINNER,
  CIRCLE_XMARK,
  EYE,
  ELLIPSIS,
  SORT,
  SORT_UP,
  SORT_DOWN,
  CLIPBOARD_CHECK,
  PAPER_PLANE,
  XMARK,
  PUBLISH,
  PUBLISH_OFF,
  LINK,
  MINUS,
  ENVELOPE,
  ENVELOPES_BULK,
  WAND_SPARKLES_SOLID,
  ROTATE_RIGHT,
  RELOAD: ROTATE_RIGHT,
  USER_CIRCLE,
};

export default {};

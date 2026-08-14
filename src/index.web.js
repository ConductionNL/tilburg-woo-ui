import 'preact/debug';
import { render } from 'preact';

import { register, unregister } from './registerServiceWorker';

import { createBrowserHistory } from 'history';
import { RouterStore, syncHistoryWithStore } from 'mobx-react-router';
import { BrowserRouter as Router } from 'react-router-dom';
import { Tooltip } from 'react-tooltip';

import config from '@config';
import createStore, { StoreContext } from '@stores';

import App from '@src/App';
import PortalHome from '@src/portal/PortalHome';
import { getToken } from '@src/portal/portalApi';

import '@src/portal/portal.scss';

export const TOOLTIP_ID = 'cb8f47c3-7151-4a46-954d-784a531b01e6';

const browserHistory = createBrowserHistory();
const routing = new RouterStore();
const store = createStore(config);

// Make store available globally for basic auth fallback
window.app = { store };

const history = syncHistoryWithStore(browserHistory, routing);

const container = document.getElementById('root');

// Portal mode: boot the per-subject Portaliq portal instead of the Open-Tilburg
// WOO site. Same theme + design tokens + schema-driven components, but every
// request goes to Portaliq's subject-scoped /portal/api (bearer session), not
// OpenRegister. The portal reuses the softwarecatalogus OpenRegister engine
// (object.store + ConBeheerTable); the store's axios adapter (see
// object.store.js) repoints /openregister/api -> /portal/api at runtime. Here we
// (1) mirror the portal bearer token into the `nextcloud_access_token` cookie
// the store's request interceptor already reads, (2) flip the design-system
// theme on, and (3) render the portal shell under the app's public mount.
// Detected at RUNTIME from window.RUNTIME_CONFIG.portalMode (set by the portal
// deployment's runtime-config.js) so the same bundle serves both and the portal
// shell is never tree-shaken away.
const IS_PORTAL = !!(window.RUNTIME_CONFIG && window.RUNTIME_CONFIG.portalMode === true);

// Router basename.
//
// The SPA is mounted at different paths per deployment: the standalone
// Open-Tilburg / Softwarecatalogus site is served from the web root (see
// `location /` in config/nginx.conf.template and `homepage` in package.json),
// while the Portaliq deployments are mounted under a Nextcloud app path. A
// basename that does not prefix the current URL makes react-router match
// nothing and render an empty page, so this must follow the deployment rather
// than be hardcoded.
//
// Resolution order: RUNTIME_CONFIG.routerBasename (camelCase, written by
// scripts/portal-postbuild.js) -> RUNTIME_CONFIG.ROUTER_BASENAME (UPPER_SNAKE,
// written by scripts/generate-runtime-config.js from the ROUTER_BASENAME env
// var) -> the per-mode default below.
const DEFAULT_PORTAL_BASENAME = '/index.php/apps/portaliq/portal';
const ROUTER_BASENAME =
  (window.RUNTIME_CONFIG &&
    (window.RUNTIME_CONFIG.routerBasename ||
      window.RUNTIME_CONFIG.ROUTER_BASENAME)) ||
  (IS_PORTAL ? DEFAULT_PORTAL_BASENAME : '/');

if (IS_PORTAL) {
  const token = getToken();
  if (token) {
    document.cookie = `nextcloud_access_token=${token}; path=/`;
  }
  // Activate the design-system theme (the checked-in variant is `vng`); the
  // tilburg CSS is loaded by the bundle regardless, this flips the token set on.
  const themeVariant = (window.RUNTIME_CONFIG && window.RUNTIME_CONFIG.themeVariant) || 'vng';
  const body = document.getElementById('body') || document.body;
  if (body) {
    body.classList.add(`${themeVariant}-theme`);
  }

  render(
    <StoreContext.Provider value={store}>
      <Router history={history} basename={ROUTER_BASENAME}>
        <Tooltip delayShow={1000} className='ac-gemma-tooltip' id={TOOLTIP_ID} />
        <div className='portaliq-portal ac-app-container'>
          <PortalHome />
        </div>
      </Router>
    </StoreContext.Provider>,
    container
  );
} else {
  render(
    <StoreContext.Provider value={store}>
      <Router history={history} basename={ROUTER_BASENAME}>
        <Tooltip delayShow={1000} className='ac-gemma-tooltip' id={TOOLTIP_ID} />
        <App />
      </Router>
    </StoreContext.Provider>,
    container
  );
}

if (process.env.NODE_ENV === 'production' && !IS_PORTAL) {
  register();
} else {
  // The portal is served under an app sub-path where a root-scoped
  // /service-worker.js does not exist; never register it in portal mode.
  unregister();
}

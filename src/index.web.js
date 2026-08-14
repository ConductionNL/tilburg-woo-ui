import 'preact/debug';
import { render } from 'preact';

import { register, unregister } from './registerServiceWorker';

import { BrowserRouter as Router } from 'react-router-dom';
import { Tooltip } from 'react-tooltip';

import config from '@config';
import createStore, { StoreContext } from '@stores';

import App from '@src/App';
import PortalHome from '@src/portal/PortalHome';
import { getToken } from '@src/portal/portalApi';
import {
  resolveRouterBasename,
  basenameMatchesPath,
} from '@src/config/router-basename';

import '@src/portal/portal.scss';

export const TOOLTIP_ID = 'cb8f47c3-7151-4a46-954d-784a531b01e6';

const store = createStore(config);

// Make store available globally for basic auth fallback
window.app = { store };

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

// Router basename — see src/config/router-basename.js for the resolution rules.
// A mismatch between the basename and the served path renders an empty page, so
// the resolution lives in a tested module and a mismatch is reported loudly here
// rather than only as react-router's own warning.
const ROUTER_BASENAME = resolveRouterBasename(window.RUNTIME_CONFIG, IS_PORTAL);

if (!basenameMatchesPath(ROUTER_BASENAME, window.location.pathname)) {
  console.error(
    `[router] basename "${ROUTER_BASENAME}" does not match path "${window.location.pathname}" — ` +
      'the app will render nothing. Set ROUTER_BASENAME for this deployment.'
  );
}

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
      <Router basename={ROUTER_BASENAME}>
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
      <Router basename={ROUTER_BASENAME}>
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

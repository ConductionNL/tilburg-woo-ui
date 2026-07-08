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

// Portal mode: reuse the softwarecatalogus OpenRegister engine (object.store +
// ConBeheerTable) as Portaliq's per-subject portal. The store's axios adapter
// (see object.store.js) repoints /openregister/api -> /portal/api at runtime;
// here we (1) mirror the portal bearer token into the `nextcloud_access_token`
// cookie the store's request interceptor already reads, (2) flip the design-
// system theme on, and (3) render the portal shell under the app's public mount.
const IS_PORTAL = !!(window.RUNTIME_CONFIG && window.RUNTIME_CONFIG.portalMode === true);

if (IS_PORTAL) {
  const token = getToken();
  if (token) {
    document.cookie = `nextcloud_access_token=${token}; path=/`;
  }
  const themeVariant = (window.RUNTIME_CONFIG && window.RUNTIME_CONFIG.themeVariant) || 'vng';
  const body = document.getElementById('body') || document.body;
  if (body) {
    body.classList.add(`${themeVariant}-theme`);
  }

  render(
    <StoreContext.Provider value={store}>
      <Router history={history} basename='/index.php/apps/portaliq/portal'>
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
      <Router history={history}>
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
  unregister();
}

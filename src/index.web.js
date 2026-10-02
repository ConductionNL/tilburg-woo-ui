import 'preact/debug';
import { render } from 'preact';

import { register, unregister } from './registerServiceWorker';

import { BrowserRouter as Router } from 'react-router-dom';
import { Tooltip } from 'react-tooltip';

import config from '@config';
import createStore, { StoreContext } from '@stores';

import App from '@src/App';
import {
  resolveRouterBasename,
  basenameMatchesPath,
} from '@src/config/router-basename';

export const TOOLTIP_ID = 'cb8f47c3-7151-4a46-954d-784a531b01e6';

const store = createStore(config);

// Make store available globally for basic auth fallback
window.app = { store };

const container = document.getElementById('root');

// Router basename — see src/config/router-basename.js for the resolution rules.
// A mismatch between the basename and the served path renders an empty page, so
// the resolution lives in a tested module and a mismatch is reported loudly here
// rather than only as react-router's own warning.
const ROUTER_BASENAME = resolveRouterBasename(window.RUNTIME_CONFIG);

if (!basenameMatchesPath(ROUTER_BASENAME, window.location.pathname)) {
  console.error(
    `[router] basename "${ROUTER_BASENAME}" does not match path "${window.location.pathname}" — ` +
      'the app will render nothing. Set ROUTER_BASENAME for this deployment.'
  );
}

render(
  <StoreContext.Provider value={store}>
    <Router basename={ROUTER_BASENAME}>
      <Tooltip delayShow={1000} className='ac-gemma-tooltip' id={TOOLTIP_ID} />
      <App />
    </Router>
  </StoreContext.Provider>,
  container
);

if (process.env.NODE_ENV === 'production') {
  register();
} else {
  unregister();
}

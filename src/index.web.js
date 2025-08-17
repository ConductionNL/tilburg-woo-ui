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

export const TOOLTIP_ID = 'cb8f47c3-7151-4a46-954d-784a531b01e6';

const browserHistory = createBrowserHistory();
const routing = new RouterStore();
const store = createStore(config);

// Make store available globally for basic auth fallback
window.app = { store };

const history = syncHistoryWithStore(browserHistory, routing);

const container = document.getElementById('root');

render(
  <StoreContext.Provider value={store}>
    <Router history={history}>
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

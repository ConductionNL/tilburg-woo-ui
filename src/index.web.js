import 'preact/debug';
import React from 'react';
import { render } from 'preact';

import { register, unregister } from './registerServiceWorker';

import { createBrowserHistory } from 'history';
import { RouterStore, syncHistoryWithStore } from 'mobx-react-router';
import { BrowserRouter as Router } from 'react-router-dom';

import config from '@config';
import createStore, { StoreContext } from '@stores';

import App from '@src/App';

const browserHistory = createBrowserHistory();
const routing = new RouterStore();
const store = createStore(config);

const history = syncHistoryWithStore(browserHistory, routing);

const container = document.getElementById('root');

render(
	<StoreContext.Provider value={store}>
		<Router history={history}>
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

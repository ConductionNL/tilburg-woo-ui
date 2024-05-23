// Imports => Dependencies
import React, { createContext } from 'react';
import { makeObservable, observable, computed, action, runInAction } from 'mobx';

// Imports => API
import API from '@api';

// Imports => Stores

import AuthStore from '@stores/auth.store';
import ToastersStore from '@stores/toasters.store';

class Store {
	constructor(config) {
		makeObservable(this);

		this.config = config;

		this.api = new API(config, this);

		this.auth = new AuthStore(this);
		this.toasters = new ToastersStore(this);

		window.addEventListener(
			'swFreshContentReady',
			this.handleSWFreshContentReady,
			true
		);
		window.addEventListener('swCacheReady', this.handleSWCacheReady, true);
	}

	@action
	resetStores = () => {
		return new Promise((resolve) => {
			resolve();
		});
	};

	@observable
	swUpdated = false;

	@observable
	freshContentReady = false;

	@computed
	get freshContentIsAvailable() {
		return this.freshContentReady;
	}

	@action
	handleSWFreshContentReady = (event) => {
		runInAction(() => {
			this.freshContentReady = true;
		});
	};

	@action
	handleSWCacheReady = (event) => {
		this.toasters.add({
			variant: 'info',
			title: 'Cache is gereed',
			description:
				'Assets en resources zijn in de cache opgeslagen voor offline gebruik.',
		});
	};
}

export default Store;

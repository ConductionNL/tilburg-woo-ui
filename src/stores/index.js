// Imports => Dependencies
import React, { createContext, useContext, forwardRef } from 'react';

import Store from '@stores/store';

export const StoreContext = createContext();

export const useStore = () => useContext(StoreContext);

export const withStore = Component =>
	forwardRef((props, ref) => {
		return <Component {...props} ref={ref} store={useStore()} />;
	});

export default config => new Store(config);

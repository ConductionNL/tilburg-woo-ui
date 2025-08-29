// Imports => Dependencies
import React, { createContext, useContext, forwardRef } from 'react';

import Store from '@stores/store';

export const StoreContext = createContext();

export const useStore = () => useContext(StoreContext);

export const withStore = (Component) => {
  const WrappedComponent = forwardRef((props, ref) => {
    return <Component {...props} ref={ref} store={useStore()} />;
  });
  WrappedComponent.displayName = `withStore(${
    Component.displayName || Component.name
  })`;
  return WrappedComponent;
};

export default (config) => new Store(config);

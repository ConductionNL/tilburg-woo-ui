import * as React from 'react';
import { Tabs as RTabs } from 'react-tabs';

// Tabs
const AcTabs = ({ children, ...otherProps }) => (
  <RTabs className='ac-tabs' {...otherProps}>
    {children}
  </RTabs>
);

AcTabs.tabsRole = 'Tabs';

export default AcTabs;

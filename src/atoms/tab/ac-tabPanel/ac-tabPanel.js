import * as React from 'react';
import { TabPanel as RTabPanel } from 'react-tabs';

const AcTabPanel = ({ children, ...otherProps }) => (
  <RTabPanel {...otherProps}>{children}</RTabPanel>
);

AcTabPanel.tabsRole = 'TabPanel';

export default AcTabPanel;

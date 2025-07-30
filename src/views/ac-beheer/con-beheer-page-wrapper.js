import React from 'react';
import ConGenericBeheerPage from './con-generic-beheer-page';

/**
 * Beheer Page Wrapper Component
 * This component provides a simple interface to use the generic beheer page
 * with specific configurations for each beheer type
 */
const ConBeheerPageWrapper = ({ type, configOverrides = {} }) => {
  return <ConGenericBeheerPage type={type} configOverrides={configOverrides} />;
};

export default ConBeheerPageWrapper;

// eslint-disable-next-line import/no-unresolved
import React from 'react';
import ConFilterHeadersDrawer from './con-filter-headers-drawer';
import OrganisatieFilterHeadersDrawer from './ac-organisatie/organisatie-filter-headers-drawer';

/**
 * Filter Drawer Factory for Beheer Pages
 * This factory manages the loading and rendering of filter drawer components
 */
const FilterDrawerFactory = {
  /**
   * Filter drawer component mappings
   */
  filterDrawerComponents: {
    default: ConFilterHeadersDrawer,
    organisaties: OrganisatieFilterHeadersDrawer,
  },

  /**
   * Get filter drawer component for a specific type
   * @param {string} type - The beheer page type
   * @returns {Component} The filter drawer component
   */
  getFilterDrawerComponent: (type) => {
    return (
      FilterDrawerFactory.filterDrawerComponents[type] ||
      FilterDrawerFactory.filterDrawerComponents.default
    );
  },

  /**
   * Get filter drawer props for a specific type
   * @param {string} type - The beheer page type
   * @param {Object} params - Parameters for the filter drawer
   * @returns {Object} Filter drawer props
   */
  getFilterDrawerProps: (type, params) => {
    const {
      filterHeadersDrawerRef,
      headers,
      defaultHeaders,
      setTableHeaders,
      loading,
      setBeoordelingFilter,
    } = params;

    const baseProps = {
      ref: filterHeadersDrawerRef,
      headers,
      defaultHeaders,
      onChange: setTableHeaders,
    };

    switch (type) {
      case 'organisaties':
        return {
          ...baseProps,
          loading,
          getBeoordeling: setBeoordelingFilter,
        };
      default:
        return baseProps;
    }
  },

  /**
   * Render filter drawer for a specific beheer type
   * @param {string} type - The beheer page type
   * @param {Object} params - Parameters for the filter drawer
   * @returns {Component} The filter drawer component
   */
  renderFilterDrawer: (type, params) => {
    const FilterDrawerComponent = FilterDrawerFactory.getFilterDrawerComponent(type);
    const filterDrawerProps = FilterDrawerFactory.getFilterDrawerProps(type, params);

    return <FilterDrawerComponent {...filterDrawerProps} />;
  },
};

export default FilterDrawerFactory;

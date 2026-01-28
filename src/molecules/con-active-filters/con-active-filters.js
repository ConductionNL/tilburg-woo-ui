import React from 'react';
import { observer } from 'mobx-react-lite';
import { AcButton } from '@molecules';
import { withStore } from '@stores';
import { AcFlex } from '@atoms';
import { VISUALS } from '@constants';
import { ConUuidResolver } from '@components';

/**
 * ConFacetsFilters Component
 *
 * Renders dynamic facets filters with automatic UUID-to-name resolution.
 *
 * Features:
 * - Uses API-driven facet configuration (title, enabled status, etc.)
 * - Automatically resolves UUID labels to human-readable names
 * - Shows loading states during name resolution
 * - Provides tooltips with original UUIDs for debugging
 * - Integrates with the existing names cache system for performance
 *
 * @param {Object} store - MobX store containing publications and object stores
 */
const ConActiveFilters = ({ activeFilters, onClearAllFilters }) => {
  const hasActiveFilters = activeFilters && activeFilters.length > 0;

  return (
    <>
      <AcButton
        style='buttonSlim'
        buttonType='primary'
        className='con-clear-all-filters'
        onClick={() => onClearAllFilters()}
        aria-label='Wis alle filters'
        disabled={!hasActiveFilters}
      >
        Wis alle filters
      </AcButton>
      {hasActiveFilters && (
        <AcFlex spacing='sm' className='con-active-filters-container'>
          {activeFilters.map((filter) => (
            <AcButton
              key={filter.id}
              style='buttonSlim'
              buttonType='secondary'
              className='con-active-filter'
              onClick={() => filter.onRemove()}
              aria-label={`Verwijder filter: ${filter.label}`}
            >
              <ConUuidResolver>
                {filter.label}
              </ConUuidResolver>{' '}
              <VISUALS.CLOSE style={{ width: '14px', height: '14px' }} />
            </AcButton>
          ))}
        </AcFlex>
      )}
    </>
  );
};

export default withStore(observer(ConActiveFilters));

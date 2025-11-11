import React, { memo } from 'react';
import { ConSchemaEnhancedField } from '@components';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';

/**
 * Applicaties Selectie Stage
 * - Multi-select dropdown with search functionality for selecting applicaties (modules)
 */
const ConFormApplicatiesStage = memo(
  ({
    // Product-related props commented out
    // productToModulesLookup,
    // selectedProductIds,
    // selectedProductOptions,
    // productOptions,
    // productLabels,
    selectedModuleIds,
    setSelectedModuleIds,
    loadingModules,
    searchLoading,
    moduleOptions,
    searchModules,
    schemas,
  }) => {
    const handleChange = (value) => {
      // ConSchemaEnhancedField with array schema returns an array of IDs for multi-select
      if (Array.isArray(value)) {
        setSelectedModuleIds(value);
      } else {
        setSelectedModuleIds([]);
      }
    };

    return (
      <div
        className='ac-register-form-section'
        role='group'
        aria-labelledby='dienst-applicaties-section-title'
      >
        <h2 id='dienst-applicaties-section-title' className='sr-only'>
          Applicaties selecteren
        </h2>
        <Paragraph style={{ marginBottom: '1rem' }}>
          Selecteer de applicaties die onderdeel zijn van deze dienst.
        </Paragraph>

        <div className='ac-register-form-grid'>
          <div style={{ gridColumn: 'span 2', maxWidth: '640px' }}>
            <ConSchemaEnhancedField
              schemaType='dienst'
              schemaProperty='modules'
              value={selectedModuleIds}
              onChange={handleChange}
              isDisabled={loadingModules}
              isLoading={loadingModules || searchLoading}
              width='full'
              schemas={schemas}
              optionsProvider={moduleOptions}
              onSearch={(_path, _refSlug, q) => searchModules && searchModules(q)}
              customProps={{
                label: 'Applicaties',
                placeholder: 'Selecteer applicaties',
              }}
            />
          </div>
        </div>
      </div>
    );
  }
);

ConFormApplicatiesStage.displayName = 'ConFormApplicatiesStage';

export default ConFormApplicatiesStage;

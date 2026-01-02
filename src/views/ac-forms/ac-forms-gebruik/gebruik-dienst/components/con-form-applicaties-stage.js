import React, { memo } from 'react';
import { ConSchemaEnhancedField } from '@components';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';

/**
 * Applicaties Selectie Stage
 * - Multi-select dropdown with search functionality for selecting applicaties (modules)
 */
const ConFormApplicatiesStage = memo(
  ({
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
          Zoek de applicatie(s) waarop u de dienst aanbiedt. Veelal is dat op de
          eigen applicaties, maar u kunt ook diensten op applicaties van andere
          leveranciers aanbieden.
        </Paragraph>

        <div className='ac-register-form-grid'>
          <div style={{ gridColumn: 'span 2', maxWidth: '640px' }}>
            <ConSchemaEnhancedField
              schemaType='dienst'
              schemaProperty='modules'
              required={true}
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

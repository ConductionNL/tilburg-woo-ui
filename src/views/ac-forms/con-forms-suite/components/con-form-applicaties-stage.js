import React, { memo } from 'react';
import { ConSchemaEnhancedField } from '@components';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';

/**
 * Applicaties Selectie Stage
 * - Multi-select dropdown with search functionality for selecting applicaties (modules)
 */
const ConFormApplicatiesStage = memo(
  ({
    selectedApplicatieIds,
    setSelectedApplicatieIds,
    loadingApplicaties,
    searchLoading,
    applicatieOptions,
    searchApplicaties,
    schemas,
  }) => {
    const handleChange = (value) => {
      // ConSchemaEnhancedField with array schema returns an array of IDs for multi-select
      if (Array.isArray(value)) {
        setSelectedApplicatieIds(value);
      } else {
        setSelectedApplicatieIds([]);
      }
    };

    return (
      <div
        className='ac-register-form-section'
        role='group'
        aria-labelledby='suite-applicaties-section-title'
      >
        <h2 id='suite-applicaties-section-title' className='sr-only'>
          Applicaties selecteren
        </h2>
        <Paragraph style={{ marginBottom: '1rem' }}>
          Selecteer de applicaties die onderdeel zijn van deze suite.
        </Paragraph>

        <div className='ac-register-form-grid'>
          <div style={{ gridColumn: 'span 2', maxWidth: '640px' }}>
            <ConSchemaEnhancedField
              schemaType='suite'
              schemaProperty='applicaties'
              required={true}
              value={selectedApplicatieIds}
              onChange={handleChange}
              isDisabled={loadingApplicaties}
              isLoading={loadingApplicaties || searchLoading}
              width='full'
              schemas={schemas}
              optionsProvider={applicatieOptions}
              onSearch={(_path, _refSlug, q) =>
                searchApplicaties && searchApplicaties(q)
              }
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


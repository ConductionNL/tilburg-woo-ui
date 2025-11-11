import React, { memo } from 'react';
import { ConSchemaEnhancedField } from '@src/components';

/**
 * ConGebruikStepProductApplicatie
 * Applicatie selection with searchable module select.
 * Shows all available applicaties from the catalog.
 */
const ConGebruikStepProductApplicatie = ({
  gebruik,
  setGebruikData,
  moduleOptions,
  modulesLoading,
  searchLoading,
  searchModules,
  schemas,
}) => {
  return (
    <div
      className='ac-register-form-section'
      role='group'
      aria-labelledby='applicatie-title'
    >
      <h2 id='applicatie-title' className='sr-only'>
        Applicatie
      </h2>

      <div className='ac-register-form-grid'>
        <div style={{ gridColumn: 'span 2', maxWidth: '640px' }}>
          <ConSchemaEnhancedField
            schemaType='gebruik'
            schemaProperty='module'
            value={gebruik?.module || null}
            onChange={(value) => {
              const nextId =
                (value && value.data && (value.data.id || value.data.value)) ||
                (value && value.value) ||
                value;
              setGebruikData('module', nextId);
            }}
            isDisabled={modulesLoading}
            isLoading={modulesLoading || searchLoading}
            width='full'
            schemas={schemas}
            optionsProvider={moduleOptions}
            onSearch={(_path, _refSlug, q) => searchModules && searchModules(q)}
            customProps={{
              label: 'Applicatie',
              placeholder: 'Selecteer een applicatie',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default memo(ConGebruikStepProductApplicatie);

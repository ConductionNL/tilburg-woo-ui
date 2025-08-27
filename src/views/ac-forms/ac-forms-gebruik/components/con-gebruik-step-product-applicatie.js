import React, { memo } from 'react';
import { ConSchemaEnhancedField } from '@src/components';

/**
 * ConGebruikStepProductApplicatie
 * Product and Applicatie selection with searchable module select,
 * aligned with product UI (see con-form-applicatie-stage.js).
 */
const ConGebruikStepProductApplicatie = ({
  gebruik,
  setGebruikData,
  productOptions,
  moduleOptions,
  modulesLoading,
  loading,
  schemas,
}) => {
  return (
    <div
      className='ac-register-form-section'
      role='group'
      aria-labelledby='product-title'
    >
      <h2 id='product-title' className='sr-only'>
        Product en applicatie
      </h2>
      <div className='ac-register-form-grid'>
        <div style={{ gridColumn: 'span 2', maxWidth: '640px' }}>
          <ConSchemaEnhancedField
            schemaType='gebruik'
            schemaProperty='product'
            value={gebruik?.product || null}
            onChange={(value) => setGebruikData('product', value)}
            isDisabled={loading}
            width='full'
            schemas={schemas}
            optionsProvider={productOptions}
          />
        </div>

        <div style={{ gridColumn: 'span 2', maxWidth: '640px' }}>
          <ConSchemaEnhancedField
            schemaType='gebruik'
            schemaProperty='module'
            value={gebruik?.module || null}
            onChange={(value) => {
              setGebruikData('module', value);
            }}
            isDisabled={modulesLoading || !gebruik?.product}
            isLoading={modulesLoading}
            width='full'
            schemas={schemas}
            optionsProvider={moduleOptions}
          />
        </div>
      </div>
    </div>
  );
};

export default memo(ConGebruikStepProductApplicatie);

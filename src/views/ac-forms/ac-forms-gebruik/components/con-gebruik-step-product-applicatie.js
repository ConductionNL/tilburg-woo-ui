import React, { memo } from 'react';
import { ConSchemaEnhancedField } from '@src/components';

/**
 * ConGebruikStepProductApplicatie
 * Product and Applicatie selection with searchable module select.
 * Behavior changes based on gebruikType:
 * - eigen-organisatie: select from all products in catalog
 * - andere-organisatie: select from your own organization's products
 */
const ConGebruikStepProductApplicatie = ({
  gebruik,
  setGebruikData,
  productOptions,
  moduleOptions,
  modulesLoading,
  loading,
  schemas,
  gebruikType,
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
        {gebruikType && (
          <div style={{ gridColumn: 'span 2', marginBottom: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#f0f8ff', borderRadius: '4px', border: '1px solid #e0e8f0' }}>
              <p style={{ margin: '0', fontSize: '0.9rem', fontWeight: '500', color: '#1976d2' }}>
                {gebruikType === 'eigen-organisatie' ? (
                  '🏢 Gebruik voor eigen organisatie: Selecteer een product uit de software catalogus dat uw organisatie gebruikt.'
                ) : (
                  '🤝 Gebruik voor andere organisatie: Selecteer een product van uw organisatie dat door een klant wordt gebruikt.'
                )}
              </p>
            </div>
          </div>
        )}
        
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

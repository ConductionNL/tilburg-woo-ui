import React, { memo } from 'react';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';
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
  searchModules,
  loading,
  schemas,
}) => {
  // current selected options are derived inline in fields; no separate memo needed

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
          <label className='utrecht-form-label'>Applicatie (module)</label>
          {(moduleOptions || []).length === 0 && !modulesLoading && (
            <Paragraph>
              Geen applicaties gevonden. Begin met typen om te zoeken...
            </Paragraph>
          )}

          {/* Radio list like product flow; preselect handled in parent when there is 1 option */}
          {(moduleOptions || []).length > 0 && (
            <fieldset style={{ border: 'none', padding: 0, margin: '0 0 8px 0' }}>
              {(moduleOptions || []).map((opt) => (
                <label
                  key={opt.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '6px',
                  }}
                >
                  <input
                    type='radio'
                    name='gebruik-module'
                    checked={
                      String(gebruik?.module?.id || gebruik?.module?.value || '') ===
                      String(opt.value)
                    }
                    onChange={() => setGebruikData('module', opt.data || opt)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </fieldset>
          )}

          {/* Show searchable select only when there are no radio options */}
          {(moduleOptions || []).length === 0 && (
            <ConSchemaEnhancedField
              schemaType='gebruik'
              schemaProperty='module'
              value={gebruik?.module || null}
              onChange={(value) => setGebruikData('module', value)}
              isDisabled={loading}
              width='full'
              schemas={schemas}
              optionsProvider={moduleOptions}
              isLoading={modulesLoading}
              onSearch={searchModules}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(ConGebruikStepProductApplicatie);

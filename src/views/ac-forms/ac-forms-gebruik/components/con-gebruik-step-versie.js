import React, { memo } from 'react';
import { ConSchemaEnhancedField } from '@src/components';

/**
 * ConGebruikStepVersie
 * Module versie selection step.
 */
const ConGebruikStepVersie = ({
  gebruik,
  setGebruikData,
  versionOptions,
  loading,
  schemas,
}) => {
  return (
    <div
      className='ac-register-form-section'
      role='group'
      aria-labelledby='version-title'
    >
      <h2 id='version-title' className='sr-only'>
        Versie
      </h2>
      <div style={{ maxWidth: '640px' }}>
        <ConSchemaEnhancedField
          schemaType='gebruik'
          schemaProperty='moduleVersie'
          value={gebruik?.moduleVersie || null}
          onChange={(value) => setGebruikData('moduleVersie', value)}
          isDisabled={loading}
          schemas={schemas}
          optionsProvider={versionOptions}
          width='full'
        />
      </div>
    </div>
  );
};

export default memo(ConGebruikStepVersie);

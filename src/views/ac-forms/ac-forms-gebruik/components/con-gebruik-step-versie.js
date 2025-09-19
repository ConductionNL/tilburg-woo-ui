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
  versionsLoading,
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
          value={gebruik?.moduleversie || null}
          onChange={(value) => setGebruikData('moduleversie', value)}
          isDisabled={versionsLoading}
          isLoading={versionsLoading}
          schemas={schemas}
          optionsProvider={versionOptions}
          onSearch={() => {}}
          width='full'
        />
      </div>
    </div>
  );
};

export default memo(ConGebruikStepVersie);

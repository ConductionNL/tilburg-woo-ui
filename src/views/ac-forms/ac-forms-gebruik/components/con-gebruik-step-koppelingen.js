import React, { memo } from 'react';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';
import { ConSchemaEnhancedField } from '@src/components';

/**
 * ConGebruikStepKoppelingen
 * Renders koppelingen selection step (checkbox list).
 */
const ConGebruikStepKoppelingen = ({
  gebruik,
  setGebruikData,
  koppelingOptions,
  schemas,
}) => {
  const selected = Array.isArray(gebruik?.koppelingen) ? gebruik.koppelingen : [];

  return (
    <div
      className='ac-register-form-section'
      role='group'
      aria-labelledby='koppelingen-title'
    >
      <h2 id='koppelingen-title' className='sr-only'>
        Koppelingen
      </h2>
      <Paragraph>
        Selecteer de koppelingen waar de gekozen applicatie onderdeel van is.
      </Paragraph>
      <div style={{ display: 'grid', gap: '8px' }}>
        {(koppelingOptions || []).length === 0 && <div>- Geen resultaten -</div>}
        <ConSchemaEnhancedField
          schemaType='gebruik'
          schemaProperty='koppelingen'
          value={selected}
          onChange={(value) => setGebruikData('koppelingen', value || [])}
          schemas={schemas}
          optionsProvider={koppelingOptions}
          width='full'
        />
      </div>
    </div>
  );
};

export default memo(ConGebruikStepKoppelingen);

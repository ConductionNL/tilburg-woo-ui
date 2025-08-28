import React, { memo } from 'react';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';
import { ConSchemaEnhancedField } from '@src/components';

/**
 * ConGebruikStepDiensten
 * Renders diensten selection step.
 */
const ConGebruikStepDiensten = ({
  gebruik,
  setGebruikData,
  dienstOptions,
  schemas,
}) => {
  const selected = Array.isArray(gebruik?.diensten) ? gebruik.diensten : [];

  return (
    <div
      className='ac-register-form-section'
      role='group'
      aria-labelledby='diensten-title'
    >
      <h2 id='diensten-title' className='sr-only'>
        Diensten
      </h2>

      <Paragraph>
        Selecteer de diensten die door de gekozen applicatie worden aangeboden.
      </Paragraph>
      <div style={{ display: 'grid', gap: '8px' }}>
        {(dienstOptions || []).length === 0 && <div>- Geen resultaten -</div>}
        <ConSchemaEnhancedField
          schemaType='gebruik'
          schemaProperty='diensten'
          value={selected}
          onChange={(value) => setGebruikData('diensten', value || [])}
          schemas={schemas}
          optionsProvider={dienstOptions}
          width='full'
        />
      </div>
    </div>
  );
};

export default memo(ConGebruikStepDiensten);

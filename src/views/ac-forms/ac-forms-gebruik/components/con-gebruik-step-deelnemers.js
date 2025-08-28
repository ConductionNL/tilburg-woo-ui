import React, { memo } from 'react';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';
import { ConSchemaEnhancedField } from '@src/components';

/**
 * ConGebruikStepDeelnemers
 * Shown only when afnemer is a samenwerking. Lets user select deelnemende organisaties.
 */
const ConGebruikStepDeelnemers = ({
  gebruik,
  setGebruikData,
  organisatieOptions,
  schemas,
}) => {
  const selected = Array.isArray(gebruik?.deelnemers) ? gebruik.deelnemers : [];

  return (
    <div
      className='ac-register-form-section'
      role='group'
      aria-labelledby='deelnemers-title'
    >
      <h2 id='deelnemers-title' className='sr-only'>
        Deelnemers
      </h2>

      <Paragraph>
        Selecteer de deelnemende organisaties binnen de samenwerking.
      </Paragraph>
      <ConSchemaEnhancedField
        schemaType='gebruik'
        schemaProperty='deelnemers'
        value={selected}
        onChange={(value) => setGebruikData('deelnemers', value || [])}
        schemas={schemas}
        optionsProvider={organisatieOptions}
        width='full'
      />
    </div>
  );
};

export default memo(ConGebruikStepDeelnemers);

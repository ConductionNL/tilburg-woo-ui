import React, { memo } from 'react';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';

/**
 * Dienstopbouw/Informatie Stage
 *
 * Introductory information for the dienst wizard. No inputs here, just context.
 */
const ConFormDienstopbouwStage = memo(() => {
  return (
    <div
      className='ac-register-form-section'
      role='group'
      aria-labelledby='dienstopbouw-section-title'
    >
      <h2 id='dienstopbouw-section-title' className='sr-only'>
        Dienst informatie
      </h2>

      <Paragraph>
        <strong>Registreer uw dienst</strong>
        <br />
        In de volgende stappen vult u de basisgegevens in, selecteert u de
        bijbehorende producten en applicaties en kiest u relevante koppelingen. Deze
        informatie helpt organisaties om snel te begrijpen welk aanbod uw dienst
        omvat en hoe die binnen hun landschap past.
      </Paragraph>
    </div>
  );
});

ConFormDienstopbouwStage.displayName = 'ConFormDienstopbouwStage';

export default ConFormDienstopbouwStage;

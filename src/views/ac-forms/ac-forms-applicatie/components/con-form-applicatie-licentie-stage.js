import React, { memo, useMemo } from 'react';
import ConSchemaEnhancedField from '@components/con-schema-enhanced-field/con-schema-enhanced-field';
import AcFlex from '@atoms/ac-flex/ac-flex';
import {
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import licenses from '@assets/licenses/licenses.json';

/**
 * Applicatie Licentie & Hosting Stage Component
 *
 * This step collects license and hosting information about the application.
 *
 * Features:
 * - Licentievorm (license type: Open source or Closed source)
 * - Licentie (specific license for open source)
 * - Hosting (cloud service model - can be multiple)
 * - Hosting locatie (hosting location - hidden if on-premise)
 * - Jurisdictie (jurisdiction - hidden if on-premise)
 *
 * @param {Object} applicatie - The applicatie object containing form data
 * @param {Function} setApplicatieData - Function to update applicatie data
 * @param {boolean} loading - Loading state indicator
 * @param {Object} touched - Touched field tracking for validation
 * @param {Object} schemas - Available schemas for field configuration
 */
const ConFormApplicatieLicentieStage = memo(
  ({ applicatie, setApplicatieData, loading, touched, schemas }) => {
    // Prepare license options from licenses.json
    const licentieOptions = useMemo(
      () =>
        licenses.map((l) => ({
          value: l['SPDX ID'],
          label: l.name,
        })),
      []
    );

    // Get current license type value (handle both licentietype and licentieType)
    const currentLicenseType =
      applicatie?.licentietype || applicatie?.licentieType || '';
    const isOpenSource = currentLicenseType === 'Open source';

    return (
      <div
        className='ac-register-form-section'
        role='group'
        aria-labelledby='license-hosting-section-title'
      >
        <h2 id='license-hosting-section-title' className='sr-only'>
          Licentie / Hosting
        </h2>
        <Paragraph className='con-form-wizard-paragraph'>
          Geef aan onder welke licentie u de applicatie aanbiedt. Vermeld daarnaast
          waar en hoe de applicatie wordt gehost, inclusief de locatie en de
          jurisdictie die van toepassing is. Deze informatie helpt gemeenten om te
          beoordelen of de applicatie voldoet aan hun eisen voor veiligheid en
          gegevensbescherming.
        </Paragraph>

        <div className='con-dynamic-form-container'>
          <div className='con-form-fields-container'>
            {/* Licentievorm and Licentie side by side */}
            <ConSchemaEnhancedField
              schemaType='module'
              schemaProperty='licentietype'
              value={currentLicenseType}
              onChange={(value) => {
                const nextValue = value || '';
                setApplicatieData('licentietype', nextValue);
                setApplicatieData('licentieType', nextValue);
                // Clear licentie if switching away from Open source
                if (nextValue !== 'Open source') {
                  setApplicatieData('licentie', '');
                }
              }}
              isDisabled={loading}
              width='half'
              touched={touched}
              schemas={schemas}
              customProps={{
                description:
                  'Biedt u de applicatie aan onder een closed source licentie of open source licentie?',
                placeholder: 'Selecteer licentievorm',
              }}
            />

            {/* Licentie - only shown and required for Open source */}
            <ConSchemaEnhancedField
              key={`licentie-${currentLicenseType}`}
              schemaType='module'
              schemaProperty='licentie'
              value={applicatie?.licentie || ''}
              onChange={(value) => setApplicatieData('licentie', value || '')}
              optionsProvider={licentieOptions}
              isDisabled={loading || !isOpenSource}
              width='half'
              touched={touched}
              schemas={schemas}
              customProps={{
                description:
                  'Selecteer één van de veel gebruikte open source licenties.',
                placeholder: isOpenSource
                  ? 'Selecteer licentie (verplicht)'
                  : 'Selecteer licentie',
                required: isOpenSource,
              }}
            />

            {/* Hosting fields in flex layout */}
            <AcFlex spacing='snail' style={{ flexBasis: '100%' }}>
              {/* Hosting - left side */}
              <ConSchemaEnhancedField
                schemaType='module'
                schemaProperty='cloudDienstverleningsmodel'
                value={applicatie?.cloudDienstverleningsmodel || ''}
                onChange={(value) =>
                  setApplicatieData('cloudDienstverleningsmodel', value)
                }
                isDisabled={loading}
                width='half'
                touched={touched}
                schemas={schemas}
                customProps={{
                  description:
                    'Kies één of meerdere hosting typen waarmee de applicatie wordt aangeboden.',
                  placeholder: 'Selecteer hosting type(s)',
                }}
              />

              {/* Hosting locatie and Jurisdictie - right side */}
              <AcFlex
                column
                spacing='snail'
                style={{
                  flexBasis:
                    'calc(50% - calc(var(--tilburg-space-block-snail) / 2))',
                  flexShrink: 0,
                  flexGrow: 0,
                }}
              >
                {/* Hosting locatie */}
                <ConSchemaEnhancedField
                  schemaType='module'
                  schemaProperty='hostingLocatie'
                  value={applicatie?.hostingLocatie || ''}
                  onChange={(value) => setApplicatieData('hostingLocatie', value)}
                  isDisabled={loading}
                  width='half'
                  touched={touched}
                  schemas={schemas}
                  customProps={{
                    description:
                      'Kies het land of continent waar de applicatie wordt gehost.',
                    placeholder: 'Selecteer hosting locatie',
                  }}
                />

                {/* Jurisdictie */}
                <ConSchemaEnhancedField
                  schemaType='module'
                  schemaProperty='hostingJurisdictie'
                  value={applicatie?.hostingJurisdictie || ''}
                  onChange={(value) =>
                    setApplicatieData('hostingJurisdictie', value)
                  }
                  isDisabled={loading}
                  width='half'
                  touched={touched}
                  schemas={schemas}
                  customProps={{
                    description:
                      'Kies de wetgeving die geldt voor de opgeslagen gegevens.',
                    placeholder: 'Selecteer jurisdictie',
                  }}
                />
              </AcFlex>
            </AcFlex>
          </div>
        </div>
      </div>
    );
  }
);

ConFormApplicatieLicentieStage.displayName = 'ConFormApplicatieLicentieStage';

export default ConFormApplicatieLicentieStage;

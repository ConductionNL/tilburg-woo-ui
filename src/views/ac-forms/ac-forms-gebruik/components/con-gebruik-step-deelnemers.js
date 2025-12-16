import React, { memo } from 'react';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';
import { AcCheckbox, AcButton } from '@src/molecules';
import AcLoader from '@components/ac-loader/ac-loader';
import { AcFlex } from '@src/atoms';

/**
 * Deelnemers Stage Component for Gebruik Form
 *
 * This stage is only shown for organizations of type 'Samenwerking' or 'Community'.
 * It allows the user to select deelnemers (participants) for the gebruik.
 * The deelnemers options are fetched from the organization's deelnemers property
 * (organizations that are members of this Samenwerking/Community).
 *
 * @param {Object} gebruik - The gebruik object containing form data
 * @param {Function} setGebruikData - Function to update gebruik data
 * @param {boolean} loading - Loading state indicator
 * @param {Array} deelnemerOptions - Array of deelnemer options { value: id, label: name }
 * @param {boolean} deelnemersLoading - Loading state for deelnemers options
 */
const ConGebruikStepDeelnemers = memo(
  ({
    gebruik,
    setGebruikData,
    loading,
    deelnemerOptions = [],
    deelnemersLoading = false,
  }) => {
    const handleDeelnemerChange = (deelnemerValue, isChecked) => {
      const currentDeelnemers = Array.isArray(gebruik?.deelnemers)
        ? gebruik.deelnemers
        : [];

      if (isChecked) {
        // Add deelnemer if not already present
        if (!currentDeelnemers.includes(deelnemerValue)) {
          setGebruikData('deelnemers', [...currentDeelnemers, deelnemerValue]);
        }
      } else {
        // Remove deelnemer
        setGebruikData(
          'deelnemers',
          currentDeelnemers.filter((deelnemer) => deelnemer !== deelnemerValue)
        );
      }
    };

    // Handle selecting all deelnemers
    const handleSelectAll = () => {
      const allValues = deelnemerOptions.map((option) => option.value);
      setGebruikData('deelnemers', allValues);
    };

    // Handle deselecting all deelnemers
    const handleDeselectAll = () => {
      setGebruikData('deelnemers', []);
    };

    return (
      <div
        className='ac-register-form-section'
        role='group'
        aria-labelledby='deelnemers-title'
      >
        <h2 id='deelnemers-title' className='sr-only'>
          Deelnemers
        </h2>

        <Paragraph className='con-form-wizard-paragraph'>
          <strong>Selecteer de deelnemers</strong>
          <br />
          Selecteer de organisaties die deelnemen aan dit gebruik binnen uw
          samenwerkingsverband of community.
        </Paragraph>

        {deelnemerOptions.length > 0 && (
          <AcFlex
            spacing='xs'
            style={{
              marginBottom: '1rem',
            }}
          >
            <AcButton
              style='button'
              buttonType='secondary'
              onClick={handleSelectAll}
              disabled={loading || deelnemersLoading}
            >
              Selecteer alle
            </AcButton>
            <AcButton
              style='button'
              buttonType='secondary'
              onClick={handleDeselectAll}
              disabled={loading || deelnemersLoading}
            >
              Deselecteer alle
            </AcButton>
          </AcFlex>
        )}

        <div className='ac-register-form-grid'>
          <div style={{ gridColumn: 'span 2' }}>
            {deelnemersLoading ? (
              <AcLoader />
            ) : deelnemerOptions.length === 0 ? (
              <Paragraph>
                Er zijn geen deelnemers gevonden voor uw organisatie.
              </Paragraph>
            ) : (
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
              >
                {deelnemerOptions.map((option) => {
                  const isChecked = Array.isArray(gebruik?.deelnemers)
                    ? gebruik.deelnemers.includes(option.value)
                    : false;

                  return (
                    <AcCheckbox
                      key={option.value}
                      label={option.label}
                      value={option.value}
                      checked={isChecked}
                      onChange={(checked) =>
                        handleDeelnemerChange(option.value, checked)
                      }
                      disabled={loading}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

ConGebruikStepDeelnemers.displayName = 'ConGebruikStepDeelnemers';

export default ConGebruikStepDeelnemers;

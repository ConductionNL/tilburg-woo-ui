import React, { memo } from 'react';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';
import { AcButton } from '@src/molecules';
import AcLoader from '@components/ac-loader/ac-loader';
import { AcFlex } from '@src/atoms';
import ReactSelect from 'react-select';

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
    // Get current selected options for ReactSelect
    const currentSelectedOptions = deelnemerOptions.filter((option) =>
      Array.isArray(gebruik?.deelnemers)
        ? gebruik.deelnemers.includes(option.value)
        : false
    );

    // Handle multi-select change
    const handleMultiSelectChange = (selectedOptions) => {
      const selectedValues = selectedOptions
        ? selectedOptions.map((option) => option.value)
        : [];
      setGebruikData('deelnemers', selectedValues);
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
              style='buttonSlim'
              buttonType='secondary'
              onClick={handleSelectAll}
              disabled={loading || deelnemersLoading}
            >
              Selecteer alle
            </AcButton>
            <AcButton
              style='buttonSlim'
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
              <ReactSelect
                isMulti
                className='ac-beheer-select'
                options={deelnemerOptions}
                value={currentSelectedOptions}
                onChange={handleMultiSelectChange}
                isLoading={deelnemersLoading}
                isDisabled={loading}
                closeMenuOnSelect={false}
                placeholder='Selecteer deelnemers...'
              />
            )}
          </div>
        </div>
      </div>
    );
  }
);

ConGebruikStepDeelnemers.displayName = 'ConGebruikStepDeelnemers';

export default ConGebruikStepDeelnemers;

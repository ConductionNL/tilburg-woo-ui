import React, { memo } from 'react';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';
import { AcButton } from '@src/molecules';
import AcLoader from '@components/ac-loader/ac-loader';
import { AcFlex } from '@src/atoms';
import ReactSelect from 'react-select';
import { VISUALS } from '@src/constants';

/**
 * Deelnemers Stage Component for Koppeling Form
 *
 * This stage is shown for the Gebruik-beheerders flow (aanbieden-koppeling type).
 * It allows the user to select deelnemers (participants) from their current logged-in organization.
 * The deelnemers options are fetched from the organization's deelnemers property.
 * This step is entirely optional.
 *
 * @param {Array} deelnemers - Array of selected deelnemer IDs
 * @param {Function} setDeelnemers - Function to update deelnemers array
 * @param {boolean} loading - Loading state indicator
 * @param {Array} deelnemerOptions - Array of deelnemer options { value: id, label: name }
 * @param {boolean} deelnemersLoading - Loading state for deelnemers options
 */
const ConKoppelingStepDeelnemers = memo(
  ({
    deelnemers = [],
    setDeelnemers,
    loading,
    deelnemerOptions = [],
    deelnemersLoading = false,
  }) => {
    // Get current selected options for ReactSelect
    const currentSelectedOptions = deelnemerOptions.filter((option) =>
      Array.isArray(deelnemers) ? deelnemers.includes(option.value) : false
    );

    // Check if all deelnemers are selected
    const allSelected =
      deelnemerOptions.length > 0 &&
      Array.isArray(deelnemers) &&
      deelnemers.length === deelnemerOptions.length &&
      deelnemerOptions.every((option) => deelnemers.includes(option.value));

    // Check if none are selected
    const noneSelected = !Array.isArray(deelnemers) || deelnemers.length === 0;

    // Handle multi-select change
    const handleMultiSelectChange = (selectedOptions) => {
      const selectedValues = selectedOptions
        ? selectedOptions.map((option) => option.value)
        : [];
      setDeelnemers(selectedValues);
    };

    // Handle selecting all deelnemers
    const handleSelectAll = () => {
      const allValues = deelnemerOptions.map((option) => option.value);
      setDeelnemers(allValues);
    };

    // Handle deselecting all deelnemers
    const handleDeselectAll = () => {
      setDeelnemers([]);
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
          Selecteer de deelnemers van de samenwerking, die gebruik maken van deze
          koppeling.
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
              disabled={loading || deelnemersLoading || allSelected}
              icon={<VISUALS.CHECK style={{ width: '16px', height: '16px' }} />}
            >
              Selecteer alle
            </AcButton>
            <AcButton
              style='buttonSlim'
              buttonType='secondary'
              onClick={handleDeselectAll}
              disabled={loading || deelnemersLoading || noneSelected}
              icon={
                <VISUALS.CIRCLE_XMARK style={{ width: '16px', height: '16px' }} />
              }
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

ConKoppelingStepDeelnemers.displayName = 'ConKoppelingStepDeelnemers';

export default ConKoppelingStepDeelnemers;

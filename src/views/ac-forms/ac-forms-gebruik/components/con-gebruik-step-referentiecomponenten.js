import React, { memo, useEffect } from 'react';
import ReactSelect from 'react-select';
import { Paragraph, Link } from '@utrecht/component-library-react/dist/css-module';

/**
 * Referentiecomponenten Stage Component for Gebruik Form
 *
 * This stage manages linking reference components to the gebruik.
 * Based on the applicatie form version but adapted for gebruik.
 *
 * @param {Object} gebruik - The gebruik object containing form data
 * @param {Function} setGebruikData - Function to update gebruik data
 * @param {Array} referentieComponentenOptions - Available reference component options
 * @param {Array} referentieComponentenWithStandards - Reference components with their standards
 * @param {Function} setSelectedReferentieComponenten - Function to update reference components with standards
 * @param {Object} schemas - Available schemas for field configuration
 * @param {boolean} loading - Loading state indicator
 * @param {boolean} referentieComponentenLoading - Loading state for referentiecomponenten options
 * @param {string} applicatieKeuze - 'bestaand' or 'nieuw' to determine flow type
 * @param {Object} selectedApplicatieData - Full applicatie data for existing flow (to get referentieComponenten)
 */
const ConGebruikStepReferentiecomponenten = memo(
  ({
    gebruik,
    setGebruikData,
    referentieComponentenOptions,
    setSelectedReferentieComponenten,
    loading,
    referentieComponentenLoading,
    applicatieKeuze = 'bestaand',
    selectedApplicatieData = null,
  }) => {
    // Helper function to normalize referentieComponenten values
    const normalizeValues = (values) => {
      if (!values || !Array.isArray(values)) return [];

      return values
        .map((value) => {
          // Handle null, undefined, or empty values
          if (value == null || value === '') {
            return null;
          }

          // Handle both object format {id: "...", naam: "..."} and string format
          if (typeof value === 'object') {
            const extractedId = value.id || value.value || value.naam;
            return extractedId != null ? String(extractedId) : null;
          }

          return String(value);
        })
        .filter((id) => id != null); // Remove null values from the array
    };

    const updateReferentieComponentenWithStandards = (refs) => {
      const refsArray = normalizeValues(refs);

      // Update the separate array with full referentieComponent data including standards
      setSelectedReferentieComponenten((prev) => {
        // Remove existing entries for this gebruik (using gebruikId 0 for single gebruik)
        const filtered = prev.filter((item) => item.gebruikId !== 0);

        // Add new entries with full data from referentieComponentenOptions
        const newEntries = refsArray.map((refId) => {
          const refOption = referentieComponentenOptions.find(
            (opt) => String(opt.value) === String(refId)
          );
          const refData = refOption?.data || {};

          return {
            id: refId,
            naam: refOption?.label || refId,
            gebruikId: 0,
            // Store the full API data for future use
            fullData: refData,
          };
        });

        const result = [...filtered, ...newEntries];
        return result;
      });
    };

    useEffect(() => {
      // Trigger updateReferentieComponentenWithStandards for edit mode initialization
      // This ensures standards are populated when referentieComponenten are prefilled
      if (referentieComponentenOptions.length > 0) {
        const currentRefs =
          gebruik.referentieComponenten ||
          gebruik.gebruiktVoorReferentiecomponenten ||
          [];
        if (currentRefs.length > 0) {
          // Normalize the refs the same way the onChange handler does
          const normalizedRefs = normalizeValues(currentRefs);

          // Only update if we have valid normalized refs
          if (normalizedRefs.length > 0) {
            updateReferentieComponentenWithStandards(normalizedRefs);
          }
        }
      }
    }, [
      // Only run when the actual referentieComponenten data changes, not on every update
      JSON.stringify(
        gebruik.referentieComponenten ||
          gebruik.gebruiktVoorReferentiecomponenten ||
          []
      ),
      referentieComponentenOptions.length,
    ]);

    return (
      <div>
        <h2 id='refcomp-section-title' className='sr-only'>
          Referentiecomponenten
        </h2>

        <Paragraph className='con-form-wizard-paragraph'>
          <strong>Koppel uw gebruik aan de GEMMA</strong>
          <br />
          Koppel uw gebruik aan de GEMMA-referentiecomponenten die de gemeentelijke
          functionaliteit weergeven. Dit helpt gemeenten te zien hoe uw gebruik past
          in hun architectuur. Een{' '}
          <Link
            href={
              'https://www.gemmaonline.nl/wiki/Overzicht_alle_referentiecomponenten'
            }
            target='_blank'
            rel='noopener noreferrer'
            style={{
              display: 'inline-block',
            }}
          >
            overzicht van alle referentiecomponenten
          </Link>{' '}
          vindt u op GEMMA Online.
        </Paragraph>

        {(() => {
          // Get referentieComponenten from selected applicatie (for existing flow)
          const applicatieRefIds = [];
          if (
            applicatieKeuze === 'bestaand' &&
            selectedApplicatieData?.referentieComponenten
          ) {
            const refs = Array.isArray(selectedApplicatieData.referentieComponenten)
              ? selectedApplicatieData.referentieComponenten
              : [selectedApplicatieData.referentieComponenten];
            applicatieRefIds.push(...refs.map((r) => String(r.id || r.value || r)));
          }

          // Filter options based on flow type
          const inApplicatieOptions = referentieComponentenOptions.filter((opt) =>
            applicatieRefIds.includes(String(opt.value))
          );
          const notInApplicatieOptions = referentieComponentenOptions.filter(
            (opt) => !applicatieRefIds.includes(String(opt.value))
          );

          const currentRefs = normalizeValues(
            gebruik.referentieComponenten ||
              gebruik.gebruiktVoorReferentiecomponenten ||
              []
          );

          const commonSelectStyles = {
            control: (provided) => ({
              ...provided,
              border: '1px solid #ccc',
              borderRadius: '4px',
            }),
            placeholder: (provided) => ({
              ...provided,
              color: '#666',
            }),
            valueContainer: (provided) => ({
              ...provided,
              padding: '8px 12px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-start',
              alignContent: 'flex-start',
            }),
            multiValue: (provided) => ({
              ...provided,
              margin: '2px',
              backgroundColor: '#e3f2fd',
              border: '1px solid #bbdefb',
            }),
            input: (provided) => ({
              ...provided,
              margin: 0,
              padding: 0,
            }),
            indicatorSeparator: () => ({
              display: 'none',
            }),
          };

          if (applicatieKeuze === 'bestaand' && applicatieRefIds.length > 0) {
            // Existing flow: show two dropdowns
            return (
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
              >
                <div>
                  <h3 style={{ marginBottom: '0.5rem' }}>
                    Referentiecomponenten in de geselecteerde applicatie
                  </h3>
                  <ReactSelect
                    value={inApplicatieOptions.filter((opt) =>
                      currentRefs.includes(String(opt.value))
                    )}
                    onChange={(selectedOptions) => {
                      const selectedInApp = selectedOptions
                        ? selectedOptions.map((opt) => opt.value)
                        : [];
                      const selectedNotInApp = notInApplicatieOptions
                        .filter((opt) => currentRefs.includes(String(opt.value)))
                        .map((opt) => opt.value);
                      const refsArray = [...selectedInApp, ...selectedNotInApp];
                      setGebruikData('gebruiktVoorReferentiecomponenten', refsArray);
                      updateReferentieComponentenWithStandards(refsArray);
                    }}
                    options={inApplicatieOptions.sort((a, b) =>
                      a.label.localeCompare(b.label)
                    )}
                    placeholder={
                      referentieComponentenLoading
                        ? 'Laden...'
                        : 'Selecteer referentiecomponenten uit de applicatie'
                    }
                    isMulti={true}
                    isSearchable={true}
                    isLoading={referentieComponentenLoading}
                    isDisabled={loading}
                    closeMenuOnSelect={false}
                    styles={commonSelectStyles}
                  />
                </div>
                <div>
                  <h3 style={{ marginBottom: '0.5rem' }}>
                    Andere referentiecomponenten
                  </h3>
                  <ReactSelect
                    value={notInApplicatieOptions.filter((opt) =>
                      currentRefs.includes(String(opt.value))
                    )}
                    onChange={(selectedOptions) => {
                      const selectedNotInApp = selectedOptions
                        ? selectedOptions.map((opt) => opt.value)
                        : [];
                      const selectedInApp = inApplicatieOptions
                        .filter((opt) => currentRefs.includes(String(opt.value)))
                        .map((opt) => opt.value);
                      const refsArray = [...selectedInApp, ...selectedNotInApp];
                      setGebruikData('gebruiktVoorReferentiecomponenten', refsArray);
                      updateReferentieComponentenWithStandards(refsArray);
                    }}
                    options={notInApplicatieOptions.sort((a, b) =>
                      a.label.localeCompare(b.label)
                    )}
                    placeholder={
                      referentieComponentenLoading
                        ? 'Laden...'
                        : 'Selecteer andere referentiecomponenten'
                    }
                    isMulti={true}
                    isSearchable={true}
                    isLoading={referentieComponentenLoading}
                    isDisabled={loading}
                    closeMenuOnSelect={false}
                    styles={commonSelectStyles}
                  />
                </div>
              </div>
            );
          } else {
            // Non-existing flow or no applicatie refs: show single dropdown with all options
            return (
              <div>
                <ReactSelect
                  value={referentieComponentenOptions.filter((opt) =>
                    currentRefs.includes(String(opt.value))
                  )}
                  onChange={(selectedOptions) => {
                    const refsArray = selectedOptions
                      ? selectedOptions.map((opt) => opt.value)
                      : [];
                    setGebruikData('gebruiktVoorReferentiecomponenten', refsArray);
                    updateReferentieComponentenWithStandards(refsArray);
                  }}
                  options={referentieComponentenOptions.sort((a, b) =>
                    a.label.localeCompare(b.label)
                  )}
                  placeholder={
                    referentieComponentenLoading
                      ? 'Laden...'
                      : 'Zoek en selecteer een referentiecomponent'
                  }
                  isMulti={true}
                  isSearchable={true}
                  isLoading={referentieComponentenLoading}
                  isDisabled={loading}
                  closeMenuOnSelect={false}
                  styles={commonSelectStyles}
                />
              </div>
            );
          }
        })()}
      </div>
    );
  }
);

ConGebruikStepReferentiecomponenten.displayName =
  'ConGebruikStepReferentiecomponenten';

export default ConGebruikStepReferentiecomponenten;

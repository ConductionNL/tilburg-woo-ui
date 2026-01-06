import React, { memo } from 'react';
import clsx from 'clsx';
import ReactSelect from 'react-select';
import {
  Paragraph,
  Textarea,
  Separator,
} from '@utrecht/component-library-react/dist/css-module';

/**
 * ConKoppelingStepGebruiksinformatie (Aanvullende informatie)
 *
 * This step handles additional koppeling details:
 * - Korte beschrijving
 * - Standaardversies
 * - Transportprotocol (renamed from Soort)
 * - Intermediair (applications with specific referentiecomponenten)
 */
const ConKoppelingStepGebruiksinformatie = ({
  beschrijvingByRow,
  setBeschrijvingByRow,
  standaardenOptions,
  standaardenOptionsLoading,
  standaardenByRow,
  setStandaardenByRow,
  typeOptions,
  typeByRow,
  setTypeByRow,
  intermediairByRow,
  setIntermediairByRow,
  intermediairOptions,
  intermediairOptionsLoading,
  rows,
  loading,
  nameByRow,
}) => {
  //   const [showInfoAlert, setShowInfoAlert] = useState(() => {
  //     return !sessionStorage.getItem('koppeling-aanvullende-info-alert-closed');
  //   });

  //   const handleCloseAlert = () => {
  //     setShowInfoAlert(false);
  //     sessionStorage.setItem('koppeling-aanvullende-info-alert-closed', 'true');
  //   };

  return (
    <div
      className='ac-register-form-section'
      role='group'
      aria-labelledby='aanvullende-informatie-title'
    >
      <h2 id='aanvullende-informatie-title' className='sr-only'>
        Aanvullende informatie over uw koppelingen
      </h2>

      <Paragraph className='con-form-wizard-paragraph'>
        Beschrijf hier de koppeling aanvullend. Geef aan op welke standaard de
        koppeling is gebaseerd en voeg relevante technische informatie toe.
      </Paragraph>

      {/* {showInfoAlert && (
        <Alert severity='info' className='ac-forms-product-info-alert'>
          <button
            onClick={handleCloseAlert}
            className='ac-forms-product-info-alert__close-button'
            title='Sluiten'
            aria-label='Alert sluiten'
          >
            <VISUALS.CLOSE />
          </button>
          <div className='ac-forms-product-info-alert__content'>
            <VISUALS.INFO className='ac-forms-product-info-alert__icon' />
            <div>
              <strong>Aanvullende informatie</strong>
              <br />
              <span className='ac-forms-product-info-alert__text'>
                Beschrijf de koppeling kort en selecteer de gebruikte standaarden.
                Het transportprotocol geeft aan hoe de gegevens worden uitgewisseld
                (bijvoorbeeld API, bestand of bericht). Een intermediair is een
                tussenliggende applicatie die de gegevensuitwisseling faciliteert.
              </span>
            </div>
          </div>
        </Alert>
      )} */}

      <div className='con-form-wizard-rows'>
        {rows.map((rowId, index) => {
          const beschrijving = beschrijvingByRow[rowId] || '';
          const maxLen = 255;
          const charsLeft = Math.max(0, maxLen - beschrijving.length);

          return (
            <div
              key={`row-${rowId}`}
              style={{
                padding: '1rem',
                border: '1px solid #e5e5e5',
                borderRadius: '6px',
                marginBottom: '1rem',
              }}
            >
              <h3
                className='utrecht-heading-4'
                style={{
                  marginBlockStart: 0,
                  marginBlockEnd: '1rem',
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: 'var(--tilburg-color-gray-900, #1a1a1a)',
                }}
              >
                {nameByRow[rowId] || `Koppeling ${index + 1}`}
              </h3>

              {/* Korte beschrijving */}
              <div style={{ marginBottom: '1rem' }}>
                <label
                  className='utrecht-form-label'
                  htmlFor={`koppeling-beschrijving-${rowId}`}
                  style={{ display: 'block' }}
                >
                  Korte beschrijving
                </label>
                <Textarea
                  id={`koppeling-beschrijving-${rowId}`}
                  className='con-koppeling-beschrijving'
                  value={beschrijving}
                  maxLength={maxLen}
                  onChange={(e) =>
                    setBeschrijvingByRow((prev) => ({
                      ...prev,
                      [rowId]: e?.target?.value || '',
                    }))
                  }
                  placeholder='Korte beschrijving van de koppeling (max 255 tekens)'
                  disabled={loading}
                />
                <Paragraph
                  style={{
                    marginTop: '0.25rem',
                    fontSize: '0.875rem',
                    color: '#666',
                  }}
                >
                  {charsLeft} tekens resterend
                </Paragraph>
              </div>

              {/* Standaardversies */}
              <div style={{ marginBottom: '1rem' }}>
                <label
                  className='utrecht-form-label'
                  htmlFor={`koppeling-standaarden-${rowId}`}
                  style={{ display: 'block' }}
                >
                  Standaardversies
                </label>
                <ReactSelect
                  className={clsx(
                    'ac-beheer-select',
                    'con-koppeling-standaarden-select',
                    loading && 'ac-beheer-select--disabled'
                  )}
                  inputId={`koppeling-standaarden-${rowId}`}
                  isClearable
                  value={
                    standaardenByRow[rowId]
                      ? standaardenOptions.filter((o) =>
                          standaardenByRow[rowId].includes(o.value)
                        )
                      : null
                  }
                  onChange={(opt) => {
                    const standaarden = opt ? opt.map((o) => o.value) : [];
                    setStandaardenByRow((prev) => {
                      const updated = { ...prev };
                      updated[rowId] = standaarden;
                      return updated;
                    });
                  }}
                  options={standaardenOptions}
                  placeholder={
                    standaardenOptionsLoading ? 'Laden...' : 'Selecteer standaarden'
                  }
                  isMulti={true}
                  isSearchable={true}
                  isLoading={standaardenOptionsLoading}
                  closeMenuOnSelect={false}
                  isDisabled={loading}
                />
              </div>

              <Separator
                className='ac-register-review-header__separator'
                style={{ marginBlock: '24px' }}
              />

              {/* Transportprotocol and Intermediair */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: '1rem',
                }}
              >
                <div>
                  <label
                    className='utrecht-form-label'
                    htmlFor={`koppeling-transportprotocol-${rowId}`}
                    style={{ display: 'block' }}
                  >
                    Transportprotocol
                  </label>
                  <ReactSelect
                    className={clsx(
                      'ac-beheer-select',
                      loading && 'ac-beheer-select--disabled'
                    )}
                    inputId={`koppeling-transportprotocol-${rowId}`}
                    options={typeOptions}
                    isClearable
                    value={
                      typeByRow[rowId]
                        ? typeOptions.find((o) => o.value === typeByRow[rowId])
                        : null
                    }
                    onChange={(opt) =>
                      setTypeByRow((prev) => ({ ...prev, [rowId]: opt?.value }))
                    }
                    placeholder='Selecteer transportprotocol'
                    isDisabled={loading}
                  />
                </div>
                <div>
                  <label
                    className='utrecht-form-label'
                    htmlFor={`koppeling-intermediair-${rowId}`}
                    style={{ display: 'block' }}
                  >
                    Intermediair
                  </label>
                  <ReactSelect
                    className={clsx(
                      'ac-beheer-select',
                      loading && 'ac-beheer-select--disabled'
                    )}
                    inputId={`koppeling-intermediair-${rowId}`}
                    options={intermediairOptions}
                    isClearable
                    value={
                      intermediairByRow[rowId]
                        ? intermediairOptions.find(
                            (o) => o.value === intermediairByRow[rowId]
                          )
                        : null
                    }
                    onChange={(opt) =>
                      setIntermediairByRow((prev) => ({
                        ...prev,
                        [rowId]: opt?.value,
                      }))
                    }
                    placeholder={
                      intermediairOptionsLoading
                        ? 'Laden...'
                        : 'Selecteer intermediair'
                    }
                    isLoading={intermediairOptionsLoading}
                    isDisabled={loading}
                    noOptionsMessage={() =>
                      'Geen applicaties gevonden met routerings- of distributiecomponenten'
                    }
                  />
                  <Paragraph
                    style={{
                      marginTop: '0.25rem',
                      fontSize: '0.75rem',
                      color: '#666',
                    }}
                  >
                    Applicaties met routerings- of distributiecomponenten
                  </Paragraph>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default memo(ConKoppelingStepGebruiksinformatie);

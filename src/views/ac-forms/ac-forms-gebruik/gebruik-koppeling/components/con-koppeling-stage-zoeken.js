import React, { useState } from 'react';
import clsx from 'clsx';
import ReactSelect from 'react-select';
import { AcFlex } from '@src/atoms';
import { AcCheckbox, AcButton } from '@src/molecules';
import { ConSchemaEnhancedField, ConUuidResolver } from '@src/components';
import {
  Paragraph,
  Alert,
  Textbox,
} from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@src/constants';
import { validateWebsite } from '@views/ac-forms/validation/form-validations';

const ConKoppelingStageZoeken = ({
  loading,
  ownAppOptions,
  ownApp,
  setOwnApp,
  ownAppLoading,
  searchResults,
  resolvedModulesFromResults = [],
  resultsLoading = false,
  getArrowForDirection,
  isEditMode,
  onSearchModules,
  schemas = {},
  selectedKoppelingId,
  setSelectedKoppelingId,
  // New koppeling creation props
  koppelingKeuze = 'bestaand',
  setKoppelingKeuze,
  nieuweKoppeling = {},
  setNieuweKoppelingData,
  // Leverancier props
  leverancierKeuze = 'bestaand',
  setLeverancierKeuze,
  leverancierOrganisatie = {},
  setLeverancierOrganisatieData,
  leverancierOptions = [],
  leverancierLoading = false,
  searchLeveranciers,
  // Module B options (for koppeling target)
  moduleBOptions = [],
  moduleBLoading = false,
  searchModuleB,
  // Buitengemeentelijke voorzieningen
  buitengemeentelijkeOptions = [],
  buitengemeentelijkeOptionsLoading = false,
}) => {
  const idToLabel = Object.fromEntries(
    (resolvedModulesFromResults || []).map((o) => [String(o.value), String(o.label)])
  );

  const extractRelationId = (rel) => {
    if (!rel) return '';
    if (typeof rel === 'string') return String(rel);
    if (typeof rel === 'object') {
      return String(rel.id || rel.value || rel?.['@self']?.id || '') || '';
    }
    return '';
  };

  const getDirectionValue = (k) => {
    return (
      k?.gegevensuitwisselingRichting ||
      k?.richting ||
      k?.direction ||
      (k?.gegevensuitwisseling && k?.gegevensuitwisseling.richting) ||
      ''
    );
  };

  const arrowFor = (dir) => {
    if (typeof getArrowForDirection === 'function') return getArrowForDirection(dir);
    if (dir === 'AnaarB') return '→';
    if (dir === 'BnaarA') return '←';
    if (dir === 'bi-directioneel') return '↔';
    return '↔';
  };

  // Direction options for koppeling
  const directionOptions = [
    { value: 'AnaarB', label: 'A → B' },
    { value: 'BnaarA', label: 'B → A' },
    { value: 'bi-directioneel', label: '↔ Bi-directioneel' },
  ];

  // Helper function to create colored dot style (matching applicatie publiceren wizard)
  const dot = (color = 'transparent') => ({
    alignItems: 'center',
    display: 'flex',
    ':before': {
      backgroundColor: color,
      borderRadius: 10,
      content: '" "',
      display: 'block',
      marginRight: 8,
      height: 10,
      width: 10,
      flex: 'none',
    },
  });

  // Custom styles for ReactSelect with colored dots (matching applicatie publiceren wizard)
  const getSelectStyles = () => ({
    option: (styles, { data }) => {
      const color = data?.type === 'buitengemeentelijke' ? '#3b82f6' : '#10b981';
      return {
        ...styles,
        ...dot(color),
      };
    },
    singleValue: (styles, { data }) => {
      const color = data?.type === 'buitengemeentelijke' ? '#3b82f6' : '#10b981';
      return {
        ...styles,
        ...dot(color),
      };
    },
    multiValue: (styles, { data }) => {
      const color = data?.type === 'buitengemeentelijke' ? '#3b82f6' : '#10b981';
      return {
        ...styles,
        ...dot(color),
      };
    },
    placeholder: (styles) => ({
      ...styles,
      ...dot('#ccc'),
    }),
  });

  // Helper function to merge modules and buitengemeentelijke options
  const getMergedModuleBOptions = () => {
    const merged = [...moduleBOptions];
    (buitengemeentelijkeOptions || []).forEach((buitenOpt) => {
      const exists = merged.some((o) => String(o.value) === String(buitenOpt.value));
      if (!exists) {
        merged.push(buitenOpt);
      }
    });
    // Filter out the selected ownApp
    return merged.filter(
      (opt) => !ownApp?.value || String(opt.value) !== String(ownApp.value)
    );
  };

  // Manage visibility state of info alerts
  const [showInfoAlert, setShowInfoAlert] = useState(() => {
    return !sessionStorage.getItem('koppeling-zoeken-info-alert-closed');
  });
  const [showInfoAlertNieuw, setShowInfoAlertNieuw] = useState(() => {
    return !sessionStorage.getItem('koppeling-zoeken-nieuw-info-alert-closed');
  });

  const handleCloseAlert = () => {
    setShowInfoAlert(false);
    sessionStorage.setItem('koppeling-zoeken-info-alert-closed', 'true');
  };

  const handleCloseAlertNieuw = () => {
    setShowInfoAlertNieuw(false);
    sessionStorage.setItem('koppeling-zoeken-nieuw-info-alert-closed', 'true');
  };

  // New koppeling creation form
  if (koppelingKeuze === 'nieuw' && setKoppelingKeuze) {
    return (
      <AcFlex
        column
        spacing='sm'
        className='ac-register-form-section'
        role='group'
        aria-labelledby='koppeling-nieuw-title'
      >
        <h2 id='koppeling-nieuw-title' className='sr-only'>
          Nieuwe koppeling aanmaken
        </h2>

        <Paragraph className='con-form-wizard-paragraph'>
          Vul de gegevens in voor de nieuwe koppeling. Geef aan met welke applicatie
          uw applicatie gegevens uitwisselt, de richting van de gegevensuitwisseling,
          en een naam voor de koppeling.
        </Paragraph>

        {/* Closeable info alert */}
        {showInfoAlertNieuw && (
          <Alert severity='info' className='ac-forms-product-info-alert'>
            <button
              onClick={handleCloseAlertNieuw}
              className='ac-forms-product-info-alert__close-button'
              title='Sluiten'
              aria-label='Alert sluiten'
            >
              <VISUALS.CLOSE />
            </button>
            <div className='ac-forms-product-info-alert__content'>
              <VISUALS.INFO className='ac-forms-product-info-alert__icon' />
              <div>
                <strong>Koppeling zoeken</strong>
                <br />
                <span className='ac-forms-product-info-alert__text'>
                  Weet je zeker dat de koppeling niet al bestaat? Ga naar de
                  zoekpagina en zoek op de naam van de applicatie.
                </span>
              </div>
            </div>
          </Alert>
        )}

        <div className='con-dynamic-form-container'>
          <div className='con-form-fields-container'>
            {/* Section 1: Applicatie - commented out for now */}
            {/* <h3 className='utrecht-heading-3' style={{ width: '100%' }}>
              Applicatie selecteren
            </h3>

            <ConSchemaEnhancedField
              schemaType='koppeling'
              schemaProperty='moduleA'
              value={ownApp?.value || null}
              onChange={(value) => {
                if (!value) {
                  setOwnApp(null);
                } else if (typeof value === 'object' && value.value !== undefined) {
                  setOwnApp(value);
                } else if (typeof value === 'string') {
                  const option = ownAppOptions.find(
                    (opt) => String(opt.value) === String(value)
                  );
                  setOwnApp(option || null);
                } else {
                  setOwnApp(null);
                }
              }}
              isDisabled={loading}
              isLoading={ownAppLoading}
              width='half'
              schemas={schemas}
              optionsProvider={(() => {
                if (ownApp?.value && ownApp?.label) {
                  const existsInOptions = ownAppOptions.some(
                    (opt) => String(opt.value) === String(ownApp.value)
                  );
                  if (!existsInOptions) {
                    return [ownApp, ...ownAppOptions];
                  }
                }
                return ownAppOptions;
              })()}
              onSearch={(_path, _refSlug, q) =>
                onSearchModules && onSearchModules(q)
              }
              customProps={{
                label: 'Applicatie A (uw applicatie)',
                placeholder: 'Selecteer een applicatie',
                isClearable: false,
                required: true,
              }}
            /> */}

            {/* Section 2: Leverancier */}
            <h3
              className='utrecht-heading-3'
              style={{ marginTop: '2rem', width: '100%' }}
            >
              {leverancierKeuze === 'bestaand'
                ? 'Leverancier selecteren'
                : 'Leverancier aanmaken'}
            </h3>

            {/* Existing leverancier dropdown */}
            {leverancierKeuze === 'bestaand' && (
              <>
                <ConSchemaEnhancedField
                  schemaType='dienst'
                  schemaProperty='aanbieder'
                  value={nieuweKoppeling.leverancier || null}
                  onChange={(value) => {
                    const nextId =
                      (value && value.data && (value.data.id || value.data.value)) ||
                      (value && value.value) ||
                      value;
                    // Also store the label for display in controleren stage
                    // The label is on value.label (from the option), or we can get the name from value.data
                    const nextLabel =
                      (value && value.label) ||
                      (value &&
                        value.data &&
                        (value.data.naam || value.data.name)) ||
                      '';
                    setNieuweKoppelingData('leverancier', nextId);
                    setNieuweKoppelingData('leverancierLabel', nextLabel);
                  }}
                  isDisabled={loading}
                  isLoading={leverancierLoading}
                  width='half'
                  schemas={schemas}
                  optionsProvider={leverancierOptions}
                  onSearch={(_path, _refSlug, q) =>
                    searchLeveranciers && searchLeveranciers(q || '')
                  }
                  customProps={{
                    label: 'Leverancier',
                    isClearable: true,
                    placeholder: 'Zoek en selecteer leverancier',
                    required: true,
                  }}
                />

                {!isEditMode && setLeverancierKeuze && (
                  <div style={{ alignSelf: 'end' }}>
                    <AcButton
                      style='button'
                      buttonType='secondary'
                      icon={<VISUALS.BUILDING />}
                      onClick={() => setLeverancierKeuze('nieuw')}
                    >
                      Ik kan de gewenste leverancier niet vinden
                    </AcButton>
                  </div>
                )}
              </>
            )}

            {/* New leverancier form fields */}
            {leverancierKeuze === 'nieuw' && setLeverancierOrganisatieData && (
              <>
                <ConSchemaEnhancedField
                  schemaType='organisatie'
                  schemaProperty='naam'
                  value={leverancierOrganisatie.naam || ''}
                  onChange={(value) => setLeverancierOrganisatieData('naam', value)}
                  isDisabled={loading}
                  width='half'
                  schemas={schemas}
                  customProps={{
                    required: true,
                  }}
                />

                <ConSchemaEnhancedField
                  schemaType='organisatie'
                  schemaProperty='website'
                  value={leverancierOrganisatie.website || ''}
                  onChange={(value) =>
                    setLeverancierOrganisatieData('website', value)
                  }
                  isDisabled={loading}
                  width='half'
                  customProps={{
                    inputType: 'text',
                    required: true,
                    validation: {
                      custom: (value) => {
                        if (!value || value.trim() === '') return true;
                        const website = value.trim();
                        return validateWebsite(website);
                      },
                      customErrorMessage:
                        'Website heeft een ongeldig formaat (bijv. conduction.nl, www.conduction.nl of https://conduction.nl)',
                    },
                  }}
                  schemas={schemas}
                />

                {setLeverancierKeuze && (
                  <AcButton
                    style='button'
                    buttonType='secondary'
                    icon={<VISUALS.ARROW_LEFT />}
                    onClick={() => setLeverancierKeuze('bestaand')}
                  >
                    Bestaande leverancier selecteren
                  </AcButton>
                )}
              </>
            )}

            {/* Section 3: Koppeling form (matching applicatie publiceren wizard) */}
            <h3
              className='utrecht-heading-3'
              style={{ marginTop: '2rem', width: '100%' }}
            >
              Koppeling
            </h3>

            {/* Legend */}
            <div
              style={{
                display: 'flex',
                gap: '1.5rem',
                padding: '0.75rem',
                backgroundColor: '#f9fafb',
                borderRadius: '4px',
                border: '1px solid #e5e7eb',
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    display: 'block',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                  }}
                />
                <span style={{ fontSize: '0.875rem' }}>Applicatie</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    display: 'block',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: '#3b82f6',
                  }}
                />
                <span style={{ fontSize: '0.875rem' }}>
                  Buiten Gemeentelijke Voorziening
                </span>
              </div>
            </div>

            <div
              className='ac-register-form-section'
              style={{
                padding: '1rem',
                border: '1px solid #e5e5e5',
                borderRadius: '6px',
                width: '100%',
              }}
            >
              {/* Grid: Applicatie A - Richting - Applicatie B - Naam */}
              <div
                className='ac-register-form-grid'
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: '1rem',
                }}
              >
                <div>
                  <label
                    className='utrecht-form-label'
                    htmlFor='koppeling-appA'
                    style={{ display: 'block' }}
                  >
                    Applicatie A
                    <span className='required-indicator' aria-hidden='true'>
                      *
                    </span>
                    <span className='sr-only'>(verplicht)</span>
                  </label>
                  <ReactSelect
                    isDisabled
                    className={clsx(
                      'ac-beheer-select',
                      'ac-beheer-select--disabled'
                    )}
                    value={
                      ownApp
                        ? { value: ownApp.value, label: ownApp.label }
                        : { value: '', label: 'Selecteer eerst een applicatie' }
                    }
                    placeholder='Selecteer applicatie A'
                    inputId='koppeling-appA'
                    aria-required='true'
                  />
                </div>
                <div>
                  <label
                    className='utrecht-form-label'
                    htmlFor='koppeling-richting'
                    style={{ display: 'block' }}
                  >
                    Richting
                    <span className='required-indicator' aria-hidden='true'>
                      *
                    </span>
                    <span className='sr-only'>(verplicht)</span>
                  </label>
                  <ReactSelect
                    className={clsx(
                      'ac-beheer-select',
                      loading && 'ac-beheer-select--disabled'
                    )}
                    options={directionOptions}
                    value={
                      nieuweKoppeling.richting
                        ? directionOptions.find(
                            (o) => o.value === nieuweKoppeling.richting
                          )
                        : null
                    }
                    onChange={(opt) =>
                      setNieuweKoppelingData('richting', opt?.value || '')
                    }
                    placeholder='Richting'
                    inputId='koppeling-richting'
                    aria-required='true'
                    isDisabled={loading}
                  />
                </div>
                <div>
                  <label
                    className='utrecht-form-label'
                    htmlFor='koppeling-appB'
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    Applicatie B of BGV
                    <span className='required-indicator' aria-hidden='true'>
                      *
                    </span>
                    <span className='sr-only'>(verplicht)</span>
                  </label>
                  <ReactSelect
                    className={clsx(
                      'ac-beheer-select',
                      (moduleBLoading || buitengemeentelijkeOptionsLoading) &&
                        'ac-beheer-select--disabled'
                    )}
                    isClearable
                    options={getMergedModuleBOptions()}
                    value={(() => {
                      const selected = nieuweKoppeling.moduleB;
                      if (selected == null) return null;
                      const mergedOptions = getMergedModuleBOptions();
                      let found = mergedOptions.find(
                        (o) => String(o.value) === String(selected)
                      );
                      if (!found) {
                        found = mergedOptions.find(
                          (o) => String(o.label) === String(selected)
                        );
                      }
                      return found || null;
                    })()}
                    onChange={(opt) => {
                      setNieuweKoppelingData('moduleB', opt?.value || null);
                      setNieuweKoppelingData('moduleBLabel', opt?.label || '');
                    }}
                    onInputChange={(inputValue, meta) => {
                      if (meta && meta.action === 'input-change') {
                        searchModuleB && searchModuleB(inputValue || '');
                      }
                      return inputValue;
                    }}
                    isLoading={moduleBLoading || buitengemeentelijkeOptionsLoading}
                    placeholder='Zoek en selecteer'
                    inputId='koppeling-appB'
                    aria-required='true'
                    isDisabled={loading}
                    styles={getSelectStyles()}
                  />
                </div>
                <div>
                  <label
                    className='utrecht-form-label'
                    htmlFor='koppeling-naam'
                    style={{ display: 'block' }}
                  >
                    Naam
                    <span className='required-indicator' aria-hidden='true'>
                      *
                    </span>
                    <span className='sr-only'>(verplicht)</span>
                  </label>
                  <Textbox
                    id='koppeling-naam'
                    value={nieuweKoppeling.naam || ''}
                    onChange={(e) =>
                      setNieuweKoppelingData('naam', e?.target?.value || '')
                    }
                    placeholder='Naam van de koppeling'
                    aria-required='true'
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </AcFlex>
    );
  }

  // Existing koppeling selection flow
  return (
    <AcFlex
      column
      spacing='sm'
      className='ac-register-form-section'
      role='group'
      aria-labelledby='koppeling-zoek-title'
    >
      <h2 id='koppeling-zoek-title' className='sr-only'>
        {isEditMode ? 'Koppeling bekijken' : 'Controleren op bestaande koppeling'}
      </h2>

      {!isEditMode && (
        <div>
          <Paragraph>
            Controleer eerst of de koppeling al bestaat. Dit kan op twee manieren:
          </Paragraph>
          <ul style={{ marginInlineStart: '1rem', marginTop: '0.5rem' }}>
            <li>
              Ga naar de betreffende applicatie en kijk onder het tabblad
              &quot;Koppelingen&quot; of de koppeling al aanwezig is.
            </li>
            <li>
              Ga naar de zoekpagina, zoek op de applicatie en gebruik de filter
              &quot;Koppelingen&quot; om te controleren of de koppeling daar al
              staat.
            </li>
          </ul>
        </div>
      )}

      {/* Closeable info alert */}
      {!isEditMode && showInfoAlert && (
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
              <strong>Zoekpagina</strong>
              <br />
              <span className='ac-forms-product-info-alert__text'>
                U kunt ook starten vanaf de zoekpagina. Open de detailpagina van de
                gevonden koppeling en kies &apos;Koppeling toevoegen&apos;.
              </span>
            </div>
          </div>
        </Alert>
      )}

      <div className='ac-register-form-grid'>
        <div style={{ gridColumn: 'span 2', maxWidth: '640px' }}>
          <ConSchemaEnhancedField
            schemaType='koppeling'
            schemaProperty='moduleA'
            value={ownApp?.value || null}
            onChange={(value) => {
              // ConSchemaEnhancedField returns the option object directly when using optionsProvider
              // Handle both object and string formats
              if (!value) {
                setOwnApp(null);
              } else if (typeof value === 'object' && value.value !== undefined) {
                // It's an option object with value property
                setOwnApp(value);
              } else if (typeof value === 'string') {
                // It's just the ID string, find the option
                const option = ownAppOptions.find(
                  (opt) => String(opt.value) === String(value)
                );
                setOwnApp(option || null);
              } else {
                setOwnApp(null);
              }
            }}
            isDisabled={loading}
            isLoading={ownAppLoading}
            width='full'
            schemas={schemas}
            optionsProvider={(() => {
              // Ensure the selected option is always in the options list
              // This handles the case where the option is prefilled but not yet in ownAppOptions
              if (ownApp?.value && ownApp?.label) {
                const existsInOptions = ownAppOptions.some(
                  (opt) => String(opt.value) === String(ownApp.value)
                );
                if (!existsInOptions) {
                  return [ownApp, ...ownAppOptions];
                }
              }
              return ownAppOptions;
            })()}
            onSearch={(_path, _refSlug, q) => onSearchModules && onSearchModules(q)}
            customProps={{
              label: 'Applicatie',
              placeholder: 'Selecteer een applicatie',
              isClearable: false,
              required: true,
            }}
          />
        </div>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <h3 className='utrecht-heading-4' style={{ marginBottom: '0.5rem' }}>
          {isEditMode
            ? 'Bestaande koppelingen'
            : ownApp?.value
            ? `Reeds bestaande koppelingen voor ${ownApp.label}`
            : 'Bestaande koppelingen'}
        </h3>
        {ownApp?.value && !isEditMode && (
          <Paragraph
            style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}
          >
            Hieronder ziet u alle koppelingen die al zijn geregistreerd voor de
            geselecteerde applicatie.
          </Paragraph>
        )}
        {!resultsLoading && searchResults.length ? (
          <div className='ac-register-review'>
            <div className='ac-register-review__section'>
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
              >
                {searchResults.map((k, i) => {
                  const koppelingId = k?.id || k?.['@self']?.id || String(i);
                  const isSelected = selectedKoppelingId === koppelingId;
                  const rels = k?.['@self']?.relations || {};
                  const aRel =
                    rels.moduleA ??
                    k.moduleA ??
                    k.applicatie1 ??
                    k.applicatieA ??
                    k.appA;
                  const bRel =
                    rels.moduleB ??
                    k.moduleB ??
                    rels.buitengemeentelijkVoorziening ??
                    k.buitengemeentelijkVoorziening ??
                    k.applicatie2 ??
                    k.applicatieB ??
                    k.appB;
                  const aId = extractRelationId(aRel);
                  const bId = extractRelationId(bRel);

                  const aNameFromObject =
                    typeof aRel === 'object'
                      ? aRel?.naam || aRel?.name || aRel?.title || aRel?.label
                      : undefined;
                  const bNameFromObject =
                    typeof bRel === 'object'
                      ? bRel?.naam || bRel?.name || bRel?.title || bRel?.label
                      : undefined;

                  const aLabel =
                    String(aNameFromObject || (aId ? idToLabel[aId] : '') || '') ||
                    (typeof aRel === 'string' ? String(aRel) : '-') ||
                    '-';
                  const bLabel =
                    String(bNameFromObject || (bId ? idToLabel[bId] : '') || '') ||
                    (typeof bRel === 'string' ? String(bRel) : '-') ||
                    '-';

                  const dir = getDirectionValue(k);
                  const dirArrow = arrowFor(dir);

                  const naam = String(
                    (k?.['@self']?.name || k?.naam || k?.name || k?.title || k?.label || '').toString()
                  ).trim();
                  const soortLabel = String(
                    k?.type ||
                      k?.soort ||
                      (k?.gegevensuitwisseling && k?.gegevensuitwisseling.soort) ||
                      ''
                  ).trim();
                  const statusLabel = String(k?.status || '').trim();
                  const beschrijving = String(
                    k?.beschrijvingKort || k?.beschrijving || k?.omschrijving || ''
                  ).trim();

                  return (
                    <div
                      key={koppelingId}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        outline: isSelected ? '2px solid #0063e5' : '1px solid #ddd',
                        borderRadius: '4px',
                        backgroundColor: isSelected ? '#f0f7ff' : 'transparent',
                        cursor: loading ? 'default' : 'pointer',
                      }}
                      onClick={() => {
                        if (!loading) {
                          setSelectedKoppelingId(isSelected ? null : koppelingId);
                        }
                      }}
                    >
                      <div style={{ marginTop: '0.25rem' }}>
                        <label
                          htmlFor={`koppeling-${koppelingId}`}
                          className='sr-only'
                        >
                          {naam
                            ? `Selecteer koppeling ${naam}, ${dir === 'BnaarA' ? `${bLabel} ${dirArrow} ${aLabel}` : `${aLabel} ${dirArrow} ${bLabel}`}${soortLabel ? `, type: ${soortLabel}` : ''}`
                            : `Selecteer koppeling ${dir === 'BnaarA' ? `${bLabel} ${dirArrow} ${aLabel}` : `${aLabel} ${dirArrow} ${bLabel}`}${soortLabel ? `, type: ${soortLabel}` : ''}`}
                        </label>
                        <AcCheckbox
                          id={`koppeling-${koppelingId}`}
                          value={koppelingId}
                          checked={isSelected}
                          onChange={(checked) => {
                            if (!loading) {
                              setSelectedKoppelingId(checked ? koppelingId : null);
                            }
                          }}
                          disabled={loading}
                        />
                      </div>
                      <div style={{ flex: 1, marginLeft: '0.5rem' }}>
                        {naam && (
                          <div style={{ marginBottom: '0.25rem' }}>
                            <strong>{naam}</strong>
                          </div>
                        )}
                        <div>
                          {dir === 'BnaarA' ? (
                            <>
                              <ConUuidResolver>{bLabel}</ConUuidResolver> {dirArrow}{' '}
                              <ConUuidResolver>{aLabel}</ConUuidResolver>
                            </>
                          ) : (
                            <>
                              <ConUuidResolver>{aLabel}</ConUuidResolver> {dirArrow}{' '}
                              <ConUuidResolver>{bLabel}</ConUuidResolver>
                            </>
                          )}
                          {soortLabel ? ` (${soortLabel})` : ''}
                        </div>
                        {(statusLabel || beschrijving) && (
                          <div
                            style={{
                              color: '#666',
                              fontSize: '0.9rem',
                              marginTop: '0.25rem',
                            }}
                          >
                            {statusLabel && <div>Status: {statusLabel}</div>}
                            {beschrijving && <div>Beschrijving: {beschrijving}</div>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : resultsLoading ? (
          <Paragraph>Bezig met laden…</Paragraph>
        ) : (
          <Paragraph>
            {ownApp?.value
              ? `Geen bestaande koppelingen gevonden voor ${ownApp.label}. U kunt deze zelf toevoegen via de knop 'Ik kan de gewenste koppeling niet vinden'.`
              : 'Selecteer eerst een applicatie om bestaande koppelingen te bekijken.'}
          </Paragraph>
        )}
      </div>
    </AcFlex>
  );
};

export default ConKoppelingStageZoeken;

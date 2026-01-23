import React, { useState, memo, useEffect } from 'react';
import clsx from 'clsx';
import { AcButton } from '@src/molecules';
import { VISUALS } from '@src/constants';
import {
  Paragraph,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Textbox,
  Alert,
} from '@utrecht/component-library-react/dist/css-module';
import ReactSelect from 'react-select';

/**
 * Applicatie Versie Stage Component
 *
 * This stage manages version information for the applicatie.
 *
 * @param {Object} applicatie - The applicatie object containing form data
 * @param {Function} setApplicatieData - Function to update applicatie data
 * @param {boolean} loading - Loading state indicator
 * @param {Object} schemas - Available schemas for field configuration
 */
const ConFormApplicatieVersieStage = memo(
  ({ applicatie, setApplicatieData, loading, schemas }) => {
    // State for controlling alert visibility - persists until page refresh
    const [showInfoAlert, setShowInfoAlert] = useState(() => {
      // Check if alert was previously closed in this session
      return !sessionStorage.getItem('applicatie-versie-info-alert-closed');
    });

    // Handle closing the alert and remember the choice
    const handleCloseAlert = () => {
      setShowInfoAlert(false);
      sessionStorage.setItem('applicatie-versie-info-alert-closed', 'true');
    };

    // Get moduleVersie schema for status options and defaults
    const moduleVersieSchema = schemas?.moduleversie;
    const statusOptions =
      moduleVersieSchema?.properties?.status?.enum?.map((status) => ({
        value: status,
        label:
          typeof status === 'string' && status.length > 0
            ? status.charAt(0).toUpperCase() + status.slice(1)
            : status,
      })) || [];

    // Extract default values from schema
    const getSchemaDefaults = () => {
      const defaults = {};
      if (moduleVersieSchema?.properties) {
        Object.entries(moduleVersieSchema.properties).forEach(([key, property]) => {
          if (property.default !== undefined) {
            defaults[key] = property.default;
          }
          // Also check for examples as fallback defaults
          if (property.example !== undefined && defaults[key] === undefined) {
            defaults[key] = property.example;
          }
        });
      }
      return defaults;
    };

    const schemaDefaults = getSchemaDefaults();

    // Initialize moduleVersies with one default version if empty
    // This ensures at least one version exists when the component mounts
    useEffect(() => {
      if (!Array.isArray(applicatie?.moduleVersies) || applicatie.moduleVersies.length === 0) {
        setApplicatieData('moduleVersies', [{ ...schemaDefaults }]);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount - we intentionally want this to run once

    // Get current versions array or initialize with one default version
    const getVersions = () => {
      return Array.isArray(applicatie?.moduleVersies) &&
        applicatie.moduleVersies.length > 0
        ? applicatie.moduleVersies
        : [{ ...schemaDefaults }];
    };

    // Update a specific version field
    const updateVersieAt = (versionIndex, field, value) => {
      const currentVersions = getVersions();
      const updatedVersions = [...currentVersions];
      if (!updatedVersions[versionIndex]) {
        updatedVersions[versionIndex] = { ...schemaDefaults };
      }
      updatedVersions[versionIndex] = {
        ...updatedVersions[versionIndex],
        [field]: value,
      };
      setApplicatieData('moduleVersies', updatedVersions);
    };

    // Add a new version row
    const addVersie = () => {
      const currentVersions = getVersions();
      const updatedVersions = [...currentVersions, { ...schemaDefaults }];
      setApplicatieData('moduleVersies', updatedVersions);
    };

    // Remove a version row
    const removeVersie = (versionIndex) => {
      const currentVersions = getVersions();
      if (currentVersions.length <= 1) return;
      const updatedVersions = [...currentVersions];
      updatedVersions.splice(versionIndex, 1);
      setApplicatieData('moduleVersies', updatedVersions);
    };

    const versions = getVersions();

    return (
      <div
        className='ac-register-form-section'
        role='group'
        aria-labelledby='versie-section-title'
      >
        <h2 id='versie-section-title' className='sr-only'>
          Laat weten welke versies er zijn
        </h2>
        <Paragraph className='con-form-wizard-paragraph'>
          Versie-informatie laat zien hoe actueel uw applicatie is. Gemeenten
          gebruiken deze informatie voor beheer, planning en impactanalyses. Vermeld
          het versienummer en de status.
        </Paragraph>

        {/* Closeable info alert about updating versie details later */}
        {showInfoAlert && (
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
                <span className='ac-forms-product-info-alert__text'>
                  Hier vult u de basisinformatie in over de on-premise versie van uw
                  applicatie. Voor gehoste applicaties wordt een default versie
                  aangemaakt. Na het opslaan kunt u op de detailpagina van elke
                  versie extra informatie toevoegen. Deze vindt u onder het tabblad
                  &quot;Versies&quot; van uw applicatie.
                </span>
              </div>
            </div>
          </Alert>
        )}

        <div className='con-form-wizard-table-container'>
          <h3>Versie informatie</h3>
          <Table>
            <thead>
              <TableRow>
                <TableCell>
                  <b>Versie</b>
                </TableCell>
                <TableCell>
                  <b>Status</b>
                </TableCell>
                <TableCell>
                  <b>Acties</b>
                </TableCell>
              </TableRow>
            </thead>
            <TableBody>
              {versions.map((versie, vIdx) => (
                <TableRow key={`v-${vIdx}`}>
                  <TableCell>
                    <Textbox
                      value={versie.versie ?? schemaDefaults.versie ?? ''}
                      onChange={(e) =>
                        updateVersieAt(vIdx, 'versie', e.target.value)
                      }
                      placeholder={
                        schemaDefaults.versie ||
                        moduleVersieSchema?.properties?.versie?.example ||
                        '1.0.0'
                      }
                      disabled={loading}
                    />
                  </TableCell>
                  <TableCell>
                    <ReactSelect
                      className={clsx(
                        'ac-beheer-select',
                        loading && 'ac-beheer-select--disabled'
                      )}
                      value={
                        statusOptions.find(
                          (opt) =>
                            opt.value === (versie.status || schemaDefaults.status)
                        ) || null
                      }
                      onChange={(opt) =>
                        updateVersieAt(vIdx, 'status', opt?.value || null)
                      }
                      options={statusOptions}
                      isDisabled={loading}
                      placeholder={schemaDefaults.status || 'Selecteer status'}
                    />
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <AcButton
                        style='button'
                        buttonType='secondary'
                        icon={<VISUALS.TRASHCAN />}
                        disabled={versions.length <= 1 || loading}
                        onClick={() => removeVersie(vIdx)}
                        title='Versie verwijderen'
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div style={{ marginTop: '1rem' }}>
            <AcButton
              style='button'
              icon={<VISUALS.PLUS />}
              onClick={addVersie}
              disabled={loading}
            >
              Rij toevoegen
            </AcButton>
          </div>
        </div>
      </div>
    );
  }
);

ConFormApplicatieVersieStage.displayName = 'ConFormApplicatieVersieStage';

export default ConFormApplicatieVersieStage;

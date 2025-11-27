import React, { memo } from 'react';
import clsx from 'clsx';
import {
  Paragraph,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Textbox,
} from '@utrecht/component-library-react/dist/css-module';
import ReactSelect from 'react-select';

/**
 * Gebruik Versie Creation Stage Component
 *
 * This stage manages version information for a new applicatie in the gebruik wizard.
 * Based on con-form-applicatie-versie-stage.js but adapted for nieuweApplicatie.
 *
 * @param {Object} nieuweApplicatie - The nieuweApplicatie object containing form data
 * @param {Function} setNieuweApplicatieData - Function to update nieuweApplicatie data
 * @param {boolean} loading - Loading state indicator
 * @param {Object} schemas - Available schemas for field configuration
 */
const ConGebruikStepVersieCreate = memo(
  ({ nieuweApplicatie, setNieuweApplicatieData, loading, schemas }) => {
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

    // Get current version or initialize with default version (only one version allowed)
    const getVersie = () => {
      return Array.isArray(nieuweApplicatie?.moduleVersies) &&
        nieuweApplicatie.moduleVersies.length > 0
        ? nieuweApplicatie.moduleVersies[0]
        : { ...schemaDefaults };
    };

    // Update version field (only one version allowed)
    const updateVersie = (field, value) => {
      const currentVersie = getVersie();
      const updatedVersie = {
        ...currentVersie,
        [field]: value,
      };
      setNieuweApplicatieData('moduleVersies', [updatedVersie]);
    };

    const versie = getVersie();

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
          Versie-informatie laat zien hoe actueel is. Gemeenten gebruiken deze
          informatie planning en impactanalyses. Vermeld het en de status. uw
          applicatie voor beheer, versienummer.
        </Paragraph>

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
              </TableRow>
            </thead>
            <TableBody>
              <TableRow>
                <TableCell>
                  <Textbox
                    value={versie.versie ?? schemaDefaults.versie ?? ''}
                    onChange={(e) => updateVersie('versie', e.target.value)}
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
                    onChange={(opt) => updateVersie('status', opt?.value || null)}
                    options={statusOptions}
                    isDisabled={loading}
                    placeholder={schemaDefaults.status || 'Selecteer status'}
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }
);

ConGebruikStepVersieCreate.displayName = 'ConGebruikStepVersieCreate';

export default ConGebruikStepVersieCreate;

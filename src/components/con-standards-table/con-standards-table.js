import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Link,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  Separator,
} from '@utrecht/component-library-react/dist/css-module';
import { AcCheckbox, AcFormField } from '@src/molecules';
import { LogoUploadField } from '@views/ac-beheer/shared/components/con-logo-upload-field';
import { ConStandardsResolver } from '@components';
import { VISUALS } from '@constants';
import { handleFileClick } from '@utils';
import { commongroundApiUrl } from '@config';
import { validateWebsite } from '@src/views/ac-forms/validation/form-validations';

/**
 * Reusable Standards Table Component
 *
 * This component displays standards from referentieComponenten with their compliance status.
 * It can be used both in publication pages and beheer module details pages.
 *
 * @param {Object} props
 * @param {Array} props.referentieComponenten - Array of referentieComponent IDs
 * @param {Array} props.complianceStandards - Array of compliance standards with evidence
 * // @param {boolean} props.enableScrolling - Whether to enable scrolling for 5+ standards (default: true)
 * @param {string} props.noStandardsMessage - Custom message when no standards found
 * @param {Object} props.containerStyle - Additional styles for the container
 * @param {Function} props.onStandardsCountChange - Callback when standards count changes
 * @param {Array} props.standards - Optional: Pre-fetched standards data (if provided, won't fetch internally)
 * @param {Array} props.referentieComponentenWithStandards - Optional: Pre-fetched referentieComponenten data
 * @param {boolean} props.loading - Optional: Loading state when using external data
 * @param {Function} props.onReferentieComponentenChange - Callback when referentieComponenten data changes
 */
const ConStandardsTable = ({
  referentieComponenten = [],
  complianceStandards = [],
  // enableScrolling = true,
  noStandardsMessage = 'Geen standaarden gevonden voor de gekoppelde referentiecomponenten.',
  containerStyle = {},
  onStandardsCountChange,
  standards: externalStandards,
  referentieComponentenWithStandards: externalReferentieComponentenWithStandards,
  loading: externalLoading = false,
  onReferentieComponentenChange,
  isEditing = false,
  onComplianceChange,
  disabled = false, // New prop for disabling interactions during save
}) => {
  // Standards state for resolving compliance standards
  const [standards, setStandards] = useState([]);
  const [standardsLoading, setStandardsLoading] = useState(false);

  // State for referentieComponenten data with standards
  const [referentieComponentenWithStandards, setReferentieComponentenWithStandards] =
    useState([]);

  // Fetch referentieComponenten data with their standards
  const fetchReferentieComponentenWithStandards = useCallback(async () => {
    if (!referentieComponenten?.length) {
      setReferentieComponentenWithStandards([]);
      return;
    }

    console.info('📋 Fetching referentieComponenten with standards data...');

    try {
      const queryParams = new URLSearchParams({
        _limit: '500',
        _page: '1',
        gemmaType: 'Referentiecomponent',
        '_extend[]': '@self.schema',
      });

      // Fetch referentieComponenten from openconnector endpoint
      const response = await fetch(
        `${commongroundApiUrl()}/openconnector/api/endpoint/elements?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error('Error fetching referentieComponenten:', response.statusText);
        return;
      }

      const data = await response.json();
      const allReferentieComponenten = data.results || data;

      // Filter to only the referentieComponenten that are used in this object
      const objectReferentieComponenten = referentieComponenten
        .map((refId) => {
          const refData = allReferentieComponenten.find(
            (ref) =>
              String(ref.id) === String(refId) ||
              String(ref.value) === String(refId) ||
              String(ref.slug) === String(refId)
          );

          if (refData) {
            return {
              id: refId,
              naam:
                refData?.xml?.name?._value ||
                refData?.naam ||
                refData?.name ||
                refData?.title ||
                refData?.label ||
                refId,
              moduleId: 0, // For publication view, we don't have specific modules
              applicatieId: 0,
              // Extract standards from the API data
              aanbevolenStandaarden: refData.aanbevolenStandaarden || [],
              verplichteStandaarden: refData.verplichteStandaarden || [],
              // Store the full API data for future use
              fullData: refData,
            };
          }
          return null;
        })
        .filter(Boolean);

      setReferentieComponentenWithStandards(objectReferentieComponenten);
      console.info(
        `✅ Loaded ${objectReferentieComponenten?.length} referentieComponenten with standards data`
      );
    } catch (error) {
      console.warn(
        '⚠️ Failed to fetch referentieComponenten with standards:',
        error
      );
      setReferentieComponentenWithStandards([]);
    }
  }, [referentieComponenten]);

  // Fetch standards from openconnector endpoint
  const fetchStandards = useCallback(async () => {
    setStandardsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        _limit: '500',
        _page: '1',
        gemmaType: 'Standaard',
      });

      console.info('📋 Fetching standards from openconnector endpoint...');

      // Fetch standards from openconnector endpoint using normal fetch
      const response = await fetch(
        `${commongroundApiUrl()}/openconnector/api/endpoint/elements?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error(
          'Error fetching openconnector standards:',
          response.statusText
        );
        return;
      }

      const data = await response.json();
      const fetchedStandards = data.results || data;

      setStandards(fetchedStandards);
      console.info(
        `✅ Loaded ${fetchedStandards?.length} standards for standards table`
      );
    } catch (error) {
      console.warn('⚠️ Failed to fetch standards:', error);
      setStandards([]);
    } finally {
      setStandardsLoading(false);
    }
  }, []);

  // Use external data if provided, otherwise use internal state
  const effectiveStandards = externalStandards || standards;
  const effectiveReferentieComponentenWithStandards =
    externalReferentieComponentenWithStandards || referentieComponentenWithStandards;
  const effectiveLoading = externalLoading || standardsLoading;

  // Only fetch data if external data is not provided
  const shouldFetchData =
    !externalStandards && !externalReferentieComponentenWithStandards;

  useEffect(() => {
    if (shouldFetchData) {
      fetchStandards();
      fetchReferentieComponentenWithStandards();
    }
  }, [shouldFetchData, fetchStandards, fetchReferentieComponentenWithStandards]);

  // Helper function to get all standards from referentieComponenten data
  const getAllStandardsFromReferentieComponenten = (
    referentieComponentenWithStandards
  ) => {
    if (!referentieComponentenWithStandards?.length) return [];

    const allStandards = [];

    referentieComponentenWithStandards.forEach((refComp) => {
      // Add verplichte standaarden
      if (
        refComp.verplichteStandaarden &&
        Array.isArray(refComp.verplichteStandaarden)
      ) {
        refComp.verplichteStandaarden.forEach((standard) => {
          const standardId =
            typeof standard === 'string'
              ? standard
              : standard?.id ||
                standard?.value ||
                standard?.slug ||
                standard?.naam ||
                standard?.name;

          if (standardId && !allStandards.find((s) => s.id === standardId)) {
            allStandards.push({
              id: standardId,
              type: 'VERPLICHT',
              referentieComponent: refComp.naam || `Component ${refComp.id}`,
            });
          }
        });
      }

      // Add aanbevolen standaarden
      if (
        refComp.aanbevolenStandaarden &&
        Array.isArray(refComp.aanbevolenStandaarden)
      ) {
        refComp.aanbevolenStandaarden.forEach((standard) => {
          const standardId =
            typeof standard === 'string'
              ? standard
              : standard?.id ||
                standard?.value ||
                standard?.slug ||
                standard?.naam ||
                standard?.name;

          if (standardId) {
            const existingStandard = allStandards.find((s) => s.id === standardId);
            if (existingStandard) {
              // If already exists as VERPLICHT, keep it as VERPLICHT
              if (existingStandard.type !== 'VERPLICHT') {
                existingStandard.type = 'AANBEVOLEN';
              }
            } else {
              allStandards.push({
                id: standardId,
                type: 'AANBEVOLEN',
                referentieComponent: refComp.naam || `Component ${refComp.id}`,
              });
            }
          }
        });
      }
    });

    return allStandards;
  };

  // Get all standards from referentieComponenten using the helper function
  const allReferentieStandards = getAllStandardsFromReferentieComponenten(
    effectiveReferentieComponentenWithStandards
  );

  // Get IDs of standards from referentieComponenten
  const referentieStandardIds = useMemo(() => {
    return new Set(allReferentieStandards.map((s) => String(s.id)));
  }, [allReferentieStandards]);

  // Find "toegevoegd" (added) standards - standards in complianceStandards but not in referentieComponenten
  const toegevoegdeStandards = useMemo(() => {
    if (!complianceStandards || complianceStandards.length === 0) {
      return [];
    }

    return complianceStandards
      .filter((cs) => {
        const standardId = String(cs.standaardversie);
        // Also check if this standard might be using a different identifier format
        // by looking it up in effectiveStandards and checking if any of its identifiers
        // match a referentie standard
        const standardData = effectiveStandards?.find(
          (s) =>
            String(s.id) === standardId ||
            String(s.identifier) === standardId ||
            String(s.value) === standardId
        );

        if (standardData) {
          // Check all possible identifier formats
          const possibleIds = [
            String(standardData.id),
            String(standardData.identifier),
            String(standardData.value),
            String(standardData.uuid),
          ].filter(Boolean);

          // If any of these IDs match a referentie standard, it's not toegevoegd
          return !possibleIds.some((id) => referentieStandardIds.has(id));
        }

        // If we can't find the standard data, just check the direct ID
        return !referentieStandardIds.has(standardId);
      })
      .map((cs) => {
        // Find the standard data to get the identifier that ConStandardsResolver will use
        const standardData = effectiveStandards?.find(
          (s) =>
            String(s.id) === String(cs.standaardversie) ||
            String(s.identifier) === String(cs.standaardversie) ||
            String(s.value) === String(cs.standaardversie)
        );

        // Use the identifier that ConStandardsResolver will match on
        const resolverIdentifier =
          standardData?.identifier ||
          standardData?.id ||
          standardData?.value ||
          cs.standaardversie;

        return {
          id: resolverIdentifier,
          type: 'TOEGEVOEGD',
          referentieComponent: 'Extra toegevoegd',
        };
      });
  }, [complianceStandards, referentieStandardIds, effectiveStandards]);

  // Combine referentie standards with toegevoegde standards
  const allStandards = useMemo(() => {
    return [...allReferentieStandards, ...toegevoegdeStandards];
  }, [allReferentieStandards, toegevoegdeStandards]);

  // Notify parent component when standards count changes
  useEffect(() => {
    if (onStandardsCountChange) {
      onStandardsCountChange(allStandards.length);
    }
  }, [allStandards.length, onStandardsCountChange]);

  // Notify parent component when referentieComponenten data changes
  useEffect(() => {
    if (
      onReferentieComponentenChange &&
      effectiveReferentieComponentenWithStandards
    ) {
      onReferentieComponentenChange(effectiveReferentieComponentenWithStandards);
    }
  }, [effectiveReferentieComponentenWithStandards, onReferentieComponentenChange]);

  // Functions for editing mode
  const toggleCompliance = useCallback(
    (standardId, isCompliant) => {
      if (!isEditing || !onComplianceChange) return;

      const currentCompliancy = complianceStandards || [];
      let newCompliancy;

      if (isCompliant) {
        // Add or update compliancy
        const existingIndex = currentCompliancy.findIndex(
          (c) => c.standaardversie === standardId
        );

        // Find the standard name and objectId for display
        const standard = allStandards.find((s) => s.id === standardId);
        const standardName = standard
          ? effectiveStandards?.find(
              (s) => s.id === standardId || s.identifier === standardId
            )?.name || standard.id
          : standardId;

        // Find the objectId from the effectiveStandards data
        const standardData = effectiveStandards?.find(
          (s) => s.id === standardId || s.identifier === standardId
        );
        const objectId = standardData?.id || standardData?.objectId || null;

        const compliancyObject = {
          standaardversie: standardId,
          standaardGemma: objectId,
          standaardnaam: standardName,
          bewijs: null,
          bewijsFilename: null,
          url: null,
        };

        if (existingIndex >= 0) {
          newCompliancy = [...currentCompliancy];
          newCompliancy[existingIndex] = compliancyObject;
        } else {
          newCompliancy = [...currentCompliancy, compliancyObject];
        }
      } else {
        // Remove compliancy
        newCompliancy = currentCompliancy.filter(
          (c) => c.standaardversie !== standardId
        );
      }

      onComplianceChange(newCompliancy);
    },
    [
      isEditing,
      onComplianceChange,
      complianceStandards,
      allStandards,
      effectiveStandards,
    ]
  );

  const updateBewijs = useCallback(
    (standardId, bewijs) => {
      if (!isEditing || !onComplianceChange) return;

      const currentCompliancy = complianceStandards || [];
      const newCompliancy = currentCompliancy.map((c) =>
        c.standaardversie === standardId
          ? { ...c, bewijs, url: null, bewijsFilename: c.bewijsFilename } // Clear URL when file is uploaded (mutually exclusive)
          : c
      );

      onComplianceChange(newCompliancy);
    },
    [isEditing, onComplianceChange, complianceStandards]
  );

  const updateUrl = useCallback(
    (standardId, url) => {
      if (!isEditing || !onComplianceChange) return;

      const currentCompliancy = complianceStandards || [];
      const newCompliancy = currentCompliancy.map((c) =>
        c.standaardversie === standardId
          ? { ...c, url, bewijs: null, bewijsFilename: null } // Clear file when URL is set (mutually exclusive)
          : c
      );

      onComplianceChange(newCompliancy);
    },
    [isEditing, onComplianceChange, complianceStandards]
  );

  const updateBewijsFilename = useCallback(
    (standardId, filename) => {
      if (!isEditing || !onComplianceChange) return;

      const currentCompliancy = complianceStandards || [];
      const newCompliancy = currentCompliancy.map((c) =>
        c.standaardversie === standardId ? { ...c, bewijsFilename: filename } : c
      );

      onComplianceChange(newCompliancy);
    },
    [isEditing, onComplianceChange, complianceStandards]
  );

  const clearBewijs = useCallback(
    (standardId) => {
      if (!isEditing || !onComplianceChange) return;

      const currentCompliancy = complianceStandards || [];
      const newCompliancy = currentCompliancy.map((c) =>
        c.standaardversie === standardId
          ? { ...c, bewijs: null, bewijsFilename: null, url: null }
          : c
      );

      onComplianceChange(newCompliancy);
    },
    [isEditing, onComplianceChange, complianceStandards]
  );

  if (effectiveLoading) {
    return <p>Standaarden laden...</p>;
  }

  if (!allStandards || allStandards.length === 0) {
    return (
      <p style={{ padding: '16px', color: '#6c757d', fontStyle: 'italic' }}>
        {noStandardsMessage}
      </p>
    );
  }

  // const shouldScroll = enableScrolling && allStandards.length > 5;

  return (
    <div
      style={{
        // maxHeight: shouldScroll ? '500px' : 'auto',
        // overflowY: shouldScroll ? 'auto' : 'visible',
        // overflowX: 'hidden',
        // border: shouldScroll ? '1px solid #e9ecef' : 'none',
        // borderRadius: shouldScroll ? '4px' : '0',
        width: '100%',
        ...containerStyle,
      }}
    >
      <Table style={{ width: '100%', tableLayout: 'fixed' }}>
        <TableHeader>
          <TableRow>
            <TableCell
              style={{
                fontWeight: 'bold',
                backgroundColor: '#f8f9fa',
                paddingLeft:
                  'var(--utrecht-table-cell-padding-inline-end) !important',
                // position: shouldScroll ? 'sticky' : 'static',
                // top: shouldScroll ? '0' : 'auto',
                // zIndex: shouldScroll ? '10' : 'auto',
                width: '50%',
              }}
            >
              Standaard
            </TableCell>
            <TableCell
              style={{
                fontWeight: 'bold',
                backgroundColor: '#f8f9fa',
                // position: shouldScroll ? 'sticky' : 'static',
                // top: shouldScroll ? '0' : 'auto',
                // zIndex: shouldScroll ? '10' : 'auto',
                width: '25%',
              }}
            >
              {isEditing ? 'Ondersteund' : 'Status'}
            </TableCell>
            <TableCell
              style={{
                fontWeight: 'bold',
                backgroundColor: '#f8f9fa',
                // position: shouldScroll ? 'sticky' : 'static',
                // top: shouldScroll ? '0' : 'auto',
                // zIndex: shouldScroll ? '10' : 'auto',
                width: '25%',
              }}
            >
              Bewijs
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(() => {
            // Group standards by type
            const verplichtStandards = allStandards.filter(
              (s) => s.type === 'VERPLICHT'
            );
            const aanbevolenStandards = allStandards.filter(
              (s) => s.type === 'AANBEVOLEN'
            );
            const toegevoegdStandards = allStandards.filter(
              (s) => s.type === 'TOEGEVOEGD'
            );

            const renderStandardRow = (refStandard, idx) => {
              // Check if this standard is in the complianceStandards array
              const complianceStandard = complianceStandards?.find(
                (cs) => cs.standaardversie === refStandard.id
              );
              const hasBewijs = !!complianceStandard?.bewijs;
              const hasUrl = !!complianceStandard?.url;
              const isCompliant = hasBewijs || hasUrl;
              const isOndersteund = !!complianceStandard && !hasBewijs && !hasUrl;

              // Find the actual standard object to get its real ID
              const actualStandard = effectiveStandards?.find(
                (standard) =>
                  standard.identifier === refStandard.id ||
                  standard.id === refStandard.id ||
                  standard.objectId === refStandard.id
              );

              // Use the actual standard's ID, fallback to refStandard.id if not found
              const standardObjectId = actualStandard?.id || refStandard.id;

              return (
                <TableRow key={`${refStandard.type}-${idx}`}>
                  <TableCell
                    style={{
                      alignContent: 'center',
                      paddingLeft:
                        'var(--utrecht-table-cell-padding-inline-end) !important',
                      width: '50%',
                      wordWrap: 'break-word',
                      overflow: 'hidden',
                    }}
                  >
                    <div>
                      <Link
                        href={`https://www.gemmaonline.nl/wiki/GEMMA/id-${standardObjectId}`}
                        target='_blank'
                      >
                        <ConStandardsResolver
                          standardId={refStandard.id}
                          standards={effectiveStandards}
                        />
                      </Link>
                      <div style={{ marginTop: '4px' }}>
                        <span
                          key={`${refStandard.type}-${idx}`}
                          className={`con-standaard-badge con-standaard-badge--${refStandard.type.toLowerCase()}`}
                        >
                          {refStandard.type}
                        </span>
                      </div>
                      <div
                        style={{
                          marginTop: '4px',
                          fontSize: '0.75rem',
                          color: '#6c757d',
                          wordWrap: 'break-word',
                        }}
                      >
                        {refStandard.referentieComponent}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell
                    style={{
                      alignContent: 'center',
                      width: '25%',
                      overflow: 'hidden',
                    }}
                  >
                    {isEditing ? (
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <AcCheckbox
                          checked={isCompliant}
                          onChange={(checked) =>
                            toggleCompliance(refStandard.id, checked)
                          }
                          disabled={disabled}
                          label=''
                        />
                      </div>
                    ) : (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: '#fff',
                          backgroundColor: isCompliant
                            ? '#28a745'
                            : isOndersteund
                            ? '#ffc107'
                            : refStandard.type === 'VERPLICHT'
                            ? '#dc3545'
                            : '#6c757d',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          display: 'inline-block',
                          lineHeight: '1.2',
                          margin: '0px',
                          marginBlockStart: '0px',
                          marginBlockEnd: '0px',
                          marginInlineStart: '0px',
                          marginInlineEnd: '0px',
                        }}
                      >
                        {isCompliant
                          ? 'COMPLIANT'
                          : isOndersteund
                          ? 'ONDERSTEUND'
                          : 'NON-COMPLIANT'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell
                    style={{
                      alignContent: 'center',
                      width: '25%',
                      overflow: 'hidden',
                    }}
                  >
                    {isEditing ? (
                      // Show file upload or URL input when editing and compliant/ondersteund
                      isCompliant || isOndersteund ? (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                          }}
                        >
                          <LogoUploadField
                            fieldConfig={{
                              label: '',
                              filename: complianceStandard?.bewijs
                                ? 'Bestand geüpload'
                                : '',
                            }}
                            _value={complianceStandard?.bewijs || ''}
                            onChange={(dataUrl) =>
                              updateBewijs(refStandard.id, dataUrl)
                            }
                            onChangeFileName={(filename) =>
                              updateBewijsFilename(refStandard.id, filename)
                            }
                            onClear={() => clearBewijs(refStandard.id)}
                            accept={[
                              '.pdf',
                              '.jpg',
                              '.jpeg',
                              '.png',
                              '.doc',
                              '.docx',
                            ]}
                            showPreview={false}
                            validation={{ required: false }}
                            propertyName={`bewijs-${refStandard.id}`}
                            size='small'
                            isDisabled={disabled || !!complianceStandard?.url}
                          />
                          <Separator />
                          <div>
                            <AcFormField
                              placeholder='https://...'
                              value={complianceStandard?.url || ''}
                              type='url'
                              onChange={(e) => updateUrl(refStandard.id, e)}
                              disabled={disabled || !!complianceStandard?.bewijs}
                              className='ac-register-form-field__no-width-limit'
                              hasError={validateWebsite(complianceStandard?.url)}
                            />
                            {complianceStandard?.url &&
                              (!complianceStandard?.url ||
                                !validateWebsite(complianceStandard?.url)) && (
                                <span className='ac-register-form-field-error'>
                                  {complianceStandard?.url &&
                                    !validateWebsite(complianceStandard?.url) &&
                                    'URL heeft een ongeldig formaat'}
                                </span>
                              )}
                          </div>
                        </div>
                      ) : (
                        <span
                          style={{
                            display: 'flex',
                            justifyContent: 'left',
                          }}
                        >
                          -
                        </span>
                      )
                    ) : // Always show download button when not editing
                    hasBewijs ? (
                      <Link
                        href='#'
                        onClick={(e) => {
                          e.preventDefault();
                          handleFileClick(complianceStandard.bewijs);
                        }}
                        style={{
                          display: 'flex',
                          justifyContent: 'left',
                          cursor: 'pointer',
                        }}
                        title='Download bewijs bestand'
                      >
                        <VISUALS.DOWNLOAD />
                      </Link>
                    ) : hasUrl ? (
                      <Link
                        href={complianceStandard.url}
                        target='_blank'
                        rel='noopener noreferrer'
                        style={{
                          display: 'flex',
                          justifyContent: 'left',
                          cursor: 'pointer',
                        }}
                        title={`Open bewijs URL: ${complianceStandard.url}`}
                      >
                        <VISUALS.EXTERNAL_LINK />
                      </Link>
                    ) : (
                      <span
                        style={{
                          display: 'flex',
                          justifyContent: 'left',
                        }}
                      >
                        -
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            };

            const rows = [];

            // Verplicht section
            if (verplichtStandards.length > 0) {
              rows.push(
                <TableRow key='header-verplicht'>
                  <TableCell
                    colSpan={3}
                    style={{
                      fontWeight: 'bold',
                      backgroundColor: '#f8f9fa',
                      padding: '12px',
                    }}
                  >
                    Verplicht
                  </TableCell>
                </TableRow>
              );
              verplichtStandards.forEach((standard, idx) => {
                rows.push(renderStandardRow(standard, idx));
              });
            }

            // Aanbevolen section
            if (aanbevolenStandards.length > 0) {
              rows.push(
                <TableRow key='header-aanbevolen'>
                  <TableCell
                    colSpan={3}
                    style={{
                      fontWeight: 'bold',
                      backgroundColor: '#f8f9fa',
                      padding: '12px',
                    }}
                  >
                    Aanbevolen
                  </TableCell>
                </TableRow>
              );
              aanbevolenStandards.forEach((standard, idx) => {
                rows.push(renderStandardRow(standard, idx));
              });
            }

            // Toegevoegd section
            if (toegevoegdStandards.length > 0) {
              rows.push(
                <TableRow key='header-toegevoegd'>
                  <TableCell
                    colSpan={3}
                    style={{
                      fontWeight: 'bold',
                      backgroundColor: '#f8f9fa',
                      padding: '12px',
                    }}
                  >
                    Toegevoegd
                  </TableCell>
                </TableRow>
              );
              toegevoegdStandards.forEach((standard, idx) => {
                rows.push(renderStandardRow(standard, idx));
              });
            }

            return rows;
          })()}
        </TableBody>
      </Table>
    </div>
  );
};

export default ConStandardsTable;

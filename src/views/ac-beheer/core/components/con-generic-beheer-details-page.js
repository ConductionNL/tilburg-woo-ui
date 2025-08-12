import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { useNavigate, useParams } from 'react-router';
import { AcFlex, AcSection, AcTab, AcTabList, AcTabPanel, AcTabs } from '@atoms';
import { AcSideNav, AcLoader } from '@components';
import {
  Heading,
  Paragraph,
  Button,
  SecondaryActionButton,
  PrimaryActionButton,
  Alert,
} from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@constants';
import AcColumn from '@atoms/ac-column/ac-column';
import AcBeheerError from '@views/ac-beheer/core/components/ac-standard-pages/ac-beheer-error';
import DetailsPageConfigFactory from '@views/ac-beheer/core/factories/con-details-page-config-factory';
import formatBySchema from '@src/utilities/con-format-by-json-schema';
import _ from 'lodash';
import ConActionMenu from '@views/ac-beheer/shared/components/con-action-menu';
import ConObjectUploadFiles from '@views/ac-beheer/shared/components/con-object-upload-files/con-object-upload-files';
import BeheerTable from '@views/ac-beheer/shared/components/con-beheer-table/con-beheer-table';
import { TOOLTIP_ID } from '@src/index.web';
// Removed direct modal imports; modals are now loaded via BeheerModalFactory for consistency
import BeheerModalFactory from '@views/ac-beheer/core/factories/con-beheer-modal-factory';

/**
 * Generic Beheer Details Page
 * - Uses DetailsPageConfigFactory for per-type configuration
 * - Uses ObjectStore for fetching object, schema and related data (uses/used/files)
 * - Renders Files tab and dynamic Uses/Used tabs
 * - Supports unique action menu items and edit/delete via external modals
 */
const ConGenericBeheerDetailsPage = ({ store: { object }, type, id: propId }) => {
  const navigate = useNavigate();
  const params = useParams();
  const id = propId || params?.id;

  const [openModal, setOpenModal] = useState(null);
  const [tabIndex, setTabIndex] = useState(0);

  // Resolve config
  const config = useMemo(() => {
    try {
      return DetailsPageConfigFactory.createConfig(type);
    } catch (e) {
      return null;
    }
  }, [type]);

  // Types
  const objectType = useMemo(() => {
    if (!config) return null;
    return object.getTypeFromParams(config.registerSlug, config.schemaSlug);
  }, [config]);

  const schemaType = useMemo(() => {
    if (!config) return null;
    return object.getSchemaType(config.schemaSlug);
  }, [config]);

  // Reactive data (read directly to enable MobX tracking)
  const data =
    objectType && id
      ? object.getObject(objectType, id) || object.getActiveObject(objectType)
      : null;

  const dataProperties = schemaType ? object.getSchemaProperties(schemaType) : {};

  const error = objectType
    ? (() => {
        const storeError = object.getError(objectType);
        return storeError ? { message: storeError } : null;
      })()
    : null;

  // Only block the UI while loading if we don't have data yet.
  // If data exists, treat fetches as background refreshes.
  const loading =
    objectType && id
      ? !data &&
        (object.isLoading(`${objectType}_${id}`) ||
          object.isLoading(objectType) ||
          object.isSchemaLoading(schemaType))
      : false;

  // Related data
  const usesData = objectType ? object.getRelatedData(objectType, 'uses') : null;

  const usedData = objectType ? object.getRelatedData(objectType, 'used') : null;

  // Fetch data
  useEffect(() => {
    if (!config || !id) return;
    const extendParams = Array.isArray(config.extend) ? config.extend : [];
    object.fetchObject(config.registerSlug, config.schemaSlug, id, {
      _extend: extendParams,
    });
    object.fetchSchema(config.schemaSlug);
  }, [config?.schemaSlug, config?.registerSlug, id]);

  // When object becomes active, ensure related data are fetched by setActiveObject helper
  useEffect(() => {
    if (!config || !data) return;
    object.setActiveObject(config.registerSlug, config.schemaSlug, data);
  }, [config?.schemaSlug, config?.registerSlug, data?.id]);

  // Tabs: Files always, plus dynamic Uses/Used
  const registerSlug = config?.registerSlug;
  const schemaSlug = config?.schemaSlug;

  // Uses/Used unique schemas for tabs
  const uniqueSchemasFrom = useCallback((rel) => {
    if (!rel?.results) return [];
    const uniq = _.uniqBy(rel.results, (item) => item['@self']?.schema?.id);
    return uniq
      .map((item) => item['@self']?.schema)
      .filter(Boolean)
      .sort((a, b) => String(a.id).localeCompare(String(b.id)));
  }, []);

  const usesSchemas = useMemo(() => uniqueSchemasFrom(usesData), [usesData]);
  const usedSchemas = useMemo(() => uniqueSchemasFrom(usedData), [usedData]);

  if (!config) {
    return <AcBeheerError error={'Onbekend detailtype'} />;
  }

  if (error) {
    return <AcBeheerError error={error.message} />;
  }

  return (
    <AcSection spacing className='ac-mijn-omgeving-section'>
      <AcFlex spacing='xl'>
        <AcSideNav />
        <div className='ac-beheer-details--100-width'>
          <AcColumn gap='sm'>
            {loading && <AcLoader />}
            {!loading && !data && <Heading>Er is een fout opgetreden</Heading>}
            {!loading && data && (
              <AcFlex column spacing='xl'>
                <AcFlex spacing='sm' justifyContent='between'>
                  <Heading>{config.getTitle(data)}</Heading>
                  <ConActionMenu>
                    <ConActionMenu.Trigger icon={<VISUALS.ELLIPSIS />}>
                      Acties
                    </ConActionMenu.Trigger>
                    <ConActionMenu.Menu position='right'>
                      <ConActionMenu.Button
                        icon={<VISUALS.PENCIL />}
                        onClick={() => setOpenModal('edit')}
                      >
                        Bijwerken
                      </ConActionMenu.Button>
                      {config.uniqueActions?.map((action) =>
                        action.condition?.(data) ? (
                          <ConActionMenu.Button
                            key={action.key}
                            icon={
                              React.isValidElement(action.icon) ? (
                                action.icon
                              ) : action.icon ? (
                                <action.icon />
                              ) : null
                            }
                            onClick={() =>
                              typeof action.onClick === 'function'
                                ? action.onClick(data)
                                : setOpenModal(action.action)
                            }
                          >
                            {action.label}
                          </ConActionMenu.Button>
                        ) : null
                      )}
                      <ConActionMenu.Divider />
                      <ConActionMenu.Button
                        icon={<VISUALS.TRASHCAN />}
                        onClick={() => setOpenModal('delete')}
                      >
                        Verwijderen
                      </ConActionMenu.Button>
                    </ConActionMenu.Menu>
                  </ConActionMenu>
                </AcFlex>

                <AcColumn gap='md'>
                  <AcFlex column spacing='sm'>
                    <div className='ac-beheer-details--grid'>
                      {Object.entries(dataProperties)
                        .filter(([key]) => !config.excludedProperties.includes(key))
                        .map(([key, schema]) => (
                          <div key={key}>
                            <strong
                              {...(schema?.description
                                ? {
                                    'data-tooltip-id': TOOLTIP_ID,
                                    'data-tooltip-content': schema.description,
                                  }
                                : {})}
                            >
                              {_.startCase(key)}:
                            </strong>
                            <Paragraph>
                              {formatBySchema(
                                schema,
                                data,
                                key,
                                config.formatBySchemaOptions || {}
                              )}
                            </Paragraph>
                          </div>
                        ))}
                    </div>

                    <div>
                      <AcTabs
                        selectedIndex={tabIndex}
                        onSelect={(index) => setTabIndex(index)}
                      >
                        <AcTabList>
                          <AcTab selected={tabIndex === 0}>Bestanden</AcTab>
                          {usesSchemas.map((schema, idx) => (
                            <AcTab
                              key={`uses-${schema.id}`}
                              selected={tabIndex === idx + 1}
                            >
                              {schema.title || schema.id}
                            </AcTab>
                          ))}
                          {usedSchemas.map((schema, idx) => (
                            <AcTab
                              key={`used-${schema.id}`}
                              selected={tabIndex === idx + 1 + usesSchemas.length}
                            >
                              {schema.title || schema.id}
                            </AcTab>
                          ))}
                        </AcTabList>

                        <AcTabPanel selected={tabIndex === 0}>
                          <ConObjectUploadFiles
                            register={registerSlug}
                            schema={schemaSlug}
                            id={data.id}
                          />
                        </AcTabPanel>

                        {usesSchemas.map((schema, idx) => {
                          const metadata = usesData?.results?.find(
                            (r) => r['@self']?.schema?.id === schema.id
                          )?.['@self'];
                          const rows = (usesData?.results || []).filter(
                            (r) => r['@self']?.schema?.id === schema.id
                          );
                          return (
                            <AcTabPanel
                              key={`uses-${schema.id}`}
                              selected={tabIndex === idx + 1}
                            >
                              {metadata ? (
                                <BeheerTable
                                  type={schema.slug}
                                  metadata={metadata}
                                  data={rows}
                                  dataProperties={schema.properties}
                                  actionButtons={(config) =>
                                    !!config.navigateView && {
                                      id: 'actions',
                                      label: 'Acties',
                                      key: '',
                                      customContent: (row) => (
                                        <AcFlex column spacing='xs'>
                                          <button
                                            className='utrecht-button slim'
                                            variant='secondary'
                                            onClick={() =>
                                              config.navigateView(row.id)
                                            }
                                          >
                                            <VISUALS.EYE className='ac-button__icon' />{' '}
                                            Bekijken
                                          </button>
                                        </AcFlex>
                                      ),
                                    }
                                  }
                                  tableProps={{
                                    renderSelectRowButtons: false,
                                    truncateLines: 1,
                                  }}
                                />
                              ) : (
                                <Alert type='error'>
                                  Er is een fout opgetreden bij het laden van deze
                                  gegevens.
                                </Alert>
                              )}
                            </AcTabPanel>
                          );
                        })}

                        {usedSchemas.map((schema, idx) => {
                          const metadata = usedData?.results?.find(
                            (r) => r['@self']?.schema?.id === schema.id
                          )?.['@self'];
                          const rows = (usedData?.results || []).filter(
                            (r) => r['@self']?.schema?.id === schema.id
                          );
                          return (
                            <AcTabPanel
                              key={`used-${schema.id}`}
                              selected={tabIndex === idx + 1 + usesSchemas.length}
                            >
                              {metadata ? (
                                <BeheerTable
                                  type={schema.slug}
                                  metadata={metadata}
                                  data={rows}
                                  dataProperties={schema.properties}
                                  actionButtons={(config) =>
                                    !!config.navigateView && {
                                      id: 'actions',
                                      label: 'Acties',
                                      key: '',
                                      customContent: (row) => (
                                        <AcFlex column spacing='xs'>
                                          <button
                                            className='utrecht-button slim'
                                            variant='secondary'
                                            onClick={() =>
                                              config.navigateView(row.id)
                                            }
                                          >
                                            <VISUALS.EYE className='ac-button__icon' />{' '}
                                            Bekijken
                                          </button>
                                        </AcFlex>
                                      ),
                                    }
                                  }
                                  tableProps={{
                                    renderSelectRowButtons: false,
                                    truncateLines: 1,
                                  }}
                                />
                              ) : (
                                <Alert type='error'>
                                  Er is een fout opgetreden bij het laden van deze
                                  gegevens.
                                </Alert>
                              )}
                            </AcTabPanel>
                          );
                        })}
                      </AcTabs>
                    </div>
                  </AcFlex>
                </AcColumn>
              </AcFlex>
            )}
          </AcColumn>
        </div>
      </AcFlex>

      {/* Render modals via factory for consistency (includes edit/delete) */}
      {BeheerModalFactory.renderModals(type, {
        singleSelectedRow: data,
        selectedRows: [],
        openModal,
        setOpenModal,
        setSingleSelectedRow: () => {},
        tableRef: { current: { resetSelectedRows: () => {} } },
        navigate,
        fetchData: () => {
          // After delete, navigate back to list; otherwise refetch the object
          if (openModal === 'delete') {
            setOpenModal(null);
            navigate(`/beheer/${config.routeType}`);
            return;
          }
          return object.fetchObject(registerSlug, schemaSlug, id, {
            _extend: config.extend,
          });
        },
        config: {
          registerSlug,
          schemaSlug,
          // Include all available modals for this type except add/import on details page
          modals: (BeheerModalFactory.modalComponents[type]
            ? Object.keys(BeheerModalFactory.modalComponents[type])
            : []
          ).filter((m) => m !== 'add' && m !== 'import'),
        },
      })}
    </AcSection>
  );
};

export default withStore(observer(ConGenericBeheerDetailsPage));

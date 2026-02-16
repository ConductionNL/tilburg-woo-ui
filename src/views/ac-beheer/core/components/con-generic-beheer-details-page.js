import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { useNavigate, useParams } from 'react-router';
import { AcFlex, AcSection, AcTab, AcTabList, AcTabPanel, AcTabs } from '@atoms';
import { ConDynamicSidenav, AcLoader, ConDetailsActionsMenu } from '@components';
import {
  Heading,
  Paragraph,
  Alert,
} from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@constants';
import AcColumn from '@atoms/ac-column/ac-column';
import AcBeheerError from '@views/ac-beheer/core/components/ac-standard-pages/ac-beheer-error';
import DetailsPageConfigFactory from '@views/ac-beheer/core/factories/con-details-page-config-factory';
import formatBySchema from '@src/utilities/con-format-by-json-schema';
import { canReadField } from '@utils/field-authorization';
import _ from 'lodash';
import ConObjectUploadFiles from '@views/ac-beheer/shared/components/con-object-upload-files/con-object-upload-files';
import ConEditableDescription from '@views/ac-beheer/shared/components/con-editable-description/con-editable-description';
import BeheerTable from '@views/ac-beheer/shared/components/con-beheer-table/con-beheer-table';
import { TOOLTIP_ID } from '@src/index.web';
// Removed direct modal imports; modals are now loaded via BeheerModalFactory for consistency
import BeheerModalFactory from '@views/ac-beheer/core/factories/con-beheer-modal-factory';
import { useRelatedCreateActions } from '@views/ac-beheer/core/hooks/use-related-create-actions';
import ConLogoPreview from '@views/ac-register/con-logo-preview';
import { AcButton } from '@src/molecules';
import AcGemmaView from '@views/ac-gemma/ac-gemma-view';
import { DASHBOARD_WIZARDS, getWizardUrl } from '@src/constants/wizards.constants';
import { commongroundApiUrl } from '@src/config';
import { useSearchParams } from 'react-router-dom';

/**
 * Generic Beheer Details Page
 * - Uses DetailsPageConfigFactory for per-type configuration
 * - Uses ObjectStore for fetching object, schema and related data (uses/used/files)
 * - Renders Files tab and dynamic Uses/Used tabs
 * - Supports unique action menu items and edit/delete via external modals
 */
const ConGenericBeheerDetailsPage = ({ store, type, id: propId }) => {
  // Destructure the stores we need
  const { object, user } = store;
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const id = propId || params?.id;
  const isExtendView = type === 'extendview' || type === 'view';

  const [openModal, setOpenModal] = useState(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [dynamicCreateTargetType, setDynamicCreateTargetType] = useState(null);
  const [dynamicCreatePreSelected, setDynamicCreatePreSelected] = useState({});
  const [dynamicCreateMetadata, setDynamicCreateMetadata] = useState({});
  const [actionMenuItems, setActionMenuItems] = useState([]);

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

  // Full schema (to read configuration)
  const schema = schemaType ? object.getSchema(schemaType) : null;

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

  // Fetch database gebruik data
  const [gebruikData, setGebruikData] = useState(null);

  useEffect(() => {
    if (isExtendView) return;

    let isMounted = true;
    const abortController = new AbortController();

    const fetchGebruik = async () => {
      try {
        const response = await fetch(
          `${commongroundApiUrl()}/softwarecatalog/api/gebruik?_extend[]=@self.schema`,
          {
            method: 'GET',
            signal: abortController.signal,
            headers: { Accept: 'application/json' },
          }
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = (await response.json()).results || [];

        if (isMounted) setGebruikData(data);
      } catch (err) {
        // Fetch failures are non-blocking
        if (isMounted && err.name === 'AbortError') return;
      }
    };

    fetchGebruik();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [isExtendView]);

  // Merge database gebruik data with uses and used data
  const mergedUsesData = useMemo(() => {
    if (!usesData && !gebruikData) return null;
    const usesResults = usesData?.results || [];
    const databaseResults = gebruikData || [];
    const mergedResults = _.uniqBy([...usesResults, ...databaseResults], 'id');
    return {
      ...usesData,
      results: mergedResults,
    };
  }, [usesData, gebruikData]);

  const mergedUsedData = useMemo(() => {
    if (!usedData && !gebruikData) return null;
    const usedResults = usedData?.results || [];
    const databaseResults = gebruikData || [];
    const mergedResults = _.uniqBy([...usedResults, ...databaseResults], 'id');
    return {
      ...usedData,
      results: mergedResults,
    };
  }, [usedData, gebruikData]);

  // Names cache for UUID resolution
  const namesMap = useMemo(() => {
    const map = {};
    Object.entries(object.namesCache || {}).forEach(([id, cacheEntry]) => {
      if (cacheEntry.name) {
        map[id] = cacheEntry.name;
      }
    });
    return map;
  }, [object?.namesCache]);

  // Fetch data
  useEffect(() => {
    if (isExtendView) return;
    if (!config || !id) return;
    const extendParams = Array.isArray(config.extend) ? config.extend : [];
    object.fetchObject(config.registerSlug, config.schemaSlug, id, {
      _extend: extendParams,
      _related: true,
      _relatedNames: true,
      _published: 'false',
    });
    object.fetchSchema(config.schemaSlug);
  }, [config?.schemaSlug, config?.registerSlug, id, isExtendView]);

  // When object becomes active, ensure related data are fetched by setActiveObject helper
  useEffect(() => {
    if (isExtendView) return;
    if (!config || !data) return;
    object.setActiveObject(config.registerSlug, config.schemaSlug, data);
  }, [config?.schemaSlug, config?.registerSlug, data?.id, isExtendView]);

  // Check for showEditModal query parameter and open edit modal
  useEffect(() => {
    if (isExtendView) return;
    if (!data) return;
    if (searchParams.get('showEditModal') === 'true') {
      setOpenModal('edit');
      // Remove the query parameter from URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('showEditModal');
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [data, searchParams, setSearchParams, isExtendView]);

  // Tabs: Files always, plus dynamic Uses/Used
  const registerSlug = config?.registerSlug;
  const schemaSlug = config?.schemaSlug;

  // Memoize modal config to keep identity stable and avoid remount loops in modal factory
  const modalConfig = useMemo(() => {
    const availableKeys = BeheerModalFactory.modalComponents[type]
      ? Object.keys(BeheerModalFactory.modalComponents[type])
      : ['edit', 'delete', 'publish', 'depublish'];
    const filtered = availableKeys.filter((m) => m !== 'add' && m !== 'import');
    const modals = filtered.includes('dynamicCreate')
      ? filtered
      : [...filtered, 'dynamicCreate'];
    return {
      registerSlug,
      schemaSlug,
      modals,
    };
  }, [type, registerSlug, schemaSlug]);

  // Respect schema configuration for files and tags
  const showFilesTab = !!schema?.configuration?.allowFiles;
  const allowedTags = Array.isArray(schema?.configuration?.allowedTags)
    ? schema.configuration.allowedTags
    : [];

  const configuredMetaFields = useMemo(() => {
    const cfg = schema?.configuration;
    return [
      cfg?.objectDescriptionField,
      cfg?.objectImageField,
      cfg?.objectNameField,
    ].filter(Boolean);
  }, [schema]);

  // If Files tab is hidden, default to first dynamic tab (index 1)
  useEffect(() => {
    if (isExtendView) return;
    setTabIndex(() => (!showFilesTab ? 1 : 0));
  }, [showFilesTab, isExtendView]);

  // Uses/Used unique schemas for tabs
  const uniqueSchemasFrom = useCallback((rel) => {
    if (!rel?.results) return [];
    const uniq = _.uniqBy(rel.results, (item) => item['@self']?.schema?.id);
    return uniq
      .map((item) => item['@self']?.schema)
      .filter(Boolean)
      .sort((a, b) => String(a.id).localeCompare(String(b.id)));
  }, []);

  const usesSchemas = useMemo(
    () => uniqueSchemasFrom(mergedUsesData),
    [mergedUsesData]
  );
  const usedSchemas = useMemo(
    () => uniqueSchemasFrom(mergedUsedData),
    [mergedUsedData]
  );

  const shortTooltip = (type) =>
    `Een korte beschrijving van de ${type.slice(0, -1)}`;
  const longTooltip = (type) =>
    `Een uitgebreide beschrijving van de ${type.slice(0, -1)}`;

  const openDynamicCreate = React.useCallback(
    (targetType, preSelected, metadata = {}) => {
      setDynamicCreateTargetType(targetType);
      setDynamicCreatePreSelected(preSelected);
      // Store metadata for outgoing relationship handling and optimization
      // Store all metadata for the modal to use
      setDynamicCreateMetadata(metadata);
      setOpenModal('dynamicCreate');
    },
    []
  );

  const { makeActionsForContext } = useRelatedCreateActions({
    object,
    user,
    schemaRef: config?.schemaSlug,
    currentType: type,
    openDynamicCreate,
    currentObject: data, // Pass current object for organization permission checks
    currentObjectRegister: config?.registerSlug, // Pass current object register
    currentObjectSchema: config?.schemaSlug, // Pass current object schema
  });

  useEffect(() => {
    if (isExtendView) return;
    if (!config?.schemaSlug || !data?.id) return;
    const items = makeActionsForContext(
      data.id,
      config.dynamicActionFilter,
      data,
      config?.registerSlug,
      config?.schemaSlug
    ).map(({ key, label, onClick, schema, icon }) => ({
      key,
      label,
      onClick,
      schema,
      icon,
    }));
    setActionMenuItems(items);
  }, [
    config?.schemaSlug,
    data?.id,
    makeActionsForContext,
    isExtendView,
    data,
    config?.registerSlug,
    config?.dynamicActionFilter,
  ]);

  if (!config) {
    return <AcBeheerError error={'Onbekend detailtype'} store={store} />;
  }

  if (error) {
    return <AcBeheerError error={error.message} store={store} />;
  }

  if (isExtendView) {
    return (
      <AcSection spacing className='ac-mijn-omgeving-section'>
        <AcFlex spacing='xl'>
          <ConDynamicSidenav store={store} />
          <div className='ac-beheer-details--100-width'>
            <AcGemmaView viewId={id} />
          </div>
        </AcFlex>
      </AcSection>
    );
  }

  return (
    <AcSection spacing className='ac-mijn-omgeving-section'>
      <AcFlex spacing='xl'>
        <ConDynamicSidenav store={store} />
        <div className='ac-beheer-details--100-width'>
          <AcColumn gap='sm'>
            {loading && <AcLoader />}
            {!loading && !data && <Heading>Er is een fout opgetreden</Heading>}
            {!loading && data && (
              <AcFlex column spacing='xl'>
                <AcFlex spacing='sm' justifyContent='between' alignItems='center'>
                  <div className='con-beheer-details--header-container'>
                    {data?.['@self']?.image && (
                      <ConLogoPreview
                        className='con-beheer-details--logo-container'
                        logoUrl={data?.['@self']?.image}
                      />
                    )}

                    <Heading className='con-beheer-details--title'>
                      {data['@self']?.name || data.id}
                    </Heading>
                  </div>
                  {config?.routeType !== 'extendview' && (
                    <ConDetailsActionsMenu
                      user={user}
                      id={id}
                      schemaSlug={config?.schemaSlug}
                      title={data['@self']?.name || data.id}
                      published={data?.['@self']?.published}
                      object={data}
                      showViewAction={false}
                      showEditAction={true}
                      showPublishActions={false} // LEGACY: Changed from true - Publish actions no longer needed
                      uniqueActions={[
                        ...(config.uniqueActions
                          ?.filter((action) => action.condition?.(data))
                          .map((action) => {
                            // Get user groups for dynamic label/params
                            const userGroups =
                              user?.currentUser?.groups || user?.user?.groups || [];

                            // Support dynamic label based on user role (like publish/depublish toggle)
                            const label =
                              typeof action.getLabel === 'function'
                                ? action.getLabel(userGroups)
                                : action.label;

                            return {
                              key: action.key,
                              label,
                              icon: action.icon,
                              onClick: () => {
                                // Check if this is a wizard action
                                if (
                                  action.action === 'wizard' &&
                                  action.wizardPath
                                ) {
                                  // Support dynamic params based on user role
                                  const params =
                                    typeof action.getWizardParams === 'function'
                                      ? action.getWizardParams(data, userGroups)
                                      : action.wizardParams
                                      ? action.wizardParams(data)
                                      : {};
                                  const searchParams = new URLSearchParams(params);
                                  const queryString = searchParams.toString();
                                  navigate(
                                    `${action.wizardPath}${
                                      queryString ? '?' + queryString : ''
                                    }`
                                  );
                                } else if (typeof action.onClick === 'function') {
                                  action.onClick(data);
                                } else {
                                  setOpenModal(action.action);
                                }
                              },
                            };
                          }) || []),
                        {
                          key: 'delete',
                          label: 'Verwijderen',
                          icon: VISUALS.TRASHCAN,
                          onClick: () => setOpenModal('delete'),
                        },
                      ]}
                      relatedActions={actionMenuItems}
                      onEdit={() => {
                        // Prefer wizard editing when available; fallback to legacy modal
                        if (config?.schemaSlug) {
                          const wizards = Object.values(DASHBOARD_WIZARDS);
                          const wizard = wizards.find(
                            (w) => w.schema === config.schemaSlug
                          );
                          if (wizard) {
                            const baseUrl = getWizardUrl(wizard);
                            const url = new URL(baseUrl, window.location.origin);
                            url.searchParams.set('id', data?.id);
                            navigate(url.pathname + url.search);
                            return;
                          }
                        }
                        setOpenModal('edit');
                      }}
                      // onPublish={() => setOpenModal('publish')} {/* LEGACY: Publish actions no longer needed */}
                      // onDepublish={() => setOpenModal('depublish')} {/* LEGACY: Publish actions no longer needed */}
                    />
                  )}
                </AcFlex>

                {/* Warning card for unpublished objects - LEGACY: No longer needed */}
                {/* {!data?.['@self']?.published && (
                  <Alert type='warning'>
                    <Heading level={4}>Dit object is nog niet gepubliceerd</Heading>
                    <Paragraph>
                      Dit object is momenteel niet zichtbaar in de zoekfunctie van{' '}
                      {config?.title || 'de Softwarecatalogus'}. Gebruik de
                      &quot;Publiceren&quot; actie om het object beschikbaar te maken
                      voor bezoekers.
                    </Paragraph>
                  </Alert>
                )} */}

                <AcColumn gap='tiger'>
                  <>
                    <ConEditableDescription
                      registerSlug={config.registerSlug}
                      schemaSlug={config.schemaSlug}
                      objectId={data.id}
                      field='beschrijvingKort'
                      label='Korte beschrijving'
                      placeholder={shortTooltip(type)}
                      tooltip={shortTooltip(type)}
                      maxLength={255}
                      isMarkdown={false}
                      value={data.beschrijvingKort}
                      serialize={(v) => v}
                      deserialize={(v) => v || ''}
                    />

                    <ConEditableDescription
                      registerSlug={config.registerSlug}
                      schemaSlug={config.schemaSlug}
                      objectId={data.id}
                      field='beschrijvingLang'
                      label='Lange beschrijving'
                      placeholder={longTooltip(type)}
                      tooltip={longTooltip(type)}
                      maxLength={5000}
                      isMarkdown={true}
                      value={data.beschrijvingLang}
                      serialize={(v) => JSON.stringify(v || '')}
                      deserialize={(v) => {
                        if (!v) return '';
                        try {
                          return JSON.parse(v) || '';
                        } catch (e) {
                          return v;
                        }
                      }}
                    />
                  </>

                  <AcFlex column spacing='sm'>
                    <div className='ac-beheer-details--grid'>
                      {Object.entries(dataProperties)
                        .filter(([key]) => !config.excludedProperties.includes(key))
                        .filter(([key]) => !configuredMetaFields.includes(key))
                        .filter(([, schema]) => canReadField(user, schema))
                        .map(([key, schema]) => {
                          // Check if this property should be displayed inline
                          const isInline =
                            config.formatBySchemaOptions?.profile?.[key]?.inline;

                          if (isInline) {
                            // Inline rendering: label and value on same line
                            return (
                              <div
                                key={key}
                                style={{
                                  display: 'flex',
                                  alignItems: 'baseline',
                                  gap: '8px',
                                }}
                              >
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
                                {formatBySchema(schema, data, key, {
                                  ...(config.formatBySchemaOptions || {}),
                                  objectStore: object,
                                  namesMap,
                                })}
                              </div>
                            );
                          } else {
                            // Default block rendering: label above value
                            return (
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
                                </strong>{' '}
                                {formatBySchema(schema, data, key, {
                                  ...(config.formatBySchemaOptions || {}),
                                  objectStore: object,
                                  namesMap,
                                })}
                              </div>
                            );
                          }
                        })}
                    </div>

                    {(usesSchemas.length > 0 ||
                      usedSchemas.length > 0 ||
                      showFilesTab) && (
                      <div className='ac-beheer-details--tabs-container'>
                        <AcTabs
                          selectedIndex={tabIndex}
                          onSelect={(index) => setTabIndex(index)}
                        >
                          <AcTabList>
                            {showFilesTab && (
                              <AcTab selected={tabIndex === 0}>Bestanden</AcTab>
                            )}
                            {usesSchemas.length > 0 &&
                              usesSchemas.map((schema, idx) => (
                                <AcTab
                                  key={`uses-${schema.id}`}
                                  selected={tabIndex === idx + !!showFilesTab}
                                >
                                  {schema.title || schema.id}
                                </AcTab>
                              ))}
                            {usedSchemas.length > 0 &&
                              usedSchemas.map((schema, idx) => (
                                <AcTab
                                  key={`used-${schema.id}`}
                                  selected={
                                    tabIndex ===
                                    idx + !!showFilesTab + usesSchemas.length
                                  }
                                >
                                  {schema.title || schema.id}
                                </AcTab>
                              ))}
                          </AcTabList>
                          {showFilesTab && (
                            <AcTabPanel selected={tabIndex === 0}>
                              <ConObjectUploadFiles
                                register={registerSlug}
                                schema={schemaSlug}
                                id={data.id}
                                allowedTags={allowedTags}
                              />
                            </AcTabPanel>
                          )}
                          {usesSchemas.length > 0 &&
                            usesSchemas.map((schema, idx) => {
                              const metadata = mergedUsesData?.results?.find(
                                (r) => r['@self']?.schema?.id === schema.id
                              )?.['@self'];
                              const rows = (mergedUsesData?.results || []).filter(
                                (r) => r['@self']?.schema?.id === schema.id
                              );
                              return (
                                <AcTabPanel
                                  key={`uses-${schema.id}`}
                                  selected={tabIndex === idx + !!showFilesTab}
                                >
                                  {metadata ? (
                                    <BeheerTable
                                      type={schema.slug}
                                      metadata={metadata}
                                      data={rows}
                                      dataProperties={schema.properties}
                                      user={user}
                                      actionButtons={(config) =>
                                        !!config.navigateView && {
                                          id: 'actions',
                                          label: 'Acties',
                                          key: '',
                                          customContent: (row) => (
                                            <AcFlex column spacing='xs'>
                                              <AcButton
                                                style='buttonSlim'
                                                buttonType='secondary'
                                                onClick={() =>
                                                  config.navigateView(row)
                                                }
                                              >
                                                <VISUALS.EYE className='ac-button__icon' />{' '}
                                                Bekijken
                                              </AcButton>
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
                                      Er is een fout opgetreden bij het laden van
                                      deze gegevens.
                                    </Alert>
                                  )}
                                </AcTabPanel>
                              );
                            })}
                          {usedSchemas.length > 0 &&
                            usedSchemas.map((schema, idx) => {
                              const metadata = mergedUsedData?.results?.find(
                                (r) => r['@self']?.schema?.id === schema.id
                              )?.['@self'];
                              const rows = (mergedUsedData?.results || []).filter(
                                (r) => r['@self']?.schema?.id === schema.id
                              );
                              return (
                                <AcTabPanel
                                  key={`used-${schema.id}`}
                                  selected={
                                    tabIndex ===
                                    idx + !!showFilesTab + usesSchemas.length
                                  }
                                >
                                  {metadata ? (
                                    <BeheerTable
                                      type={schema.slug}
                                      metadata={metadata}
                                      data={rows}
                                      dataProperties={schema.properties}
                                      user={user}
                                      actionButtons={(config) =>
                                        !!config.navigateView && {
                                          id: 'actions',
                                          label: 'Acties',
                                          key: '',
                                          customContent: (row) => (
                                            <AcFlex column spacing='xs'>
                                              <AcButton
                                                style='buttonSlim'
                                                buttonType='secondary'
                                                onClick={() =>
                                                  config.navigateView(row)
                                                }
                                              >
                                                <VISUALS.EYE className='ac-button__icon' />{' '}
                                                Bekijken
                                              </AcButton>
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
                                      Er is een fout opgetreden bij het laden van
                                      deze gegevens.
                                    </Alert>
                                  )}
                                </AcTabPanel>
                              );
                            })}
                        </AcTabs>
                      </div>
                    )}
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
        store: { object, user }, // Pass store for cross-collection refreshes
        fetchData: () => {
          // After delete, navigate back to list; otherwise refetch the object
          if (openModal === 'delete') {
            setOpenModal(null);
            navigate(`/beheer/${config.routeType}`);
            return;
          }
          return object.fetchObject(registerSlug, schemaSlug, id, {
            _extend: config.extend,
            _published: 'false',
          });
        },
        config: modalConfig,
        dynamicCreateTargetType,
        dynamicCreatePreSelected,
        dynamicCreateMetadata,
      })}
    </AcSection>
  );
};

export default withStore(observer(ConGenericBeheerDetailsPage));

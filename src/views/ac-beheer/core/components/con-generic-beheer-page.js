import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcFlex, AcSection, AcContainer } from '@atoms';
import { Heading } from '@utrecht/component-library-react/dist/css-module';
import { SecondaryActionButton } from '@utrecht/component-library-react';
import { VISUALS, LABELS } from '@constants';
import { NAVIGATE_TO } from '@src/constants/routes.constants';
import { ConDynamicSidenav } from '@components';
import AcBeheerError from '@views/ac-beheer/core/components/ac-standard-pages/ac-beheer-error';
import AcColumn from '@atoms/ac-column/ac-column';
import ConTable from '@views/ac-beheer/shared/components/con-table';
import ConActionMenu from '@views/ac-beheer/shared/components/con-action-menu';
import { Pagination } from '@amsterdam/design-system-react';
import ConPaginationLimitSelector, {
  usePaginationLimit,
} from '@src/components/con-pagination-limit-selector/con-pagination-limit-selector';
import BeheerModalFactory from '@views/ac-beheer/core/factories/con-beheer-modal-factory';
import FilterDrawerFactory from '@views/ac-beheer/core/factories/con-filter-drawer-factory';
import BeheerPageConfigFactory from '@views/ac-beheer/core/factories/con-beheer-page-config-factory';
import _ from 'lodash';
import { CanceledError } from 'axios';
import { AcButton } from '@molecules';
import { useRelatedCreateActions } from '@views/ac-beheer/core/hooks/use-related-create-actions';
import { canReadField } from '@utils/field-authorization';
import { DASHBOARD_WIZARDS, getWizardUrl } from '@src/constants/wizards.constants';
import { extractReferenceIdsFromCollection } from '@src/utilities';

/**
 * Generic Beheer Page Component
 * This component can handle all beheer page types through configuration
 */
const ConGenericBeheerPage = ({ store, type, configOverrides = {} }) => {
  // Destructure the stores we need
  const { object, user } = store;
  const navigate = useNavigate();
  const [beoordelingFilter, setBeoordelingFilter] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [enhancedConfig, setEnhancedConfig] = useState(null);

  // Get base configuration for this type
  const baseConfig = useMemo(() => {
    try {
      const config = BeheerPageConfigFactory.createConfig(type);
      return { ...config, ...configOverrides };
    } catch (err) {
      // If configuration doesn't exist for this type, return null
      return null;
    }
  }, [type, configOverrides]);

  // Use enhanced config if available, otherwise fall back to base config
  const config = enhancedConfig || baseConfig;

  // Generate object type identifier for the object store
  const objectType = useMemo(() => {
    if (!config) return null;
    return object.getTypeFromParams(config.registerSlug, config.schemaSlug);
  }, [config, object]);

  // Generate schema type identifier for schema operations
  const schemaType = useMemo(() => {
    if (!config) return null;
    return object.getSchemaType(config.schemaSlug);
  }, [config, object]);

  // Get reactive data from object store (read directly to enable MobX tracking)
  const data = objectType ? object.getCollection(objectType).results || [] : [];

  const loading = objectType ? object.isLoading(objectType) : false;

  const error = objectType
    ? (() => {
        const storeError = object.getError(objectType);
        return storeError ? { message: storeError } : null;
      })()
    : null;

  const objectStorePagination = objectType
    ? object.getPagination(objectType)
    : { total: 0, page: 1, pages: 0, limit: 20 };

  // Get schema properties from object store
  const dataProperties = schemaType ? object.getSchemaProperties(schemaType) : [];

  // Get full schema object to access title and other metadata
  const schemaData = schemaType ? object.getSchema(schemaType) : null;

  const schemaLoading = schemaType ? object.isSchemaLoading(schemaType) : false;

  const schemaError = schemaType
    ? (() => {
        const storeError = object.getSchemaError(schemaType);
        return storeError ? { message: storeError } : null;
      })()
    : null;

  // Enhance config with dynamic headers and title from schema
  useEffect(() => {
    if (
      baseConfig &&
      dataProperties &&
      Object.keys(dataProperties).length > 0 &&
      !schemaLoading &&
      !schemaError
    ) {
      // Only enhance if we have a generic config (no predefined defaultHeaders)
      if (baseConfig.defaultHeaders && baseConfig.defaultHeaders.length === 0) {
        const schemaPropertyKeys = Object.entries(dataProperties)
          .filter(([, value]) => value.hideOnCollection !== true)
          .map(([key]) => key);

        // Use schema title if available, otherwise capitalize the type without "Beheer" prefix
        let dynamicTitle = baseConfig.title;
        if (schemaData && schemaData.title) {
          dynamicTitle = schemaData.title;
        } else {
          // Remove "Beheer " prefix and just use the capitalized type
          dynamicTitle = type.charAt(0).toUpperCase() + type.slice(1);
        }

        const enhancedConfigWithHeaders = {
          ...baseConfig,
          defaultHeaders: schemaPropertyKeys,
          title: dynamicTitle,
        };
        setEnhancedConfig(enhancedConfigWithHeaders);
      } else {
        // If config already has headers, use it as-is
        setEnhancedConfig(baseConfig);
      }
    }
  }, [baseConfig, dataProperties, schemaData, schemaLoading, schemaError, type]);

  // Use the custom hook for pagination limit management
  const [limit, setLimit] = usePaginationLimit(config.paginationKey);

  // Merge object store pagination with local limit preference
  const pagination = useMemo(
    () => ({
      ...objectStorePagination,
      limit,
    }),
    [objectStorePagination, limit]
  );

  const filterHeadersDrawerRef = useRef(null);
  const tableRef = useRef(null);

  const [dynamicCreateTargetType, setDynamicCreateTargetType] = useState(null);
  const [dynamicCreatePreSelected, setDynamicCreatePreSelected] = useState({});
  const showManageActions = !['extendview', 'view'].includes(config?.routeType);

  // Related create actions via shared hook (declared after cancelAllRequests effect
  // to avoid its initial fetch being aborted on type changes)
  let makeActionsForContext; // will be assigned below

  const fetchData = useCallback(
    async (searchParams = {}) => {
      if (!objectType || !config) {
        return;
      }

      try {
        // Build the extend parameters exactly as before
        const extend = [...config.extend];

        // Convert extend array and searchParams to object format for object store
        const storeParams = {
          _page: pagination.page,
          _limit: pagination.limit,
          _extend: extend,
          _related: true, // Request related object data
          _relatedNames: true, // Request ID to name mappings
          ...searchParams,
        };

        if (beoordelingFilter) storeParams['beoordeling'] = beoordelingFilter;

        console.info(
          `🔗 Fetching collection for ${config.registerSlug}/${config.schemaSlug} with related names`
        );

        // Use object store for collection data - this handles loading/error states automatically
        await object.fetchCollection(
          config.registerSlug,
          config.schemaSlug,
          storeParams
        );

        // Fetch schema using object store
        await object.fetchSchema(config.schemaSlug);

        // Additional fallback: manually resolve any remaining reference IDs
        // (for cases where backend doesn't support _relatedNames yet)
        const collection = object.getCollection(objectType);
        const schema = object.getSchema(schemaType);

        if (collection.results?.length && schema) {
          const referenceIds = extractReferenceIdsFromCollection(
            collection.results,
            schema
          );
          if (referenceIds.length > 0) {
            console.info(
              `📋 Found ${referenceIds.length} additional reference IDs to resolve`
            );
            // This will fetch any missing names and cache them
            await object.getNamesForMultipleIds(referenceIds);
          }
        }
      } catch (err) {
        // Don't set error if request was cancelled - object store handles collection errors
        if (err.code === 'ERR_CANCELED' || err instanceof CanceledError) {
          return;
        }
        console.error('Error fetching data:', err);
      }
    },
    [
      objectType,
      config,
      pagination.page,
      pagination.limit,
      beoordelingFilter,
      object,
    ]
  );

  const downloadData = useCallback(
    async (type = 'csv') => {
      await object.exportObjects(config.registerSlug, config.schemaSlug, type);
    },
    [object, config.registerSlug, config.schemaSlug]
  );

  // Cancel all requests and reset state when type changes
  useEffect(() => {
    // Cancel all active requests when switching types
    object.cancelAllRequests();

    // Reset all state when type changes
    setSelectedRows([]);
    setSingleSelectedRow(null);
    setOpenModal(null);
    setBeoordelingFilter(null);
    setTableHeaders([]);
    setShowSearch(false);
  }, [type]);

  // Initialize related create actions after cancellation effect definition
  ({ makeActionsForContext } = useRelatedCreateActions({
    object,
    user,
    schemaRef: config?.schemaSlug,
    currentType: type,
    openDynamicCreate: (targetType, preSelected, metadata = {}) => {
      setDynamicCreateTargetType(targetType);
      setDynamicCreatePreSelected(preSelected);
      if (metadata.isOutgoing) {
        // handled by the form modal after successful creation
      }
      setOpenModal('dynamicCreate');
    },
    currentObject: null,
  }));

  // Fetch data when component is ready and pagination changes
  useEffect(() => {
    if (!!config && objectType) {
      // Only fetch when objectType is available
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objectType, pagination.limit, pagination.page, !config]);

  // Open create modal when query param is present, but only after the 'add' modal has actually mounted
  const openAddModal = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const wantsCreate = params.get('showCreateModal') === 'true';
    if (!wantsCreate) return;
    const timer = setTimeout(() => setOpenModal('add'), 150);
    return () => clearTimeout(timer);
  }, []);

  // Handle object store cancellation when objectType changes (separate effect)
  const prevObjectTypeRef = useRef();
  useEffect(() => {
    if (!config) return;

    const prevObjectType = prevObjectTypeRef.current;
    prevObjectTypeRef.current = objectType;

    // Cancel previous objectType requests when switching to a new objectType
    if (prevObjectType && prevObjectType !== objectType) {
      object.cancelRequest(prevObjectType);
    }
  }, [objectType, object]);

  // Refetch data when beoordelingFilter changes
  useEffect(() => {
    if (!config) return;
    if (type === 'organisaties') {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beoordelingFilter]);

  const [selectedRows, setSelectedRows] = useState([]);
  const [singleSelectedRow, setSingleSelectedRow] = useState(null);
  const [openModal, setOpenModal] = useState(null);

  // Handle create action → open corresponding wizard when available
  const handleCreateClick = useCallback(() => {
    if (!config?.schemaSlug) {
      setOpenModal('add');
      return;
    }

    const wizards = Object.values(DASHBOARD_WIZARDS);
    const wizard = wizards.find((w) => w.schema === config.schemaSlug);
    const areThereMultipleOptions =
      wizards.filter((w) => w.schema === config.schemaSlug).length > 1;

    if (wizard) {
      navigate(getWizardUrl(wizard, !areThereMultipleOptions));
      return;
    }

    // Fallback to legacy modal when no wizard is defined for this schema
    setOpenModal('add');
  }, [config?.schemaSlug, navigate]);

  // Generate headers from dataProperties schema
  const headers = useMemo(() => {
    if (!config) return [];
    if (!dataProperties) return [];

    return Object.entries(dataProperties)
      .filter(
        ([value]) => value.visible !== false && value.hideOnCollection !== true
      )
      .filter(([value]) => canReadField(user, value))
      .map(([key, value]) => {
        // Check if we have a custom override for this header
        if (config.customHeaders[key]) {
          return config.customHeaders[key];
        }

        // Generate standard header from schema
        // Use schema property title if available, otherwise capitalize the key
        const label =
          value.title && value.title.trim() ? value.title : _.upperFirst(key);

        return {
          id: key,
          label: label,
          key: key,
        };
      });
  }, [dataProperties, config.customHeaders, user]);

  const [tableHeaders, setTableHeaders] = useState([]);

  // Stable keys to avoid re-running effects on new array/object references
  const { defaultHeaderIds, shouldShowAllHeaders } = useMemo(() => {
    if (!config || !dataProperties)
      return { defaultHeaderIds: [], shouldShowAllHeaders: true };

    const headersList = headers;

    // Helper to map schema keys or custom header ids to actual header ids
    const mapKeysToHeaderIds = (keys) => {
      const result = new Set();
      keys.forEach((keyOrId) => {
        const match = headersList.find((h) => h.id === keyOrId || h.key === keyOrId);
        if (match) result.add(match.id);
      });
      return result;
    };

    // 1) PRIORITY: Schema-based table.default flags always override everything else
    const entries = Object.entries(dataProperties);
    const anyTable = entries.some(([, value]) => !!value?.table);
    const defaultTrueKeys = entries
      .filter(([, value]) => value?.table?.default === true)
      .map(([k]) => k);
    const defaultTrueIds = mapKeysToHeaderIds(defaultTrueKeys);

    // If we have table.default flags, use them regardless of config.defaultHeaders
    if (anyTable && defaultTrueIds.size > 0) {
      return {
        defaultHeaderIds: headersList
          .filter((h) => defaultTrueIds.has(h.id))
          .map((h) => h.id),
        shouldShowAllHeaders: false,
      };
    }

    // 2) Fallback to explicit defaults from config.defaultHeaders if no table.default found
    const explicitDefaults = Array.isArray(config.defaultHeaders)
      ? config.defaultHeaders
      : [];
    const explicitDefaultIds = mapKeysToHeaderIds(explicitDefaults);
    if (explicitDefaultIds.size > 0) {
      return {
        defaultHeaderIds: Array.from(explicitDefaultIds),
        shouldShowAllHeaders: false,
      };
    }

    // Debug logging to understand what's happening
    console.info('🔍 Table.default filtering debug:', {
      type,
      dataPropertiesKeys: Object.keys(dataProperties || {}),
      anyTable,
      defaultTrueKeys,
      defaultTrueIds: Array.from(defaultTrueIds),
      explicitDefaults,
      explicitDefaultIds: Array.from(explicitDefaultIds),
      headersListIds: headersList.map((h) => h.id),
    });

    // 3) Show all headers if no specific configuration found
    return { defaultHeaderIds: [], shouldShowAllHeaders: true };
  }, [dataProperties, headers, config && config.defaultHeaders, type]);

  const headerIdsKey = useMemo(() => headers.map((h) => h.id).join(','), [headers]);
  const defaultHeaderIdsKey = useMemo(
    () => (shouldShowAllHeaders ? '' : defaultHeaderIds.join(',')),
    [shouldShowAllHeaders, defaultHeaderIds]
  );

  useEffect(() => {
    if (!config || headers.length === 0) return;

    const next = shouldShowAllHeaders
      ? headers
      : headers.filter((header) => defaultHeaderIds.includes(header.id));

    const nextKey = next.map((h) => h.id).join(',');
    const currentKey = tableHeaders.map((h) => h.id).join(',');

    if (nextKey === currentKey) return;

    setTableHeaders(next);
  }, [headerIdsKey, defaultHeaderIdsKey]);

  const handleMultipleDelete = () => {
    setOpenModal('delete');
  };

  // Bulk publish/depublish handlers
  const handleMultiplePublish = () => {
    setOpenModal('publish');
  };

  const handleMultipleDepublish = () => {
    setOpenModal('depublish');
  };

  // Generate action buttons for table rows
  const generateActionButtons = useCallback(
    (row) => {
      const isViewOnlyRoute = ['extendview', 'view'].includes(config.routeType);

      const baseActions = [
        {
          key: 'view',
          label: 'Bekijken',
          icon: <VISUALS.EYE />,
          onClick: () => {
            navigate(
              NAVIGATE_TO.BEHEER_TYPE_DETAILS(config.routeType, row['@self'].id)
            );
          },
        },
        {
          key: 'edit',
          label: 'Bewerken',
          icon: <VISUALS.PENCIL />,
          onClick: () => {
            // Prefer wizard editing when available; fallback to legacy modal
            if (config?.schemaSlug) {
              const wizards = Object.values(DASHBOARD_WIZARDS);
              const wizard = wizards.find((w) => w.schema === config.schemaSlug);

              if (wizard) {
                const baseUrl = getWizardUrl(wizard);
                const url = new URL(baseUrl, window.location.origin);
                url.searchParams.set('id', row['@self'].id);
                navigate(url.pathname + url.search);
                return;
              }
            }

            setSingleSelectedRow(row);
            setOpenModal('edit');
          },
        },
      ];

      // Add publish/depublish actions as standard options
      const publishActions = [];
      if (!row['@self']?.published) {
        publishActions.push({
          key: 'publish',
          label: 'Publiceren',
          icon: <VISUALS.PUBLISH />,
          onClick: () => {
            setSingleSelectedRow(row);
            setOpenModal('publish');
          },
        });
      }
      if (row['@self']?.published) {
        publishActions.push({
          key: 'depublish',
          label: 'Depubliceren',
          icon: <VISUALS.PUBLISH_OFF />,
          onClick: () => {
            setSingleSelectedRow(row);
            setOpenModal('depublish');
          },
        });
      }

      // Add unique actions based on configuration
      const uniqueActions =
        config.uniqueActions
          ?.filter((action) => action.condition(row))
          .map((action) => ({
            key: action.key,
            label: action.label,
            icon: action.icon,
            onClick: () => {
              setSingleSelectedRow(row);
              setOpenModal(action.action);
            },
          })) || [];

      // Map related schemas user can create → dynamic create actions
      const dynamicCreateActions = makeActionsForContext(row.id);

      const deleteAction = {
        key: 'delete',
        label: 'Verwijderen',
        icon: <VISUALS.TRASHCAN />,
        onClick: () => {
          setSingleSelectedRow(row);
          setOpenModal('delete');
        },
      };

      if (isViewOnlyRoute) {
        return baseActions.filter((action) => action.key === 'view');
      }

      return [
        ...baseActions,
        ...publishActions,
        ...uniqueActions,
        ...dynamicCreateActions,
        deleteAction,
      ];
    },
    [config.routeType, config.uniqueActions, navigate, makeActionsForContext]
  );

  // Build table headers with status icon if configured
  const finalTableHeaders = useMemo(() => {
    const headers = [...tableHeaders];

    if (config.statusIcon) {
      headers.unshift({
        id: 'status-icon',
        label: '',
        key: '',
        customContent: config.statusIcon.customContent,
        customHeader: config.statusIcon.customHeader,
      });
    }

    return headers;
  }, [tableHeaders, config.statusIcon]);

  // Memoize modal config to keep identity stable and avoid remount loops in modal factory
  const modalConfig = useMemo(() => {
    if (!config) return null;
    const baseModals = Array.isArray(config.modals) ? config.modals : [];
    const modals = baseModals.includes('dynamicCreate')
      ? baseModals
      : [...baseModals, 'dynamicCreate'];
    return { ...config, modals };
  }, [config]);

  // If no configuration exists for this type, show wrong page
  if (!config) {
    return (
      <AcSection spacing>
        <AcContainer>
          <AcColumn gap='tiger'>
            <AcColumn>
              <Heading>{LABELS.WRONG_PAGE}</Heading>
            </AcColumn>
          </AcColumn>
        </AcContainer>
      </AcSection>
    );
  }

  if (error) {
    return (
      <AcBeheerError title={config.title} error={error.message} store={store} />
    );
  }

  if (schemaError) {
    return (
      <AcBeheerError
        title={config.title}
        error={schemaError.message}
        store={store}
      />
    );
  }

  return (
    <AcSection spacing className='ac-mijn-omgeving-section'>
      <AcFlex spacing='xl'>
        <ConDynamicSidenav store={store} />

        <AcColumn gap='sm' horizontalOverflowWrapper>
          <AcFlex
            className='ac-beheer-heading-container'
            spacing='sm'
            justifyContent='between'
          >
            <Heading>{config.title}</Heading>
            <AcFlex spacing='sm' justifyContent='end'>
              <AcButton
                style='button'
                buttonType={showSearch ? 'primary' : 'secondary'}
                onClick={() => setShowSearch(!showSearch)}
                icon={<VISUALS.SEARCH />}
              />

              <SecondaryActionButton
                onClick={() => filterHeadersDrawerRef.current.showModal()}
              >
                <VISUALS.FILTER />
              </SecondaryActionButton>
              {showManageActions && (
                <>
                  <AcButton
                    style='button'
                    buttonType='primary'
                    onClick={handleCreateClick}
                    icon={<VISUALS.PLUS />}
                  >
                    Toevoegen
                  </AcButton>

                  <ConActionMenu>
                    <ConActionMenu.Trigger icon={<VISUALS.ELLIPSIS />}>
                      Acties
                    </ConActionMenu.Trigger>

                    <ConActionMenu.Menu position='right'>
                      <ConActionMenu.Button
                        icon={<VISUALS.RELOAD />}
                        onClick={() => fetchData()}
                        disabled={loading}
                      >
                        Vernieuwen
                      </ConActionMenu.Button>

                      <ConActionMenu.Divider />

                      <ConActionMenu.SubMenu
                        label='Exporteren'
                        icon={<VISUALS.DOWNLOAD />}
                        position='left'
                      >
                        <ConActionMenu.Button onClick={() => downloadData('csv')}>
                          Als CSV
                        </ConActionMenu.Button>
                        <ConActionMenu.Button onClick={() => downloadData('excel')}>
                          Als Excel
                        </ConActionMenu.Button>
                      </ConActionMenu.SubMenu>

                      <ConActionMenu.Button
                        icon={<VISUALS.UPLOAD />}
                        onClick={() => setOpenModal('import')}
                      >
                        Importeren
                      </ConActionMenu.Button>

                      <ConActionMenu.Button icon={<VISUALS.EYE />} disabled={true}>
                        Weergeven als view
                      </ConActionMenu.Button>

                      <ConActionMenu.Divider />

                      {/* Bulk publish/depublish actions based on selection */}
                      <ConActionMenu.Button
                        icon={<VISUALS.PUBLISH />}
                        onClick={handleMultiplePublish}
                        disabled={
                          selectedRows.length === 0 ||
                          !selectedRows.some((r) => !r['@self']?.published)
                        }
                      >
                        Publiceren
                      </ConActionMenu.Button>

                      <ConActionMenu.Button
                        icon={<VISUALS.PUBLISH_OFF />}
                        onClick={handleMultipleDepublish}
                        disabled={
                          selectedRows.length === 0 ||
                          !selectedRows.some((r) => !!r['@self']?.published)
                        }
                      >
                        Depubliceren
                      </ConActionMenu.Button>

                      <ConActionMenu.Divider />

                      <ConActionMenu.Button
                        icon={<VISUALS.TRASHCAN />}
                        disabled={selectedRows.length === 0}
                        onClick={handleMultipleDelete}
                      >
                        Delete {selectedRows.length}{' '}
                        {selectedRows.length === 1 ? 'item' : 'items'}
                      </ConActionMenu.Button>
                    </ConActionMenu.Menu>
                  </ConActionMenu>
                </>
              )}
            </AcFlex>
          </AcFlex>

          <ConTable
            data={data}
            tableHeaders={[
              ...finalTableHeaders,
              {
                id: 'actions',
                label: 'Acties',
                key: '',
                static: true,
                customContent: (row) => (
                  <ConActionMenu>
                    <ConActionMenu.Trigger
                      icon={<VISUALS.ELLIPSIS />}
                      buttonType='secondary'
                    >
                      Acties
                    </ConActionMenu.Trigger>

                    <ConActionMenu.Menu position='right'>
                      {generateActionButtons(row).map((action) => (
                        <ConActionMenu.Button
                          key={action.key}
                          icon={action.icon}
                          onClick={action.onClick}
                        >
                          {action.label}
                        </ConActionMenu.Button>
                      ))}
                    </ConActionMenu.Menu>
                  </ConActionMenu>
                ),
              },
            ]}
            getSelectedRows={setSelectedRows}
            renderSelectRowButtons={showManageActions}
            ref={tableRef}
            truncateLines={3}
            showSortButtons
            onHeaderSearch={fetchData}
            dataProperties={dataProperties}
            loading={loading || schemaLoading}
            showSearch={showSearch}
            // Names resolution props
            objectStore={object}
            schema={schemaData}
          />

          <AcFlex justifyContent='between' alignItems='center'>
            <Pagination
              totalPages={pagination?.pages}
              page={parseInt(pagination?.page, 10)}
              onPageChange={async (page) => {
                // push new page to the store
                object.setPagination(objectType, {
                  ...object.getPagination(objectType),
                  page,
                });
              }}
              nextLabel=''
              previousLabel=''
              maxVisiblePages={7}
            />

            {pagination?.pages <= 1 && (
              <span className='ac-beheer-pagination-single-page'>
                Pagina 1 van 1
              </span>
            )}

            <ConPaginationLimitSelector
              objectType={config.paginationKey}
              value={limit}
              onChange={setLimit}
            />
          </AcFlex>

          {/* Render modals based on configuration */}
          {BeheerModalFactory.renderModals(type, {
            singleSelectedRow,
            selectedRows,
            openModal,
            setOpenModal,
            setSingleSelectedRow,
            tableRef,
            fetchData,
            store: { object, user }, // Pass store for cross-collection refreshes
            config: modalConfig,
            dynamicCreateTargetType,
            dynamicCreatePreSelected,
            onModalMounted: (modalType) => {
              if (modalType === 'add') {
                openAddModal();
              }
            },
            voorzieningId: new URLSearchParams(window.location.search).get(
              'voorzieningId'
            ),
          })}

          {FilterDrawerFactory.renderFilterDrawer(type, {
            filterHeadersDrawerRef,
            headers,
            defaultHeaders: shouldShowAllHeaders
              ? headers.map((h) => h.id)
              : defaultHeaderIds,
            setTableHeaders,
            loading,
            setBeoordelingFilter,
          })}
        </AcColumn>
      </AcFlex>
    </AcSection>
  );
};

export default withStore(observer(ConGenericBeheerPage));

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcFlex, AcSection, AcContainer } from '@atoms';
import { Heading } from '@utrecht/component-library-react/dist/css-module';
import {
  PrimaryActionButton,
  SecondaryActionButton,
} from '@utrecht/component-library-react';
import { VISUALS, LABELS } from '@constants';
import { NAVIGATE_TO } from '@src/constants/routes.constants';
import { AcSideNav } from '@components';
import { AcBeheerError } from '@views/ac-beheer';
import AcColumn from '@atoms/ac-column/ac-column';
import ConTable from './con-table';
import ConActionMenu from './con-action-menu';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import { Pagination } from '@amsterdam/design-system-react';
import ConPaginationLimitSelector, {
  usePaginationLimit,
} from '../../components/con-pagination-limit-selector/con-pagination-limit-selector';
import BeheerModalFactory from './con-beheer-modal-factory';
import FilterDrawerFactory from './con-filter-drawer-factory';
import BeheerPageConfigFactory from './con-beheer-page-config-factory';
import _ from 'lodash';
import { CanceledError } from 'axios';
import { AcButton } from '@molecules';

/**
 * Generic Beheer Page Component
 * This component can handle all beheer page types through configuration
 */
const ConGenericBeheerPage = ({ store: { object }, type, configOverrides = {} }) => {
  const navigate = useNavigate();
  const [beoordelingFilter, setBeoordelingFilter] = useState(null);
  const [showSearch, setShowSearch] = useState(false);

  const nextcloud = useNextcloudRequests();

  // Get configuration for this type
  const config = useMemo(() => {
    try {
      const baseConfig = BeheerPageConfigFactory.createConfig(type);
      return { ...baseConfig, ...configOverrides };
    } catch (err) {
      // If configuration doesn't exist for this type, return null
      return null;
    }
  }, [type, configOverrides]);

  // Generate object type identifier for the object store
  const objectType = useMemo(() => {
    if (!config) return null;
    return object.getTypeFromRegisterAndSchema(
      config.registerSlug,
      config.schemaSlug
    );
  }, [config, object]);

  // Generate schema type identifier for schema operations
  const schemaType = useMemo(() => {
    if (!config) return null;
    return object.getSchemaType(config.schemaSlug);
  }, [config, object]);

  // Get reactive data from object store
  const data = useMemo(() => {
    if (!objectType) return [];
    return object.getCollection(objectType).results || [];
  }, [objectType, object]);

  const loading = useMemo(() => {
    if (!objectType) return false;
    return object.isLoading(objectType);
  }, [objectType, object]);

  const error = useMemo(() => {
    if (!objectType) return null;
    const storeError = object.getError(objectType);
    return storeError ? { message: storeError } : null;
  }, [objectType, object]);

  const objectStorePagination = useMemo(() => {
    if (!objectType) return { total: 0, page: 1, pages: 0, limit: 20 };
    return object.getPagination(objectType);
  }, [objectType, object]);

  // Get schema properties from object store
  const dataProperties = useMemo(() => {
    if (!schemaType) return [];
    return object.getSchemaProperties(schemaType);
  }, [schemaType, object]);

  const schemaLoading = useMemo(() => {
    if (!schemaType) return false;
    return object.isSchemaLoading(schemaType);
  }, [schemaType, object]);

  const schemaError = useMemo(() => {
    if (!schemaType) return null;
    const storeError = object.getSchemaError(schemaType);
    return storeError ? { message: storeError } : null;
  }, [schemaType, object]);

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

  const fetchData = useCallback(
    async (searchParams = {}) => {
      if (!objectType || !config) {
        return;
      }

      try {
        // Build the extend parameters exactly as before
        const extend = { ...config.extend };
        if (beoordelingFilter) extend.push(['beoordeling', beoordelingFilter]);

        // Convert extend array and searchParams to object format for object store
        const storeParams = {
          _page: pagination.page,
          _limit: pagination.limit,
          '_extend[]': extend,
          ...searchParams,
        };

        // Use object store for collection data - this handles loading/error states automatically
        await object.fetchCollection(
          config.registerSlug,
          config.schemaSlug,
          storeParams
        );

        // Fetch schema using object store
        await object.fetchSchema(config.schemaSlug);
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
      await nextcloud.exportObjects(config.registerSlug, config.schemaSlug, type);
    },
    [config.registerSlug, config.schemaSlug]
  );

  // Cancel all requests and reset state when type changes
  useEffect(() => {
    // Cancel all active requests when switching types
    nextcloud.cancelAllRequests();

    // Reset all state when type changes
    setSelectedRows([]);
    setSingleSelectedRow(null);
    setOpenModal(null);
    setBeoordelingFilter(null);
    setTableHeaders([]);
    setShowSearch(false);
  }, [type]);

  // Fetch data when component is ready and pagination changes
  useEffect(() => {
    if (objectType) {
      // Only fetch when objectType is available
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objectType, pagination.page, pagination.limit]);

  // Handle object store cancellation when objectType changes (separate effect)
  const prevObjectTypeRef = useRef();
  useEffect(() => {
    const prevObjectType = prevObjectTypeRef.current;
    prevObjectTypeRef.current = objectType;

    // Cancel previous objectType requests when switching to a new objectType
    if (prevObjectType && prevObjectType !== objectType) {
      object.cancelRequest(prevObjectType);
    }
  }, [objectType, object]);

  // Refetch data when beoordelingFilter changes
  useEffect(() => {
    if (type === 'organisaties') {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beoordelingFilter]);

  const [selectedRows, setSelectedRows] = useState([]);
  const [singleSelectedRow, setSingleSelectedRow] = useState(null);
  const [openModal, setOpenModal] = useState(null);

  // Generate headers from dataProperties schema
  const headers = useMemo(() => {
    if (!dataProperties) return [];

    return Object.entries(dataProperties)
      .filter(([key, value]) => value.visible !== false)
      .map(([key, value]) => {
        // Check if we have a custom override for this header
        if (config.customHeaders[key]) {
          return config.customHeaders[key];
        }

        // Generate standard header from schema
        return {
          id: key,
          label: _.upperFirst(key),
          key: key,
        };
      });
  }, [dataProperties, config.customHeaders]);

  const [tableHeaders, setTableHeaders] = useState([]);

  useEffect(() => {
    if (headers.length > 0) {
      setTableHeaders(
        headers.filter((header) => config.defaultHeaders.includes(header.id))
      );
    }
  }, [headers, config.defaultHeaders]);

  const handleMultipleDelete = () => {
    setOpenModal('delete');
  };

  // Generate action buttons for table rows
  const generateActionButtons = useCallback(
    (row) => {
      const baseActions = [
        {
          key: 'view',
          label: 'Bekijken',
          icon: <VISUALS.EYE />,
          onClick: () => {
            navigate(NAVIGATE_TO.BEHEER_TYPE_DETAILS(config.routeType, row.id));
          },
        },
        {
          key: 'edit',
          label: 'Bewerken',
          icon: <VISUALS.PENCIL />,
          onClick: () => {
            setSingleSelectedRow(row);
            setOpenModal('edit');
          },
        },
      ];

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

      const deleteAction = {
        key: 'delete',
        label: 'Verwijderen',
        icon: <VISUALS.TRASHCAN />,
        onClick: () => {
          setSingleSelectedRow(row);
          setOpenModal('delete');
        },
      };

      return [...baseActions, ...uniqueActions, deleteAction];
    },
    [config.routeType, config.uniqueActions, navigate]
  );

  if (error) {
    return <AcBeheerError title={config.title} error={error.message} />;
  }

  if (schemaError) {
    return <AcBeheerError title={config.title} error={schemaError.message} />;
  }

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

  return (
    <AcSection spacing className='ac-mijn-omgeving-section'>
      <AcFlex spacing='xl'>
        <AcSideNav />

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

              <AcButton
                style='button'
                buttonType='primary'
                onClick={() => setOpenModal('add')}
                icon={<VISUALS.PLUS />}
              >
                Toevoegen
              </AcButton>

              <ConActionMenu>
                <ConActionMenu.Trigger icon={<VISUALS.ELLIPSIS />}>
                  Acties
                </ConActionMenu.Trigger>

                <ConActionMenu.Menu position='right'>
                  <ConActionMenu.Button icon={<VISUALS.EYE />} disabled={true}>
                    Weergeven als view
                  </ConActionMenu.Button>

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
            renderSelectRowButtons
            ref={tableRef}
            truncateLines={3}
            showSortButtons
            onHeaderSearch={fetchData}
            dataProperties={dataProperties}
            loading={loading || schemaLoading}
            showSearch={showSearch}
          />

          <AcFlex justifyContent='between' alignItems='center'>
            <Pagination
              totalPages={pagination?.pages}
              page={parseInt(pagination?.page, 10)}
              onPageChange={async (page) => {
                const params = {
                  _page: page,
                  _limit: pagination.limit,
                };

                // Add beoordelingFilter if present
                if (beoordelingFilter) {
                  params.beoordeling = beoordelingFilter;
                }

                // Add extend parameters
                const extend = [...config.extend];
                if (beoordelingFilter)
                  extend.push(['beoordeling', beoordelingFilter]);

                extend.forEach(([key, value]) => {
                  if (params[key]) {
                    params[key] = Array.isArray(params[key])
                      ? [...params[key], value]
                      : [params[key], value];
                  } else {
                    params[key] = value;
                  }
                });

                await object.fetchCollection(
                  config.registerSlug,
                  config.schemaSlug,
                  params
                );
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
            config,
            voorzieningId: new URLSearchParams(window.location.search).get(
              'voorzieningId'
            ),
          })}

          {FilterDrawerFactory.renderFilterDrawer(type, {
            filterHeadersDrawerRef,
            headers,
            defaultHeaders: config.defaultHeaders,
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

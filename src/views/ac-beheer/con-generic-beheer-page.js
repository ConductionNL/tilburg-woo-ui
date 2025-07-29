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
import { sortPropertiesByOrder } from '@src/utilities';
import ConPaginationLimitSelector, {
  usePaginationLimit,
} from '../../components/con-pagination-limit-selector/con-pagination-limit-selector';
import BeheerModalFactory from './con-beheer-modal-factory';
import FilterDrawerFactory from './con-filter-drawer-factory';
import BeheerPageConfigFactory from './con-beheer-page-config-factory';
import _ from 'lodash';
import { CanceledError } from 'axios';

/**
 * Generic Beheer Page Component
 * This component can handle all beheer page types through configuration
 */
const ConGenericBeheerPage = ({ type, configOverrides = {} }) => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [dataProperties, setDataProperties] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [beoordelingFilter, setBeoordelingFilter] = useState(null);

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
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 0,
    limit,
    offset: 0,
  });

  // Update pagination when limit changes
  useEffect(() => {
    setPagination((prev) => ({ ...prev, limit }));
  }, [limit]);

  const filterHeadersDrawerRef = useRef(null);
  const tableRef = useRef(null);

  const endpoint = `openregister/api/objects/${config.registerSlug}/${config.schemaSlug}`;
  const schemaEndpoint = `openregister/api/schemas/${config.schemaSlug}`;

  const fetchData = useCallback(
    async (searchParams = {}) => {
      try {
        setLoading(true);

        const extend = [...config.extend];
        if (beoordelingFilter) extend.push(['beoordeling', beoordelingFilter]);

        // create the data request key
        const dataRequestKey = `key_data_${config.routeType}`;
        const schemaRequestKey = `key_schema_${config.schemaSlug}`;

        const [response, schemaResponse] = await Promise.all([
          nextcloud.request(endpoint, {
            params: [
              ...extend,
              ['_page', pagination.page],
              ['_limit', pagination.limit],
              ...Object.entries(searchParams),
            ],
            redirectPath: `/beheer/${config.routeType}`,
            requestKey: dataRequestKey,
          }),
          nextcloud.request(schemaEndpoint, {
            redirectPath: `/beheer/${config.routeType}`,
            requestKey: schemaRequestKey,
          }),
        ]);

        const jsonResponse = response.data;
        const schemaJsonResponse = schemaResponse.data;

        setPagination((prev) => ({
          ...prev,
          total: jsonResponse.total,
          pages: jsonResponse.pages,
          offset: jsonResponse.offset,
        }));

        const data = jsonResponse.results;
        const dataProperties = schemaJsonResponse.properties;

        const errorResponse = jsonResponse.error;

        errorResponse && setError({ message: errorResponse });
        setData(data);
        setDataProperties(sortPropertiesByOrder(dataProperties));
      } catch (err) {
        // Don't set error if request was cancelled
        if (err.code === 'ERR_CANCELED' || err instanceof CanceledError) {
          return;
        }
        console.error('Error fetching data:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [
      pagination.page,
      pagination.limit,
      endpoint,
      schemaEndpoint,
      config.extend,
      config.routeType,
      beoordelingFilter,
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

    setPagination((prev) => ({ ...prev, page: 1 }));
    setSelectedRows([]);
    setSingleSelectedRow(null);
    setOpenModal(null);
    setBeoordelingFilter(null);
    setTableHeaders([]);
    setData([]);
    setDataProperties([]);
    setError(null);
  }, [type]);

  useEffect(() => {
    fetchData();
  }, [pagination.page, pagination.limit]);

  // Refetch data when beoordelingFilter changes
  useEffect(() => {
    if (type === 'organisaties') {
      fetchData();
    }
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
              <SecondaryActionButton
                onClick={() => filterHeadersDrawerRef.current.showModal()}
              >
                <VISUALS.FILTER />
              </SecondaryActionButton>

              <PrimaryActionButton onClick={() => setOpenModal('add')}>
                <VISUALS.PLUS className='ac-button__icon' /> Toevoegen
              </PrimaryActionButton>

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
            loading={loading}
          />

          <AcFlex justifyContent='between' alignItems='center'>
            <Pagination
              totalPages={pagination?.pages}
              page={parseInt(pagination?.page, 10)}
              onPageChange={(page) => {
                setPagination((prev) => ({
                  ...prev,
                  page,
                }));
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

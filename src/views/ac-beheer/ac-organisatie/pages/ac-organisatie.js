import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcFlex, AcSection } from '@atoms';
import {
  Heading,
  SecondaryActionButton,
} from '@utrecht/component-library-react/dist/css-module';
import { PrimaryActionButton } from '@utrecht/component-library-react';
import { VISUALS } from '@constants';
import { NAVIGATE_TO } from '@src/constants/routes.constants';
import { AcSideNav } from '@components';
import { AcBeheerError, AcBeheerLoading } from '@views/ac-beheer';
import AcColumn from '@atoms/ac-column/ac-column';
import ConTable from '../../con-table';
import AcOrganisatieFormModal from '../modals/ac-organisatie-form-modal';
import AcDeleteOrganisatieModal from '../modals/ac-delete-organisatie-modal';
import ConActionMenu from '../../con-action-menu';
import ConFilterHeadersDrawer from '../organisatie-filter-headers-drawer';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import { ConSorterLogic } from '@src/utilities/con-sorter';
import { BASE_URL } from '../../ac-beheer';
import _ from 'lodash';
import AcAcceptOrganizationModal from '../modals/ac-accept-organisation';
import AcBeheerImportModal from '../../import-modal/ac-beheer-import-modal';
import { Pagination } from '@amsterdam/design-system-react';
import { useLaterEffect } from '@src/hooks';
import { sortPropertiesByOrder } from '@src/utilities';
import AcPublishDepublishOrganizationModal from '../modals/ac-publish-depublish-organisation';
import AcAddDeelnameModal from '../modals/ac-add-deelname';
import ConPaginationLimitSelector, {
  usePaginationLimit,
} from '../../../../components/con-pagination-limit-selector/con-pagination-limit-selector';
import { TOOLTIP_ID } from '@src/index.web';
import { AcLink } from '@molecules';

const AcBeheerOrganisaties = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [dataProperties, setDataProperties] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [beoordelingFilter, setBeoordelingFilter] = useState(null);

  const { makeRequest, downloadObjectList } = useNextcloudRequests();

  // Use the custom hook for pagination limit management
  const [limit, setLimit] = usePaginationLimit('organisaties');
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

  const registerSlug = 'voorzieningen';
  const schemaSlug = 'organisatie';
  const endpoint = `openregister/api/objects/${registerSlug}/${schemaSlug}`;

  const schemaEndpoint = `openregister/api/schemas/${schemaSlug}`;

  const fetchSchema = useCallback(async () => {
    try {
      const schemaResponse = await makeRequest(
        `${BASE_URL}/apps/${schemaEndpoint}`,
        null,
        null,
        '/beheer/organisaties'
      );

      const schemaJsonResponse = schemaResponse.data;
      const dataProperties = schemaJsonResponse.properties;
      setDataProperties(sortPropertiesByOrder(dataProperties));
    } catch (err) {
      console.error('Error fetching schema:', err);
      setError(err);
    }
  }, []);

  const fetchData = useCallback(async (searchParams = {}  ) => {
    try {
      setLoading(true);

      const extend = [['_extend[]', 'contactgegevens']];
      if (beoordelingFilter) extend.push(['beoordeling', beoordelingFilter]);

      const response = await makeRequest(
        `${BASE_URL}/apps/${endpoint}`,
        [
          ...extend,
          ['_page', pagination.page],
          ['_limit', pagination.limit],
          ...Object.entries(searchParams),
        ],
        null,
        '/beheer/organisaties'
      );

      const jsonResponse = response.data;
      const data = jsonResponse.results;
      const errorResponse = jsonResponse.error;

      setPagination((prev) => ({
        ...prev,
        total: jsonResponse.total,
        pages: jsonResponse.pages,
        offset: jsonResponse.offset,
      }));

      errorResponse && setError({ message: errorResponse });
      setData(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err);
    }
  }, [
    beoordelingFilter,
    pagination.page,
    pagination.limit,
    makeRequest,
    endpoint,
    BASE_URL,
  ]);

  // Fetch schema and data on component mount
  useEffect(() => {
    fetchSchema();
    fetchData();
  }, []);

  // recall fetchData when beoordelingFilter changes
  useLaterEffect(() => {
    fetchData();
  }, [beoordelingFilter]);

  useLaterEffect(() => {
    fetchData();
  }, [pagination.page, pagination.limit]);

  const downloadData = useCallback(async (type = 'csv') => {
    await downloadObjectList(registerSlug, schemaSlug, type);
  }, []);

  const [selectedRows, setSelectedRows] = useState([]);
  const [singleSelectedRow, setSingleSelectedRow] = useState(null);
  const [openModal, setOpenModal] = useState(null);

  const tableRef = useRef(null);

  // Custom header overrides for special cases
  const customHeaders = useMemo(
    () => ({
      naam: {
        id: 'organizationName',
        label: 'Naam',
        key: 'naam',
        customContent: (row) => {
          return row.naam || row.naam || '-';
        },
        sortComparator: (a, b, direction) => {
          if (direction === null) return 0;
          const aName = a.naam || a.naam || undefined;
          const bName = b.naam || b.naam || undefined;
          return ConSorterLogic(aName, bName, direction);
        },
      },
      contactgegevens: {
        id: 'contactDetails',
        label: 'Contactgegevens',
        key: 'contactgegevens',
        customContent: (row) => {
          if (!row?.contactgegevens) return '-';
          return (
            <AcColumn key={row.id}>
              <span>
                {row.contactgegevens.voornaam} {row.contactgegevens.tussenvoegsel}{' '}
                {row.contactgegevens.achternaam} / {row.contactgegevens.email} /{' '}
                {row.contactgegevens.telefoon}
              </span>
            </AcColumn>
          );
        },
        sortComparator: (a, b, direction) => {
          if (direction === null) return 0;
          const aName = a?.contactgegevens?.voornaam;
          const bName = b?.contactgegevens?.voornaam;
          return ConSorterLogic(aName, bName, direction);
        },
      },
      website: {
        id: 'website',
        label: 'Website',
        key: 'website',
        customContent: (row) => {
          if (!row.website) {
            return '-';
          }

          try {
            const url = new URL(row.website);
            return (
              <AcLink href={url.href} target='_blank'>
                {url.href}
              </AcLink>
            );
          } catch {
            return row.website;
          }
        },
      },
    }),
    []
  );

  // Generate headers from dataProperties schema
  const headers = useMemo(() => {
    if (!dataProperties) return [];

    return Object.entries(dataProperties)
      .filter(([key, value]) => value.visible !== false)
      .map(([key, value]) => {
        // Check if we have a custom override for this header
        if (customHeaders[key]) {
          return customHeaders[key];
        }

        // Generate standard header from schema
        return {
          id: key,
          label: _.upperFirst(key),
          key: key,
        };
      });
  }, [dataProperties, customHeaders]);

  const defaultHeaders = [
    'organizationName',
    'website',
    'beoordeling',
    'e-mailadres',
    'type',
  ];
  const [tableHeaders, setTableHeaders] = useState([]);

  useEffect(() => {
    if (headers.length > 0 && tableHeaders.length === 0) {
      setTableHeaders(
        headers.filter((header) => defaultHeaders.includes(header.id))
      );
    }
  }, [headers, tableHeaders.length]);

  const handleMultipleDelete = () => {
    setOpenModal('delete');
  };

  if (error) {
    return <AcBeheerError title='Beheer Organisaties' error={error.message} />;
  }

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
            <Heading>Beheer Organisaties</Heading>
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
                  <ConActionMenu.Button
                    icon={<VISUALS.EYE />}
                    // disabled={selectedRows.length === 0}
                    disabled={true}
                  >
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
              {
                id: 'status-icon',
                label: '',
                key: '',
                customContent: (row) => (
                  <div className='ac-beheer-organisaties-name-container'>
                    <div
                      className='ac-beheer-organisaties-name-container__icon'
                      data-tooltip-id={TOOLTIP_ID}
                      data-tooltip-content={
                        row['@self'].published ? 'Gepubliceerd' : 'Niet gepubliceerd'
                      }
                    >
                      {row['@self'].published ? (
                        <VISUALS.CIRCLE_CHECK className='ac-beheer-publish-icon__check' />
                      ) : (
                        <VISUALS.CIRCLE_EXCLAMATION className='ac-beheer-publish-icon__exclamation' />
                      )}
                    </div>
                  </div>
                ),
                customHeader: <div className='ac-beheer-organisaties-name-container__icon'></div>,
              },
              ...tableHeaders,
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
                      {row?.beoordeling?.toLowerCase?.() !== 'concept' && (
                        <ConActionMenu.Button
                          icon={<VISUALS.EYE />}
                          onClick={() => {
                            navigate(
                              NAVIGATE_TO.BEHEER_TYPE_DETAILS('organisaties', row.id)
                            );
                          }}
                        >
                          Bekijken
                        </ConActionMenu.Button>
                      )}

                      {row?.beoordeling?.toLowerCase?.() !== 'concept' && (
                        <ConActionMenu.Button
                          icon={<VISUALS.PENCIL />}
                          onClick={() => {
                            setSingleSelectedRow(row);
                            setOpenModal('edit');
                          }}
                        >
                          Bewerken
                        </ConActionMenu.Button>
                      )}

                      {row.beoordeling?.toLowerCase?.() !== 'actief' && (
                        <ConActionMenu.Button
                          icon={<VISUALS.CHECK />}
                          onClick={() => {
                            setSingleSelectedRow(row);
                            setOpenModal('activate');
                          }}
                        >
                          Activeren
                        </ConActionMenu.Button>
                      )}

                      {row.beoordeling?.toLowerCase?.() === 'actief' && (
                        <ConActionMenu.Button
                          icon={<VISUALS.CLOSE />}
                          onClick={() => {
                            setSingleSelectedRow(row);
                            setOpenModal('deactivate');
                          }}
                        >
                          Deactiveren
                        </ConActionMenu.Button>
                      )}

                      {!row['@self'].published &&
                        row?.beoordeling?.toLowerCase?.() !== 'concept' && (
                          <ConActionMenu.Button
                            icon={<VISUALS.PAPER_PLANE />}
                            onClick={() => {
                              setSingleSelectedRow(row);
                              setOpenModal('publish');
                            }}
                          >
                            Publiceren
                          </ConActionMenu.Button>
                        )}

                      {row['@self'].published &&
                        row?.beoordeling?.toLowerCase?.() !== 'concept' && (
                          <ConActionMenu.Button
                            icon={<VISUALS.PAPER_PLANE />}
                            onClick={() => {
                              setSingleSelectedRow(row);
                              setOpenModal('depublish');
                            }}
                          >
                            Depubliceren
                          </ConActionMenu.Button>
                        )}

                      {row?.beoordeling?.toLowerCase?.() !== 'concept' && (
                        <ConActionMenu.Button
                          icon={<VISUALS.PLUS />}
                          onClick={() => {
                            setSingleSelectedRow(row);
                            setOpenModal('addDeelname');
                          }}
                        >
                          Deelname toevoegen
                        </ConActionMenu.Button>
                      )}

                      <ConActionMenu.Button
                        icon={<VISUALS.TRASHCAN />}
                        onClick={() => {
                          setSingleSelectedRow(row);
                          setOpenModal('delete');
                        }}
                      >
                        Verwijderen
                      </ConActionMenu.Button>
                    </ConActionMenu.Menu>
                  </ConActionMenu>
                ),
              },
            ]}
            getSelectedRows={setSelectedRows}
            renderSelectRowButtons
            ref={tableRef}
            truncateLines={4}
            showSortButtons
            loading={loading}
            dataProperties={dataProperties}
            onHeaderSearch={(searchValues) => {
              // Refetch data with search parameters
              fetchData(searchValues);
            }}
          />

          <AcFlex justifyContent='between'>
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

            <ConPaginationLimitSelector
              objectType='organisaties'
              value={limit}
              onChange={setLimit}
            />
          </AcFlex>

          {/* modals */}
          <AcOrganisatieFormModal
            organisatie={singleSelectedRow}
            isEdit={openModal === 'edit'}
            showModal={openModal === 'edit' || openModal === 'add'}
            onClose={() => {
              setOpenModal(null);
              setSingleSelectedRow(null);
            }}
            onSuccess={() => {
              tableRef.current.resetSelectedRows();
              fetchData();
              setOpenModal(null);
            }}
          />

          <AcDeleteOrganisatieModal
            organisaties={singleSelectedRow ? [singleSelectedRow] : selectedRows}
            showModal={openModal === 'delete'}
            onClose={() => {
              setOpenModal(null);
              setSingleSelectedRow(null);
            }}
            onSuccess={() => {
              tableRef.current.resetSelectedRows();
              fetchData();
              setOpenModal(null);
            }}
          />

          <AcAcceptOrganizationModal
            organization={singleSelectedRow}
            showModal={openModal === 'activate' || openModal === 'deactivate'}
            activate={openModal === 'activate'}
            onClose={() => {
              setOpenModal(null);
            }}
            onSuccess={() => {
              fetchData();
              setOpenModal(null);
            }}
          />

          <ConFilterHeadersDrawer
            ref={filterHeadersDrawerRef}
            headers={headers}
            defaultHeaders={defaultHeaders}
            onChange={setTableHeaders}
            getBeoordeling={setBeoordelingFilter}
          />

          <AcBeheerImportModal
            register={registerSlug}
            schema={schemaSlug}
            showModal={openModal === 'import'}
            onClose={() => setOpenModal(null)}
            onSuccess={() => {}}
          />

          <AcPublishDepublishOrganizationModal
            organization={singleSelectedRow}
            showModal={openModal === 'publish' || openModal === 'depublish'}
            publish={openModal === 'publish'}
            onClose={() => {
              setOpenModal(null);
            }}
            onSuccess={() => {
              fetchData();
              setOpenModal(null);
            }}
          />

          <AcAddDeelnameModal
            organization={singleSelectedRow}
            showModal={openModal === 'addDeelname'}
            onClose={() => {
              setOpenModal(null);
            }}
            onSuccess={() => {
              fetchData();
              setOpenModal(null);
            }}
          />
        </AcColumn>
      </AcFlex>
    </AcSection>
  );
};

export default withStore(observer(AcBeheerOrganisaties));

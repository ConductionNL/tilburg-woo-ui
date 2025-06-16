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
import AcGebruikenFormModal from '../modals/ac-gebruiken-form-modal';
import AcDeleteGebruikenModal from '../modals/ac-delete-gebruiken-modal';
import ConActionMenu from '../../con-action-menu';
import ConFilterHeadersDrawer from '../../con-filter-headers-drawer';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import { ConSorterLogic } from '@src/utilities/con-sorter';
import { BASE_URL } from '../../ac-beheer';
import _ from 'lodash';
import AcBeheerImportModal from '../../import-modal/ac-beheer-import-modal';
import { Pagination } from '@amsterdam/design-system-react';
import { sortPropertiesByOrder } from '@src/utilities';

const AcBeheerGebruiken = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const showCreateModal = searchParams.get('showCreateModal');
  const voorzieningId = searchParams.get('voorzieningId');

  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [dataProperties, setDataProperties] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 0,
    limit: 5,
    offset: 0,
  });

  const { makeRequest, downloadObjectList } = useNextcloudRequests();

  const [selectedRows, setSelectedRows] = useState([]);
  const [singleSelectedRow, setSingleSelectedRow] = useState(null);
  const [openModal, setOpenModal] = useState(null);

  const filterHeadersDrawerRef = useRef(null);
  const tableRef = useRef(null);

  useEffect(() => {
    if (showCreateModal) {
      setOpenModal('add');
    }
  }, [showCreateModal]);

  const registerSlug = 'voorzieningen';
  const schemaSlug = 'voorzieninggebruik';
  const endpoint = `openregister/api/objects/${registerSlug}/${schemaSlug}`;

  const schemaEndpoint = `openregister/api/schemas/${schemaSlug}`;

  const extend = [
    ['_extend[]', 'voorzieningId'],
    ['_extend[]', 'organisatieId'],
  ];

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [response, schemaResponse] = await Promise.all([
        makeRequest(
          `${BASE_URL}/apps/${endpoint}`,
          [...extend, ['_page', pagination.page], ['_limit', pagination.limit]],
          null,
          '/beheer/gebruiken'
        ),
        makeRequest(
          `${BASE_URL}/apps/${schemaEndpoint}`,
          extend,
          null,
          '/beheer/gebruiken'
        ),
      ]);

      const jsonResponse = response.data;
      const schemaJsonResponse = schemaResponse.data;

      setPagination((prev) => ({
        ...prev,
        total: jsonResponse.total,
        pages: jsonResponse.pages,
        offset: jsonResponse.offset,
      }));

      setLoading(false);

      const data = jsonResponse.results;
      const dataProperties = schemaJsonResponse.properties;

      const errorResponse = jsonResponse.error;

      errorResponse && setError({ message: errorResponse });
      setData(data);
      setDataProperties(sortPropertiesByOrder(dataProperties));
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [pagination.page, pagination.limit]);

  const downloadData = useCallback(async (type = 'csv') => {
    await downloadObjectList(registerSlug, schemaSlug, type);
  }, []);

  // Custom header overrides for special cases
  const customHeaders = useMemo(
    () => ({
      versieId: {
        id: 'versionId',
        label: 'Versie ID',
        key: 'versieId',
        customContent: (row) => {
          return row?.versieId?.id ?? row?.versieId ?? '-';
        },
      },
      organisatieId: {
        id: 'organisatieId',
        label: 'Organisatie',
        key: 'organisatieId',
        customContent: (row) => {
          return (
            <AcColumn key={row.id}>
              <span>{row?.organisatieId?.naam ?? '-'}</span>
            </AcColumn>
          );
        },
      },
      voorzieningId: {
        id: 'voorzieningId',
        label: 'Voorziening',
        key: 'voorzieningId',
        customContent: (row) => {
          return (
            <AcColumn key={row.id}>
              <span>{row?.voorzieningId?.naam ?? '-'}</span>
            </AcColumn>
          );
        },
      },
      beheerder: {
        id: 'beheerderNaam',
        label: 'Beheerder naam',
        key: 'beheerder',
        customContent: (row) => {
          return row?.beheerder?.naam || '-';
        },
        sortComparator: (a, b, direction) => {
          if (direction === null) return 0;
          return ConSorterLogic(a?.beheerder?.naam, b?.beheerder?.naam, direction);
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

  const defaultHeaders = ['id', 'versionId', 'eindDatum', 'status'];
  const [tableHeaders, setTableHeaders] = useState([]);

  useEffect(() => {
    if (headers.length > 0) {
      setTableHeaders(
        headers.filter((header) => defaultHeaders.includes(header.id))
      );
    }
  }, [headers]);

  const handleMultipleDelete = () => {
    setOpenModal('delete');
  };

  if (error) {
    return <AcBeheerError title='Beheer Gebruiken' error={error.message} />;
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
            <Heading>Beheer Gebruiken</Heading>
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
                    label='Download'
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
                      <ConActionMenu.Button
                        icon={<VISUALS.EYE />}
                        onClick={() => {
                          navigate(
                            NAVIGATE_TO.BEHEER_TYPE_DETAILS('gebruiken', row.id)
                          );
                        }}
                      >
                        Bekijken
                      </ConActionMenu.Button>

                      <ConActionMenu.Button
                        icon={<VISUALS.PENCIL />}
                        onClick={() => {
                          setSingleSelectedRow(row);
                          setOpenModal('edit');
                        }}
                      >
                        Bewerken
                      </ConActionMenu.Button>

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
            truncateLines={3}
            showSortButtons
            loading={loading}
          />

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

          {/* modals */}
          <AcGebruikenFormModal
            gebruik={singleSelectedRow}
            isEdit={openModal === 'edit'}
            preSelectedVoorzieningId={voorzieningId}
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

          <AcDeleteGebruikenModal
            gebruiken={singleSelectedRow ? [singleSelectedRow] : selectedRows}
            showModal={openModal === 'delete'}
            onClose={() => {
              setOpenModal(null);
              setSingleSelectedRow(null);
            }}
            onSuccess={() => {
              tableRef.current.resetSelectedRows();
              fetchData();
            }}
          />

          <ConFilterHeadersDrawer
            ref={filterHeadersDrawerRef}
            headers={headers}
            defaultHeaders={defaultHeaders}
            onChange={setTableHeaders}
          />

          <AcBeheerImportModal
            register={registerSlug}
            schema={schemaSlug}
            showModal={openModal === 'import'}
            onClose={() => setOpenModal(null)}
            onSuccess={() => {}}
          />
        </AcColumn>
      </AcFlex>
    </AcSection>
  );
};

export default withStore(observer(AcBeheerGebruiken));

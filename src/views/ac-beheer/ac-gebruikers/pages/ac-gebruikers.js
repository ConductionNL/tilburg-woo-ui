import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcFlex, AcSection } from '@atoms';
import {
  Heading,
  SecondaryActionButton,
} from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@constants';
import { NAVIGATE_TO } from '@src/constants/routes.constants';
import { AcSideNav } from '@components';
import { AcBeheerError, AcBeheerLoading } from '@views/ac-beheer';
import AcColumn from '@atoms/ac-column/ac-column';
import ConTable from '../../con-table';
import AcGebruikerFormModal from '../modals/ac-gebruikers-form-modal';
import AcDeleteGebruikerModal from '../modals/ac-delete-gebruikers-modal';
import ConActionMenu from '../../con-action-menu';
import ConFilterHeadersDrawer from '../../con-filter-headers-drawer';
import { ConSorterLogic } from '@src/utilities/con-sorter';
import { BASE_URL } from '../../ac-beheer';
import { AcButton } from '@src/molecules';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import AcBeheerImportModal from '../../import-modal/ac-beheer-import-modal';

const AcBeheerGebruikers = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [dataProperties, setDataProperties] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [selectedRows, setSelectedRows] = useState([]);
  const [singleSelectedRow, setSingleSelectedRow] = useState(null);
  const [openModal, setOpenModal] = useState(null);

  const { makeRequest, downloadObjectList } = useNextcloudRequests();

  const filterHeadersDrawerRef = useRef(null);

  const registerSlug = 'voorzieningen';
  const schemaSlug = 'gebruiker';
  const endpoint = `openregister/api/objects/${registerSlug}/${schemaSlug}`;

  const schemaEndpoint = `openregister/api/schemas/${schemaSlug}`;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [response, schemaResponse] = await Promise.all([
        makeRequest(`${BASE_URL}/apps/${endpoint}`, null, null, '/beheer/diensten'),
        makeRequest(
          `${BASE_URL}/apps/${schemaEndpoint}`,
          null,
          null,
          '/beheer/diensten'
        ),
      ]);

      const jsonResponse = response.data;
      const schemaJsonResponse = schemaResponse.data;

      const data = jsonResponse.results;
      const dataProperties = schemaJsonResponse.properties;

      const errorResponse = jsonResponse.error;

      errorResponse && setError({ message: errorResponse });
      setData(data);
      setDataProperties(dataProperties);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const downloadData = useCallback(async (type = 'csv') => {
    await downloadObjectList(registerSlug, schemaSlug, type);
  }, []);

  const tableRef = useRef(null);

  // Custom header overrides for special cases
  const customHeaders = useMemo(
    () => ({
      voornaam: {
        id: 'name',
        label: 'Naam',
        key: 'voornaam',
        customContent: (row) => `${row.voornaam} ${row.achternaam}`,
      },
      actief: {
        id: 'status',
        label: 'Status',
        key: 'actief',
        customContent: (row) => <span>{row.actief ? 'Actief' : 'Inactief'}</span>,
      },
      voorkeuren: {
        id: 'preferences',
        label: 'Voorkeuren',
        key: 'voorkeuren',
        customContent: (row) => {
          if (!row?.voorkeuren) return '-';
          return `Taal: ${row.voorkeuren.taal}, Thema: ${row.voorkeuren.thema}`;
        },
        sortComparator: (a, b, direction) => {
          if (direction === null) return 0;
          return ConSorterLogic(a?.voorkeuren?.taal, b?.voorkeuren?.taal, direction);
        },
      },
    }),
    []
  );

  // Generate headers from dataProperties schema
  const headers = useMemo(() => {
    if (!dataProperties) return [];

    const schemaHeaders = Object.entries(dataProperties)
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
      })
      .flat(); // flatten the array of arrays

    return schemaHeaders;
  }, [dataProperties, customHeaders]);

  const defaultHeaders = ['name', 'status', 'lastActivity', 'email'];
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
    return <AcBeheerError title='Beheer Gebruikers' error={error.message} />;
  }

  if (loading) {
    return <AcBeheerLoading title='Beheer Gebruikers' />;
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
            <Heading>Beheer Gebruikers</Heading>
            <AcFlex spacing='sm' justifyContent='end'>
              <SecondaryActionButton
                onClick={() => filterHeadersDrawerRef.current.showModal()}
              >
                <VISUALS.FILTER />
              </SecondaryActionButton>

              <AcButton
                style='button'
                icon={<VISUALS.PLUS />}
                onClick={() => setOpenModal('add')}
              >
                Toevoegen
              </AcButton>

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
                  <AcFlex column spacing='xs'>
                    <button
                      className='utrecht-button slim'
                      variant='secondary'
                      onClick={() => {
                        navigate(
                          NAVIGATE_TO.BEHEER_TYPE_DETAILS('gebruikers', row.id)
                        );
                      }}
                    >
                      <VISUALS.EYE className='ac-button__icon' /> Bekijken
                    </button>
                    <button
                      className='utrecht-button slim'
                      variant='secondary'
                      onClick={() => {
                        setSingleSelectedRow(row);
                        setOpenModal('edit');
                      }}
                    >
                      <VISUALS.PENCIL className='ac-button__icon' /> Bewerken
                    </button>
                    <button
                      className='utrecht-button slim'
                      variant='secondary'
                      onClick={() => {
                        setSingleSelectedRow(row);
                        setOpenModal('delete');
                      }}
                    >
                      <VISUALS.TRASHCAN className='ac-button__icon' /> Verwijderen
                    </button>
                  </AcFlex>
                ),
              },
            ]}
            getSelectedRows={setSelectedRows}
            renderSelectRowButtons
            ref={tableRef}
            truncateLines={3}
            showSortButtons
          />

          {/* modals */}
          <AcGebruikerFormModal
            gebruiker={singleSelectedRow}
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

          <AcDeleteGebruikerModal
            gebruikers={singleSelectedRow ? [singleSelectedRow] : selectedRows}
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

export default withStore(observer(AcBeheerGebruikers));

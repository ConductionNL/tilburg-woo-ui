import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcFlex, AcSection } from '@atoms';
import { Heading } from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@constants';
import { NAVIGATE_TO } from '@src/constants/routes.constants';
import { AcSideNav } from '@components';
import { AcBeheerError, AcBeheerLoading } from '@views/ac-beheer';
import { SecondaryActionButton } from '@utrecht/component-library-react';
import AcColumn from '@atoms/ac-column/ac-column';
import ConTable from '../../con-table';
import AcDienstFormModal from '../modals/ac-dienst-form-modal';
import AcDeleteDienstModal from '../modals/ac-delete-dienst-modal';
import ConActionMenu from '../../con-action-menu';
import { AcButton } from '@src/molecules';
import ConFilterHeadersDrawer from '../../con-filter-headers-drawer';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import { ConSorterLogic } from '@src/utilities/con-sorter';

const AcBeheerDienst = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { makeRequest } = useNextcloudRequests();

  const filterHeadersDrawerRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const response = await makeRequest(
        'https://vng.test.commonground.nu/apps/openregister/api/objects/voorzieningaanbod/voorzieningaanbod',
        [
          ['_extend[]', 'voorziening'],
          ['_extend[]', 'leverancier'],
        ],
        null,
        '/beheer/voorzieningen-aanbod'
      ).finally(() => setLoading(false));

      const jsonResponse = await response.json();

      const data = jsonResponse.results;

      const errorResponse = jsonResponse.error;

      errorResponse && setError({ message: errorResponse });
      setData(data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const [selectedRows, setSelectedRows] = useState([]);
  const [singleSelectedRow, setSingleSelectedRow] = useState(null);
  const [openModal, setOpenModal] = useState(null);

  const tableRef = useRef(null);

  const headers = [
    // TODO: name is to be removed - https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/VNG-Realisatie/Softwarecatalogus/refs/heads/documentation/website/static/api/voorzieningen-api-specification.json#schema/Voorzieningaanbod
    // {
    //   id: 'name',
    //   label: 'Naam',
    //   key: 'naam',
    // },
    {
      id: 'voorzieningName',
      label: 'Voorziening naam',
      key: '',
      customContent: (row) => {
        return row?.voorziening?.naam || '-';
      },
      sortComparator: (a, b, direction) => {
        if (direction === null) return 0;

        const nameA = a?.voorziening?.naam || '';
        const nameB = b?.voorziening?.naam || '';

        return ConSorterLogic(nameA, nameB, direction);
      },
    },
    {
      id: 'leverancierId',
      label: 'Leverancier ID',
      key: '',
      customContent: (row) => {
        return row?.leverancier?.id || '-';
      },
      sortComparator: (a, b, direction) => {
        if (direction === null) return 0;

        const idA = a?.leverancier?.id || '';
        const idB = b?.leverancier?.id || '';

        return ConSorterLogic(idA, idB, direction);
      },
    },
    {
      id: 'email',
      label: 'Email',
      key: '',
      customContent: (row) => {
        return row?.leverancier?.contactgegevens?.email || '-';
      },
      sortComparator: (a, b, direction) => {
        if (direction === null) return 0;

        const emailA = a?.leverancier?.contactgegevens?.email || '';
        const emailB = b?.leverancier?.contactgegevens?.email || '';

        return ConSorterLogic(emailA, emailB, direction);
      },
    },
    {
      id: 'ondersteunendeStandaarden',
      label: 'Ondersteunende standaard',
      key: 'ondersteundeStandaarden',
      customContent: (row) => {
        if (!row?.ondersteundeStandaarden) return 'N/A';
        if (!row?.ondersteundeStandaarden?.length) return '-';
        return row?.ondersteundeStandaarden?.map((standaard) => {
          return (
            <AcColumn key={standaard.id}>
              <span>
                {standaard.naam} / {standaard.status}
              </span>
            </AcColumn>
          );
        });
      },
      sortComparator: (a, b, direction) => {
        if (direction === null) return 0;

        const aName = a.ondersteundeStandaarden[0].naam;
        const bName = b.ondersteundeStandaarden[0].naam;

        return ConSorterLogic(aName, bName, direction);
      },
    },
    {
      id: 'productPage',
      label: 'Productpagina',
      key: 'productpagina',
    },
    {
      id: 'supportOptions',
      label: 'Ondersteuningsopties',
      key: 'ondersteuningsopties',
    },
    {
      id: 'priceModel',
      label: 'Prijsmodel',
      key: 'prijsmodel',
    },
    {
      id: 'certifications',
      label: 'Certificeringen',
      key: 'certificeringen',
    },
  ];
  const defaultHeaders = ['name', 'voorzieningName', 'email', 'productPage'];
  const [tableHeaders, setTableHeaders] = useState(
    headers.filter((header) => defaultHeaders.includes(header.id))
  );

  const handleMultipleDelete = () => {
    setOpenModal('delete');
  };

  if (error) {
    return <AcBeheerError title='Beheer Dienst' error={error.message} />;
  }

  if (loading) {
    return <AcBeheerLoading title='Beheer Dienst' />;
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
            <Heading>Beheer Dienst</Heading>
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
                    disabled={selectedRows.length === 0}
                    icon={<VISUALS.DOWNLOAD />}
                    position='left'
                  >
                    <ConActionMenu.Button disabled>Als CSV</ConActionMenu.Button>
                    <ConActionMenu.Button disabled>Als XML</ConActionMenu.Button>
                    <ConActionMenu.Button disabled>Als AFML</ConActionMenu.Button>
                  </ConActionMenu.SubMenu>

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
                          NAVIGATE_TO.BEHEER_TYPE_DETAILS('diensten', row.id)
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
          <AcDienstFormModal
            dienst={singleSelectedRow}
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

          <AcDeleteDienstModal
            diensten={singleSelectedRow ? [singleSelectedRow] : selectedRows}
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
        </AcColumn>
      </AcFlex>
    </AcSection>
  );
};

export default withStore(observer(AcBeheerDienst));

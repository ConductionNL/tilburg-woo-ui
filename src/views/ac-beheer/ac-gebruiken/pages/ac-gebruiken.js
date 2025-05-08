import { useCallback, useEffect, useRef, useState } from 'react';
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

const AcBeheerGebruiken = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { makeRequest } = useNextcloudRequests();

  const filterHeadersDrawerRef = useRef(null);

  const endpoint = BASE_URL.includes('test')
    ? 'openregister/api/objects/voorzieninggebruik/voorzieninggebruik'
    : 'openconnector/api/endpoint/voorzieninggebruiken';

  const extend = BASE_URL.includes('test')
    ? [['_extend[]', 'voorzieningId'], ['_extend[]', 'organisatieId']]
    : [];

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const response = await makeRequest(
        `${BASE_URL}/apps/${endpoint}`,
        extend,
        null,
        '/beheer/gebruiken'
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
    {
      id: 'id',
      label: 'Id',
      key: 'id',
    },
    {
      id: 'versionId',
      label: 'Versie ID',
      key: 'versieId',
      customContent: (row) => {
        return row?.versieId?.id ?? row?.versieId ?? '-';
      },
    },
    {
      id: 'status',
      label: 'Status',
      key: 'status',
    },
    {
      id: 'opmerkingen',
      label: 'Opmerkingen',
      key: 'opmerkingen',
    },
    {
      id: 'bedrijfsKritisch',
      label: 'Bedrijfs kritisch',
      key: 'bedrijfsKritisch',
    },
    {
      id: 'privacyGevoelig',
      label: 'Privacy gevoelig',
      key: 'privacyGevoelig',
    },
    {
      id: 'bbnScore',
      label: 'BBN Score',
      key: 'bbnScore',
    },
    {
      id: 'ibpScore',
      label: 'IBP Score',
      key: 'ibpScore',
    },
    {
      id: 'startDate',
      label: 'Start datum',
      key: 'startDatum',
    },
    {
      id: 'endDate',
      label: 'Eind datum',
      key: 'eindDatum',
    },
    {
      id: 'organisatie',
      label: 'Organisatie',
      key: 'organisatie',
      customContent: (row) => {
        return (
          <AcColumn key={row.id}>
            <span>{row?.organisatieId?.organisatienaam ?? '-'}</span>
          </AcColumn>
        );
      },
    },
    {
      id: 'voorziening',
      label: 'Voorziening',
      key: 'voorziening',
      customContent: (row) => {
        return (
          <AcColumn key={row.id}>
            <span>{row?.voorzieningId?.naam ?? '-'}</span>
          </AcColumn>
        );
      },
    },
    {
      id: 'beheerderNaam',
      label: 'Beheerder naam',
      key: '',
      customContent: (row) => {
        return row?.beheerder?.naam || '-';
      },
      sortComparator: (a, b, direction) => {
        if (direction === null) return 0;
        return ConSorterLogic(a?.beheerder?.naam, b?.beheerder?.naam, direction);
      },
    },
  ];
  const defaultHeaders = ['id', 'versionId', 'endDate', 'status'];
  const [tableHeaders, setTableHeaders] = useState(
    headers.filter((header) => defaultHeaders.includes(header.id))
  );

  const handleMultipleDelete = () => {
    setOpenModal('delete');
  };

  if (error) {
    return <AcBeheerError title='Beheer Gebruiken' error={error.message} />;
  }

  if (loading) {
    return <AcBeheerLoading title='Beheer Gebruiken' />;
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
                          NAVIGATE_TO.BEHEER_TYPE_DETAILS('gebruiken', row.id)
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
          <AcGebruikenFormModal
            gebruik={singleSelectedRow}
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
        </AcColumn>
      </AcFlex>
    </AcSection>
  );
};

export default withStore(observer(AcBeheerGebruiken));

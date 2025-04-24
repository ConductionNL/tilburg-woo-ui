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
import AcGebruikerFormModal from '../modals/ac-gebruikers-form-modal';
import AcDeleteGebruikerModal from '../modals/ac-delete-gebruikers-modal';
import ConActionMenu from '../../con-action-menu';
import ConFilterHeadersDrawer from '../../con-filter-headers-drawer';

const AcBeheerGebruikers = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const filterHeadersDrawerRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch(
        //   config.authentication.baseURL +
        'https://vng.accept.commonground.nu/apps' +
          '/openconnector/api/endpoint/gebruikers'
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
      id: 'name',
      label: 'Naam',
      key: 'voornaam',
      customContent: (row) => `${row.voornaam} ${row.achternaam}`,
    },
    {
      id: 'status',
      label: 'Status',
      key: 'actief',
      customContent: (row) => <span>{row.actief ? 'Actief' : 'Inactief'}</span>,
    },
    {
      id: 'active',
      label: 'Actief',
      key: 'actief',
    },
    {
      id: 'lastActivity',
      label: 'Laatste activiteit',
      key: 'laatsteInlogdatum',
    },
    {
      id: 'email',
      label: 'Email',
      key: 'email',
    },
    {
      id: 'phoneNumber',
      label: 'Telefoonnummer',
      key: 'telefoonnummer',
    },
    {
      id: 'username',
      label: 'Username',
      key: 'username',
    },
    {
      id: 'functie',
      label: 'Functie',
      key: 'functie',
    },
    {
      id: 'organisatie',
      label: 'Organisatie',
      key: 'organisatie',
    },
    {
      id: 'preferences',
      label: 'Voorkeuren',
      key: 'voorkeuren',
    },
    {
      id: 'rollen',
      label: 'Rollen',
      key: 'rollen',
    },
    {
      id: 'createdAt',
      label: 'Aanmaakdatum',
      key: 'aanmaakdatum',
    },
    {
      id: 'updatedAt',
      label: 'Wijzigingsdatum',
      key: 'wijzigingsdatum',
    },
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
              navigate(NAVIGATE_TO.BEHEER_TYPE_DETAILS('gebruikers', row.id));
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
  ];
  const defaultHeaders = ['name', 'status', 'lastActivity', 'email', 'actions'];
  const [tableHeaders, setTableHeaders] = useState(
    headers.filter((header) => defaultHeaders.includes(header.id))
  );

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
            tableHeaders={tableHeaders}
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
        </AcColumn>
      </AcFlex>
    </AcSection>
  );
};

export default withStore(observer(AcBeheerGebruikers));

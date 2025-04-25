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
import AcVoorzieningGebruikFormModal from '../modals/ac-voorziening-gebruik-form-modal';
import AcDeleteVoorzieningGebruikModal from '../modals/ac-delete-voorziening-gebruik-modal';
import ConActionMenu from '../../con-action-menu';
import ConFilterHeadersDrawer from '../../con-filter-headers-drawer';
import { getCookie } from '@src/utilities';

const AcBeheerVoorzieningenGebruik = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const filterHeadersDrawerRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const accessToken = getCookie('nextcloud_access_token');

      if (!accessToken) {
        navigate(`/login?redirect_url=/beheer/voorzieningen-gebruik`);
        return;
      }

      const response = await fetch(
        //   config.authentication.baseURL +
        'https://vng.test.commonground.nu/apps' +
          '/openregister/api/objects/10/17',
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
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
      label: 'Versie Id',
      key: 'versieId',
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
      id: 'organisatieId',
      label: 'Organisatie ID',
      key: 'organisatieId',
    },
    {
      id: 'voorzieningId',
      label: 'Voorziening ID',
      key: 'voorzieningId',
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
        return direction
          ? a?.beheerder?.naam.localeCompare(b?.beheerder?.naam)
          : b?.beheerder?.naam.localeCompare(a?.beheerder?.naam);
      },
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
              navigate(
                NAVIGATE_TO.BEHEER_TYPE_DETAILS('voorzieningen-gebruik', row.id)
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
  ];
  const defaultHeaders = ['id', 'versionId', 'endDate', 'status', 'actions'];
  const [tableHeaders, setTableHeaders] = useState(
    headers.filter((header) => defaultHeaders.includes(header.id))
  );

  const handleMultipleDelete = () => {
    setOpenModal('delete');
  };

  if (error) {
    return (
      <AcBeheerError title='Beheer Voorzieningen Gebruik' error={error.message} />
    );
  }

  if (loading) {
    return <AcBeheerLoading title='Beheer Voorzieningen Gebruik' />;
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
            <Heading>Beheer Voorzieningen Gebruik</Heading>
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
          <AcVoorzieningGebruikFormModal
            voorziening={singleSelectedRow}
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

          <AcDeleteVoorzieningGebruikModal
            voorzieningen={singleSelectedRow ? [singleSelectedRow] : selectedRows}
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

export default withStore(observer(AcBeheerVoorzieningenGebruik));

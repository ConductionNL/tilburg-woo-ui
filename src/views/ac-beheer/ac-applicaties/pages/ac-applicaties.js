import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcFlex, AcSection } from '@atoms';
import { Heading } from '@utrecht/component-library-react/dist/css-module';
import {
  PrimaryActionButton,
  SecondaryActionButton,
} from '@utrecht/component-library-react';
import { VISUALS } from '@constants';
import { NAVIGATE_TO } from '@src/constants/routes.constants';
import { AcDrawer, AcSideNav } from '@components';
import { AcBeheerError, AcBeheerLoading } from '@views/ac-beheer';
import AcColumn from '@atoms/ac-column/ac-column';
import ConTable from '../../con-table';
import AcApplicatiesFormModal from '../modals/ac-applicaties-form-modal';
import AcDeleteApplicatiesModal from '../modals/ac-delete-applicaties-modal';
import ConActionMenu from '../../con-action-menu';
import ConFilterHeadersDrawer from '../../con-filter-headers-drawer';
import { getCookie } from '@src/utilities';

const AcBeheerApplicaties = () => {
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
        navigate(`/login?redirect_url=/beheer/voorzieningen`);
        return;
      }

      const response = await fetch(
        //   config.authentication.baseURL +
        'https://vng.test.commonground.nu/apps' +
          '/openregister/api/objects/voorzieningen/voorziening',
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
      id: 'name',
      label: 'Naam',
      key: 'naam',
    },
    {
      id: 'description',
      label: 'Beschrijving',
      key: 'beschrijving',
    },
    {
      id: 'category',
      label: 'Categorie',
      key: 'categorie',
    },
    {
      id: 'functionalities',
      label: 'Functionaliteiten',
      key: 'functionaliteiten',
    },
    {
      id: 'targetGroup',
      label: 'Doelgroep',
      key: 'doelgroep',
    },
    {
      id: 'referenceComponents',
      label: 'Referentie componenten',
      key: 'referentieComponenten',
    },
    {
      id: 'standards',
      label: 'Standaarden',
      key: 'standaarden',
    },
    {
      id: 'voorzieningstype',
      label: 'Voorzienings type',
      key: 'voorzieningstype',
    },
  ];
  const defaultHeaders = [
    'name',
    'referenceComponents',
    'standards',
    'category',
    'links',
  ];
  const [tableHeaders, setTableHeaders] = useState(
    headers.filter((header) => defaultHeaders.includes(header.id))
  );

  const handleMultipleDelete = () => {
    setOpenModal('delete');
  };

  if (error) {
    return <AcBeheerError title='Beheer Applicaties' error={error.message} />;
  }

  if (loading) {
    return <AcBeheerLoading title='Beheer Applicaties' />;
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
            <Heading>Beheer Applicaties</Heading>
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
                          NAVIGATE_TO.BEHEER_TYPE_DETAILS('applicaties', row.id)
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
          <AcApplicatiesFormModal
            applicatie={singleSelectedRow}
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

          <AcDeleteApplicatiesModal
            applicaties={singleSelectedRow ? [singleSelectedRow] : selectedRows}
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

export default withStore(observer(AcBeheerApplicaties));

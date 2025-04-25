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
import AcVoorzieningAanbodFormModal from '../modals/ac-voorziening-aanbod-form-modal';
import AcDeleteVoorzieningAanbodModal from '../modals/ac-delete-voorziening-aanbod-modal';
import ConActionMenu from '../../con-action-menu';
import { AcButton } from '@src/molecules';
import ConFilterHeadersDrawer from '../../con-filter-headers-drawer';
import { getCookie } from '@src/utilities';

const AcBeheerVoorzieningenAanbod = () => {
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
        navigate(`/login?redirect_url=/beheer/voorzieningen-aanbod`);
        return;
      }

      const response = await fetch(
        //   config.authentication.baseURL +
        'https://vng.test.commonground.nu/apps' +
          '/openregister/api/objects/5/12',
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
    // TODO: name is to be removed - https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/VNG-Realisatie/Softwarecatalogus/refs/heads/documentation/website/static/api/voorzieningen-api-specification.json#schema/Voorzieningaanbod
    {
      id: 'name',
      label: 'Naam',
      key: 'naam',
    },
    {
      id: 'voorzieningName',
      label: 'Voorziening naam',
      key: '',
      customContent: (row) => {
        // TODO: replace with actual voorziening name
        return row.voorzieningId;
      },
      sortComparator: (a, b, direction) => {
        if (direction === null) return 0;
        return direction
          ? // TODO: voorzieningId should become an voorziening name
            a.voorzieningId.localeCompare(b.voorzieningId)
          : b.voorzieningId.localeCompare(a.voorzieningId);
      },
    },
    {
      id: 'leverancierId',
      label: 'Leverancier ID',
      key: '',
      customContent: (row) => {
        // TODO: replace with actual voorziening name
        return row?.leverancier?.id || '-';
      },
      sortComparator: (a, b, direction) => {
        if (direction === null) return 0;
        return direction
          ? a?.leverancier?.id.localeCompare(b?.leverancier?.id)
          : b?.leverancier?.id.localeCompare(a?.leverancier?.id);
      },
    },
    {
      id: 'email',
      label: 'Email',
      key: '',
      customContent: (row) => {
        // TODO: replace with actual email
        return row.organisatieId;
      },
      sortComparator: (a, b, direction) => {
        if (direction === null) return 0;
        return direction
          ? // TODO: organisatieId should become an email
            a.organisatieId.localeCompare(b.organisatieId)
          : b.organisatieId.localeCompare(a.organisatieId);
      },
    },
    {
      id: 'ondersteunendeStandaarden',
      label: 'Ondersteunende standaard',
      key: 'ondersteundeStandaarden',
      customContent: (row) => {
        if (!row?.ondersteundeStandaarden) return 'N/A';
        if (!row.ondersteundeStandaarden.length) return '-';
        return `${row.ondersteundeStandaarden[0].naam} / ${row.ondersteundeStandaarden[0].status}`;
      },
      sortComparator: (a, b, direction) => {
        if (direction === null) return 0;
        return direction
          ? a.ondersteundeStandaarden.naam.localeCompare(
              b.ondersteundeStandaarden.naam
            )
          : b.ondersteundeStandaarden.naam.localeCompare(
              a.ondersteundeStandaarden.naam
            );
      },
    },
    {
      id: 'description',
      label: 'Omschrijving',
      key: 'omschrijving',
    },
    {
      id: 'type',
      label: 'Type',
      key: 'type',
    },
    {
      id: 'voorzieningId',
      label: 'Voorziening ID',
      key: 'voorzieningId',
    },
    {
      id: 'organisationId',
      label: 'Organisatie ID',
      key: 'organisatieId',
    },
    {
      id: 'productPage',
      label: 'Productpagina',
      key: 'productpagina',
    },
    {
      id: 'supportModel',
      label: 'Ondersteuningsmodel',
      key: 'ondersteuningsmodel',
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
      id: 'licenseModel',
      label: 'Licentiemodel',
      key: 'licentiemodel',
    },
    {
      id: 'certifications',
      label: 'Certificeringen',
      key: 'certificeringen',
    },
    {
      id: 'hostingOptions',
      label: 'Hosting opties',
      key: 'hostingopties',
    },
    {
      id: 'versions',
      label: 'Versies',
      key: 'versies',
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
                NAVIGATE_TO.BEHEER_TYPE_DETAILS('voorzieningen-aanbod', row.id)
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
  const defaultHeaders = [
    'name',
    'voorzieningName',
    'email',
    'productPage',
    'actions',
  ];
  const [tableHeaders, setTableHeaders] = useState(
    headers.filter((header) => defaultHeaders.includes(header.id))
  );

  const handleMultipleDelete = () => {
    setOpenModal('delete');
  };

  if (error) {
    return (
      <AcBeheerError title='Beheer Voorzieningen Aanbod' error={error.message} />
    );
  }

  if (loading) {
    return <AcBeheerLoading title='Beheer Voorzieningen Aanbod' />;
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
            <Heading>Beheer Voorzieningen Aanbod</Heading>
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
            tableHeaders={tableHeaders}
            getSelectedRows={setSelectedRows}
            renderSelectRowButtons
            ref={tableRef}
            truncateLines={3}
            showSortButtons
          />

          {/* modals */}
          <AcVoorzieningAanbodFormModal
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

          <AcDeleteVoorzieningAanbodModal
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

export default withStore(observer(AcBeheerVoorzieningenAanbod));

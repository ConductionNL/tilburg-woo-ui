import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcFlex, AcSection } from '@atoms';
import { Heading } from '@utrecht/component-library-react/dist/css-module';
import { PrimaryActionButton } from '@utrecht/component-library-react';
import { VISUALS } from '@constants';
import { NAVIGATE_TO } from '@src/constants/routes.constants';
import { AcSideNav } from '@components';
import { AcBeheerError, AcBeheerLoading } from '@views/ac-beheer';
import AcColumn from '@atoms/ac-column/ac-column';
import CDTable from '../../cd-table';
import AcOrganisatieFormModal from '../modals/ac-organisatie-form-modal';
import AcDeleteOrganisatieModal from '../modals/ac-delete-organisatie-modal';
import ConActionMenu from '../../con-action-menu';

const AcBeheerOrganisaties = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch(
        //   config.authentication.baseURL +
        'https://vng.accept.commonground.nu/apps' +
          '/openconnector/api/endpoint/organisaties'
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

  const tableHeaders = [
    {
      label: 'Naam',
      key: 'naam',
    },
    {
      label: 'Beschrijving',
      key: 'beschrijving',
    },
    {
      label: 'Type',
      key: 'type',
    },
    {
      label: 'KvK nummer',
      key: 'kvkNummer',
    },
    {
      label: 'OIDN',
      key: 'oidn',
    },
    {
      label: 'Moeder Organisatie',
      key: 'moederOrganisatie',
    },
    {
      label: 'Acties',
      key: '',
      customContent: (row) => (
        <AcFlex column spacing='xs'>
          <button
            className='utrecht-button slim'
            variant='secondary'
            onClick={() => {
              navigate(NAVIGATE_TO.BEHEER_TYPE_DETAILS('organisaties', row.id));
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

  const handleMultipleDelete = () => {
    setOpenModal('delete');
  };

  if (error) {
    return <AcBeheerError title='Beheer Organisaties' error={error.message} />;
  }

  if (loading) {
    return <AcBeheerLoading title='Beheer Organisaties' />;
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
                    disabled={selectedRows.length === 0}
                  >
                    Weergeven als view
                  </ConActionMenu.Button>
                  <ConActionMenu.Button
                    icon={<VISUALS.DOWNLOAD />}
                    disabled={selectedRows.length === 0}
                  >
                    Downloaden als CSV
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

          <CDTable
            data={data}
            tableHeaders={tableHeaders}
            getSelectedRows={setSelectedRows}
            renderSelectRowButtons
            ref={tableRef}
            truncateLines={3}
          />

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
            }}
          />
        </AcColumn>
      </AcFlex>
    </AcSection>
  );
};

export default withStore(observer(AcBeheerOrganisaties));

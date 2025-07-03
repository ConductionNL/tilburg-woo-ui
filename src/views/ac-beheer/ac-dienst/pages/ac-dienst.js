import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcFlex, AcSection } from '@atoms';
import { Heading } from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@constants';
import { AcSideNav } from '@components';
import { AcBeheerError } from '@views/ac-beheer';
import { SecondaryActionButton } from '@utrecht/component-library-react';
import AcColumn from '@atoms/ac-column/ac-column';
import AcDienstFormModal from '../modals/ac-dienst-form-modal';
import AcDeleteDienstModal from '../modals/ac-delete-dienst-modal';
import ConActionMenu from '../../con-action-menu';
import { AcButton } from '@src/molecules';
import ConFilterHeadersDrawer from '../../con-filter-headers-drawer';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import { ConSorterLogic } from '@src/utilities/con-sorter';
import _ from 'lodash';
import BeheerTable from '../../con-beheer-table/con-beheer-table';
import AcBeheerImportModal from '../../import-modal/ac-beheer-import-modal';
import { Pagination } from '@amsterdam/design-system-react';
import ConPaginationLimitSelector, {
  usePaginationLimit,
} from '../../../../components/con-pagination-limit-selector/con-pagination-limit-selector';

const AcBeheerDienst = () => {
  // get the query params manually since useParams doesn't work with any query param
  const searchParams = new URLSearchParams(window.location.search);
  const showCreateModal = searchParams.get('showCreateModal');
  const voorzieningId = searchParams.get('voorzieningId');

  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Use the custom hook for pagination limit management
  const [limit, setLimit] = usePaginationLimit('diensten');
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

  const [selectedRows, setSelectedRows] = useState([]);
  const [singleSelectedRow, setSingleSelectedRow] = useState(null);
  const [openModal, setOpenModal] = useState(null);

  const [unfilteredHeaders, setUnfilteredHeaders] = useState([]);
  const [filteredHeaders, setFilteredHeaders] = useState([]);
  const [defaultHeaders, setDefaultHeaders] = useState([]);
  const { downloadObjectList } = useNextcloudRequests();

  const filterHeadersDrawerRef = useRef(null);
  const tableRef = useRef(null);

  useEffect(() => {
    if (showCreateModal) {
      setOpenModal('add');
    }
  }, [showCreateModal]);

  const registerSlug = 'voorzieningen';
  const schemaSlug = 'voorzieningaanbod';

  const downloadData = useCallback(async (type = 'csv') => {
    await downloadObjectList(registerSlug, schemaSlug, type);
  }, []);

  // Custom header overrides for special cases
  const customHeaders = useMemo(
    () => ({
      voorziening: {
        id: 'voorzieningName',
        label: 'Applicatie',
        key: 'voorziening',
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
      leverancier_naam: {
        id: 'leverancier',
        label: 'Leverancier',
        key: '',
        customContent: (row) => {
          return (
            <AcColumn key={row.id}>
              <span>{row?.leverancier?.naam ?? '-'}</span>
            </AcColumn>
          );
        },
        sortComparator: (a, b, direction) => {
          if (direction === null) return 0;

          const idA = a?.leverancier?.id || '';
          const idB = b?.leverancier?.id || '';

          return ConSorterLogic(idA, idB, direction);
        },
      },
      leverancier_email: {
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
    }),
    []
  );

  const handleMultipleDelete = () => {
    setOpenModal('delete');
  };

  if (error) {
    return <AcBeheerError title='Beheer Dienst' error={error.message} />;
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

          <BeheerTable
            ref={tableRef}
            type={schemaSlug}
            getSelectedRows={setSelectedRows}
            getSingleSelectedRow={setSingleSelectedRow}
            getModalValue={setOpenModal} // get the modal value so that we can know which modal to show
            getLoading={setLoading}
            headerOverrides={customHeaders} // custom header overrides
            getHeaders={setUnfilteredHeaders} // get the unfiltered headers to pass to the header filter component
            getDefaultHeaders={setDefaultHeaders} // get the default headers to pass to the header filter component
            headers={filteredHeaders} // set the headers to be used in the table from the header filter component, this overrides the headers within the component
            pagination={pagination}
            setPagination={setPagination}
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
              objectType='diensten'
              value={limit}
              onChange={setLimit}
            />
          </AcFlex>

          {/* modals */}
          <AcDienstFormModal
            dienst={singleSelectedRow}
            preSelectedVoorziening={voorzieningId}
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
            loading={loading}
            headers={unfilteredHeaders}
            defaultHeaders={defaultHeaders}
            onChange={setFilteredHeaders}
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

export default withStore(observer(AcBeheerDienst));

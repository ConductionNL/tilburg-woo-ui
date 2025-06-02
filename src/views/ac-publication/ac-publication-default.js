import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate, useParams } from 'react-router-dom';
import { AcContainer, AcFlex } from '@atoms';
import { AcLoader } from '@components';
import { AcTable } from '@molecules';
import { withStore } from '@stores';
import { LABELS, VISUALS } from '@constants';
import { Pagination } from '@amsterdam/design-system-react';
import { getCookie } from '@src/utilities';
import { AcMappedAttachmentRow } from '@src/services/ac-mapped-attachmend-row';
import { Heading } from '@utrecht/component-library-react/dist/css-module';
import ConActionMenu from '../ac-beheer/con-action-menu';

const AcPublication = observer(({ store: { publications }, schema }) => {
  const { id } = useParams();
  const {
    get_single,
    loading,
    attachmentPagination,
    setAttachmentsPage,
    getFilteredAttachments,
    attachments,
  } = publications;

  const navigate = useNavigate();

  const isVoorziening = schema?.title === 'Voorziening';
  const isLoggedIn = !!getCookie('nextcloud_user_id');

  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);

  const getFilterdRows = (data) => {
    return Object.entries(data).filter(([key, value]) => {
      if (key === '@self') return false;
      if (key === 'name') return false;
      if (typeof value === 'object') return false;

      return [
        <div>
          <strong>{key}</strong>
        </div>,
        <div>{value ? value : '-'}</div>,
      ];
    });
  };

  useEffect(() => {
    setHeaders(['Titel', 'Waarde']);
    setRows(getFilterdRows(get_single));
  }, [get_single]);

  if (loading.status || !get_single || !attachments) {
    return <AcLoader />;
  }

  return (
    <>
      <AcContainer compact margin='xl'>
        <AcFlex column spacing={'lg'}>
          <AcFlex spacing='lg' className='ac-publication-header'>
            <Heading>
              {get_single?.title ?? get_single?.name ?? get_single?.naam}
            </Heading>
            {
              <img
                src={get_single?.image}
                className='ac-publication-header-image'
              ></img>
            }

            {isVoorziening && isLoggedIn && (
              <ConActionMenu>
                <ConActionMenu.Trigger icon={<VISUALS.ELLIPSIS />}>
                  Acties
                </ConActionMenu.Trigger>

                <ConActionMenu.Menu position='right'>
                  <ConActionMenu.Button
                    onClick={() =>
                      navigate(
                        `/beheer/diensten?showCreateModal=true&voorzieningId=${id}`
                      )
                    }
                  >
                    Dienst toevoegen
                  </ConActionMenu.Button>

                  <ConActionMenu.Button
                    onClick={() =>
                      navigate(
                        `/beheer/gebruiken?showCreateModal=true&voorzieningId=${id}`
                      )
                    }
                  >
                    Gebruik toevoegen
                  </ConActionMenu.Button>
                </ConActionMenu.Menu>
              </ConActionMenu>
            )}
          </AcFlex>
          <AcTable header={headers} rows={rows} />{' '}
          {/* Show only when there are primary attachments */}
          {getFilteredAttachments(true)?.length > 0 && (
            <div>
              <Heading level={2}>{LABELS.DOCUMENTS_PRIMARY}</Heading>
              <AcFlex spacing={'xs'} className='notice'>
                <VISUALS.INFO />
                Documenten worden in een nieuw tabblad geopend.
              </AcFlex>
              <AcTable
                header={[LABELS.DOCUMENT, LABELS.TYPE, LABELS.DATE]}
                rows={getFilteredAttachments(true)?.map((attachment) =>
                  AcMappedAttachmentRow(attachment, true)
                )}
              />
            </div>
          )}
          {/* Show only if there are secondary attachments */}
          {getFilteredAttachments()?.length > 0 && (
            <div>
              <Heading level={2}>{LABELS.DOCUMENTS_SECONDARY}</Heading>
              <AcFlex spacing={'md'} column>
                <AcTable
                  header={[LABELS.DOCUMENT]}
                  rows={getFilteredAttachments(
                    false,
                    attachmentPagination.page
                  )?.map((attachment) => AcMappedAttachmentRow(attachment))}
                />
                {getFilteredAttachments()?.length > attachmentPagination.perPage && (
                  <Pagination
                    totalPages={getFilteredAttachments().length}
                    page={1}
                    nextLabel=''
                    previousLabel=''
                    onPageChange={(page) => setAttachmentsPage(page)}
                  />
                )}
              </AcFlex>
            </div>
          )}
        </AcFlex>
      </AcContainer>
    </>
  );
});

export default withStore(AcPublication);

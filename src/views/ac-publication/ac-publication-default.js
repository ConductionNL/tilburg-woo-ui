import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate, useParams } from 'react-router-dom';
import { AcContainer, AcFlex } from '@atoms';
import { AcLoader } from '@components';
import { AcTable, AcLink } from '@molecules';
import { withStore } from '@stores';
import { LABELS, VISUALS } from '@constants';
import { Pagination } from '@amsterdam/design-system-react';
import { getCookie } from '@src/utilities';
import { AcMappedAttachmentRow } from '@src/services/ac-mapped-attachmend-row';
import { Heading } from '@utrecht/component-library-react/dist/css-module';
import ConActionMenu from '../ac-beheer/con-action-menu';
import ConLogoPreview from '../ac-register/con-logo-preview';

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

  const getFilteredData = (data) => {
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([key, value]) => {
        if (key === '@self') return false;
        if (
          key === 'name' ||
          key === 'naam' ||
          key === 'titel' ||
          key === 'title' ||
          key === 'id'
        )
          return false;

        if (typeof value === 'object') return false;
        return true;
      })
    );
    return filteredData;
  };

  const getFilterdRows = (data) => {
    const getValueField = (key, value) => {
      // Handle null/undefined values
      if (!value) return <div>-</div>;

      // Convert to string if not already
      const strValue = String(value);

      // Handle URLs
      if (strValue.includes('https://')) {
        return (
          <AcLink to={strValue} target='_blank'>
            {strValue}
            <span className='sr-only'>Opent in een nieuw tabblad</span>
            <VISUALS.EXTERNAL_LINK_PINK />
          </AcLink>
        );
      }

      // Handle logos
      if (key === 'logo') {
        return (
          <ConLogoPreview
            className='ac-publication-logo-container'
            logoUrl={strValue}
          />
        );
      }

      // Only escape if the string contains escaped characters
      if (/\\[bfnrt"\\]/.test(strValue)) {
        const formattedValue = strValue
          .replace(/\\b/g, '\b')
          .replace(/\\f/g, '\f')
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
        return <div style={{ whiteSpace: 'pre-wrap' }}>{formattedValue}</div>;
      }

      // Regular string display
      return <div style={{ whiteSpace: 'pre-wrap' }}>{strValue}</div>;
    };

    return Object.entries(data).map(([key, value]) => [
      <strong>{_.upperFirst(key)}</strong>,
      <>{getValueField(key, value)}</>,
    ]);
  };

  useEffect(() => {
    setHeaders(['Titel', 'Waarde']);
    setRows(getFilterdRows(getFilteredData(get_single)));
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
              {get_single?.title ??
                get_single?.titel ??
                get_single?.name ??
                get_single?.naam ??
                get_single?.id}
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

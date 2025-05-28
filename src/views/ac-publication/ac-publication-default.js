import { useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate, useParams } from 'react-router-dom';
import { toJS } from 'mobx';

import { AcCard, AcContainer, AcFlex } from '@atoms';
import { AcLoader, AcDrawer, AcTabList, AcSearchFilter, AcModal } from '@components';
import { AcLink, AcTable } from '@molecules';
import { withStore } from '@stores';

import {
  Heading,
  Paragraph,
  Link,
  Textbox,
  PrimaryActionButton,
  SecondaryActionButton,
} from '@utrecht/component-library-react/dist/css-module';
import { LABELS, VISUALS } from '@constants';
import acFormatDate from '@src/utilities/ac-format-date';
import { Pagination } from '@amsterdam/design-system-react';
import { StatusBadge } from '@utrecht/component-library-react';
import _ from 'lodash';
import { MOCK_CONCEPTS } from '@constants/mock.data.constants';
import { AcGetAdditionalInfoRow } from '@src/services/ac-get-additional-info-row';
import { Heading2, Heading3 } from '@utrecht/component-library-react';
import AcDienstFormModal from '../ac-beheer/ac-dienst/modals/ac-dienst-form-modal';
import { getCookie } from '@src/utilities';
import ConActionMenu from '../ac-beheer/con-action-menu';
import { AcMappedAttachmentRow } from '@src/services/ac-mapped-attachmend-row';
const AcPublication = observer(({ store: { publications }, schema }) => {
  const { id } = useParams();
  const {
    fetchPublication,
    resetPublication,
    get_single,
    loading,
    attachmentPagination,
    getSearchPageURL,
    setAttachmentsPage,
    getFilteredAttachments,
    setAttachmentSearch,
    attachmentSearch,
    fetchAttachments,
    attachments,
    resetAttachments,
  } = publications;

  const navigate = useNavigate();

  const isVoorziening = schema?.title === 'Voorziening';
  const isLoggedIn = !!getCookie('nextcloud_user_id');

  const drawerRef = useRef(null);
  const modalRef = useRef(null);

  const [filteredAllConcepts, setFilteredAllConcepts] = useState(
    MOCK_CONCEPTS.allConcepts
  );
  const [copyStatus, setCopyStatus] = useState('idle'); // 'idle' | 'copied' | 'error'

  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);

  const handleAllConceptsSearch = (searchTerm) => {
    const filtered = MOCK_CONCEPTS.allConcepts.filter((concept) =>
      concept.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAllConcepts(filtered);
    return filtered.length;
  };

  const handleAttachmentSearch = (searchTerm) => {
    setAttachmentSearch(searchTerm);
    return getFilteredAttachments(false)?.length || 0;
  };

  const tabs = [
    {
      title: 'Deze pagina',
      content: (
        <>
          {MOCK_CONCEPTS.pageConcepts.map((concept) => (
            <AcFlex column key={concept.title}>
              <Heading level={3}>{concept.title}</Heading>
              <Paragraph>{concept.description}</Paragraph>
            </AcFlex>
          ))}
        </>
      ),
    },
    {
      title: 'Alle begrippen',
      content: (
        <>
          <AcSearchFilter
            onSearch={handleAllConceptsSearch}
            ariaLabel='Zoek in alle begrippen'
            label='Zoek in alle begrippen'
            searchIconOnly={true}
          />
          {filteredAllConcepts.map((concept) => (
            <AcFlex column key={concept.title}>
              <Heading level={3}>{concept.title}</Heading>
              <Paragraph>{concept.description}</Paragraph>
            </AcFlex>
          ))}
        </>
      ),
    },
  ];

  // useEffect(() => {
  //   fetchPublication(id);
  //   fetchAttachments(id);
  //   return () => {
  //     resetPublication();
  //     resetAttachments();
  //   };
  // }, []);

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

  const openDrawer = () => {
    drawerRef.current?.showModal();
  };

  const openDialog = () => {
    modalRef.current?.showModal();
  };

  const copyLink = async () => {
    try {
      // Get the base URL (will be the actual domain in production)
      const baseUrl = window.location.origin;
      // Construct the publication URL
      const url = `${baseUrl}/publicatie/${get_single?.id}`;

      await navigator.clipboard.writeText(url);
      setCopyStatus('copied');

      setTimeout(() => {
        setCopyStatus('idle');
      }, 2000);
    } catch (err) {
      setCopyStatus('error');
    }
  };

  const getCopyButtonText = () => {
    switch (copyStatus) {
      case 'copied':
        return LABELS.COPY_LINK_SUCCESS;
      case 'error':
        return LABELS.COPY_LINK_ERROR;
      default:
        return LABELS.COPY_LINK;
    }
  };

  const mapAttachmentRow = (row, primary) => {
    // Fallback for when there is no extension property

    const formatFileSize = (bytes) => {
      if (!bytes) return '-';
      const mb = bytes / (1024 * 1024);
      if (mb >= 1) {
        return `${Math.round(mb)} MB`;
      }
      return `${Math.round(bytes / 1024)} KB`;
    };

    if (!primary) {
      return [
        <AcLink to={row.accessUrl} target='_blank'>
          {`${row.title}` || 'Naamloos bestand'}
          <span className='sr-only'>Opent in een nieuw tabblad</span>
          <VISUALS.EXTERNAL_LINK_PINK />
        </AcLink>,
        formatFileSize(row.size),
      ];
    }

    return [
      <AcLink to={row.accessUrl} target='_blank'>
        {`${row.title}` || 'Naamloos bestand'}
        <span className='sr-only'>Opent in een nieuw tabblad</span>
        <VISUALS.EXTERNAL_LINK_PINK />
      </AcLink>,
      _.upperFirst(row.labels[0]) || LABELS.UNKNOWN,
      acFormatDate('2025-02-19T08:43:54Z', 'YYYY-MM-DD', 'DD MMMM YYYY') ||
        LABELS.UNKNOWN,
      formatFileSize(row.size),
    ];
  };

  const renderPrimaryAttachments = useMemo(() => {
    if (!getFilteredAttachments(true)?.length) {
      return null;
    }

    return (
      <AcFlex column>
        <Heading level={2}>{LABELS.DOCUMENTS_PRIMARY}</Heading>
        <AcFlex spacing={'xs'} className='notice'>
          <VISUALS.INFO />
          Documenten worden in een nieuw tabblad geopend.
        </AcFlex>
        <AcTable
          header={[LABELS.DOCUMENT, LABELS.TYPE, LABELS.DATE, LABELS.SIZE]}
          rows={getFilteredAttachments(true)?.map((attachment) =>
            mapAttachmentRow(attachment, true)
          )}
        />
      </AcFlex>
    );
  }, [get_single]);

  const renderAttachments = () => {
    const allAttachments = getFilteredAttachments(false);

    if (!allAttachments?.length) {
      return null;
    }

    const totalItems = allAttachments.length;
    const totalPages = Math.ceil(totalItems / attachmentPagination.perPage);
    const paginatedAttachments = getFilteredAttachments(
      false,
      attachmentPagination.page
    );

    return (
      <AcFlex column>
        <AcFlex spacing={'md'} column>
          <AcFlex alignItems='center' spacing='snail'>
            <Heading level={2}>{LABELS.DOCUMENTS_SECONDARY}</Heading>{' '}
            <StatusBadge>{totalItems}</StatusBadge>
          </AcFlex>
          <AcSearchFilter
            onSearch={handleAttachmentSearch}
            initialValue={attachmentSearch}
            label='Zoek in bijlagen'
            placeholder='Welk document zoek je?'
          />
          <AcTable
            header={[LABELS.DOCUMENT, LABELS.SIZE]}
            rows={toJS(paginatedAttachments)?.map((attachment) =>
              mapAttachmentRow(attachment)
            )}
          />
          {totalItems > attachmentPagination.perPage && (
            <Pagination
              totalPages={totalPages}
              page={attachmentPagination.page}
              nextLabel=''
              previousLabel=''
              onPageChange={(page) => setAttachmentsPage(page)}
            />
          )}
        </AcFlex>
      </AcFlex>
    );
  };

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

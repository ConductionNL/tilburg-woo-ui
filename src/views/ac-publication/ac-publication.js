import { useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useParams } from 'react-router-dom';
import { toJS } from 'mobx';

import { AcCard, AcContainer, AcFlex } from '@atoms';
import { AcLoader, AcDrawer, AcTabList, AcSearchFilter, AcModal } from '@components';
import { AcLink, AcTable } from '@molecules';
import { withStore } from '@stores';

import {
  Heading,
  Paragraph,
  Textbox,
  PrimaryActionButton,
  SecondaryActionButton,
  Alert,
} from '@utrecht/component-library-react/dist/css-module';
import { LABELS, VISUALS } from '@constants';
import acFormatDate from '@src/utilities/ac-format-date';
import { Pagination } from '@amsterdam/design-system-react';
import { StatusBadge } from '@utrecht/component-library-react';
import _ from 'lodash';

const MOCK_CONCEPTS = {
  pageConcepts: [
    {
      title: 'Ecologisch',
      description:
        'Ecologisch gaat over hoe dieren, planten en andere levende dingen samenwerken in de natuur. Het gaat ook over hoe we proberen de natuur te beschermen en gezond te houden.',
    },
    {
      title: 'Natuurversnippering',
      description:
        'Natuurversnippering gebeurt als stukjes natuur worden verdeeld door menselijke activiteiten, zoals het bouwen van wegen en steden of het gebruiken van land voor landbouw. Dit kan slecht zijn voor dieren en planten.',
    },
  ],
  allConcepts: [
    {
      title: 'Biodiversiteit',
      description:
        'De verscheidenheid van plant- en diersoorten in een gebied. Een grote biodiversiteit draagt bij aan een gezond ecosysteem.',
    },
    {
      title: 'Duurzaamheid',
      description:
        'Het vermogen om te blijven bestaan zonder het vermogen van toekomstige generaties om in hun eigen behoeften te voorzien in gevaar te brengen.',
    },
    {
      title: 'Ecologisch',
      description:
        'Ecologisch gaat over hoe dieren, planten en andere levende dingen samenwerken in de natuur. Het gaat ook over hoe we proberen de natuur te beschermen en gezond te houden.',
    },
    {
      title: 'Ecosysteem',
      description:
        'Een gemeenschap van levende organismen in wisselwerking met hun omgeving.',
    },
    {
      title: 'Habitat',
      description:
        'De natuurlijke leefomgeving van een plant of dier waar het kan overleven en zich voortplanten.',
    },
    {
      title: 'Klimaatadaptatie',
      description:
        'Aanpassingen die worden gedaan om beter om te kunnen gaan met de gevolgen van klimaatverandering.',
    },
    {
      title: 'Milieuvervuiling',
      description:
        'De aanwezigheid of introductie van schadelijke stoffen in het milieu die nadelige effecten hebben op mensen, dieren en planten.',
    },
    {
      title: 'Natuurbeheer',
      description:
        'Het planmatig onderhouden en beschermen van natuurgebieden om de biodiversiteit en natuurlijke processen in stand te houden.',
    },
    {
      title: 'Natuurversnippering',
      description:
        'Natuurversnippering gebeurt als stukjes natuur worden verdeeld door menselijke activiteiten, zoals het bouwen van wegen en steden of het gebruiken van land voor landbouw. Dit kan slecht zijn voor dieren en planten.',
    },
    {
      title: 'Stikstofkringloop',
      description:
        'De cyclus waarbij stikstof door verschillende vormen en processen in de natuur wordt omgezet en hergebruikt.',
    },
    {
      title: 'Voedselketen',
      description:
        'De reeks van organismen waarbij elk organisme voedsel is voor een ander organisme, beginnend bij producenten en eindigend bij de top-predatoren.',
    },
    {
      title: 'Waterkwaliteit',
      description:
        'De chemische, fysische en biologische kenmerken van water in relatie tot de geschiktheid voor verschillende gebruiksdoeleinden en het ondersteunen van ecosystemen.',
    },
  ],
};

const AcPublication = observer(({ store: { publications } }) => {
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

  const drawerRef = useRef(null);
  const modalRef = useRef(null);

  const [filteredAllConcepts, setFilteredAllConcepts] = useState(
    MOCK_CONCEPTS.allConcepts
  );
  const [copyStatus, setCopyStatus] = useState('idle'); // 'idle' | 'copied' | 'error'

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

  useEffect(() => {
    fetchPublication(id);
    fetchAttachments(id);
    return () => {
      resetPublication();
      resetAttachments();
    };
  }, []);

  useEffect(() => {
    document.title = get_single?.title || 'Gemeente | Publicatie';
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
    // Check if we have any attachments at all (before filtering)
    const hasAttachments =
      attachments &&
      attachments.filter((att) => att?.labels?.length === 0).length > 0;

    // If no attachments at all, return null to hide the section
    if (!hasAttachments) {
      return null;
    }

    // Get filtered attachments based on search
    const allAttachments = getFilteredAttachments(false);
    const totalItems = allAttachments?.length || 0;

    return (
      <AcFlex column>
        <AcFlex spacing={'md'} column>
          <AcFlex alignItems='center' spacing='snail'>
            <Heading level={2}>{LABELS.DOCUMENTS_SECONDARY}</Heading>{' '}
            <StatusBadge>
              {attachments?.filter((att) => att?.labels?.length === 0).length || 0}
            </StatusBadge>
          </AcFlex>
          <AcSearchFilter
            onSearch={handleAttachmentSearch}
            initialValue={attachmentSearch}
            label='Zoek in bijlagen'
            placeholder='Welk document zoek je?'
          />

          {totalItems > 0 ? (
            <>
              <AcTable
                header={[LABELS.DOCUMENT, LABELS.SIZE]}
                rows={toJS(
                  getFilteredAttachments(false, attachmentPagination.page)
                )?.map((attachment) => mapAttachmentRow(attachment))}
              />
              {totalItems > attachmentPagination.perPage && (
                <Pagination
                  totalPages={Math.ceil(totalItems / attachmentPagination.perPage)}
                  page={attachmentPagination.page}
                  nextLabel=''
                  previousLabel=''
                  onPageChange={(page) => setAttachmentsPage(page)}
                />
              )}
            </>
          ) : (
            <Alert type='info'>
              <AcFlex spacing='sm'>
                <VISUALS.INFO_BLUE />
                <AcFlex column spacing='xs'>
                  <Heading level={3}>Geen resultaten gevonden</Heading>
                  <Paragraph>
                    Pas je zoekopdracht aan om resultaten te vinden.
                  </Paragraph>
                </AcFlex>
              </AcFlex>
            </Alert>
          )}
        </AcFlex>
      </AcFlex>
    );
  };

  return (
    <>
      <AcContainer compact margin='xl'>
        <AcFlex column spacing={'lg'}>
          <Heading>{get_single?.title}</Heading>

          <AcCard blue>
            <Heading level={2}>{LABELS.SUMMARY}</Heading>
            <Paragraph>
              {get_single?.summary || LABELS.SUMMARY_UNAVAILABLE}
            </Paragraph>
            <SecondaryActionButton style='button' onClick={openDrawer}>
              <VISUALS.LIST_ALT />
              {LABELS.CONCEPTS_LIST}
            </SecondaryActionButton>
          </AcCard>

          {renderPrimaryAttachments}
          {renderAttachments()}

          <AcFlex column>
            <Heading level={2}>{LABELS.ADDITIONAL_INFO}</Heading>
            <AcTable
              rows={[
                [LABELS.CASE_NUMBER, get_single?.reference || LABELS.UNKNOWN],
                [
                  LABELS.CATEGORY,
                  <AcLink
                    href={getSearchPageURL({
                      category: [get_single?.category],
                    })}
                  >
                    {get_single?.category}
                  </AcLink>,
                ],
                [
                  LABELS.THEMES,
                  get_single?.themes?.length
                    ? get_single?.themes?.map((theme) => (
                        <AcLink
                          href={getSearchPageURL({
                            themes: [theme.id],
                          })}
                        >
                          {theme.title}
                        </AcLink>
                      ))
                    : '-',
                ],
                [LABELS.SOURCE, get_single?.source || LABELS.UNKNOWN],
              ]}
            />
          </AcFlex>
          <SecondaryActionButton style='button' onClick={openDialog}>
            <VISUALS.SHARE />
            Link delen
          </SecondaryActionButton>
        </AcFlex>
      </AcContainer>

      <AcDrawer id='concepts-drawer' ref={drawerRef} title={LABELS.CONCEPTS_LIST}>
        <AcTabList tabs={tabs} />
      </AcDrawer>

      <AcModal
        id='share-modal'
        ref={modalRef}
        title={LABELS.SHARE_MODAL}
        customFooter
      >
        <AcFlex column spacing='sm'>
          <Paragraph>Kopieer de link naar uw klembord.</Paragraph>
          <Textbox
            value={`${window.location.origin}/publicatie/${get_single?.id}`}
            readOnly
          />
          <div role='status' aria-live='polite' className='sr-only'>
            {copyStatus === 'copied' && 'De link is gekopieerd naar uw klembord'}
            {copyStatus === 'error' && 'Het kopiëren van de link is mislukt'}
          </div>
          <PrimaryActionButton
            className='copy-button'
            data-status={copyStatus}
            style='button'
            onClick={copyLink}
            aria-label={getCopyButtonText()}
          >
            <div class='particles'>
              <VISUALS.CHECK />
              <div class='particles-inner'>
                <VISUALS.PARTICLES />
              </div>
            </div>
            {getCopyButtonText()}
          </PrimaryActionButton>
        </AcFlex>
      </AcModal>
    </>
  );
});

export default withStore(AcPublication);

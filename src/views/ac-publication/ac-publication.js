import { useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useParams } from 'react-router-dom';
import { toJS } from 'mobx';

import { AcCard, AcContainer, AcFlex } from '@atoms';
import { AcLoader, AcDrawer, AcTabList, AcSearchFilter } from '@components';
import { AcLink, AcTable } from '@molecules';
import { withStore } from '@stores';

import {
  Heading,
  Paragraph,
  Link,
  SecondaryActionButton,
} from '@utrecht/component-library-react/dist/css-module';
import { LABELS, VISUALS } from '@constants';
import acFormatDate from '@src/utilities/ac-format-date';
import { Pagination } from '@amsterdam/design-system-react';
import { StatusBadge } from '@utrecht/component-library-react';

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
  } = publications;

  const drawerRef = useRef(null);

  const [filteredAllConcepts, setFilteredAllConcepts] = useState(
    MOCK_CONCEPTS.allConcepts
  );

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
    return () => resetPublication();
  }, []);

  useEffect(() => {
    document.title = get_single?.title || 'Open Tilburg | Publicatie';
  }, [get_single]);

  if (loading.status || !get_single) {
    return <AcLoader />;
  }

  const openDrawer = () => {
    drawerRef.current?.showModal();
  };

  const mapAttachmentRow = (row, primary) => {
    // Fallback for when there is no extension property
    const extension = row.type.split('/').pop();

    if (!primary) {
      return [
        <AcLink to={row.accessUrl} target='_blank'>
          <VISUALS.DOCUMENT />
          <Link>
            {`${row.title}.${row.extension ?? extension}` || 'Naamloos bestand'}
          </Link>
        </AcLink>,
      ];
    }

    return [
      <AcLink to={row.accessUrl} target='_blank'>
        <VISUALS.DOCUMENT />
        <Link>
          {`${row.title}.${row.extension ?? extension}` || 'Naamloos bestand'}
        </Link>
      </AcLink>,
      row.labels[0] || LABELS.UNKNOWN,
      acFormatDate(row?.published, 'YYYY-MM-DD', 'DD MMMM YYYY') || LABELS.UNKNOWN,
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
          header={[LABELS.DOCUMENT, LABELS.TYPE, LABELS.DATE]}
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
            header={[LABELS.DOCUMENT]}
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
              ]}
            />
          </AcFlex>
        </AcFlex>
      </AcContainer>

      <AcDrawer id='concepts-drawer' ref={drawerRef} title={LABELS.CONCEPTS_LIST}>
        <AcTabList tabs={tabs} />
      </AcDrawer>
    </>
  );
});

export default withStore(AcPublication);

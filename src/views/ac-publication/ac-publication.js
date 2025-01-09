import { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useParams } from 'react-router-dom';

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

const AcPublication = ({ store: { publications } }) => {
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

  const tabs = [
    {
      title: 'Deze pagina',
      content: (
        <>
          {MOCK_CONCEPTS.pageConcepts.map((concept) => (
            <div key={concept.title}>
              <h3>{concept.title}</h3>
              <p>{concept.description}</p>
            </div>
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
          />
          {filteredAllConcepts.map((concept) => (
            <div key={concept.title}>
              <h3>{concept.title}</h3>
              <p>{concept.description}</p>
            </div>
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
    document.title = get_single?.title || 'Open Ac | Publicatie';
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
                  mapAttachmentRow(attachment, true)
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
                  )?.map((attachment) => mapAttachmentRow(attachment))}
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

          <div>
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
          </div>
        </AcFlex>
      </AcContainer>

      <AcDrawer id='concepts-drawer' ref={drawerRef} title={LABELS.CONCEPTS_LIST}>
        <AcTabList tabs={tabs} />
      </AcDrawer>
    </>
  );
};

export default withStore(observer(AcPublication));

import { Heading } from '@utrecht/component-library-react/dist/css-module';
import { LABELS } from '@constants';

import { AcSection, AcContainer } from '@atoms';
import AcGrid from '@atoms/ac-grid/ac-grid';
import { AcSearchResult } from '@molecules';
import { AcLoader } from '@components';

// Fallback data in case API fails
const FALLBACK_ITEMS = [
  {
    id: '1',
    title: 'Raadsbesluit Ontwikkeling Spoorzone',
    summary:
      'Besluitvorming over de herontwikkeling van het gebied rond het station Gouda, inclusief plannen voor woningbouw en voorzieningen.',
    published: '2024-03-15',
  },
  {
    id: '2',
    title: 'WOO-verzoek Kaasmarkt evenementen',
    summary:
      'Openbaarmaking van documenten met betrekking tot de organisatie en vergunningverlening van evenementen op de historische Kaasmarkt.',
    published: '2024-03-10',
  },
  {
    id: '3',
    title: 'Beleidsplan Duurzame Energietransitie',
    summary:
      'Strategisch plan voor de verduurzaming van de gemeente Gouda, met focus op energiebesparing en duurzame energieopwekking.',
    published: '2024-03-05',
  },
];

const AcFeatured = ({ publications = [], isLoading = false }) => {
  // Check if publications have the required properties
  const hasValidPublications =
    publications.length > 0 &&
    publications.every((item) => item.title && (item.summary || item.description));

  // Use provided publications or fallback to static data if empty or invalid
  const displayItems = hasValidPublications ? publications : FALLBACK_ITEMS;

  return (
    <AcSection className='ac-featured' spacing>
      <AcContainer>
        <div className='ac-featured__heading'>
          <Heading level={2}>{LABELS.HIGHLIGHTED}</Heading>
          <br />
        </div>
        <div className='ac-featured__content'>
          <AcGrid row={3}>
            {isLoading
              ? // Show skeleton loaders while loading
                Array.from({ length: 3 }).map((_, index) => (
                  <AcSearchResult skeleton key={index} />
                ))
              : // Show publications when loaded
                displayItems.map((item, index) => (
                  <AcSearchResult
                    key={item.id || index}
                    {...item}
                    // Override props to hide category and themes on homepage
                    hideCategory={true}
                    hideThemes={true}
                    simplified={true}
                  />
                ))}
            <AcSearchResult
              title='Woo-verzoek Wijkevoort - Gemeente Tilburg'
              summary='Verzoek: alle relevante documenten, informatie en correspondentie betreffende het overleg over Wijkevoort tussen...'
              published='2024-03-15'
              themes={[{ title: 'Woo-verzoek' }]}
              hideCategory={true}
            />
          </AcGrid>
        </div>
      </AcContainer>
    </AcSection>
  );
};

export default AcFeatured;

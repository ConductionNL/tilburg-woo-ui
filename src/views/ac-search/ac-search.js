import { TilburgCard, TilburgContainer, TilburgFlex } from '@atoms';
import { TilburgSearchFilters, TilburgSearchResult } from '@molecules';
import { TilburgSearchbox } from '@components';
import { LABELS } from '@constants';
import {
  Heading,
  Select,
  SelectOption,
  Paragraph,
  StatusBadge,
} from '@utrecht/component-library-react/dist/css-module';

const AcSearch = ({ store }) => {
  return (
    <>
      <TilburgContainer spacing='lg'>
        <TilburgCard blue padding='md'>
          <TilburgSearchbox label={LABELS.SEARCH} />
        </TilburgCard>
      </TilburgContainer>

      <TilburgContainer spacing='sm'>
        <TilburgFlex spacing='xl'>
          <TilburgSearchFilters />
          <TilburgFlex column grow spacing='xs'>
            <Heading level={4}>Gekozen filters</Heading>
            <TilburgFlex spacing='xs'>
              <StatusBadge onClick={() => console.log('test')}>Wonen</StatusBadge>
              <StatusBadge>Werken</StatusBadge>
              <StatusBadge>Studeren</StatusBadge>
            </TilburgFlex>
            <TilburgFlex column spacing='sm'>
              <TilburgSearchResult />
              <TilburgSearchResult />
              <TilburgSearchResult />
              <TilburgSearchResult />
              <TilburgSearchResult />
              <TilburgSearchResult />
              <TilburgSearchResult />
              <strong style='padding-block: 3rem; color: var(--tilburg-color-pink-300);'>
                // PAGINATION PLACEHOLDER //
              </strong>
            </TilburgFlex>
          </TilburgFlex>
        </TilburgFlex>
      </TilburgContainer>
    </>
  );
};

export default AcSearch;

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
      <TilburgContainer spacing='md'>
        <TilburgCard blue padding='md'>
          <TilburgSearchbox label={LABELS.SEARCH} />
        </TilburgCard>
      </TilburgContainer>

      <TilburgContainer spacing='sm'>
        <TilburgFlex spacing={'md'}>
          {/*TODO: Fix width? */}
          <div style={{ width: '264px' }}>
            <TilburgSearchFilters />
          </div>
          <TilburgFlex column grow spacing={'xs'}>
            <TilburgFlex justifyContent='between'>
              <Heading level={2}>5.761 zoekresultaten</Heading>
              <TilburgFlex alignItems='center' spacing='xs'>
                <Paragraph>Sorteer</Paragraph>
                <Select>
                  <SelectOption>Meest relevant</SelectOption>
                  <SelectOption>Best bekeken</SelectOption>
                </Select>
              </TilburgFlex>
            </TilburgFlex>
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
            </TilburgFlex>
          </TilburgFlex>
        </TilburgFlex>
      </TilburgContainer>
    </>
  );
};

export default AcSearch;

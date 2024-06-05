import { TilburgCard, TilburgContainer, TilburgFlex } from '@atoms';
import { TilburgSearchResult } from '@molecules';
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

      <TilburgContainer spacing='md'>
        <div style={{ display: 'flex' }}>
          <div style={{ display: 'flex', width: '264px' }}>
            <Heading level={2}>Filters</Heading>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
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
          </div>
        </div>
      </TilburgContainer>
    </>
  );
};

export default AcSearch;

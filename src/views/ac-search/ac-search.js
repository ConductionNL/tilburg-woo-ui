import React from 'react';
import { TilburgCard, TilburgContainer, TilburgFlex } from '@atoms';
import {
  TilburgButton,
  TilburgSearchFilters,
  TilburgSearchResult,
} from '@molecules';
import { TilburgSearchbox } from '@components';
import { LABELS, VISUALS } from '@constants';
import {
  Heading,
  StatusBadge,
} from '@utrecht/component-library-react/dist/css-module';

const AcSearch = ({ store }) => {
  const [isLoading, setIsLoading] = React.useState(true);

  const SEARCH_RESULTS = 7;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 9000000);

    return () => clearTimeout(timer); // Clear timeout if the component unmounts
  }, []);

  return (
    <>
      <TilburgContainer spacing='lg'>
        <TilburgCard blue padding='md'>
          <TilburgSearchbox searchpage label={LABELS.SEARCH} />
        </TilburgCard>
      </TilburgContainer>
      <TilburgContainer spacing='sm'>
        <TilburgFlex spacing='xl'>
          <TilburgSearchFilters />
          <TilburgFlex column grow spacing='xs'>
            <Heading level={4}>Gekozen filters</Heading>
            <TilburgFlex spacing='sm' justifyContent='between' wrap>
              <TilburgFlex spacing='xs' wrap>
                <TilburgButton onClick={() => console.log('cleared')}>
                  <StatusBadge>
                    Woo-verzoek
                    <VISUALS.CLOSE_SMALL />
                  </StatusBadge>
                </TilburgButton>
                <TilburgButton onClick={() => console.log('cleared')}>
                  <StatusBadge>
                    Raadstuk
                    <VISUALS.CLOSE_SMALL />
                  </StatusBadge>
                </TilburgButton>
              </TilburgFlex>
              <TilburgButton>Wis alle filters</TilburgButton>
            </TilburgFlex>
            <TilburgFlex column spacing='sm' margin='sm'>
              {isLoading
                ? Array.from({ length: SEARCH_RESULTS }).map((_, index) => (
                    <TilburgSearchResult key={index} skeleton />
                  ))
                : Array.from({ length: SEARCH_RESULTS }).map((_, index) => (
                    <TilburgSearchResult key={index} />
                  ))}
              <strong style='padding-block: 3rem; color: var(--tilburg-color-pink-300);'>
                // PAGINATION PLACEHOLDER (TODO) //
              </strong>
            </TilburgFlex>
          </TilburgFlex>
        </TilburgFlex>
      </TilburgContainer>
    </>
  );
};

export default AcSearch;

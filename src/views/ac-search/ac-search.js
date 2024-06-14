import React, { useEffect, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';

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
import { withStore } from '@stores';

const SEARCH_RESULTS = 7;

const AcSearch = ({ store: { documents } }) => {
  const navigate = useNavigate();

  useEffect(() => {
    documents.fetchDocuments();
  }, [documents.query.search]);

  const renderDocuments = useMemo(() => {
    if (documents.is_loading) {
      return Array.from({ length: SEARCH_RESULTS }).map((_, index) => (
        <TilburgSearchResult skeleton key={index} />
      ));
    }

    if (documents.all_documents.length < 1) {
      return 'No results';
    }

    return documents?.all_documents?.map((document, index) => (
      <TilburgSearchResult {...document} key={index} />
    ));
  }, [documents.is_loading, documents.all_documents]);

  const onSearchSubmit = (query) => {
    documents.setSearchQuery(query);
    navigate(`/zoeken/${query}`);
  };

  return (
    <>
      <TilburgContainer spacing='lg'>
        <TilburgCard blue padding='md'>
          <TilburgSearchbox
            page='search'
            mobileFiltersOpen={documents.mobileFiltersOpen}
            toggleMobileFilters={documents.toggleMobileFilters}
            onSubmitCallback={onSearchSubmit}
            label={LABELS.SEARCH}
          />
        </TilburgCard>
      </TilburgContainer>
      <TilburgContainer spacing='sm'>
        <TilburgFlex spacing='xl'>
          <TilburgSearchFilters
            mobileFiltersOpen={documents.mobileFiltersOpen}
            toggleMobileFilters={documents.toggleMobileFilters}
          />
          <TilburgFlex column grow spacing='xs'>
            <Heading level={4}>{LABELS.CHOSEN_FILTERS}</Heading>
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
              {renderDocuments}
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

export default withStore(observer(AcSearch));

import React, { useEffect, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';

import { TilburgCard, TilburgContainer, TilburgFlex } from '@atoms';
import { TilburgSearchFilters, TilburgSearchResult } from '@molecules';
import { TilburgSearchbox } from '@components';
import { LABELS, VISUALS } from '@constants';
import { Heading, Alert } from '@utrecht/component-library-react/dist/css-module';
import { withStore } from '@stores';
import { toJS } from 'mobx';

const SEARCH_RESULTS = 7;

const AcSearch = ({ store: { documents } }) => {
  const navigate = useNavigate();

  const { searchQuery } = documents;

  useEffect(() => {
    documents.fetchDocuments();
  }, [searchQuery]);

  useEffect(() => {
    documents.fetchCategories();
  }, []);

  const renderDocuments = useMemo(() => {
    if (documents.is_loading) {
      return Array.from({ length: SEARCH_RESULTS }).map((_, index) => (
        <TilburgSearchResult skeleton key={index} />
      ));
    }

    if (documents.all_documents.length < 1) {
      return (
        <Alert type='info'>
          <TilburgFlex spacing='sm'>
            <VISUALS.INFO_BLUE />
            <TilburgFlex column spacing='xs'>
              <Heading level={3}>Geen resultaten gevonden</Heading>
              <p>Probeer een andere zoekterm of pas de filters aan.</p>
            </TilburgFlex>
          </TilburgFlex>
        </Alert>
      );
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
      {JSON.stringify(documents.searchQuery.categorie)}
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
      <TilburgContainer spacing='sm' margin='xl'>
        <TilburgFlex spacing='xl'>
          <TilburgSearchFilters
            mobileFiltersOpen={documents.mobileFiltersOpen}
            toggleMobileFilters={documents.toggleMobileFilters}
          />
          <TilburgFlex column grow spacing='xs'>
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

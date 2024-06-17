import React, { useEffect, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';

import { TilburgCard, TilburgContainer, TilburgFlex } from '@atoms';
import { TilburgSearchFilters, TilburgSearchResult } from '@molecules';
import { TilburgSearchbox } from '@components';
import { LABELS, VISUALS } from '@constants';
import { Heading, Alert } from '@utrecht/component-library-react/dist/css-module';
import { withStore } from '@stores';
import { Pagination } from '@amsterdam/design-system-react';

const AcSearch = ({ store: { documents } }) => {
  const navigate = useNavigate();

  const { searchQuery, pagination, setPage } = documents;

  useEffect(() => {
    documents.fetchDocuments();
  }, [searchQuery]);

  useEffect(() => {
    documents.fetchCategories();
  }, []);

  const renderDocuments = useMemo(() => {
    if (documents.is_loading) {
      return Array.from({ length: pagination?.limit }).map((_, index) => (
        <TilburgSearchResult skeleton key={index} />
      ));
    }

    if (documents.all_documents?.length < 1) {
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
        <TilburgFlex spacing='xl' className='tilburg-search-results'>
          <TilburgSearchFilters
            mobileFiltersOpen={documents.mobileFiltersOpen}
            toggleMobileFilters={documents.toggleMobileFilters}
          />
          <TilburgFlex column grow spacing='xs'>
            <TilburgFlex column spacing='sm' margin='sm'>
              {renderDocuments}
              {pagination && (
                <Pagination
                  totalPages={pagination?.pages}
                  page={pagination?.page}
                  onPageChange={setPage}
                  nextLabel=''
                  previousLabel=''
                  maxVisiblePages={7}
                />
              )}
            </TilburgFlex>
          </TilburgFlex>
        </TilburgFlex>
      </TilburgContainer>
    </>
  );
};

export default withStore(observer(AcSearch));

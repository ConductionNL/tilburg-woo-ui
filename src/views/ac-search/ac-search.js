import React, { useEffect, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { TilburgCard, TilburgContainer, TilburgFlex } from '@atoms';
import { TilburgSearchFilters, TilburgSearchResult } from '@molecules';
import { TilburgSearchbox } from '@components';
import { LABELS, VISUALS } from '@constants';
import { Heading, Alert } from '@utrecht/component-library-react/dist/css-module';
import { withStore } from '@stores';
import { Pagination } from '@amsterdam/design-system-react';
import { Paragraph } from '@utrecht/component-library-react';
import { AcBuildURLSearchParams } from '@utils';

const AcSearch = ({ store: { documents } }) => {
  const navigate = useNavigate();
  const { query } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    searchQuery,
    pagination,
    setPage,
    updateQuery,
    setSearchQuery,
    fetchCategories,
    fetchDocuments,
    is_loading,
    all_documents,
    mobileFiltersOpen,
    toggleMobileFilters,
  } = documents;

  useEffect(() => {
    updateQuery({ _page: searchParams.get('page') || 1, search: query || '' });
  }, []);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (searchQuery.search === undefined) {
      return;
    }
    fetchDocuments();
    navigate(getNavigateUrl({}));
  }, [searchQuery]);

  const getNavigateUrl = ({ query, page }) => {
    const params = AcBuildURLSearchParams({
      page: page || searchQuery._page,
      categorie: searchQuery.categorie,
    });
    return `/zoeken/${query !== undefined ? query : searchQuery.search}?${params}`;
  };

  const onPaginationChange = (page) => {
    setPage(page);
  };

  const onSearchSubmit = (query) => {
    setSearchQuery(query);
  };

  const renderDocuments = useMemo(() => {
    if (is_loading) {
      return Array.from({ length: pagination?.limit }).map((_, index) => (
        <TilburgSearchResult skeleton key={index} />
      ));
    }

    if (all_documents?.length < 1) {
      return (
        <Alert type='info'>
          <TilburgFlex spacing='sm'>
            <VISUALS.INFO_BLUE />
            <TilburgFlex column spacing='xs'>
              <Heading level={3}>Geen resultaten gevonden</Heading>
              <Paragraph>
                Probeer een andere zoekterm of pas de filters aan.
              </Paragraph>
            </TilburgFlex>
          </TilburgFlex>
        </Alert>
      );
    }

    return all_documents?.map((document, index) => (
      <TilburgSearchResult {...document} key={index} />
    ));
  }, [is_loading, all_documents]);

  return (
    <>
      <TilburgContainer spacing='lg'>
        <TilburgCard blue padding='md'>
          <TilburgSearchbox
            page='search'
            mobileFiltersOpen={mobileFiltersOpen}
            toggleMobileFilters={toggleMobileFilters}
            onSubmitCallback={onSearchSubmit}
            label={LABELS.SEARCH}
            defaultValue={searchQuery.search}
          />
        </TilburgCard>
      </TilburgContainer>
      <TilburgContainer spacing='sm' margin='xl'>
        <TilburgFlex spacing='xl' className='tilburg-search-results'>
          <TilburgSearchFilters
            mobileFiltersOpen={mobileFiltersOpen}
            toggleMobileFilters={toggleMobileFilters}
          />
          <TilburgFlex column grow spacing='xs'>
            <TilburgFlex column spacing='sm' margin='sm'>
              {renderDocuments}
              {pagination?.pages > 1 && (
                <Pagination
                  totalPages={pagination?.pages}
                  page={pagination?.page}
                  onPageChange={onPaginationChange}
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

import React, { useEffect, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { TilburgSearchFilters, TilburgSearchResult } from '@molecules';
import { TilburgCard, TilburgContainer, TilburgFlex } from '@atoms';
import { TilburgSearchbox } from '@components';
import { LABELS, LABELS_DYNAMIC, VISUALS } from '@constants';
import { withStore } from '@stores';

import {
  Alert,
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import { Pagination } from '@amsterdam/design-system-react';

const AcSearch = ({ store: { documents } }) => {
  const { query } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const {
    search_query,
    pagination,
    setPage,
    updateQuery,
    setSearchQuery,
    fetchAggregations,
    fetchDocuments,
    is_loading,
    getSearchPageURL,
    all_documents,
  } = documents;

  useEffect(() => {
    updateQuery({
      _page: searchParams.get('page') || 1,
      search: query || '',
      categorie: searchParams.getAll('categorie[]'),
      'publicatiedatum[before]': searchParams.get('publicatiedatum[before]'),
      'publicatiedatum[after]': searchParams.get('publicatiedatum[after]'),
    });

    fetchAggregations();
  }, []);

  useEffect(() => {
    if (search_query.search === undefined) {
      return;
    }
    fetchDocuments();
    navigate(getSearchPageURL(), { replace: true });
  }, [search_query]);

  const onPaginationChange = (page) => {
    setPage(page);
  };

  const onSearchSubmit = (query) => {
    setSearchQuery(query);
  };

  const screenReaderText = useMemo(() => {
    if (is_loading === true) {
      return LABELS.SEARCH_RESULTS_LOADING;
    }

    return `${LABELS.SEARCH_RESULTS_LOADED} ${LABELS_DYNAMIC.RESULTS(
      all_documents?.length
    )} ${LABELS.FOUND.toLowerCase()}.`;
  }, [is_loading]);

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
              <Heading level={3}>{LABELS.NO_RESULTS}</Heading>
              <Paragraph>{LABELS.REFINE_SEARCH}</Paragraph>
            </TilburgFlex>
          </TilburgFlex>
        </Alert>
      );
    }

    return all_documents?.map((document, index) => (
      <TilburgSearchResult {...document} key={index} />
    ));
  }, [is_loading, all_documents, pagination?.limit]);

  return (
    <>
      <TilburgContainer spacing='lg'>
        <TilburgCard blue padding='md'>
          <TilburgSearchbox
            page='search'
            onSubmitCallback={onSearchSubmit}
            label={LABELS.SEARCH}
            defaultValue={search_query.search}
          />
        </TilburgCard>
      </TilburgContainer>
      <TilburgContainer spacing='sm' margin='xl'>
        <TilburgFlex spacing='xl' className='tilburg-search-results'>
          <TilburgSearchFilters />
          <TilburgFlex column grow spacing='xs'>
            <div className='sr-only' aria-live='polite' aria-atomic='true'>
              {screenReaderText}
            </div>
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

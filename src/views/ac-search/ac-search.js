import { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { AcBreadcrumbs, AcSearchFilters, AcSearchResult } from '@molecules';
import { AcCard, AcContainer, AcFlex } from '@atoms';
import { LABELS, LABELS_DYNAMIC, VISUALS } from '@constants';
import { AcSearchBox, AcSearchSort } from '@components';
import { withStore } from '@stores';

import {
  Alert,
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import { Pagination } from '@amsterdam/design-system-react';
import { AcSearchParamsToObject } from '@utils';

const AcSearch = ({ store: { documents } }) => {
  const location = useLocation();
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
    resetSearchQuery,
    resetAggregations,
  } = documents;

  const setQuery = () => {
    updateQuery(AcSearchParamsToObject(searchParams));
  };

  useEffect(() => {
    setQuery();

    fetchAggregations();
    fetchDocuments();

    return () => {
      resetSearchQuery();
      resetAggregations();
    };
  }, []);

  useEffect(() => {
    if (getSearchPageURL() === location.pathname + location.search) {
      return;
    }

    navigate(getSearchPageURL());
  }, [search_query]);

  // On GET params change.
  useEffect(() => {
    setQuery();
    fetchDocuments();
  }, [location.search]);

  const onPaginationChange = (page) => {
    setPage(page);
  };

  const renderPagination = useMemo(() => {
    // Pagination component does not update with updated props. It will keep the 'page' prop internally.
    // To force an update, we need to rerender the component.
    if (is_loading) {
      return null;
    }

    return (
      <Pagination
        totalPages={pagination?.pages}
        page={pagination?.page}
        onPageChange={onPaginationChange}
        nextLabel=''
        previousLabel=''
        maxVisiblePages={7}
      />
    );
  }, [is_loading, pagination?.page]);

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
  }, [is_loading, all_documents?.length]);

  const renderDocuments = useMemo(() => {
    if (is_loading) {
      return Array.from({ length: pagination?.limit || 15 }).map((_, index) => (
        <AcSearchResult skeleton key={index} />
      ));
    }

    if (all_documents?.length < 1) {
      return (
        <Alert type='info'>
          <AcFlex spacing='sm'>
            <VISUALS.INFO_BLUE />
            <AcFlex column spacing='xs'>
              <Heading level={3}>{LABELS.NO_RESULTS}</Heading>
              <Paragraph>{LABELS.REFINE_SEARCH}</Paragraph>
            </AcFlex>
          </AcFlex>
        </Alert>
      );
    }

    return all_documents?.map((document, index) => (
      <AcSearchResult {...document} key={index} />
    ));
  }, [is_loading, all_documents, pagination?.limit]);

  return (
    <>
      <AcContainer spacing='lg'>
        <AcCard blue padding='md'>
          <AcSearchBox
            page='search'
            onSubmitCallback={onSearchSubmit}
            label={LABELS.SEARCH}
            defaultValue={search_query.search}
          />
        </AcCard>
      </AcContainer>
      <AcContainer spacing='sm' margin='xl'>
        <AcFlex spacing='xl' className='ac-search-results'>
          <AcSearchFilters />
          <AcFlex column grow spacing='xs'>
            <div className='sr-only' aria-live='polite' aria-atomic='true'>
              {screenReaderText}
            </div>
            <AcFlex column spacing='sm' margin='sm'>
              <AcFlex justifyContent='between'>
                <Heading level={2}>{LABELS.SEARCH_RESULTS}</Heading>
                <div className='desktop-sorting'>
                  <AcSearchSort type='alt' />
                </div>
              </AcFlex>
              {renderDocuments}
              {pagination?.pages > 1 && renderPagination}
            </AcFlex>
          </AcFlex>
        </AcFlex>
      </AcContainer>
    </>
  );
};

export default withStore(observer(AcSearch));

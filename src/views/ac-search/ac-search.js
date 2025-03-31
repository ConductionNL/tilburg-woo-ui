import { useEffect, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { AcSearchFilters, AcSearchResult } from '@molecules';
import { AcCard, AcContainer, AcFlex } from '@atoms';
import { LABELS, LABELS_DYNAMIC, VISUALS } from '@constants';
import { AcSearchBox, AcSearchSort } from '@components';
import { withStore } from '@stores';

import {
  Alert,
  Heading,
  Paragraph,
  SkipLink,
} from '@utrecht/component-library-react/dist/css-module';
import { Pagination } from '@amsterdam/design-system-react';
import { AcSearchParamsToObject } from '@utils';

const AcSearch = ({ store: { publications } }) => {
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
    fetchPublications,
    is_loading,
    getSearchPageURL,
    all_publications,
    resetSearchQuery,
    resetAggregations,
  } = publications;

  const setQuery = () => {
    updateQuery(AcSearchParamsToObject(searchParams));
  };

  useEffect(() => {
    setQuery();

    fetchAggregations();

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
  }, [search_query, ...Object.values(search_query?.published || {})]);

  // On GET params change.
  useEffect(() => {
    setQuery();
    fetchPublications();
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
        page={parseInt(pagination?.page, 10)}
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

    // Make sure count is defined before using it
    const count = all_publications?.length || 0;
    const resultText = LABELS_DYNAMIC.RESULTS(count);

    return `${
      LABELS.SEARCH_RESULTS_LOADED
    }. ${count} ${resultText.toLowerCase()} ${LABELS.FOUND.toLowerCase()}.`;
  }, [is_loading, all_publications?.length, location.search]);

  const renderPublications = useMemo(() => {
    if (is_loading) {
      return Array.from({ length: pagination?.limit || 15 }).map((_, index) => (
        <AcSearchResult skeleton key={index} />
      ));
    }

    if (all_publications?.length < 1) {
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

    return all_publications?.map((publication, index) => (
      <AcSearchResult {...publication} key={index} />
    ));
  }, [is_loading, all_publications, pagination?.limit]);

  return (
    <>
      <AcContainer spacing='lg'>
        <Heading level={1}>Zoeken in publicaties</Heading>
        <AcCard blue padding='md'>
          <AcSearchBox
            page='search'
            onSubmitCallback={onSearchSubmit}
            label={LABELS.WHAT_ARE_YOU_LOOKING_FOR}
            defaultValue={search_query._search}
          />
        </AcCard>
      </AcContainer>
      <AcContainer spacing='sm' margin='xl'>
        <SkipLink href='#search-results'>Ga direct naar zoekresultaten</SkipLink>
        <AcFlex spacing='xl' className='ac-search-results'>
          <AcSearchFilters />
          <AcFlex column grow spacing='xs'>
            <div className='sr-only' aria-live='polite' aria-atomic='true'>
              {screenReaderText}
            </div>
            <AcFlex id='search-results' column spacing='sm' margin='sm'>
              <AcFlex justifyContent='between'>
                <Heading level={2}>
                  {all_publications?.length}{' '}
                  {LABELS_DYNAMIC.RESULTS(all_publications?.length).toLowerCase()}
                </Heading>
                <div className='desktop-sorting'>
                  <AcSearchSort type='alt' />
                </div>
              </AcFlex>
              {renderPublications}
              {pagination?.pages > 1 && renderPagination}
            </AcFlex>
          </AcFlex>
        </AcFlex>
      </AcContainer>
    </>
  );
};

export default withStore(observer(AcSearch));

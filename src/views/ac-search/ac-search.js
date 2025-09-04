import { useEffect, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useLocation, useSearchParams } from 'react-router-dom';

import { AcSearchFilters, AcSearchResult } from '@molecules';
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
import { extractTitle, extractSummary } from '@src/utilities/con-extract-text';
import { ConCardOrganisationApplication, ConCardDienst } from '@molecules/con-cards';

const AcSearch = ({ store: { publications, user } }) => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    search_query,
    pagination,
    updateQuery,
    fetchPublications,
    is_loading,
    // getSearchPageURL,
    all_publications,
  } = publications;

  const setQuery = () => {
    const paramsObj = AcSearchParamsToObject(searchParams);
    if (!paramsObj._search) {
      paramsObj._search = null;
    }
    updateQuery(paramsObj);
  };

  // DISABLED: This effect was competing with URL processing and causing the deep linking issue
  // useEffect(() => {
  //   if (getSearchPageURL() === location.pathname + location.search) {
  //     return;
  //   }
  //   navigate(getSearchPageURL());
  // }, [search_query, ...Object.values(search_query?.published || {})]);

  // On GET params change.
  useEffect(() => {
    setQuery();
    fetchPublications();
  }, [location.search]);

  const onPaginationChange = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set('_page', page);
    setSearchParams(params);
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
    const params = new URLSearchParams(searchParams);
    if (query && query.trim()) {
      params.set('_search', query.trim());
    } else {
      params.delete('_search');
    }
    params.set('_page', 1);
    setSearchParams(params);
  };

  const screenReaderText = useMemo(() => {
    if (is_loading === true) {
      return LABELS.SEARCH_RESULTS_LOADING;
    }

    return `${LABELS.SEARCH_RESULTS_LOADED} ${LABELS_DYNAMIC.RESULTS(
      all_publications?.length
    )} ${LABELS.FOUND.toLowerCase()}.`;
  }, [is_loading, all_publications?.length]);

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

    return all_publications?.map((publication, index) => {
      switch (publication['@self'].schema.slug) {
        case 'product':
        case 'organisatie':
          return (
            <ConCardOrganisationApplication
              {...publication}
              title={extractTitle(publication['@self'].name)}
              summary={extractSummary(publication['@self'].description)}
              logo={publication['@self'].logo}
              cardType={publication['@self'].schema.slug}
              type={publication['@self'].schema.type}
              user={user}
              published={publication['@self'].published}
              key={index}
            />
          );
        case 'dienst':
          return (
            <ConCardDienst
              {...publication}
              updated={publication['@self'].updated}
              published={publication['@self'].published}
              category={publication['@self'].schema.title}
              title={extractTitle(
                publication.title ??
                  publication.titel ??
                  publication.name ??
                  publication.naam ??
                  publication.id
              )}
              summary={extractSummary(publication?.beschrijvingKort)}
              organisationData={publication?.organisatie}
              key={index}
            />
          );
        default:
          return (
            <AcSearchResult
              {...publication}
              published={publication['@self'].published}
              category={publication['@self'].schema.title}
              title={extractTitle(
                publication.title ??
                  publication.titel ??
                  publication.name ??
                  publication.naam ??
                  publication.id
              )}
              summary={extractSummary(
                publication?.summary || publication?.beschrijving
              )}
              user={user}
              schemaSlug={publication['@self']?.schema?.slug}
              key={index}
            />
          );
      }
    });
  }, [is_loading, all_publications, pagination?.limit]);

  return (
    <>
      <AcContainer spacing='lg'>
        <AcCard blue padding='md'>
          <AcSearchBox
            page='search'
            onSubmitCallback={onSearchSubmit}
            label={LABELS.SEARCH}
            defaultValue={search_query._search}
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
                <Heading level={2}>
                  {pagination.total}{' '}
                  {LABELS_DYNAMIC.RESULTS(pagination.total).toLowerCase()}
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

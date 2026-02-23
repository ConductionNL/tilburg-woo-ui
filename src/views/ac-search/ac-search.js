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
import {
  AcSearchParamsToObject,
  ConFormatDutchNumber,
  getImageFromPublication,
} from '@utils';
import { extractTitle, extractSummary } from '@src/utilities/con-extract-text';
import {
  ConCardOrganisationApplication,
  ConCardDienst,
  ConCardContactpersoon,
  ConCardGebruik,
  ConCardModuleVersie,
  ConCardKoppeling,
} from '@molecules/con-cards';

const AcSearch = ({ store: { publications, user, object } }) => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    pagination,
    updateQuery,
    fetchPublications,
    fetchFacets,
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

  // On GET params change - optimized order
  useEffect(() => {
    setQuery();
    
    // Step 1: Fetch publications first (fastest, shows results immediately)
    fetchPublications();
    
    // Step 2: Fetch facets after publications (only once, not on every search change)
    // This is heavier and not needed for initial display
    fetchFacets();
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
      const selfData = publication['@self'];

      switch (selfData.schema.slug) {
        case 'product':
        case 'module':
        case 'organisatie':
          return (
            <ConCardOrganisationApplication
              {...publication}
              self={selfData}
              id={publication.id || selfData?.id}
              title={extractTitle(selfData.name)}
              summary={extractSummary(
                selfData?.summary || publication?.beschrijvingKort
              )}
              logo={getImageFromPublication(publication)}
              cardType={selfData.schema.slug}
              type={selfData.schema.title}
              user={user}
              referenceComponents={publication.referentieComponenten}
              created={selfData.created}
              organisation={selfData.organisation}
              objectStore={object}
              key={index}
            />
          );
        case 'moduleversie':
          return (
            <ConCardModuleVersie
              {...publication}
              id={publication.id || publication['@self']?.id}
              versie={publication.versie || publication['@self']?.name}
              beschrijvingKort={publication.beschrijvingKort}
              beschrijvingLang={
                publication.beschrijvingLang || publication['@self']?.summary
              }
              status={publication.status}
              datumInOntwikkeling={publication.datumInOntwikkeling}
              datumInGebruik={publication.datumInGebruik}
              datumEindeOndersteuning={publication.datumEindeOndersteuning}
              datumTeruggetrokken={publication.datumTeruggetrokken}
              organisation={publication['@self']?.organisation}
              moduleUuid={
                publication['@self']?.relations?.module || publication.module
              }
              objectStore={object}
              key={index}
            />
          );
        case 'dienst':
          return (
            <ConCardDienst
              {...publication}
              id={publication.id || publication['@self']?.id}
              created={publication['@self']?.created}
              category={publication['@self'].schema.title}
              title={extractTitle(
                publication['@self']?.name ??
                  publication.title ??
                  publication.titel ??
                  publication.name ??
                  publication.naam ??
                  publication.id
              )}
              summary={extractSummary(publication?.beschrijvingKort)}
              aanbieder={
                publication['@self']?.relations?.aanbieder || publication.aanbieder
              }
              status={publication.status}
              type={publication.type}
              objectStore={object}
              key={index}
            />
          );
        case 'contactpersoon':
          return (
            <ConCardContactpersoon
              {...publication}
              id={publication.id || publication['@self']?.id}
              firstName={publication.voornaam}
              middleName={publication.tussenvoegsel}
              lastName={publication.achternaam}
              functie={publication.functie}
              image={publication['@self'].image || publication.image}
              email={publication['e-mailadres']}
              telefoon={publication.telefoonnummer}
              organisation={publication.organisatie}
              objectStore={object}
              key={index}
            />
          );
        case 'gebruik':
          return (
            <ConCardGebruik
              {...publication}
              id={publication.id || publication['@self']?.id}
              product={publication.product}
              module={publication.module}
              organisation={publication['@self'].organisation}
              referentieComponenten={publication.gebruiktVoorReferentiecomponenten}
              status={publication.status}
              objectStore={object}
              key={index}
            />
          );
        case 'koppeling':
          return (
            <ConCardKoppeling
              {...publication}
              key={index}
              id={publication.id || publication['@self']?.id}
              created={publication['@self']?.created}
              title={extractTitle(
                publication['@self']?.name ??
                  publication.title ??
                  publication.titel ??
                  publication.name ??
                  publication.naam ??
                  publication.id
              )}
              item={publication}
              category={publication['@self']?.schema?.title}
              themes={publication.themes}
              navigateTo='publication'
            />
          );
        default:
          return (
            <AcSearchResult
              id={publication.id || selfData?.id}
              created={selfData.created}
              category={selfData.schema.title}
              title={extractTitle(
                selfData?.name ??
                  publication.title ??
                  publication.titel ??
                  publication.name ??
                  publication.naam ??
                  publication.id
              )}
              summary={extractSummary(
                publication?.summary || publication?.beschrijving
              )}
              themes={publication.themes}
              user={user}
              schemaSlug={selfData?.schema?.slug}
              self={selfData}
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
            defaultValue={searchParams.get('_search') || ''}
          />
        </AcCard>
      </AcContainer>
      <AcContainer spacing='sm' margin='xl'>
        <div className='ac-search-layout'>
          {/* Results and pagination come first in DOM/tab order */}
          <div className='ac-search-layout__main'>
            <div className='sr-only' aria-live='polite' aria-atomic='true'>
              {screenReaderText}
            </div>
            <AcFlex column spacing='sm' margin='sm'>
              <AcFlex justifyContent='between'>
                <Heading level={2}>
                  {ConFormatDutchNumber(pagination.total)}{' '}
                  {LABELS_DYNAMIC.RESULTS(pagination.total).toLowerCase()}
                </Heading>
                <div className='desktop-sorting'>
                  <AcSearchSort type='alt' />
                </div>
              </AcFlex>
              {renderPublications}
              {pagination?.pages > 1 && renderPagination}
            </AcFlex>
          </div>

          {/* Filters come last in DOM/tab order */}
          <div className='ac-search-layout__filters'>
            <AcSearchFilters />
          </div>
        </div>
      </AcContainer>
    </>
  );
};

export default withStore(observer(AcSearch));

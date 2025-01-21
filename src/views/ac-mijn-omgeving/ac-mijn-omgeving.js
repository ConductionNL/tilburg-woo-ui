import { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { AcSearchFilters, AcSearchResult, AcLink, AcTable } from '@molecules';
import { AcCard, AcContainer, AcFlex } from '@atoms';
import { LABELS, LABELS_DYNAMIC, VISUALS } from '@constants';
import { AcSearchBox, AcSearchSort } from '@components';
import { withStore } from '@stores';

import {
  Alert,
  Heading,
  Paragraph,
  BadgeCounter,
} from '@utrecht/component-library-react/dist/css-module';
import { Pagination } from '@amsterdam/design-system-react';
import { AcSearchParamsToObject } from '@utils';
import AcSideNav from './ac-side-nav';
import {
  Sidenav,
  SidenavList,
  SidenavItem,
  SidenavLink,
  SidenavLinkLabel,
} from '@gemeente-denhaag/components-react';
import { AcTabs, AcTabList, AcTab, AcTabPanel } from '@atoms';
import { AcCNavigation } from '@components';
const AcMijnOmgeving = ({ store: { mijnOmgeving } }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tabIndex, setTabIndex] = useState(0);
  const [catalogId, setCatalogId] = useState(null);
  const [publicationTypeId, setPublicationTypeId] = useState(null);
  const [selectedPublicationType, setSelectedPublicationType] = useState(null);

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
  } = mijnOmgeving;

  const getSelectedPublicationType = (catalog_id, publication_type_id) => {
    console.log(catalog_id, publication_type_id);
    const catalog = all_publications.find((catalog) => catalog.id === catalog_id);
    console.log(catalog);
    const publicationType = catalog.publicationTypes.find(
      (publicationType) => publicationType.id === publication_type_id
    );
    setSelectedPublicationType(publicationType);
  };

  const publicationRow = () => {
    const test = JSON.parse(JSON.stringify(selectedPublicationType));
    console.log(test.title);

    return [
      <span>{test.title}</span>,
      <span>{test.summary || 'Geen samenvatting beschikbaar'}</span>,
    ];
  };

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
    console.log(getSearchPageURL());
    console.log(location.pathname + location.mijnOmgeving);
    if (getSearchPageURL() === location.pathname + location.mijnOmgeving) {
      return;
    }

    navigate(getSearchPageURL());
  }, [search_query, ...Object.values(search_query?.published || {})]);

  // On GET params change.
  useEffect(() => {
    console.group('LOCATION PARAMS CHANGED');
    console.log([location.mijnOmgeving]);
    console.groupEnd();

    setQuery();
    fetchPublications();
  }, [location.mijnOmgeving]);

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

  const users = [
    {
      name: 'Lisa',
      last_name: 'Smith',
      function: 'Developer',
    },
    {
      name: 'Bram',
      last_name: 'van der Veen',
      function: 'Manager',
    },
    {
      name: 'Jeroen',
      last_name: 'Molenaar',
      function: 'Lead Developer',
    },
  ];

  const mapConfigurationRow = (row) => {
    return [
      <span>{row.name}</span>,
      <span>{row.last_name}</span>,
      <span>{row.function}</span>,
    ];
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

    return all_publications?.map((publication, index) => (
      <AcSearchResult {...publication} key={index} />
    ));
  }, [is_loading, all_publications, pagination?.limit]);

  return (
    <>
      <AcContainer spacing='sm' margin='xl'>

        <AcFlex spacing='xl'>
          <Sidenav>
            <SidenavList>
              <SidenavItem>
                <SidenavLink current>
                  <VISUALS.USERS />
                  Gebruikers
                </SidenavLink>
              </SidenavItem>
              <SidenavItem>
                <SidenavLink>
                  <VISUALS.CUBE />
                  Voorzieningen
                </SidenavLink>
              </SidenavItem>
              <SidenavItem>
                <SidenavLink>
                  <VISUALS.HAND_HOLDING />
                  Aanbod
                </SidenavLink>
              </SidenavItem>
              <SidenavItem>
                <SidenavLink>
                  <VISUALS.BUILDING />
                  Organisaties
                </SidenavLink>
              </SidenavItem>
              <SidenavItem>
                <SidenavLink>
                  <VISUALS.TRUCK />
                  Leveranciers
                </SidenavLink>
              </SidenavItem>
            </SidenavList>
          </Sidenav>
          {/* {all_publications && (
            <AcTabs
              className='ac-mijn-omgeving-tabs'
              selectedIndex={tabIndex}
              onSelect={(index) => {
                setTabIndex(index);
                setCatalogId(all_publications[index].id);
              }}
            >
              <AcTabList>
                {all_publications.map((catalog, idx) => (
                  <AcTab selected={tabIndex === idx}>
                    <span>{catalog.title}</span>
                    <BadgeCounter className='ac-publication-badge-counter'>
                      {catalog?.publicationTypes?.length}
                    </BadgeCounter>
                  </AcTab>
                ))}
              </AcTabList>
              {all_publications &&
                all_publications.map((catalog, idx) => (
                  <AcTabPanel
                    selected={tabIndex === idx}
                    className='ac-mijn-omgeving-tabpanels'
                  >
                    <Sidenav>
                      <SidenavList>
                        <SidenavItem>
                          <SidenavLink>
                            <span>Alles</span>
                          </SidenavLink>
                        </SidenavItem>
                        {catalog.publicationTypes.map((item, index) => (
                          <SidenavItem key={index} current={index === 0}>
                            <SidenavLink
                              onClick={() => {
                                setPublicationTypeId(item.id);
                                getSelectedPublicationType(catalog.id, item.id);
                              }}
                            >
                              {item.title}
                            </SidenavLink>
                          </SidenavItem>
                        ))}
                      </SidenavList>
                    </Sidenav>
                  </AcTabPanel>
                ))}
            </AcTabs>
          )} */}

          <AcFlex column grow spacing='xs'>
            <AcFlex column spacing='sm' margin='sm'>
              <AcTable
                header={['Voornaam', 'Achternaam', 'Functie']}
                rows={users?.map((user) => mapConfigurationRow(user))}
              />
            </AcFlex>
          </AcFlex>
        </AcFlex>
      </AcContainer>
    </>
  );
};

export default withStore(observer(AcMijnOmgeving));

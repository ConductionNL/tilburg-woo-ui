/**
 * Beheer Views List Component
 * Custom management page for AMEF views with card-based layout
 */

import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { withStore } from '@stores';
import { AcSection, AcFlex, AcContainer } from '@atoms';
import { ConDynamicSidenav, AcLoader } from '@components';
import { AcSearchResult } from '@molecules';
import { Alert, Heading, Paragraph, Textbox } from '@utrecht/component-library-react';
import { VISUALS } from '@constants';

const ConBeheerViewsList = ({ store }) => {
  const { gemma } = store;
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Load views on component mount
  useEffect(() => {
    if (!gemma) return;
    
    const loadViews = async (params = {}) => {
      setIsLoading(true);
      try {
        await gemma.fetchViews(params);
      } catch (error) {
        console.error('Error loading views:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if we don't have views yet — filter server-side to reduce payload (33MB → 9.6MB)
    if (!gemma.all_views || gemma.all_views.length === 0) {
      loadViews({ publiceren: 'Softwarecatalogus en GEMMA Online en redactie', _unset: 'xml', _limit: 100 });
    } else {
      setIsLoading(false);
    }
  }, [gemma]);

  // Helper functions to extract view data
  const getViewName = (view) => {
    const inlineTitle =
      typeof view?.titelViewSwc === 'string' ? view.titelViewSwc.trim() : '';
    if (inlineTitle) return inlineTitle;
    return view?.name || view?.['@self']?.name || 'Naamloze View';
  };

  const getViewDescription = (view) => {
    if (view?.['@self']?.summary) return view['@self'].summary;
    if (view?.['@self']?.description) return view['@self'].description;
    if (view?.documentation) return view.documentation;
    if (view?.description) return view.description;
    return 'Geen beschrijving beschikbaar voor deze view.';
  };

  // Filter views to only show Softwarecatalogus views
  const views = (gemma?.all_views || []).filter(
    (view) => view?.publiceren === 'Softwarecatalogus en GEMMA Online en redactie'
  );

  // Filter views based on search query
  const filteredViews = views.filter((view) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const viewName = getViewName(view).toLowerCase();
    const viewDescription = getViewDescription(view).toLowerCase();

    return viewName.includes(query) || viewDescription.includes(query);
  });

  return (
    <AcSection spacing className='ac-mijn-omgeving-section'>
      <AcContainer>
        <AcFlex spacing='xl'>
          <ConDynamicSidenav store={store} />

          <AcFlex column spacing='lg' className='con-beheer-views-list-content'>
            {/* Page Header */}
            <div className='con-beheer-views-list-header'>
              <Heading level={1}>AMEF Views</Heading>
              <Paragraph>
                Overzicht van alle beschikbare architectuurweergaven uit GEMMA
              </Paragraph>
            </div>

            {/* Info Box - Explanation of Views */}
            <Alert type='info' className='con-beheer-views-info-alert'>
              <Heading level={4}>Wat zijn AMEF Views?</Heading>
              <Paragraph>
                Views zijn architecturale weergaven van GEMMA waarop applicaties en
                koppelingen kunnen worden geplot. Dit werkt via Gebruik-objecten.
                Gebruik-objecten kunnen worden aangeleverd door een organisatie zelf of
                door een samenwerkingsverband waarvan die organisatie lid is.
              </Paragraph>
              <Paragraph style={{ marginTop: 'var(--tilburg-space-block-sm)' }}>
                Door een view te selecteren kunt u de architecturale opzet bekijken en
                zien hoe verschillende componenten met elkaar samenhangen binnen de
                GEMMA-standaard.
              </Paragraph>
            </Alert>

            {/* Search Box */}
            <div className='con-beheer-views-search'>
              <Textbox
                placeholder='Zoek naar een view...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='con-beheer-views-search-input'
              />
              <div className='con-beheer-views-search-icon'>
                <VISUALS.SEARCH />
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <AcFlex
                justifyContent='center'
                style={{ padding: 'var(--tilburg-space-block-xl)' }}
              >
                <AcLoader />
              </AcFlex>
            )}

            {/* Error State */}
            {gemma?.get_viewsError && !isLoading && (
              <Alert type='error'>
                <Heading level={4}>Fout bij laden</Heading>
                <Paragraph>
                  Er is een fout opgetreden bij het laden van de views. Probeer de
                  pagina te vernieuwen.
                </Paragraph>
              </Alert>
            )}

            {/* Views List - Using search result cards */}
            {!isLoading && filteredViews.length > 0 && (
              <div className='con-beheer-views-results'>
                {filteredViews.map((view) => {
                  const viewId = view?.id || view?.['@self']?.id;
                  return (
                    <AcSearchResult
                      key={viewId}
                      id={viewId}
                      title={getViewName(view)}
                      summary={getViewDescription(view)}
                      category='View'
                      navigateTo='view'
                    />
                  );
                })}
              </div>
            )}

            {/* No Results State */}
            {!isLoading && views.length > 0 && filteredViews.length === 0 && (
              <Alert type='warning'>
                <Heading level={4}>Geen resultaten gevonden</Heading>
                <Paragraph>
                  Er zijn geen views gevonden die overeenkomen met uw zoekopdracht "{searchQuery}".
                </Paragraph>
              </Alert>
            )}

            {/* Empty State */}
            {!isLoading && views.length === 0 && !gemma?.get_viewsError && (
              <Alert type='warning'>
                <Heading level={4}>Geen views beschikbaar</Heading>
                <Paragraph>
                  Er zijn momenteel geen AMEF views beschikbaar om weer te geven.
                </Paragraph>
              </Alert>
            )}
          </AcFlex>
        </AcFlex>
      </AcContainer>
    </AcSection>
  );
};

export default withStore(observer(ConBeheerViewsList));

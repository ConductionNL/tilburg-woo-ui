import _ from 'lodash';
import { useEffect, useState } from 'react';
import { AcLoader } from '@components';
import { observer } from 'mobx-react-lite';
import { AcSearchResult } from '@molecules';
import { AcTabs, AcTabList, AcTab, AcTabPanel } from '@atoms';
import { getTabHeaderIcon, getTabHeaderName, getImageFromPublication } from '@utils';
import {
  ConCardOrganisationApplication,
  ConCardDienst,
  ConCardGebruik,
  ConCardContactpersoon,
  ConCardKoppeling,
} from '@molecules/con-cards';
import { commongroundApiUrl } from '@src/config';

// Helper function to define the desired tab order
const getTabOrder = (schemaSlug) => {
  const order = {
    product: 1,
    module: 2,
    dienst: 3,
    gebruik: 4,
    contactpersoon: 5,
  };
  return order[schemaSlug] || 999; // Other relations get a high number to appear last
};

// Helper function to render a card based on schema type
const renderCard = (item, object, navigateTo) => {
  const schemaSlug = item['@self']?.schema?.slug;

  switch (schemaSlug) {
    case 'product':
    case 'module':
    case 'organisatie':
      return (
        <ConCardOrganisationApplication
          key={item.id}
          id={item.id}
          title={item.title ?? item.titel ?? item.name ?? item.naam ?? item.id}
          summary={item.beschrijving ?? item.beschrijvingKort ?? ''}
          logo={getImageFromPublication(item)}
          cardType={schemaSlug}
          type={item['@self']?.schema?.title}
          referenceComponents={item.referentieComponenten}
          updated={item['@self']?.updated}
          published={item['@self']?.published}
          organisation={item['@self']?.organisation}
          objectStore={object}
          navigateTo={`${navigateTo}-${schemaSlug}`}
        />
      );
    case 'dienst':
      return (
        <ConCardDienst
          key={item.id}
          id={item.id}
          title={item.title ?? item.titel ?? item.name ?? item.naam ?? item.id}
          summary={item.beschrijving ?? item.beschrijvingKort ?? ''}
          updated={item['@self']?.updated}
          published={item['@self']?.published}
          category={item['@self']?.schema?.title}
          themes={item.themes}
          navigateTo={navigateTo}
        />
      );
    case 'gebruik':
      return (
        <ConCardGebruik
          key={item.id}
          id={item.id}
          product={item.product}
          module={item.module}
          organisation={item['@self'].organisation}
          referentieComponenten={item.gebruiktVoorReferentiecomponenten}
          status={item.status}
          objectStore={object}
          navigateTo={navigateTo}
        />
      );
    case 'contactpersoon':
      return (
        <ConCardContactpersoon
          key={item.id}
          id={item.id}
          firstName={item.voornaam}
          middleName={item.tussenvoegsel}
          lastName={item.achternaam}
          functie={item.functie}
          image={item['@self'].image}
          email={item['e-mailadres']}
          telefoon={item.telefoonnummer}
          organisation={item.organisatie}
          objectStore={object}
          navigateTo={navigateTo}
        />
      );
    case 'koppeling':
      return (
        <ConCardKoppeling
          key={item.id}
          id={item.id}
          title={item.title}
          item={item}
          category={item['@self']?.schema?.title}
          themes={item.themes}
          navigateTo={navigateTo}
        />
      );
    default:
      return (
        <AcSearchResult
          key={item.id}
          id={item.id}
          title={item.title ?? item.titel ?? item.name ?? item.naam ?? item.id}
          summary={item.beschrijving ?? item.beschrijvingKort ?? ''}
          published={item['@self']?.published}
          category={item['@self']?.schema?.title}
          themes={item.themes}
          navigateTo={navigateTo}
        />
      );
  }
};

// Helper function to merge and deduplicate items
const mergeAndDeduplicateItems = (uses = [], used = []) => {
  // Combine both arrays
  const allItems = [...uses, ...used];

  // Remove duplicates based on item ID and filter out elements
  return _.uniqBy(allItems, 'id').filter(
    (item) => item['@self']?.schema?.slug !== 'element'
  );
};

// Helper function to merge ambtenaar gebruik items into the combined list so there's a single 'gebruik' tab
const mergeGebruiksIntoItems = (items = [], ambtenaarItems = []) => {
  if (!Array.isArray(ambtenaarItems) || ambtenaarItems.length === 0) return items;

  // Normalize ambtenaar items so generic renderers can handle them
  const normalizedAmbtenaar = ambtenaarItems.map((it) => {
    const self = it['@self'] || {};
    const normalized = {
      ...it,
      ['@self']: {
        ...self,
        organisation: self.organisation || it.organisation,
      },
    };

    if (
      !normalized.gebruiktVoorReferentiecomponenten &&
      normalized.referentieComponenten
    ) {
      normalized.gebruiktVoorReferentiecomponenten =
        normalized.referentieComponenten;
    }

    return normalized;
  });

  const nonGebruikItems = items.filter(
    (i) => i?.['@self']?.schema?.slug !== 'gebruik'
  );
  const gebruikItems = items.filter((i) => i?.['@self']?.schema?.slug === 'gebruik');

  const mergedGebruik = _.uniqBy([...gebruikItems, ...normalizedAmbtenaar], 'id');

  return [...nonGebruikItems, ...mergedGebruik];
};

// Helper function to render tabs for related objects
const renderRelatedTabs = (
  items,
  loading,
  tabIndex,
  setTabIndex,
  object,
  navigateTo
) => {
  if (loading && (!items || items.length === 0)) {
    return (
      <div>
        <AcLoader className='con-publication-uses-used-loader' />
      </div>
    );
  }

  if (!items || items.length === 0) {
    return null;
  }

  const uniqueSchemas = (items || []).length
    ? _.uniqBy(items, (item) => item['@self'].schema.id).sort(
        (a, b) =>
          getTabOrder(a['@self'].schema.slug) - getTabOrder(b['@self'].schema.slug)
      )
    : [];

  return (
    <AcTabs
      style={{ marginBlockStart: 'var(--tilburg-space-block-mouse)' }}
      selectedIndex={tabIndex}
      onSelect={(index) => setTabIndex(index)}
    >
      <AcTabList>
        {uniqueSchemas.map((item, idx) => {
          const IconComponent = getTabHeaderIcon(item['@self'].schema.slug);
          // Count items with this schema
          const count = items.filter(
            (u) => u['@self'].schema.id === item['@self'].schema.id
          ).length;

          return (
            <AcTab key={item['@self'].schema.id} selected={tabIndex === idx}>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <IconComponent /> {getTabHeaderName(item['@self'].schema.slug)} (
                {count})
              </span>
            </AcTab>
          );
        })}
      </AcTabList>

      {uniqueSchemas.map((schemaItem, idx) => {
        const itemsWithThisSchema = items.filter(
          (u) => u['@self'].schema.id === schemaItem['@self'].schema.id
        );

        const renderCards = itemsWithThisSchema.map((item) =>
          renderCard(item, object, navigateTo)
        );

        return (
          <AcTabPanel key={idx} selected={tabIndex === idx}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  renderCards.length === 1 ? '1fr' : 'repeat(2, 1fr)',
                gap: '16px',
                marginTop: '16px',
                wordBreak: 'break-word',
              }}
            >
              {renderCards}
            </div>
          </AcTabPanel>
        );
      })}
    </AcTabs>
  );
};

const RelatedTabs = observer(
  ({
    id: activeObjectId,
    uses,
    used,
    usesLoading,
    usedLoading,
    tabIndex,
    setTabIndex,
    object,
    navigateTo,
  }) => {
    // Merge and deduplicate the data
    const mergedItems = mergeAndDeduplicateItems(uses, used);

    // Show loading if either is loading
    const isLoading = usesLoading || usedLoading;

    // Fetch ambtenaar gebruik for "Aangeboden gebruik" tab (optional, permission-based)
    const [ambtenaarData, setAmbtenaarData] = useState(null);

    useEffect(() => {
      if (!activeObjectId) return;

      let isMounted = true;
      const abortController = new AbortController();

      const fetchAmbtenaarGebruik = async () => {
        try {
          const response = await fetch(
            `${commongroundApiUrl()}/softwarecatalog/api/aangeboden-gebruik/ambtenaar/${activeObjectId}`,
            {
              method: 'GET',
              signal: abortController.signal,
              headers: { Accept: 'application/json' },
            }
          );
          if (!response.ok) throw new Error(`HTTP ${response.status}`);

          const data = (await response.json()).results;

          if (isMounted) setAmbtenaarData(data);
        } catch (err) {
          // Permission errors or fetch failures are non-blocking; omit the tab
          if (isMounted && err.name === 'AbortError') return;
        }
      };

      fetchAmbtenaarGebruik();

      return () => {
        isMounted = false;
        abortController.abort();
      };
    }, []);

    // Combine ambtenaar gebruik into the main items so there's a single 'gebruik' tab
    const itemsWithAmbtenaarGebruik = mergeGebruiksIntoItems(
      mergedItems,
      ambtenaarData || []
    );

    // Show the tabs if we have data or are loading
    const shouldShow =
      isLoading ||
      (itemsWithAmbtenaarGebruik && itemsWithAmbtenaarGebruik.length > 0);

    return (
      <>
        {shouldShow && (
          <div>
            {renderRelatedTabs(
              itemsWithAmbtenaarGebruik,
              isLoading,
              tabIndex,
              setTabIndex,
              object,
              navigateTo,
            )}
          </div>
        )}
      </>
    );
  }
);

export default RelatedTabs;

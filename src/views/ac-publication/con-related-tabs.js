import _ from 'lodash';
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

// Helper function to render tabs for related objects
const renderRelatedTabs = (
  items,
  loading,
  tabIndex,
  setTabIndex,
  object,
  navigateTo
) => {
  if (loading) {
    return (
      <div>
        <AcLoader className='con-publication-uses-used-loader' />
      </div>
    );
  }

  if (!items || items.length === 0) {
    return null;
  }

  const uniqueSchemas = _.uniqBy(items, (item) => item['@self'].schema.id).sort(
    (a, b) =>
      getTabOrder(a['@self'].schema.slug) - getTabOrder(b['@self'].schema.slug)
  );

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

    // Show the tabs if we have data or are loading
    const shouldShow = isLoading || (mergedItems && mergedItems.length > 0);

    return (
      <>
        {shouldShow && (
          <div>
            {renderRelatedTabs(
              mergedItems,
              isLoading,
              tabIndex,
              setTabIndex,
              object,
              navigateTo
            )}
          </div>
        )}
      </>
    );
  }
);

export default RelatedTabs;

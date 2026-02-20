import _ from 'lodash';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef } from 'react';
import { AcLoader } from '@components';
import { AcTabs, AcTabList, AcTab, AcTabPanel } from '@atoms';
import {
  getTabHeaderIcon,
  getTabHeaderName,
  getImageFromPublication,
  extractSummary,
  extractTitle,
} from '@utils';
import {
  ConCardOrganisationApplication,
  ConCardDienst,
  ConCardGebruik,
  ConCardContactpersoon,
  ConCardKoppeling,
  ConCardModuleVersie,
} from '@molecules/con-cards';
import { schemaCache } from '@services/schemaCache.service';
import { VISUALS } from '@constants';

/**
 * Simplified RelatedTabs component that auto-generates tabs based on schema types
 * found in the provided data from /uses, /used, and /gebruik endpoints.
 *
 * @param {Object} props
 * @param {Array} props.uses - Data from /uses endpoint
 * @param {Array} props.used - Data from /used endpoint  
 * @param {Array} props.gebruik - Data from /gebruik endpoint
 * @param {Object} props.schemas - Aggregated schemas object (indexed by schema ID)
 * @param {boolean} props.usesLoading - Loading state for /uses
 * @param {boolean} props.usedLoading - Loading state for /used
 * @param {boolean} props.gebruikLoading - Loading state for /gebruik
 * @param {Array} props.excludeObjectIds - Array of object IDs to exclude from tabs
 * @param {Array} props.customTabsBefore - Custom tabs to render before auto-generated tabs
 * @param {Array} props.customTabsAfter - Custom tabs to render after auto-generated tabs
 * @param {number} props.tabIndex - Currently selected tab index
 * @param {Function} props.setTabIndex - Function to set tab index
 * @param {Object} props.object - Object store for resolving names
 * @param {string} props.navigateTo - Navigation target ('publication', 'beheer', etc.)
 * @param {Object} props.user - User object
 */

// Schema slug to icon mapping for auto-generated tabs
const SCHEMA_ICONS = {
  product: VISUALS.CUBE,
  module: VISUALS.CUBE,
  organisatie: VISUALS.BUILDING,
  gebruik: VISUALS.CURSOR_CLICK,
  contactpersoon: VISUALS.USER,
  dienst: VISUALS.COG,
  moduleversie: VISUALS.DOCUMENT_TEXT,
  moduleVersie: VISUALS.DOCUMENT_TEXT,
  koppeling: VISUALS.LINK,
};

// Helper function to get schema slug from item using provided schemas object
const getSchemaSlug = (item, schemas) => {
  // Check if schema is extended with full schema object
  if (item?.['@self']?.schema?.slug) {
    return item['@self'].schema.slug;
  }
  
  // Look up schema from provided schemas object
  const schemaId = item?.['@self']?.schema;
  if (schemaId && schemas?.[schemaId]) {
    return schemas[schemaId].slug;
  }
  
  // Try to get from schema cache as fallback
  if (schemaId) {
    const cached = schemaCache.get(String(schemaId));
    if (cached) return cached;
  }
  
  // Schema not available yet
  return null;
};

// Helper to check if a tab should be visible
const isVisible = (v) => {
  if (typeof v === 'function') return !!v();
  if (typeof v === 'boolean') return v;
  return true; // default visible
};

// Helper to resolve count from tab config
const resolveCount = (tab) => {
  const resolveMaybeFn = (v) => (typeof v === 'function' ? v() : v);
  const provided = resolveMaybeFn(tab?.count);
  if (typeof provided === 'number') return provided;
  const itemsArr = resolveMaybeFn(tab?.items);
  if (Array.isArray(itemsArr)) return itemsArr.length;
  return undefined;
};

// Helper function to get the desired tab order
const getTabOrder = (schemaSlug) => {
  const order = {
    product: 1,
    module: 2,
    dienst: 3,
    gebruik: 4,
    contactpersoon: 5,
    organisatie: 6,
  };
  return order[schemaSlug] || 999; // Other relations get a high number to appear last
};

// Helper function to render a card based on schema type
const renderCard = (item, object, navigateTo, user, schemas) => {
  const schemaSlug = getSchemaSlug(item, schemas);

  switch (schemaSlug) {
    case 'product':
    case 'module':
    case 'organisatie':
      return (
        <ConCardOrganisationApplication
          {...item}
          id={item.id || item['@self']?.id}
          title={extractTitle(item['@self'].name)}
          summary={extractSummary(item['@self']?.summary || item?.beschrijvingKort)}
          logo={getImageFromPublication(item)}
          cardType={schemaSlug}
          type={schemaSlug ? getTabHeaderName(schemaSlug, true) : null}
          referenceComponents={item.referentieComponenten}
          created={item['@self']?.created}
          organisation={item['@self'].organisation}
          objectStore={object}
          navigateTo={`${navigateTo}-${schemaSlug}`}
          user={user}
          key={item.id}
        />
      );
    case 'moduleversie':
    case 'moduleVersie':
      return (
        <ConCardModuleVersie
          key={item.id}
          id={item.id}
          versie={item.versie || item['@self']?.name}
          beschrijvingKort={item.beschrijvingKort}
          beschrijvingLang={item.beschrijvingLang || item['@self']?.summary}
          status={item.status}
          datumInOntwikkeling={item.datumInOntwikkeling}
          datumInGebruik={item.datumInGebruik}
          datumEindeOndersteuning={item.datumEindeOndersteuning}
          datumTeruggetrokken={item.datumTeruggetrokken}
          organisation={item['@self']?.organisation}
          moduleUuid={item['@self']?.relations?.module || item.module}
          objectStore={object}
          navigateTo={navigateTo}
        />
      );
    case 'dienst':
      return (
        <ConCardDienst
          key={item.id}
          id={item.id}
          title={
            item.title ??
            item.titel ??
            item.name ??
            item.naam ??
            item.id ??
            item['@self']?.name
          }
          summary={item.beschrijving ?? item.beschrijvingKort ?? ''}
          created={item['@self']?.created}
          category={schemaSlug ? getTabHeaderName(schemaSlug, true) : null}
          themes={item.themes}
          aanbieder={item['@self']?.relations?.aanbieder || item.aanbieder}
          status={item.status}
          type={item.type}
          objectStore={object}
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
          image={item['@self']?.image || item?.image}
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
          title={item.naam}
          item={item}
          source={item.bronApplicatie}
          target={item.doelApplicatie}
          created={item['@self']?.created}
          category={schemaSlug ? getTabHeaderName(schemaSlug, true) : null}
          objectStore={object}
          navigateTo={navigateTo}
        />
      );
    default:
      return null;
  }
};

const RelatedTabs = observer(
  ({
    uses = [],
    used = [],
    gebruik = [],
    schemas = {},
    usesLoading = false,
    usedLoading = false,
    gebruikLoading = false,
    excludeObjectIds = [],
    tabNameOverride = { schemaName: null, newTabName: null },
    setTabIndex,
    object,
    navigateTo,
    customTabsBefore = [],
    customTabsAfter = [],
    user,
  }) => {
    // Merge all three data sources
    const allItems = [...uses, ...used, ...gebruik];
    
    // Remove duplicates based on item ID and filter out excluded items
    const mergedItems = _.uniqBy(allItems, 'id').filter((item) => {
      const schemaSlug = getSchemaSlug(item, schemas);
      const itemId = item?.id || item['@self']?.id;
      
      // Filter out element and compliancy schemas
      if (schemaSlug === 'element' || schemaSlug === 'compliancy') {
        return false;
      }
      
      // Filter out excluded object IDs
      if (excludeObjectIds.includes(itemId)) {
        return false;
      }
      
      return true;
    });

    // Show loading if any is loading
    const isLoading = usesLoading || usedLoading || gebruikLoading;

    // Group items by schema slug
    const itemsBySlug = {};
    mergedItems.forEach((item) => {
      const schemaSlug = getSchemaSlug(item, schemas);
      if (!schemaSlug) return;

      if (!itemsBySlug[schemaSlug]) {
        itemsBySlug[schemaSlug] = [];
      }
      itemsBySlug[schemaSlug].push(item);
    });

    // Build auto-generated schema tabs, sorted by tab order
    const schemaTabs = Object.keys(itemsBySlug)
      .map((schemaSlug) => ({
        kind: 'schema',
        id: `schema-${schemaSlug}`,
        schemaSlug,
        items: itemsBySlug[schemaSlug],
        count: itemsBySlug[schemaSlug].length,
      }))
      .sort((a, b) => getTabOrder(a.schemaSlug) - getTabOrder(b.schemaSlug))
      .filter((tab) => tab.count > 0);

    // Normalize and filter custom tabs by visibility
    const normalizeCustomTabs = (tabs = []) =>
      (tabs || [])
        .filter((t) => isVisible(t?.visible))
        .map((t) => ({ kind: 'custom', tab: t }));

    let beforeCustom = normalizeCustomTabs(customTabsBefore);
    const afterCustom = normalizeCustomTabs(customTabsAfter);

    const allTabs = [...beforeCustom, ...schemaTabs, ...afterCustom];

    // Only show loader if we're loading AND have no tabs at all
    if (isLoading && allTabs.length === 0) {
      return (
        <div>
          <AcLoader className='con-publication-uses-used-loader' />
        </div>
      );
    }

    // Don't render if we have no tabs and we're done loading
    if (!isLoading && allTabs.length === 0) {
      return null;
    }

    // Render tabs even while loading if we have at least one tab
    if (allTabs.length === 0) {
      return null;
    }

    // Workaround: react-tabs defaultIndex={0} doesn't reliably select the first tab
    // when tabs are rendered asynchronously. Programmatically click the first tab if needed.
    const wrapperRef = useRef(null);
    useEffect(() => {
      if (wrapperRef.current && allTabs.length > 0) {
        setTimeout(() => {
          const firstTab = wrapperRef.current?.querySelector('[role="tab"]');
          if (firstTab && firstTab.getAttribute('aria-selected') !== 'true') {
            firstTab.click();
          }
        }, 100);
      }
    }, [allTabs.length]);

    return (
      <div ref={wrapperRef}>
      <AcTabs
        style={{ marginBlockStart: 'var(--tilburg-space-block-mouse)' }}
        defaultIndex={0}
        onSelect={(index) => setTabIndex(index)}
      >
        <AcTabList>
          {allTabs.map((entry, idx) => {
            if (entry.kind === 'schema') {
              const IconComponent = SCHEMA_ICONS[entry.schemaSlug] || getTabHeaderIcon(entry.schemaSlug);

              const tabName =
                tabNameOverride.schemaName === entry.schemaSlug
                  ? tabNameOverride.newTabName
                  : getTabHeaderName(entry.schemaSlug);
              return (
                <AcTab key={entry.id} id={entry.id}>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    {IconComponent && <IconComponent />} {tabName} ({entry.count})
                  </span>
                </AcTab>
              );
            }

            // Custom tab header
            const { tab } = entry;
            const Icon = tab?.icon;
            const headerNode = tab?.header;
            const count = resolveCount(tab);

            return (
              <AcTab key={tab.id || `custom-${idx}`} id={tab.id || `custom-${idx}`}>
                {headerNode ? (
                  headerNode
                ) : (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    {Icon && <Icon />}
                    {tab.label}
                    {typeof count === 'number' && ` (${count})`}
                  </span>
                )}
              </AcTab>
            );
          })}
        </AcTabList>

        {allTabs.map((entry, idx) => {
          if (entry.kind === 'schema') {
            return (
              <AcTabPanel key={entry.id} id={entry.id}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {entry.items.map((item) => renderCard(item, object, navigateTo, user, schemas))}
                </div>
              </AcTabPanel>
            );
          }

          // Custom tab panel
          const { tab } = entry;
          return (
            <AcTabPanel key={tab.id || `custom-${idx}`} id={tab.id || `custom-${idx}`}>
              {typeof tab.render === 'function'
                ? tab.render({ object, navigateTo })
                : null}
            </AcTabPanel>
          );
        })}
      </AcTabs>
      </div>
    );
  }
);

export default RelatedTabs;

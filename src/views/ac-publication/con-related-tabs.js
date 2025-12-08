import _ from 'lodash';
import { useEffect, useState } from 'react';
import { AcLoader } from '@components';
import { observer } from 'mobx-react-lite';
import { AcSearchResult } from '@molecules';
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
const renderCard = (item, object, navigateTo, user) => {
  const schemaSlug = item['@self']?.schema?.slug;

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
          type={item['@self'].schema.title}
          referenceComponents={item.referentieComponenten}
          updated={item['@self'].updated}
          published={item['@self'].published}
          organisation={item['@self'].organisation}
          objectStore={object}
          navigateTo={`${navigateTo}-${schemaSlug}`}
          user={user}
          key={item.id}
        />
      );
    case 'moduleversie':
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
          updated={item['@self']?.updated}
          published={item['@self']?.published}
          category={item['@self']?.schema?.title}
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
          title={extractTitle(
            item.title ??
              item.titel ??
              item.name ??
              item.naam ??
              item.id ??
              item['@self']?.name
          )}
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
    (item) =>
      item['@self']?.schema?.slug !== 'element' &&
      item['@self']?.schema?.slug !== 'compliancy'
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

const isVisible = (v) => {
  if (typeof v === 'function') return !!v();
  if (typeof v === 'boolean') return v;
  return true; // default visible
};

// Helper function to render tabs for related objects (and optional custom tabs)
/**
 * @typedef {Object} CustomTab
 * @property {string} id
 * @property {string | import('react').ReactNode} [label]
 * @property {import('react').ReactNode} [header]
 * @property {import('react').ComponentType} [icon]
 * @property {any[] | (() => any[])} [items]
 * @property {number | (() => number)} [count]
 * @property {boolean | (() => boolean)} [visible]
 * @property {boolean} [disabled]
 * @property {(ctx: { object: any, navigateTo: string }) => import('react').ReactNode} [render]
 */
const renderRelatedTabs = (
  items,
  loading,
  tabIndex,
  setTabIndex,
  object,
  navigateTo,
  customTabsBefore = [],
  customTabsAfter = [],
  user,
  tabNameOverride = { schemaName: null, newTabName: null },
  activeObjectId = null
) => {
  if (loading && (!items || items.length === 0)) {
    return (
      <div>
        <AcLoader className='con-publication-uses-used-loader' />
      </div>
    );
  }

  // Small helpers for custom tabs
  const resolveMaybeFn = (val) => (typeof val === 'function' ? val() : val);
  const resolveCount = (tab) => {
    const provided = resolveMaybeFn(tab?.count);
    if (typeof provided === 'number') return provided;
    const itemsArr = resolveMaybeFn(tab?.items);
    if (Array.isArray(itemsArr)) return itemsArr.length;
    return undefined;
  };

  const uniqueSchemas = (items || []).length
    ? _.uniqBy(items, (item) => item['@self']?.schema?.id).sort(
        (a, b) =>
          getTabOrder(a['@self']?.schema?.slug) - getTabOrder(b['@self']?.schema?.slug)
      )
    : [];

  // Build schema-derived tabs
  const schemaTabs = uniqueSchemas
    .map((schemaItem) => {
      const schemaId = schemaItem['@self']?.schema?.id;
      const schemaSlug = schemaItem['@self']?.schema?.slug;
      let itemsWithThisSchema = (items || []).filter(
        (u) => u['@self']?.schema?.id === schemaId
      );

      // Filter out items with matching ID for 'organisatie' schema
      if (schemaSlug === 'organisatie' && activeObjectId) {
        itemsWithThisSchema = itemsWithThisSchema.filter((item) => {
          const itemId = item?.id || item['@self']?.id;
          return itemId !== activeObjectId;
        });
      }

      return {
        kind: 'schema',
        id: `schema-${schemaId}`,
        schemaId,
        schemaSlug,
        items: itemsWithThisSchema,
        count: itemsWithThisSchema.length,
      };
    })
    .filter((tab) => tab.count > 0); // Filter out tabs with 0 items

  // Normalize and filter custom tabs by visibility
  const normalizeCustomTabs = (tabs = []) =>
    (tabs || [])
      .filter((t) => isVisible(t?.visible))
      .map((t) => ({ kind: 'custom', tab: t }));

  const beforeCustom = normalizeCustomTabs(customTabsBefore);
  const afterCustom = normalizeCustomTabs(customTabsAfter);

  const allTabs = [...beforeCustom, ...schemaTabs, ...afterCustom];

  if (allTabs.length === 0) {
    return null;
  }

  return (
    <AcTabs
      style={{ marginBlockStart: 'var(--tilburg-space-block-mouse)' }}
      selectedIndex={tabIndex}
      onSelect={(index) => setTabIndex(index)}
    >
      <AcTabList>
        {allTabs.map((entry, idx) => {
          if (entry.kind === 'schema') {
            const IconComponent = getTabHeaderIcon(entry.schemaSlug);

            const tabName =
              tabNameOverride.schemaName === entry.schemaSlug
                ? tabNameOverride.newTabName
                : getTabHeaderName(entry.schemaSlug);
            return (
              <AcTab key={entry.id} selected={tabIndex === idx}>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <IconComponent /> {tabName} ({entry.count})
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
            <AcTab
              key={tab.id}
              selected={tabIndex === idx}
              disabled={!!tab.disabled}
            >
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
                  {Icon ? <Icon /> : null} {tab.label}
                  {typeof count === 'number' ? ` (${count})` : ''}
                </span>
              )}
            </AcTab>
          );
        })}
      </AcTabList>

      {allTabs.map((entry, idx) => {
        if (entry.kind === 'schema') {
          const renderCards = entry.items.map((item) =>
            renderCard(item, object, navigateTo, user)
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
        }

        // Custom tab panel
        const { tab } = entry;
        const maybeItems = resolveMaybeFn(tab?.items);
        const hasItems = Array.isArray(maybeItems) && maybeItems.length > 0;

        return (
          <AcTabPanel key={idx} selected={tabIndex === idx}>
            {typeof tab.render === 'function' ? (
              tab.render({ object, navigateTo })
            ) : hasItems ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    maybeItems.length === 1 ? '1fr' : 'repeat(2, 1fr)',
                  gap: '16px',
                  marginTop: '16px',
                  wordBreak: 'break-word',
                }}
              >
                {maybeItems.map((item) =>
                  renderCard(item, object, navigateTo, user)
                )}
              </div>
            ) : null}
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
    tabNameOverride = { schemaName: null, newTabName: null },
    tabIndex,
    setTabIndex,
    object,
    navigateTo,
    customTabsBefore = [],
    customTabsAfter = [],
    user,
  }) => {
    // Merge and deduplicate the data
    const mergedItems = mergeAndDeduplicateItems(uses, used);

    // Show loading if either is loading
    const isLoading = usesLoading || usedLoading;

    // Fetch ambtenaar gebruik for "Aangeboden gebruik" tab (optional, permission-based)
    const [ambtenaarData, setAmbtenaarData] = useState(null);
    // Fetch gebruik data
    const [gebruikData, setGebruikData] = useState(null);

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

      const fetchGebruik = async () => {
        try {
          const response = await fetch(
            `${commongroundApiUrl()}/softwarecatalog/api/gebruik?_source=database&_extend[]=@self.schema`,
            {
              method: 'GET',
              signal: abortController.signal,
              headers: { Accept: 'application/json' },
            }
          );
          if (!response.ok) throw new Error(`HTTP ${response.status}`);

          const data = (await response.json()).results || [];

          if (isMounted) setGebruikData(data);
        } catch (err) {
          // Fetch failures are non-blocking
          if (isMounted && err.name === 'AbortError') return;
        }
      };

      fetchAmbtenaarGebruik();
      fetchGebruik();

      return () => {
        isMounted = false;
        abortController.abort();
      };
    }, []);

    // Combine ambtenaar gebruik and database gebruik into the main items so there's a single 'gebruik' tab
    const itemsWithAmbtenaarGebruik = mergeGebruiksIntoItems(
      mergedItems,
      ambtenaarData || []
    );
    const itemsWithAllGebruik = mergeGebruiksIntoItems(
      itemsWithAmbtenaarGebruik,
      gebruikData || []
    );

    // Determine if there are any visible custom tabs
    const anyVisibleCustomTabs = [
      ...(customTabsBefore || []),
      ...(customTabsAfter || []),
    ].some((t) => isVisible(t?.visible));

    // Show the tabs if we have data, custom tabs, or are loading
    const shouldShow =
      isLoading ||
      (itemsWithAllGebruik && itemsWithAllGebruik.length > 0) ||
      anyVisibleCustomTabs;

    return (
      <>
        {shouldShow && (
          <div>
            {renderRelatedTabs(
              itemsWithAllGebruik,
              isLoading,
              tabIndex,
              setTabIndex,
              object,
              navigateTo,
              customTabsBefore,
              customTabsAfter,
              user,
              tabNameOverride,
              activeObjectId
            )}
          </div>
        )}
      </>
    );
  }
);

export default RelatedTabs;

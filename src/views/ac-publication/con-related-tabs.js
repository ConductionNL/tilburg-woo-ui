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
import { schemaCache } from '@services/schemaCache.service';

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

// Helper function to get schema slug - handles backend bug where schema might be extended
// Only use for comparisons or display purposes
const getSchemaSlug = (item) => {
  // Check if schema is extended (backend bug workaround)
  if (item?.['@self']?.schema?.slug) {
    return item['@self'].schema.slug;
  }
  // Otherwise use schema cache
  const schemaId = item?.['@self']?.schema;
  return schemaId ? schemaCache.get(schemaId) : null;
};

// Helper function to render a card based on schema type
const renderCard = (item, object, navigateTo, user) => {
  const schemaSlug = getSchemaSlug(item);

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
          title={extractTitle(
            item['@self']?.name ??
              item.title ??
              item.titel ??
              item.name ??
              item.naam ??
              item.id
          )}
          item={item}
          category={schemaSlug ? getTabHeaderName(schemaSlug, true) : null}
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
          created={item['@self']?.created}
          category={schemaSlug ? getTabHeaderName(schemaSlug, true) : null}
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

  // Remove duplicates based on item ID and filter out elements & compliancy
  return _.uniqBy(allItems, 'id').filter((item) => {
    const schemaSlug = getSchemaSlug(item);
    return schemaSlug !== 'element' && schemaSlug !== 'compliancy';
  });
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

  const nonGebruikItems = items.filter((i) => {
    const schemaSlug = getSchemaSlug(i);
    return schemaSlug !== 'gebruik';
  });
  const gebruikItems = items.filter((i) => {
    const schemaSlug = getSchemaSlug(i);
    return schemaSlug === 'gebruik';
  });

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

  // Group items by schema slug (not schema ID) to ensure tabs with same slug are combined
  const itemsBySlug = {};
  (items || []).forEach((item) => {
    const schemaSlug = getSchemaSlug(item);
    if (!schemaSlug) return;

    if (!itemsBySlug[schemaSlug]) {
      itemsBySlug[schemaSlug] = [];
    }
    itemsBySlug[schemaSlug].push(item);
  });

  // Build schema-derived tabs, sorted by tab order
  const schemaTabs = Object.keys(itemsBySlug)
    .map((schemaSlug) => {
      let itemsWithThisSchema = itemsBySlug[schemaSlug];

      // Filter out items with matching ID for 'organisatie' schema
      if (schemaSlug === 'organisatie' && activeObjectId) {
        itemsWithThisSchema = itemsWithThisSchema.filter((item) => {
          const itemId = item?.id || item['@self']?.id;
          return itemId !== activeObjectId;
        });
      }

      // Get a representative schema ID from the first item (for tab ID)
      const representativeSchemaId = itemsWithThisSchema[0]?.['@self']?.schema;

      return {
        kind: 'schema',
        id: `schema-${schemaSlug}`,
        schemaId: representativeSchemaId,
        schemaSlug,
        items: itemsWithThisSchema,
        count: itemsWithThisSchema.length,
      };
    })
    .sort((a, b) => getTabOrder(a.schemaSlug) - getTabOrder(b.schemaSlug))
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
    gebruikId,
    gebruikSchemaId,
    gebruikSchemaSlug,
  }) => {
    // Merge and deduplicate the data
    const mergedItems = mergeAndDeduplicateItems(uses, used);

    // Show loading if either is loading
    const isLoading = usesLoading || usedLoading;
    // Fetch ambtenaar gebruik for "Aangeboden gebruik" tab (optional, permission-based)
    // Fetch gebruik data
    const [gebruikData, setGebruikData] = useState(null);
    // Initialize to true if we have an activeObjectId, since we'll be fetching
    const [gebruikLoading, setGebruikLoading] = useState(!!activeObjectId);

    useEffect(() => {
      if (!activeObjectId) {
        setGebruikLoading(false);
        return;
      }

      let isMounted = true;
      const abortController = new AbortController();

      const getGebruikPropertyParam = (schemaSlug) => {
        switch (schemaSlug) {
          case 'organisatie':
            return 'afnemer';
          default:
            return schemaSlug;
        }
      };

      const fetchGebruik = async () => {
        setGebruikLoading(true);
        try {
          // Wait for schemaCache to resolve the schema slug if gebruikSchema is provided
          let gebruikParam = '';

          if (gebruikSchemaSlug && gebruikId) {
            gebruikParam = `&${getGebruikPropertyParam(
              gebruikSchemaSlug
            )}=${gebruikId}`;
          }

          if (!gebruikSchemaSlug && gebruikSchemaId && gebruikId) {
            const schemaSlug = await schemaCache.waitFor(gebruikSchemaId.toString());

            if (schemaSlug) {
              gebruikParam = `&${getGebruikPropertyParam(schemaSlug)}=${gebruikId}`;
            }
          }

          // Check if component is still mounted after async wait
          if (!isMounted) return;

          const response = await fetch(
            `${commongroundApiUrl()}/softwarecatalog/api/gebruik?_limit=1000&_extend[]=_schema${gebruikParam}`,
            {
              method: 'GET',
              signal: abortController.signal,
              headers: { Accept: 'application/json' },
            }
          );
          if (!response.ok) throw new Error(`HTTP ${response.status}`);

          const data = (await response.json()).results || [];

          if (isMounted) {
            setGebruikData(data);
          }
        } catch (err) {
          // Fetch failures are non-blocking - data stays null but we still complete
          if (isMounted && err.name === 'AbortError') return;
        } finally {
          if (isMounted) {
            setGebruikLoading(false);
          }
        }
      };

      fetchGebruik();

      return () => {
        isMounted = false;
        abortController.abort();
      };
    }, [activeObjectId, gebruikSchemaSlug, gebruikId]);

    // Combine ambtenaar gebruik and database gebruik into the main items so there's a single 'gebruik' tab
    const itemsWithAllGebruik = mergeGebruiksIntoItems(
      mergedItems,
      gebruikData || []
    );

    // Determine if there are any visible custom tabs
    const anyVisibleCustomTabs = [
      ...(customTabsBefore || []),
      ...(customTabsAfter || []),
    ].some((t) => isVisible(t?.visible));

    // Check if we have data from any source
    const hasUsesData = Array.isArray(uses) && uses.length > 0;
    const hasUsedData = Array.isArray(used) && used.length > 0;
    const hasGebruikData = Array.isArray(gebruikData) && gebruikData.length > 0;
    const hasAnyData = hasUsesData || hasUsedData || hasGebruikData;

    // Check if any fetch is still loading
    const anyLoading = isLoading || gebruikLoading;

    // Show the tabs if:
    // 1. Any fetch is still loading (show loader)
    // 2. We have data from any of the three sources
    // 3. There are visible custom tabs
    const shouldShow = anyLoading || hasAnyData || anyVisibleCustomTabs;

    return (
      <>
        {shouldShow && (
          <div>
            {renderRelatedTabs(
              itemsWithAllGebruik,
              anyLoading,
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

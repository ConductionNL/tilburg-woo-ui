// Imports => MOBX
import { observable, computed, makeObservable, action, toJS } from 'mobx';
import { AcBuildURLSearchParams, getCookie } from '@utils';
import { commongroundApiUrl } from '@config';

let app = {};

const LIMIT = 20;

export const DEFAULT_SEARCH_QUERY = {
  extend: 'themes',
  _limit: LIMIT,
};

const DEFAULT_QUERY = {
  extend: 'themes',
};

// Optimized: Only request essential facets instead of all available ones
export const buildEssentialFacetsQueries = () => {
  // Only request the most important facets for performance
  return [
    [['@self', 'register'], 'terms'], // Publication register
    [['@self', 'schema'], 'terms'], // Publication schema
    ['cloudDienstverleningsmodel', 'terms'], // Service delivery model
  ];
};

// Legacy function for backward compatibility (if needed)
export const buildFacetsQueries = (availableFacets) => {
  const queries = [];

  // Handle @self facets
  if (availableFacets['@self']) {
    Object.entries(availableFacets['@self']).forEach(([key, config]) => {
      if (config.facet_types && config.facet_types.includes('terms')) {
        queries.push([['@self', key], 'terms']);
      }
    });
  }

  // Handle object_fields facets
  if (availableFacets.object_fields) {
    Object.entries(availableFacets.object_fields).forEach(([key, config]) => {
      if (config.facet_types && config.facet_types.includes('terms')) {
        queries.push([key, 'terms']);
      }
    });
  }

  return queries;
};

export const buildPublicationsSearchQuery = (baseQuery) => {
  return {
    ...baseQuery,
    extend: '@self.schema',
  };
};

// Helper function to get authentication headers (same logic as object store)
const getAuthHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
    Accept: '*/*',
    Referer: window.location.origin + '/zoeken',
  };

  // Try Bearer token first (from cookies)
  const accessToken = getCookie('nextcloud_access_token');
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
    return headers;
  }

  // Fallback to basic auth (from user store)
  try {
    if (
      window.app &&
      window.app.store &&
      window.app.store.user &&
      window.app.store.user.basicAuthCredentials
    ) {
      const basicAuth = window.app.store.user.basicAuthCredentials;
      if (basicAuth && basicAuth.username && basicAuth.password) {
        const credentials = btoa(`${basicAuth.username}:${basicAuth.password}`);
        headers.Authorization = `Basic ${credentials}`;
      }
    }
  } catch (error) {
    console.warn('Failed to get basic auth credentials:', error);
  }
  return headers;
};

export class PublicationsStore {
  constructor(store) {
    makeObservable(this);
    app.store = store;
  }

  @observable
  mobileFiltersOpen = false;

  @observable
  items = [];

  @observable
  single = null;

  @observable
  attachments = [];

  @observable
  relations = null;

  @observable
  categories = [];

  @observable
  themes = [];

  @observable
  themesFacets = [];

  @observable
  facets = {};

  @observable
  availableFacets = null;

  @observable
  facetsConfig = null;

  @observable
  facetsConfigLoaded = false;

  @observable
  pagination = {};

  @observable
  attachmentPagination = {
    page: 1,
    perPage: 10,
  };

  @observable
  defaultQuery = DEFAULT_QUERY;

  @observable
  aggregationsQuery = {
    _queries: ['category', 'themes'],
  };

  @observable
  query = DEFAULT_SEARCH_QUERY;

  @observable
  loading = {
    status: false,
    message: undefined,
  };

  @observable
  facetsLoading = false;

  @observable
  attachmentSearch = '';

  @computed
  get all_categories() {
    return this.categories;
  }

  @action
  getFilteredAttachments = (primary = false, page) => {
    const filteredAttachmentsLabel = this.attachments?.filter((attachment) =>
      primary ? attachment?.labels?.length > 0 : attachment?.labels?.length === 0
    );

    const filteredAttachments = [];
    filteredAttachmentsLabel &&
      filteredAttachmentsLabel.forEach((attachment) => {
        for (let i = 1; i <= attachment.labels.length; i++) {
          filteredAttachments.push({
            ...attachment,
            labels: [attachment.labels[i - 1]],
          });
        }
      });

    if (page) {
      const start = (page - 1) * this.attachmentPagination.perPage;
      const end = start + this.attachmentPagination.perPage;
      return primary
        ? filteredAttachments.slice(start, end)
        : filteredAttachmentsLabel.slice(start, end);
    }

    return primary ? filteredAttachments : filteredAttachmentsLabel;
  };

  @action
  setAttachmentsPage = (page) => {
    this.attachmentPagination.page = page;
  };

  @computed
  get all_themes_facets() {
    return this.themesFacets;
  }

  @computed
  get search_query() {
    return { ...this.defaultQuery, ...this.query };
  }

  get aggregations_query() {
    return { ...this.defaultQuery, ...this.aggregationsQuery };
  }

  @computed
  get is_loading() {
    return this.loading.status;
  }

  @computed
  get is_facets_loading() {
    return this.facetsLoading;
  }

  @computed
  get is_facets_config_loaded() {
    return this.facetsConfigLoaded;
  }

  @computed
  get get_order() {
    return this.query._order;
  }

  @computed
  get get_single() {
    return toJS(this.single);
  }

  @computed
  get get_relations() {
    return toJS(this.relations);
  }

  @computed
  get all_publications() {
    return this.items;
  }

  @computed
  get all_attachments() {
    return toJS(this.attachments);
  }

  @computed
  get all_facets() {
    return toJS(this.facets);
  }

  @action
  setItems = (items) => {
    this.items = items;
  };

  @action
  setAttachments = (attachments) => {
    this.attachments = attachments;
  };

  @action
  setPagination = (pagination) => {
    this.pagination = pagination;
  };

  @action
  setAttachmentPagination = (pagination) => {
    this.attachmentPagination = pagination;
  };

  @action
  category_checked = (id) => {
    return this.query.category?.includes(id);
  };

  @action
  theme_checked = (id) => {
    return this.query.themes?.includes(id);
  };

  @action
  setQueryDate = (key, value) => {
    console.group('SET QUERY DATE');
    console.info(key, value, 'SET QUERY DATE');
    console.info('CURRENT QUERY:', toJS(this.query));

    if (!this.query.published) {
      this.query.published = {};
    }

    this.setPage(1);
    this.query.published[key] = value;

    console.info('NEW QUERY:', toJS(this.query));
    console.groupEnd();
  };

  @action
  updateQuery = (query) => {
    // Replace the entire query instead of merging to prevent old filters from persisting
    this.query = { ...DEFAULT_SEARCH_QUERY, ...query };
  };

  @action
  setSearchQuery = (searchQuery) => {
    this.query._search = searchQuery;
    // Trigger publications reload with new search query
    this.fetchPublications();
  };

  @action
  setPage = (page) => {
    this.query._page = page;
    this.pagination.page = page;
  };

  @action
  resetSort = () => {
    const newObject = { ...this.query };
    delete newObject._order;
    this.query = newObject;
  };

  @action
  setSort = (key, value) => {
    console.group('SET SORT');
    console.info(key, value);
    console.info('VALUE', value);
    this.query._order = {};
    this.query._order[key] = value;
    console.groupEnd();
  };

  @action
  toggleSearchArrayValue = (key, value) => {
    console.group('TOGGLE SEARCH ARRAY VALUE');
    console.info(key, value);
    if (!this.query[key]) {
      console.info('KEY DOES NOT EXIST, CREATING ARRAY');
      this.query[key] = [];
    }

    const index = this.query[key]?.indexOf(value);
    // Remove item if we find it in the array.
    if (index !== -1) {
      console.info(index, this.query[key]);
      this.query[key] = this.query[key].filter((cat) => cat !== value);
      return;
    }

    if (key === 'category') {
      this.setPage(1);
    }

    this.query[key] = [...this.query[key], value];
    console.groupEnd();
  };

  @action
  setLoadingStatus = (status) => {
    this.loading.status = status;
  };

  @action
  setPublication = (publication) => {
    this.single = publication;
  };

  @action
  setRelations = (relations) => {
    this.relations = relations;
  };

  @action
  setCategories = (categories) => {
    this.categories = categories;
  };

  @action
  setThemesFacets = (themesFacets) => {
    this.themesFacets = themesFacets;
  };

  @action
  setFacets = (facets) => {
    this.facets = facets;
  };

  @action
  setAvailableFacets = (availableFacets) => {
    this.availableFacets = availableFacets;
  };

  @action
  setFacetsLoadingStatus = (status) => {
    this.facetsLoading = status;
  };

  @action
  setFacetsConfig = (config) => {
    const configChanged =
      JSON.stringify(this.facetsConfig) !== JSON.stringify(config);
    this.facetsConfig = config;
    this.facetsConfigLoaded = true;

    // If config changed, trigger facets reload
    if (configChanged && config) {
      this.triggerFacetsReload();
    }
  };

  @action
  resetFacetsConfig = () => {
    this.facetsConfig = null;
    this.facetsConfigLoaded = false;
    this.facets = {};
  };

  @action
  triggerFacetsReload = async () => {
    if (this.facetsConfig) {
      await this.fetchFacets();
    }
  };

  @action
  toggleMobileFilters = () => {
    this.mobileFiltersOpen = !this.mobileFiltersOpen;
  };

  @action
  getSearchPageURL = (params = null) => {
    const urlParams = AcBuildURLSearchParams(params ?? this.query);
    // console.group('GET SEARCH PAGE URL');
    // console.log('BUILDING URL, CURRENT QUERY:', toJS(this.query));
    // console.log(urlParams);
    // console.groupEnd();
    if (!urlParams) {
      return '/zoeken';
    }
    return `/zoeken?${urlParams}`;
  };

  // Note: fetchAvailableFacets removed - now handled in fetchPublications

  @action
  fetchFacets = async () => {
    this.setFacetsLoadingStatus(true);

    try {
      // 🚀 OPTIMIZED: Use essential facets only for better performance
      const essentialFacetsQueries = buildEssentialFacetsQueries();

      // 🚀 OPTIMIZED: Build base query from current filters
      const baseQueryString = AcBuildURLSearchParams(this.search_query);
      const baseWithLimit = baseQueryString
        ? `${baseQueryString}&_limit=0`
        : `_limit=0`;

      // Add essential facets with proper URL encoding (append manually)
      const facetParams = essentialFacetsQueries
        .map(([key, value]) =>
          Array.isArray(key)
            ? `_facets[${key.join('][')}]=${encodeURIComponent(value)}`
            : `_facets[${key}]=${encodeURIComponent(value)}`
        )
        .join('&');
      const finalQueryString = facetParams
        ? `${baseWithLimit}&${facetParams}`
        : baseWithLimit;

      console.group('🚀 OPTIMIZED FACETS API CALL');
      console.info(
        'Essential facets only:',
        essentialFacetsQueries.length,
        'facets instead of all available'
      );
      console.info('Final query string:', finalQueryString);
      console.groupEnd();

      const response = await fetch(
        `${commongroundApiUrl()}/opencatalogi/api/publications?${finalQueryString}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
          credentials: 'include', // Include cookies like the browser
        }
      ).then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      });

      // Handle nested facets structure - API returns facets.facets
      const facetsData = response.facets?.facets || response.facets || {};

      if (facetsData && Object.keys(facetsData).length > 0) {
        console.info('📊 Processing facets data:', facetsData);

        // Add basic titles to facets (simplified since we only use essential ones)
        const facetsWithTitles = {};
        for (const [key, value] of Object.entries(facetsData)) {
          if (key === '@self') {
            facetsWithTitles[key] = {};
            for (const [subKey, subValue] of Object.entries(value)) {
              facetsWithTitles[key][subKey] = {
                ...subValue,
                title: this.getFacetTitle(subKey),
              };
            }
          } else {
            facetsWithTitles[key] = {
              ...value,
              title: this.getFacetTitle(key),
            };
          }
        }
        this.setFacets(facetsWithTitles);
        console.info('✅ Facets processed and set:', Object.keys(facetsWithTitles));
      } else {
        console.warn(
          'No facets in response. Available keys:',
          Object.keys(response)
        );
        console.warn('Facets data structure:', response.facets);
      }
    } catch (error) {
      console.error('Error fetching facets:', error);
    } finally {
      this.setFacetsLoadingStatus(false);
    }
  };

  // Helper method to get facet titles
  getFacetTitle = (key) => {
    const titleMap = {
      register: 'Register',
      schema: 'Schema',
      cloudDienstverleningsmodel: 'Cloud Dienstverleningsmodel',
    };
    return titleMap[key] || key;
  };

  @action
  fetchPublications = async () => {
    this.loading.status = true;

    // Reset facets UI while fetching, so counts reflect new filters after reload
    this.setFacetsLoadingStatus(true);
    this.setFacets({});

    // Build query including current filters/facets and request facetable config plus names data
    const baseQuery = {
      ...this.search_query,
      _facetable: true,
      _related: true,
      _relatedNames: true,
    };
    const queryString = AcBuildURLSearchParams(baseQuery);
    const fullUrl = `${commongroundApiUrl()}/opencatalogi/api/publications?${queryString}`;

    console.group('🚀 HYBRID API CALL - Publications + Facets Config');
    console.info('SEARCH QUERY:', toJS(baseQuery));
    console.info('URL:', fullUrl);
    console.groupEnd();

    // Use fetch with proper authentication headers
    fetch(fullUrl, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include', // Include cookies like the browser
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((response) => {
        // Set search results immediately
        this.setItems(response.results);

        // Process related names data to populate the names cache
        if (response.relatedNames && app.store?.object) {
          console.group('🏷️ PROCESSING RELATED NAMES FROM SEARCH');
          console.info(
            'Related names received:',
            Object.keys(response.relatedNames).length,
            'entries'
          );
          console.info('Names data:', response.relatedNames);
          app.store.object.processRelatedNamesFromResponse(response);
          console.info(
            'Names cache after processing:',
            Object.keys(app.store.object.namesCache).length,
            'entries'
          );
          console.groupEnd();
        } else if (app.store?.object && response.results?.length > 0) {
          // Fallback: manually extract reference IDs and resolve names if _relatedNames is not supported
          console.group('⚠️ FALLBACK: Manual reference extraction in search');
          console.info(
            'No relatedNames in response, falling back to manual extraction'
          );
          console.info('Search results count:', response.results.length);
          try {
            const {
              extractReferenceIdsFromCollection,
            } = require('@src/utilities/con-detect-object-references');
            const referenceIds = extractReferenceIdsFromCollection(response.results);
            console.info('Extracted reference IDs:', referenceIds.length, 'IDs');
            console.info('Reference IDs:', referenceIds);

            if (referenceIds.length > 0) {
              // Asynchronously resolve names in background (don't wait for this)
              console.info('Starting background names resolution...');
              app.store.object
                .getNamesForMultipleIds(referenceIds)
                .then((resolvedNames) => {
                  console.info(
                    'Background names resolved:',
                    Object.keys(resolvedNames).length,
                    'names'
                  );
                  console.info('Resolved names:', resolvedNames);
                })
                .catch((error) => {
                  console.warn(
                    'Failed to resolve reference names in search:',
                    error
                  );
                });
            } else {
              console.info('No reference IDs found to resolve');
            }
          } catch (error) {
            console.warn('Reference resolution fallback failed in search:', error);
          }
          console.groupEnd();
        } else {
          console.group('ℹ️ SEARCH NAMES INFO');
          console.info('No names processing needed');
          console.info('Has object store:', !!app.store?.object);
          console.info('Results count:', response.results?.length || 0);
          console.info('Has relatedNames:', !!response.relatedNames);
          console.groupEnd();
        }

        // Store facetable configuration for facets call
        if (response.facetable) {
          const configChanged =
            JSON.stringify(this.facetsConfig) !== JSON.stringify(response.facetable);
          this.setAvailableFacets(response.facetable);
          this.setFacetsConfig(response.facetable); // Triggers reload if config changed
          // If config didn't change, still reload facets to reflect new filters
          if (!configChanged) {
            this.triggerFacetsReload();
          }
        } else {
          // No config received, but ensure we try to refresh facets for new filters
          this.triggerFacetsReload();
        }

        // Clean up response and set pagination
        delete response.results;
        delete response.facetable;
        delete response.relatedNames;
        this.setPagination(response);
      })
      .catch((e) => console.error(e))
      .finally(() => {
        this.setLoadingStatus(false);
      });
  };

  @action
  fetchAttachments = async (_id) => {
    this.loading.status = true;
    console.group('MAKING API CALL');
    console.info('SEARCH QUERY:', toJS(this.search_query));
    console.groupEnd();

    app.store.api.publications
      .attachments(_id)
      .then((response) => {
        this.setAttachments(response.results);
      })
      .catch((e) => console.error(e))
      .finally(() => {
        this.setLoadingStatus(false);
      });
  };

  @action
  fetchPublication = async (_id) => {
    this.loading.status = true;

    console.group('📄 FETCHING SINGLE PUBLICATION WITH NAMES');
    console.info('Publication ID:', _id);
    console.groupEnd();

    app.store.api.publications
      .single(
        _id,
        new URLSearchParams(
          AcBuildURLSearchParams({
            _id,
            ...this.defaultQuery,
            _related: true,
            _relatedNames: true,
          })
        ).toString()
      )
      .then((response) => {
        console.group('📄 PROCESSING SINGLE PUBLICATION RESPONSE');
        console.info('Publication response:', response);

        // Process related names data to populate the names cache
        if (response.relatedNames && app.store?.object) {
          console.info(
            'Related names received:',
            Object.keys(response.relatedNames).length,
            'entries'
          );
          console.info('Names data:', response.relatedNames);
          app.store.object.processRelatedNamesFromResponse(response);
          console.info(
            'Names cache after processing:',
            Object.keys(app.store.object.namesCache).length,
            'entries'
          );
        } else {
          console.info('No related names in publication response');
        }
        console.groupEnd();

        this.setPublication(response);
      })
      .catch((e) => console.error(e))
      .finally(() => {
        this.setLoadingStatus(false);
      });
  };

  @action
  fetchRelations = async (uri) => {
    this.loading.status = true;

    app.store.api.publications
      .relations(uri)
      .then((response) => {
        this.setRelations(response);
      })
      .catch((e) => console.error(e))
      .finally(() => {
        this.setLoadingStatus(false);
      });
  };

  @action
  resetPublication = () => {
    this.single = null;
  };

  @action
  resetAttachments = () => {
    this.attachments = [];
  };

  @action
  resetRelations = () => {
    this.relations = null;
  };

  @action
  resetSearchQuery = () => {
    this.query = DEFAULT_SEARCH_QUERY;
  };

  @action
  resetAggregations = () => {
    this.categories = [];
    this.themesFacets = [];
  };

  @action
  fetchAggregations = async () => {
    this.loading.status = true;
    app.store.api.publications
      .searchAggregations(this.aggregations_query)
      .then((response) => {
        this.setCategories(
          response.facets.category.filter((category) => category._id !== '')
        );
        this.setThemesFacets(response.facets.themes);
      })
      .catch((e) => console.error(e))
      .finally(() => {
        this.setLoadingStatus(false);
      });
  };

  @action
  setAttachmentSearch = (search) => {
    this.attachmentSearch = search;
    this.attachmentPagination.page = 1; // Reset to first page when searching
  };
}

export default PublicationsStore;

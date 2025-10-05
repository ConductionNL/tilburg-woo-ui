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

// Legacy functions removed - facets are now built directly from API response facetable configuration

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
    console.info(key, value, typeof value);
    if (!this.query[key]) {
      console.info('KEY DOES NOT EXIST, CREATING ARRAY');
      this.query[key] = [];
    }

    // Convert to string for comparison since URL params are strings
    const valueStr = String(value);
    const hasValue = this.query[key].some(item => String(item) === valueStr);
    
    // Remove item if we find it in the array.
    if (hasValue) {
      console.info('REMOVING VALUE:', value);
      this.query[key] = this.query[key].filter((item) => String(item) !== valueStr);
      return;
    }

    if (key === 'category') {
      this.setPage(1);
    }

    console.info('ADDING VALUE:', value);
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
  setFacetsLoadingStatus = (status) => {
    this.facetsLoading = status;
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

  /**
   * Fetch facets using the new optimized API structure.
   * 
   * The API now returns:
   * - `facets`: Object where each key is a facet name and value contains both configuration and data
   * - `facetable`: Configuration object defining all available facets (fallback/reference)
   * 
   * Each facet in the `facets` object has the structure:
   * {
   *   "name": "_register",
   *   "type": "terms", 
   *   "title": "Register",
   *   "enabled": true,
   *   "queryParameter": "@self[register]",
   *   "data": {
   *     "buckets": [{ "value": 1, "count": 2, "label": "1" }]
   *   }
   * }
   * 
   * This allows us to:
   * 1. Only show enabled facets (configured in backend)
   * 2. Get proper titles and metadata from each facet
   * 3. Access buckets/counts directly from facet.data
   * 4. Remove complex custom filtering logic
   */
  @action
  fetchFacets = async () => {
    this.setFacetsLoadingStatus(true);

    try {
      // Build base query from current filters and add _facets=extend
      const baseQuery = {
        ...this.search_query,
        _limit: 0, // We only want facets, not results
        _facets: 'extend', // Request extended facets
      };
      
      // Remove pagination parameters since we're not fetching results
      delete baseQuery._page;
      
      const queryString = AcBuildURLSearchParams(baseQuery);
      const fullUrl = `${commongroundApiUrl()}/opencatalogi/api/publications?_source=index&${queryString}`;

      console.group('🚀 INDEPENDENT FACETS API CALL');
      console.info('FACETS QUERY:', toJS(baseQuery));
      console.info('URL:', fullUrl);
      console.groupEnd();

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      }).then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      });

      // Handle new facets structure - API returns facets as an object where each facet contains both config and data
      const facetsData = response.facets || {};
      const facetableConfig = response.facetable || {};

      console.info('📊 Processing new facets structure');
      console.info('Facets data:', Object.keys(facetsData).length, 'facets with data');
      console.info('Facetable config:', Object.keys(facetableConfig).length, 'available facets');

      if (facetsData && Object.keys(facetsData).length > 0) {
        // Build facets from the facets data, only including enabled ones
        const processedFacets = {};

        // Process each facet in the response
        for (const [facetName, facetInfo] of Object.entries(facetsData)) {
          // Only include enabled facets
          if (!facetInfo.enabled) {
            continue;
          }

          // Skip date histogram facets for now (different structure)
          if (facetInfo.type === 'date_histogram') {
            continue;
          }

          // Get buckets from the data property
          const buckets = facetInfo.data?.buckets || [];

          // Check if this is a @self facet (starts with _)
          if (facetName.startsWith('_')) {
            // Handle @self facets - group them under @self key
            if (!processedFacets['@self']) {
              processedFacets['@self'] = {};
            }
            
            const cleanKey = facetName.substring(1); // Remove the _ prefix
            processedFacets['@self'][cleanKey] = {
              buckets: buckets,
              title: facetInfo.title || facetInfo.name || cleanKey,
              description: facetInfo.description,
              type: facetInfo.type,
              queryParameter: facetInfo.queryParameter,
              enabled: facetInfo.enabled,
              order: facetInfo.order || 0,
            };
          } else {
            // Handle regular facets
            processedFacets[facetName] = {
              buckets: buckets,
              title: facetInfo.title || facetInfo.name || facetName,
              description: facetInfo.description,
              type: facetInfo.type,
              queryParameter: facetInfo.queryParameter,
              enabled: facetInfo.enabled,
              order: facetInfo.order || 0,
            };
          }
        }
        
        this.setFacets(processedFacets);
        console.info('✅ Facets processed and set:', Object.keys(processedFacets));
        console.info('Processed facets structure:', processedFacets);
      } else {
        console.warn('No facets data in response');
        console.warn('Available response keys:', Object.keys(response));
        this.setFacets({});
      }
    } catch (error) {
      console.error('Error fetching facets:', error);
      this.setFacets({});
    } finally {
      this.setFacetsLoadingStatus(false);
    }
  };

  @action
  fetchPublications = async () => {
    this.loading.status = true;

    // Build query including current filters/facets and request names data (no facetable)
    const baseQuery = {
      ...this.search_query,
      _related: true,
      _relatedNames: true,
    };
    const queryString = AcBuildURLSearchParams(baseQuery);
    const fullUrl = `${commongroundApiUrl()}/opencatalogi/api/publications?_source=index&${queryString}`;

    console.group('🚀 INDEPENDENT PUBLICATIONS API CALL');
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

        // Clean up response and set pagination
        delete response.results;
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

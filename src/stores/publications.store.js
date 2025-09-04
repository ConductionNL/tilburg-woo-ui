// Imports => MOBX
import { observable, computed, makeObservable, action, toJS } from 'mobx';
import { AcBuildURLSearchParams } from '@utils';
import { commongroundApiUrl } from '@config';
import { getCookie } from '@src/utilities';

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
    [['@self', 'register'], 'terms'],     // Publication register
    [['@self', 'schema'], 'terms'],       // Publication schema
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
    'Accept': '*/*',
    'Referer': window.location.origin + '/zoeken',
  };
  
  // Try Bearer token first (from cookies)
  const accessToken = getCookie('nextcloud_access_token');
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
    return headers;
  }
  
  // Fallback to basic auth (from user store)
  try {
    if (window.app && window.app.store && window.app.store.user && window.app.store.user.basicAuthCredentials) {
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
    this.query = { ...this.query, ...query };
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
    const configChanged = JSON.stringify(this.facetsConfig) !== JSON.stringify(config);
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
      
      // 🚀 OPTIMIZED: Use _limit=0 for facet-only queries (no objects needed)
      const search_query = {
        ...buildPublicationsSearchQuery(this.search_query),
        _limit: 0, // Only get facets, not actual objects - MAJOR performance boost!
        // No _facetable needed here - we already have config from first call
      };

      // 🚀 OPTIMIZED: Proper URL encoding using URLSearchParams
      const urlParams = new URLSearchParams(search_query);
      
      // Add essential facets with proper URL encoding
      essentialFacetsQueries.forEach(([key, value]) => {
        if (Array.isArray(key)) {
          // Use proper bracket notation: _facets[@self][register]=terms
          const facetParam = `_facets[${key.join('][')}]`;
          urlParams.set(facetParam, value);
        } else {
          urlParams.set(`_facets[${key}]`, value);
        }
      });

      console.group('🚀 OPTIMIZED FACETS API CALL');
      console.log('Essential facets only:', essentialFacetsQueries.length, 'facets instead of all available');
      console.log('Query params:', urlParams.toString());
      console.groupEnd();

      const response = await fetch(`${commongroundApiUrl()}/opencatalogi/api/publications?${urlParams.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include', // Include cookies like the browser
      }).then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      });

      // Handle nested facets structure - API returns facets.facets
      const facetsData = response.facets?.facets || response.facets || {};
      
      if (facetsData && Object.keys(facetsData).length > 0) {
        console.log('📊 Processing facets data:', facetsData);
        
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
        console.log('✅ Facets processed and set:', Object.keys(facetsWithTitles));
      } else {
        console.warn('No facets in response. Available keys:', Object.keys(response));
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
      'register': 'Register',
      'schema': 'Schema',
      'cloudDienstverleningsmodel': 'Cloud Dienstverleningsmodel',
    };
    return titleMap[key] || key;
  };

  @action
  fetchPublications = async () => {
    this.loading.status = true;

    // 🚀 OPTIMIZED: Keep _facetable for facets config, but we'll optimize the facets call separately
    const search_query = {
      _facetable: true, // Still needed to get facets config for second call
    };
    
    // Add search term if user has entered one
    if (this.search_query._search) {
      search_query._search = this.search_query._search;
    }

    console.group('🚀 HYBRID API CALL - Publications + Facets Config');
    console.log('SEARCH QUERY:', toJS(search_query));
    
    const fullUrl = `${commongroundApiUrl()}/opencatalogi/api/publications?${new URLSearchParams(search_query)}`;
    console.log('URL (with _facetable for config):', fullUrl);
    console.groupEnd();

    // Use fetch with proper authentication headers
    fetch(fullUrl, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include', // Include cookies like the browser
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
      .then((response) => {
        // Set search results immediately
        this.setItems(response.results);
        
        // Store facetable configuration for facets call
        if (response.facetable) {
          this.setAvailableFacets(response.facetable);
          this.setFacetsConfig(response.facetable); // This will trigger facets reload if config changed
        }
        
        // Clean up response and set pagination
        delete response.results;
        delete response.facetable;
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

    app.store.api.publications
      .single(
        _id,
        new URLSearchParams(
          AcBuildURLSearchParams({ _id, ...this.defaultQuery })
        ).toString()
      )
      .then((response) => {
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

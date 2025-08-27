// Imports => MOBX
import { observable, computed, makeObservable, action, toJS } from 'mobx';
import { AcBuildURLSearchParams } from '@utils';
import { LABELS, LABELS_DYNAMIC } from '@constants';

let app = {};

const LIMIT = 20;

export const DEFAULT_SEARCH_QUERY = {
  extend: 'themes',
  _limit: LIMIT,
};

const DEFAULT_QUERY = {
  extend: 'themes',
};



// Function to build facetsQueries from available facets
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
    console.log(key, value, 'SET QUERY DATE');
    console.log('CURRENT QUERY:', toJS(this.query));

    if (!this.query.published) {
      this.query.published = {};
    }

    this.setPage(1);
    this.query.published[key] = value;

    console.log('NEW QUERY:', toJS(this.query));
    console.groupEnd();
  };

  @action
  updateQuery = (query) => {
    this.query = { ...this.query, ...query };
  };

  @action
  setSearchQuery = (searchQuery) => {
    this.query._search = searchQuery;
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
    console.log(key, value);
    console.log('VALUE', value);
    this.query._order = {};
    this.query._order[key] = value;
    console.groupEnd();
  };

  @action
  toggleSearchArrayValue = (key, value) => {
    console.group('TOGGLE SEARCH ARRAY VALUE');
    console.log(key, value);
    if (!this.query[key]) {
      console.log('KEY DOES NOT EXIST, CREATING ARRAY');
      this.query[key] = [];
    }

    const index = this.query[key]?.indexOf(value);
    // Remove item if we find it in the array.
    if (index !== -1) {
      console.log(index, this.query[key]);
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
      // Use facets configuration 
      const facetsConfig = this.facetsConfig;
      
      if (!facetsConfig) {
        console.error('No facets config found. Make sure fetchPublications was called first.');
        this.setFacetsLoadingStatus(false);
        return;
      }

      // Build dynamic facets queries
      const dynamicFacetsQueries = buildFacetsQueries(facetsConfig);
      
      // Create search query with facets (full query like user specified)
      const search_query = {
        ...buildPublicationsSearchQuery(this.search_query),
        _facetable: true,
      };

      // Add facets parameters
      dynamicFacetsQueries.forEach(([key, value]) => {
        if (Array.isArray(key)) {
          const brackets = key.map((val) => `[${val}]`).join('');
          search_query[`_facets${brackets}`] = value;
        } else {
          search_query[`_facets[${key}]`] = value;
        }
      });

      console.group('MAKING FACETS API CALL');
      console.log('FACETS SEARCH QUERY:', toJS(search_query));
      console.groupEnd();

      const response = await app.store.api.publications.search(search_query);

      console.group('PROCESSING FACETS RESPONSE');
      console.log('Full response:', response);
      console.log('Response facets:', response.facets);
      console.log('Facets config:', facetsConfig);
      console.groupEnd();

      if (response.facets) {
        // Add titles to facets from available facets
        const facetsWithTitles = {};
        for (const [key, value] of Object.entries(response.facets)) {
          console.log(`Processing facet: ${key}`, value);
          
          if (key === '@self') {
            facetsWithTitles[key] = {};
            for (const [subKey, subValue] of Object.entries(value)) {
              console.log(`  Processing @self subkey: ${subKey}`, subValue);
              facetsWithTitles[key][subKey] = {
                ...subValue,
                title: facetsConfig?.object_fields?.[subKey]?.title || subKey,
              };
            }
          } else {
            facetsWithTitles[key] = {
              ...value,
              title: facetsConfig?.object_fields?.[key]?.title || key,
            };
          }
        }
        
        console.log('Final facets with titles:', facetsWithTitles);
        this.setFacets(facetsWithTitles);
      } else {
        console.warn('No facets in response');
      }
    } catch (error) {
      console.error('Error fetching facets:', error);
    } finally {
      this.setFacetsLoadingStatus(false);
    }
  };

  @action
  fetchPublications = async () => {
    this.loading.status = true;

    // recreate the search query to include the metadata schema in the extend array
    // I just do it like this because the current API system is just so awful and not flexible at all.
    // I spent more hours then i'd like to admit figuring out where the original extend is coming from, and I still dont know.
    const search_query = {
      ...buildPublicationsSearchQuery(this.search_query),
      _facetable: true // Add facetable to get both results and facet config
    };

    console.group('MAKING API CALL - Publications + Facetable');
    console.log('SEARCH QUERY:', toJS(search_query));
    console.groupEnd();

    app.store.api.publications
      .search(search_query)
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
    console.log('SEARCH QUERY:', toJS(this.search_query));
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

// Imports => MOBX
import { observable, computed, makeObservable, action, toJS } from 'mobx';
import { AcBuildURLSearchParams, getCookie } from '@utils';
import { commongroundApiUrl } from '@config';
import { schemaCache } from '@services/schemaCache.service';

let app = {};

const LIMIT = 20;

export const DEFAULT_SEARCH_QUERY = {
  extend: 'themes',
  _limit: LIMIT,
  _order: {
    '_name': 'asc', // Default to alphabetical A-Z
  },
};

const DEFAULT_QUERY = {
  extend: 'themes',
};

// Legacy functions removed - facets are now built directly from API response facetable configuration

export const buildPublicationsSearchQuery = (baseQuery) => {
  return {
    ...baseQuery,
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

  /**
   * AbortController for cancelling in-flight publications fetch requests.
   * When a new search is triggered before the previous one completes,
   * the old request is cancelled to prevent race conditions and unnecessary API calls.
   * @type {AbortController|null}
   */
  publicationsAbortController = null;

  /**
   * AbortController for cancelling in-flight facets fetch requests.
   * When facets are re-fetched (e.g., user changes filters quickly),
   * the old request is cancelled to prevent outdated facet data from being displayed.
   * @type {AbortController|null}
   */
  facetsAbortController = null;

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
  usedData = null;

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
    status: true,
    message: undefined,
  };

  @observable
  facetsLoading = false;

  @observable
  attachmentSearch = '';

  @observable
  error = null;

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
  get get_used_data() {
    return toJS(this.usedData);
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

  @computed
  get get_error() {
    return toJS(this.error);
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
    const merged = { ...DEFAULT_SEARCH_QUERY, ...query };

    // When a search term is present but no explicit sort was provided in the URL,
    // default to relevance sorting instead of alphabetical for better UX.
    const hasSearchTerm = merged._search && merged._search.trim() !== '';
    const hasExplicitOrder = query._order !== undefined;
    if (hasSearchTerm && !hasExplicitOrder) {
      merged._order = { '_relevance': 'desc' };
    }

    this.query = merged;
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
    // Metadata properties use _property format (e.g., _name, _published)
    this.query._order[`_${key}`] = value;
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
    const hasValue = this.query[key].some((item) => String(item) === valueStr);

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
  setError = (error) => {
    this.error = error;
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
  setUsedData = (usedData) => {
    this.usedData = usedData;
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
    // Cancel any in-flight facets request
    if (this.facetsAbortController) {
      console.info('⚠️ Cancelling previous facets request');
      this.facetsAbortController.abort();
    }

    // Create new AbortController for this request
    this.facetsAbortController = new AbortController();
    const signal = this.facetsAbortController.signal;

    this.setFacetsLoadingStatus(true);

    try {
      // Build base query from current filters and add _facets=extend and _extend parameters
      const baseQuery = {
        ...this.search_query,
        _limit: 0, // We only want facets, not results
        _facets: 'extend', // Request extended facets
        _extend: '_schema,_register',
      };

      // If _search is present, add _fuzzy=true for fuzzy relevance scoring
      if (baseQuery._search) {
        baseQuery._fuzzy = true;
      }

      // Remove pagination parameters since we're not fetching results
      delete baseQuery._page;

      const queryString = AcBuildURLSearchParams(baseQuery);
      const fullUrl = `${commongroundApiUrl()}/opencatalogi/api/publications?${queryString}`;

      console.group('🚀 INDEPENDENT FACETS API CALL');
      console.info('FACETS QUERY:', toJS(baseQuery));
      console.info('URL:', fullUrl);
      console.groupEnd();

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
        signal, // Add abort signal
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
      console.info(
        'Facets data:',
        Object.keys(facetsData).length,
        'facets with data'
      );
      console.info(
        'Facetable config:',
        Object.keys(facetableConfig).length,
        'available facets'
      );

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
              toggle: facetInfo.toggle,
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
              toggle: facetInfo.toggle,
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
      // Don't log error if request was aborted (expected behavior)
      if (error.name === 'AbortError') {
        console.info('✅ Facets request cancelled');
        return;
      }
      console.error('Error fetching facets:', error);
      this.setFacets({});
    } finally {
      this.setFacetsLoadingStatus(false);
      // Clear the controller reference after request completes
      this.facetsAbortController = null;
    }
  };

  @action
  enrichPublications = (publications, responseMetadata) => {
    if (!publications || publications.length === 0 || !responseMetadata) {
      return publications;
    }

    console.group('🔍 Enriching publications with schema and register data');
    console.info('Publications to enrich:', publications.length);

    try {
      // Extract register and schema data from response metadata
      const registers = responseMetadata.registers || {};
      const schemas = responseMetadata.schemas || {};

      console.info('Available registers:', Object.keys(registers));
      console.info('Available schemas:', Object.keys(schemas));

      // Enrich publications by replacing IDs with full objects
      const enrichedPublications = publications.map((pub) => {
        if (!pub['@self']) {
          return pub;
        }

        const enriched = { ...pub };
        const registerId = pub['@self'].register;
        const schemaId = pub['@self'].schema;

        // Replace register ID with full register object
        if (registerId && registers[registerId]) {
          enriched['@self'] = {
            ...enriched['@self'],
            register: registers[registerId],
          };
        }

        // Replace schema ID with full schema object
        if (schemaId && schemas[schemaId]) {
          enriched['@self'] = {
            ...enriched['@self'],
            schema: schemas[schemaId],
          };
        }

        return enriched;
      });

      console.info('✅ Publications enriched successfully');
      console.groupEnd();

      return enrichedPublications;
    } catch (error) {
      console.error('❌ Error enriching publications:', error);
      console.groupEnd();
      return publications; // Return original if enrichment fails
    }
  };

  @action
  fetchPublications = async () => {
    // Cancel any in-flight publications request
    if (this.publicationsAbortController) {
      console.info('⚠️ Cancelling previous publications request');
      this.publicationsAbortController.abort();
    }

    // Create new AbortController for this request
    this.publicationsAbortController = new AbortController();
    const signal = this.publicationsAbortController.signal;

    this.loading.status = true;

    // Build query including current filters/facets and extend parameters
    // Include _names to get UUID-to-name mappings in response
    const baseQuery = {
      ...this.search_query,
      _extend: '_schema,_register,_names',
    };

    // If _search is present, add _fuzzy=true for fuzzy relevance scoring
    if (baseQuery._search) {
      baseQuery._fuzzy = true;
    }

    const queryString = AcBuildURLSearchParams(baseQuery);
    const fullUrl = `${commongroundApiUrl()}/opencatalogi/api/publications?${queryString}`;

    console.group('🚀 INDEPENDENT PUBLICATIONS API CALL');
    console.info('SEARCH QUERY:', toJS(baseQuery));
    console.info('URL:', fullUrl);
    console.groupEnd();

    // Use fetch with proper authentication headers
    fetch(fullUrl, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include', // Include cookies like the browser
      signal, // Add abort signal
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(async (response) => {
        // Enrich publications with full schema and register data from response metadata
        const enrichedResults = this.enrichPublications(
          response.results,
          response['@self']
        );

        // Set enriched search results
        this.setItems(enrichedResults);

        // Process related names data to populate the names cache
        // API may return names in response['@self'].names or response.relatedNames
        const namesData = response['@self']?.names || response.relatedNames;
        
        if (namesData && app.store?.object) {
          console.group('🏷️ PROCESSING NAMES FROM SEARCH (_extend=_names)');
          console.info(
            'Names received:',
            Object.keys(namesData).length,
            'entries'
          );
          console.info('Names data sample:', Object.keys(namesData).slice(0, 5));
          app.store.object.setNamesInCache(namesData);
          console.info(
            'Names cache after processing:',
            Object.keys(app.store.object.namesCache).length,
            'total entries'
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
          console.info('Has names in @self:', !!response['@self']?.names);
          console.info('Has relatedNames:', !!response.relatedNames);
          console.groupEnd();
        }

        // Clean up response and set pagination
        delete response.results;
        delete response.relatedNames;
        if (response['@self']) {
          delete response['@self'].names;
        }
        this.setPagination(response);
      })
      .catch((e) => {
        // Don't log error if request was aborted (expected behavior)
        if (e.name === 'AbortError') {
          console.info('✅ Publications request cancelled');
          return;
        }
        console.error(e);
      })
      .finally(() => {
        this.setLoadingStatus(false);
        // Clear the controller reference after request completes
        this.publicationsAbortController = null;
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
    // Clear any previous error when starting a new fetch
    this.setError(null);

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
            '_extend[]': ['_schema', 'compliancy'],
          })
        ).toString()
      )
      .then((response) => {
        console.group('📄 PROCESSING SINGLE PUBLICATION RESPONSE');
        console.info('Publication response:', response);
        console.info('response[@self].schema:', response['@self']?.schema);
        console.info('response[@self].schemas:', response['@self']?.schemas);

        // Normalize schema location: move from @self.schemas[uuid] to @self.schema
        // Check if schemas object exists and schema is just an ID (not the full object)
        if (response['@self']?.schemas && response['@self']?.schema) {
          const schemaId = response['@self'].schema;
          const schemasObj = response['@self'].schemas;
          
          console.info('Schema normalization path 1: schema exists as ID');
          console.info('schemaId:', schemaId, 'type:', typeof schemaId);
          console.info('schemasObj:', schemasObj);
          
          // If schema is just an ID string/number and we have the full object in schemas
          if (typeof schemaId !== 'object' && schemasObj[schemaId]) {
            response['@self'].schema = schemasObj[schemaId];
            console.info('✅ Normalized schema from ID to full object using @self.schemas');
            
            // Cache the schema slug for quick lookups
            if (schemasObj[schemaId]?.slug) {
              schemaCache.set(String(schemaId), schemasObj[schemaId].slug);
              console.info(`✅ Cached schema slug: ${schemaId} -> ${schemasObj[schemaId].slug}`);
            } else {
              console.warn('⚠️ Schema object has no slug property:', schemasObj[schemaId]);
            }
          } else if (typeof schemaId === 'object') {
            console.info('Schema is already an object, checking for slug');
            if (schemaId?.id && schemaId?.slug) {
              schemaCache.set(String(schemaId.id), schemaId.slug);
              console.info(`✅ Cached schema slug from object: ${schemaId.id} -> ${schemaId.slug}`);
            }
          }
        } else if (response['@self']?.schemas && !response['@self']?.schema) {
          console.info('Schema normalization path 2: no schema, using first from schemas');
          // Fallback: if schema doesn't exist but schemas does, use the first one
          const schemasObj = response['@self'].schemas;
          const schemaIds = Object.keys(schemasObj);
          if (schemaIds.length > 0) {
            response['@self'].schema = schemasObj[schemaIds[0]];
            console.info('✅ Normalized schema location from @self.schemas to @self.schema');
            
            // Cache the schema slug for quick lookups
            const schemaId = schemaIds[0];
            if (schemasObj[schemaId]?.slug) {
              schemaCache.set(String(schemaId), schemasObj[schemaId].slug);
              console.info(`✅ Cached schema slug: ${schemaId} -> ${schemasObj[schemaId].slug}`);
            }
          }
        } else {
          console.warn('⚠️ No schema normalization needed or possible');
          console.info('Has @self.schemas?', !!response['@self']?.schemas);
          console.info('Has @self.schema?', !!response['@self']?.schema);
        }

        // Normalize register location: move from @self.registers[uuid] to @self.register
        // Check if registers object exists and register is just an ID (not the full object)
        if (response['@self']?.registers && response['@self']?.register) {
          const registerId = response['@self'].register;
          const registersObj = response['@self'].registers;
          
          // If register is just an ID string/number and we have the full object in registers
          if (typeof registerId !== 'object' && registersObj[registerId]) {
            response['@self'].register = registersObj[registerId];
            console.info('✅ Normalized register from ID to full object using @self.registers');
          }
        } else if (response['@self']?.registers && !response['@self']?.register) {
          // Fallback: if register doesn't exist but registers does, use the first one
          const registersObj = response['@self'].registers;
          const registerIds = Object.keys(registersObj);
          if (registerIds.length > 0) {
            response['@self'].register = registersObj[registerIds[0]];
            console.info('✅ Normalized register location from @self.registers to @self.register');
          }
        }

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
        this.setError(null);
      })
      .catch((e) => {
        console.error(e);
        // Normalize Axios error shape
        const status = e?.response?.status;
        const statusText = e?.response?.statusText;
        const data = e?.response?.data;
        const messageFromApi =
          (typeof data === 'string' && data) ||
          data?.message ||
          data?.detail ||
          data?.title;

        const normalizedError = {
          status: status || null,
          statusText: statusText || null,
          code: e?.code || null,
          message:
            messageFromApi ||
            (status === 404
              ? 'Publicatie niet gevonden.'
              : status === 401
              ? 'Niet geautoriseerd om deze publicatie te bekijken.'
              : status === 403
              ? 'Toegang geweigerd voor deze publicatie.'
              : status === 500
              ? 'Er is een fout opgetreden op de server.'
              : 'Er is een fout opgetreden bij het ophalen van de publicatie.'),
          raw: toJS(e?.response) || null,
        };
        this.setError(normalizedError);
      })
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
  fetchUsed = async (id) => {
    this.loading.status = true;

    app.store.api.publications
      .used(id)
      .then((response) => {
        this.setUsedData(response);
      })
      .catch((e) => console.error(e))
      .finally(() => {
        this.setLoadingStatus(false);
      });
  };

  @action
  resetPublication = () => {
    this.single = null;
    this.setError(null);
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
  resetUsedData = () => {
    this.usedData = null;
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

// Imports => MOBX
import { observable, computed, makeObservable, action, toJS } from 'mobx';
import { AcBuildURLSearchParams } from '@utils';
import { LABELS, LABELS_DYNAMIC } from '@constants';

let app = {};

const LIMIT = 15;

export const DEFAULT_SEARCH_QUERY = {
  extend: ['themes', 'catalog'],
  _limit: LIMIT,
};

const DEFAULT_QUERY = {
  extend: ['themes', 'catalog'],
};

if (process.env.API_URL_COMMONGROUND_ORGANIZATION_OIN) {
}

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
  latest_items = [];

  @observable
  single = null;

  @observable
  attachments = null;

  @observable
  categories = [];

  @observable
  categoryFacets = [];

  @observable
  themes = [];

  @observable
  themesFacets = [];

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
  loading_latest = {
    status: false,
    message: undefined,
  };

  @observable
  attachmentSearch = '';

  @computed
  get all_categories() {
    return this.categories;
  }

  @computed
  get all_category_facets() {
    return this.categoryFacets;
  }

  @computed
  get categories_with_facets() {
    return this.categories.map((category) => {
      delete category.count;
      const facet = this.categoryFacets.find((facet) => facet._id === category._id);
      return {
        ...category,
        count: facet?.count || 0,
      };
    });
  }

  @action
  getFilteredAttachments = (primary = false, page) => {
    // @TODO: This is the way we want to filter but the API does not support it yet. Keep it for reference.
    const filteredAttachmentsLabel = this.attachments?.filter((attachment) =>
      primary ? attachment?.labels?.length > 0 : attachment?.labels?.length === 0
    );

    // const filteredAttachmentsLabel = this.attachments?.filter(
    //   (attachment) => {
    //     const isPrimary = !attachment?.title?.toLowerCase().startsWith('bijlage');
    //     const matchesSearch =
    //       !this.attachmentSearch ||
    //       attachment?.title
    //         ?.toLowerCase()
    //         .includes(this.attachmentSearch.toLowerCase());

    //     return primary ? isPrimary && matchesSearch : !isPrimary && matchesSearch;
    //   }
    // );

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

  @action
  fetchLatestPublications = async (limit = 3) => {
    this.loading_latest.status = true;

    try {
      // Create a query for the latest publications
      const latestQuery = {
        ...DEFAULT_QUERY,
        _limit: limit,
        _order: { date: 'desc' },
      };

      const response = await app.store.api.publications.search(latestQuery);
      this.setLatestItems(response.results || []);
    } catch (e) {
      // Set empty array on error to avoid UI issues
      this.setLatestItems([]);
    } finally {
      this.loading_latest.status = false;
    }
  };

  @computed
  get all_themes_facets() {
    return this.themesFacets;
  }

  @computed
  get search_query() {
    return { ...this.defaultQuery, ...this.aggregationsQuery, ...this.query };
  }

  get aggregations_query() {
    return { ...this.defaultQuery, ...this.aggregationsQuery };
  }

  @computed
  get is_loading() {
    return this.loading.status;
  }

  @computed
  get is_loading_latest() {
    return this.loading_latest.status;
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
  get all_publications() {
    return this.items;
  }

  @computed
  get latest_publications() {
    return this.latest_items ? toJS(this.latest_items) : [];
  }

  @action
  setItems = (items) => {
    this.items = items;
  };

  @action
  setLatestItems = (items) => {
    this.latest_items = items;
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
    if (!this.query.published) {
      this.query.published = {};
    }

    this.setPage(1);
    this.query.published[key] = value;
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
    this.query._order = {};
    this.query._order[key] = value;
  };

  @action
  toggleSearchArrayValue = (key, value) => {
    if (!this.query[key]) {
      this.query[key] = [];
    }

    const index = this.query[key]?.indexOf(value);
    // Remove item if we find it in the array.
    if (index !== -1) {
      this.query[key] = this.query[key].filter((cat) => cat !== value);
      return;
    }

    if (key === 'category') {
      this.setPage(1);
    }

    this.query[key] = [...this.query[key], value];
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
  setCategories = (categories) => {
    this.categories = categories;
  };

  @action
  setCategoryFacets = (categoryFacets) => {
    this.categoryFacets = categoryFacets;
  };

  @action
  setThemesFacets = (themesFacets) => {
    this.themesFacets = themesFacets;
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

  @action
  fetchPublications = async () => {
    this.loading.status = true;

    app.store.api.publications
      .search(this.search_query)
      .then((response) => {
        this.setCategoryFacets(
          response.facets.category.filter((category) => category._id !== '')
        );
        this.setThemesFacets(response.facets.themes);

        this.setItems(response.results);
        delete response.results;
        this.setPagination(response);
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
      .then(async (response) => {
        // Fetch file sizes for all attachments
        if (response.attachments?.length) {
          await Promise.all(
            response.attachments.map(async (attachment) => {
              try {
                const response = await fetch(attachment.downloadUrl, {
                  method: 'HEAD',
                });
                const size = response.headers.get('content-length');
                attachment.size = size ? parseInt(size, 10) : null;
              } catch (error) {
                attachment.size = null;
              }
            })
          );
        }
        this.setPublication(response);
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
  fetchAttachments = async (_id) => {
    this.loading.status = true;

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
  resetAttachments = () => {
    this.attachments = null;
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

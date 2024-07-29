// Imports => MOBX
import { observable, computed, makeObservable, action, toJS } from 'mobx';
import { AcBuildURLSearchParams } from '@utils';

let app = {};

const LIMIT = 15;

const DEFAULT_SEARCH_QUERY = {
  _limit: LIMIT,
};

export class DocumentsStore {
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
  categories = [];

  @observable
  themes = [];

  // Pagination information
  @observable
  pagination = {};

  @observable
  defaultQuery = {
    'organization.oin':
      process.env.API_URL_COMMONGROUND_ORGANIZATION_OIN || '00000001001172773000',
  };

  @observable
  aggregationsQuery = {
    _queries: ['category', 'theme'],
  };

  @observable
  query = DEFAULT_SEARCH_QUERY;

  @observable
  loading = {
    status: false,
    message: undefined,
  };

  @computed
  get all_categories() {
    return this.categories;
  }

  @computed
  get all_themes() {
    return this.themes;
  }

  @computed
  get search_query() {
    const query = { ...this.defaultQuery, ...this.query };

    return query;
  }

  get aggregations_query() {
    return { ...this.defaultQuery, ...this.aggregationsQuery };
  }

  @computed
  get is_loading() {
    return this.loading.status;
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
  get all_documents() {
    return this.items;
  }

  @action
  category_checked = (id) => {
    return this.query.category?.includes(id);
  };

  @action
  get_attachments = (primary = false) => {
    return this.single?.attachments?.filter((attachment) =>
      primary ? attachment.labels.length > 0 : attachment.labels.length === 0
    );
  };

  @action
  setQueryDate = (key, value) => {
    this.setPage(1);
    this.query[`publicationDate[${key}]`] = value;
  };

  @action
  updateQuery = (query) => {
    this.query = { ...this.query, ...query };
  };

  @action
  setSearchQuery = (searchQuery) => {
    this.query.search = searchQuery;
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
    this.updateQuery({ _order: { [key]: value } });
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
  toggleMobileFilters = () => {
    this.mobileFiltersOpen = !this.mobileFiltersOpen;
  };

  @action
  getSearchPageURL = (params = {}) => {
    return `/zoeken?${AcBuildURLSearchParams({
      search: this.query.search,
      category: this.query.category,
      _page: this.query._page,
      'publicationDate[before]': this.query['publicationDate[before]'],
      'publicationDate[after]': this.query['publicationDate[after]'],
      _order: this.query._order,
      ...params,
    })}`;
  };

  @action
  fetchDocuments = async () => {
    this.loading.status = true;

    app.store.api.documents
      .search(this.search_query)
      .then((response) => {
        this.items = response.results;
        this.pagination = response;
        delete this.pagination.results;
      })
      .catch((e) => console.error(e))
      .finally(() => {
        this.loading.status = false;
      });
  };

  @action
  fetchDocument = async (_id) => {
    this.loading.status = true;

    app.store.api.documents
      .single(
        _id,
        new URLSearchParams(
          AcBuildURLSearchParams({ _id, ...this.defaultQuery })
        ).toString()
      )
      .then((response) => {
        this.single = response;
      })
      .catch((e) => console.error(e))
      .finally(() => {
        this.loading.status = false;
      });
  };

  @action
  resetDocument = () => {
    this.single = null;
  };

  @action
  resetSearchQuery = () => {
    this.query = DEFAULT_SEARCH_QUERY;
  };

  @action
  resetAggregations = () => {
    this.categories = [];
    this.themes = [];
  };

  @action
  fetchAggregations = async () => {
    this.loading.status = true;
    app.store.api.documents
      .searchAggregations(this.aggregations_query)
      .then((response) => {
        this.categories = response.category;
        this.themes = response.themes;
      })
      .catch((e) => console.error(e))
      .finally(() => {
        this.loading.status = false;
      });
  };
}

export default DocumentsStore;

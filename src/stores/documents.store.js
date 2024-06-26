// Imports => MOBX
import { observable, computed, makeObservable, action, toJS } from 'mobx';
import acFormatDate from '@src/utilities/ac-format-date';
import { AcBuildURLSearchParams } from '@utils';

let app = {};

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

  @computed
  get all_categories() {
    return this.categories;
  }

  @observable
  themes = [];

  @computed
  get all_themes() {
    return this.themes;
  }

  // Pagination information
  @observable
  pagination = {};

  @observable
  defaultQuery = {
    'organisatie.oin': '00000001001172773000',
  };

  @observable
  aggregationsQuery = {
    _queries: ['categorie', 'themas'],
  };

  @observable
  themesQuery = {
    '_queries[]': 'thema',
  };

  @observable
  query = {
    categorie: [],
    // @TODO DEFAULT 15
    _limit: 3,
    _page: 1,
    'publicatiedatum[after]': null,
    'publicatiedatum[before]': null,
  };

  @observable
  loading = {
    status: false,
    message: undefined,
  };

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
  get get_single() {
    return toJS(this.single);
  }

  @computed
  get all_documents() {
    return this.items.map((item) => ({
      _id: item._id,
      title: item.titel,
      content: item.samenvatting,
      date: acFormatDate(item.publicatiedatum, 'YYYY-MM-DD', 'DD MMMM YYYY'),
      category: item.categorie,
      themes: item.themas,
    }));
  }

  @action
  category_checked = (id) => {
    return this.query.categorie.includes(id);
  };

  @action
  setQueryYear = (year) => {
    if (isNaN(year)) {
      this.query['publicatiedatum[after]'] = null;
      this.query['publicatiedatum[before]'] = null;
      return;
    }
    this.query['publicatiedatum[after]'] = `${year}-01-01`;
    this.query['publicatiedatum[before]'] = `${year + 1}-01-01`;
  };

  @action
  setQueryDate = (key, value) => {
    this.setPage(1);
    this.query[`publicatiedatum[${key}]`] = value;
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
  toggleSearchArrayValue = (key, value) => {
    const index = this.query[key].indexOf(value);
    // Remove item if we find it in the array.
    if (index !== -1) {
      this.query[key] = this.query[key].filter((cat) => cat !== value);
      return;
    }

    if (key === 'categorie') {
      this.query._page = 1;
    }

    this.query[key] = [...this.query[key], value];
  };

  @action
  toggleMobileFilters = () => {
    this.mobileFiltersOpen = !this.mobileFiltersOpen;
  };

  @action
  fetchDocuments = async () => {
    this.loading.status = true;

    app.store.api.documents
      .search(
        new URLSearchParams(AcBuildURLSearchParams(this.search_query)).toString()
      )
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
      .search(
        new URLSearchParams(
          AcBuildURLSearchParams({ _id, ...this.defaultQuery })
        ).toString()
      )
      .then((response) => {
        this.single = response.results?.[0];
      })
      .catch((e) => console.error(e))
      .finally(() => {
        this.loading.status = false;
      });
  };

  @action
  fetchAggregations = async () => {
    this.loading.status = true;

    app.store.api.documents
      .searchAggregations(
        new URLSearchParams(
          AcBuildURLSearchParams(this.aggregations_query)
        ).toString()
      )
      .then((response) => {
        this.categories = response.categorie;
        this.themes = response.themas;
      })
      .catch((e) => console.error(e))
      .finally(() => {
        this.loading.status = false;
      });
  };
}

export default DocumentsStore;

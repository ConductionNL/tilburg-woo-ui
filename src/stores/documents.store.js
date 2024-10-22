// Imports => MOBX
import { observable, computed, makeObservable, action, toJS } from 'mobx';
import { AcBuildURLSearchParams } from '@utils';

let app = {};

const LIMIT = 3;

export const DEFAULT_SEARCH_QUERY = {
  extend: 'all',
  _limit: LIMIT,
};

const DEFAULT_QUERY = {
  extend: 'all',
};

if (process.env.API_URL_COMMONGROUND_ORGANIZATION_OIN) {
}

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

  @observable
  themesFacets = [];

  @observable
  pagination = {};

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

  @computed
  get all_categories() {
    return this.categories;
  }

  @computed
  get all_themes() {
    return toJS(this.themes).map((theme) => {
      return {
        ...theme,
        paragraph: theme.description,
        linkTitle: `Bekijk ${
          this.all_documents.filter((item) => item.themes.includes(theme.id))
            ?.length ?? 0
        } documenten`,
      };
    });
  }

  @computed
  get all_themes_facets() {
    return this.themesFacets;
  }

  @computed
  get search_query() {
    const query = { ...this.defaultQuery, ...this.query };

    return query;
  }

  get themes_query() {
    const query = { ...this.defaultQuery };

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
  setItems = (items) => {
    this.items = items;
  };

  @action
  setPagination = (pagination) => {
    this.pagination = pagination;
  };

  @action
  category_checked = (id) => {
    return this.query.category?.includes(id);
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
  setDocument = (document) => {
    this.single = document;
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
  toggleMobileFilters = () => {
    this.mobileFiltersOpen = !this.mobileFiltersOpen;
  };

  @action
  getSearchPageURL = (params = null) => {
    console.group('GET SEARCH PAGE URL');
    console.log('BUILDING URL, CURRENT QUERY:', toJS(this.query));
    const urlParams = AcBuildURLSearchParams(params ?? this.query);
    console.log(urlParams);
    console.groupEnd();
    // console.log('building url');
    return `/zoeken?${urlParams}`;
  };

  @action
  fetchDocuments = async () => {
    this.loading.status = true;
    console.group('MAKING API CALL');
    console.log('SEARCH QUERY:', toJS(this.search_query));
    console.groupEnd();

    app.store.api.documents
      .search(this.search_query)
      .then((response) => {
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
        this.setDocument(response);
      })
      .catch((e) => console.error(e))
      .finally(() => {
        this.setLoadingStatus(false);
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
    this.themesFacets = [];
  };

  @action
  fetchAggregations = async () => {
    this.loading.status = true;
    app.store.api.documents
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
  fetchThemes = async () => {
    this.loading.status = true;

    app.store.api.documents
      .themes(this.themes_query)
      .then((response) => {
        this.themes = response;
      })
      .catch((e) => console.error(e))
      .finally(() => {
        this.setLoadingStatus(false);
      });
  };
}

export default DocumentsStore;

// Imports => MOBX
import { observable, computed, makeObservable, action, toJS } from 'mobx';
import { AcBuildURLSearchParams } from '@utils';
import { LABELS, LABELS_DYNAMIC } from '@constants';

let app = {};

const LIMIT = 7;

export const DEFAULT_SEARCH_QUERY = {
  extend: 'all',
  _limit: LIMIT,
};

const DEFAULT_QUERY = {
  extend: 'all',
};

export class GemmaStore {
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
  defaultQuery = DEFAULT_QUERY;

  @observable
  query = DEFAULT_SEARCH_QUERY;

  @observable
  loading = {
    status: false,
    message: undefined,
  };

  @computed
  get search_query() {
    return { ...this.defaultQuery, ...this.query };
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
  get all_publications() {
    return this.items;
  }

  @action
  setItems = (items) => {
    this.items = items;
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
  fetchGemmaList = async () => {
    this.loading.status = true;

    app.store.api.gemma
      .list(this.search_query)
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
  fetchGemma = async (_id) => {
    this.loading.status = true;

    app.store.api.gemma
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
  resetPublication = () => {
    this.single = null;
  };
}

export default GemmaStore;

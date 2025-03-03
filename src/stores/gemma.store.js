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
  views = [];

  @observable
  view = null;

  @observable
  elementReferences = null;

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
  get get_view() {
    return toJS(this.view);
  }

  @computed
  get get_elementReferences() {
    return toJS(this.elementReferences);
  }

  @computed
  get all_views() {
    return toJS(this.views);
  }

  @action
  setViews = (views) => {
    this.views = views;
  };

  @action
  setElementReferences = (elementReferences) => {
    this.elementReferences = elementReferences;
  };

  @action
  setLoadingStatus = (status) => {
    this.loading.status = status;
  };

  @action
  setView = (view) => {
    this.view = view;
  };

  @action
  fetchViews = async () => {
    this.loading.status = true;

    app.store.api.gemma
      .views()
      .then((response) => {
        this.setViews(response.results);
        delete response.results;
      })
      .catch((e) => console.error(e))
      .finally(() => {
        this.setLoadingStatus(false);
      });
  };

  @action
  fetchView = async (_id) => {
    this.loading.status = true;

    app.store.api.gemma
      .view(
        _id,
        new URLSearchParams(
          AcBuildURLSearchParams({ _id, ...this.defaultQuery })
        ).toString()
      )
      .then((response) => {
        this.setView(response);
      })
      .catch((e) => console.error(e))
      .finally(() => {
        this.setLoadingStatus(false);
      });
  };

  @action
  fetchElementReferences = async (_id) => {
    this.loading.status = true;

    app.store.api.gemma
      .elementReferences(
        _id,
        new URLSearchParams(
          AcBuildURLSearchParams({ _id, ...this.defaultQuery })
        ).toString()
      )
      .then((response) => {
        this.setElementReferences(response);
      })
      .catch((e) => console.error(e))
      .finally(() => {
        this.setLoadingStatus(false);
      });
  };

  @action
  resetView = () => {
    this.view = null;
  };

  @action
  resetElementReferences = () => {
    this.elementReferences = null;
  };

  @action
  resetViews = () => {
    this.views = [];
  };
}

export default GemmaStore;

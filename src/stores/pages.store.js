// Imports => MOBX
import { observable, computed, makeObservable, action, toJS } from 'mobx';

let app = {};

export class PagesStore {
  constructor(store) {
    makeObservable(this);
    app.store = store;
  }

  @observable
  items = [];

  @observable
  single = {};

  @observable
  loading = {
    status: false,
    message: undefined,
  };

  @computed
  get is_loading() {
    return this.loading.status;
  }

  @computed
  get all_pages() {
    return this.items ? toJS(this.items) : [];
  }

  @computed
  get get_single() {
    return this.single ? toJS(this.single) : null;
  }

  @action
  resetPage = () => {
    this.single = {};
  };

  @action
  setLoadingStatus = (status) => {
    this.loading.status = status;
  };

  @action
  setPages = (items) => {
    this.items = items;
  };

  @action
  setPage = (page) => {
    this.single = page;
  };

  @action
  fetchPage = async (id) => {
    this.loading.status = true;

    app.store.api.pages
      .single(id)
      .then((response) => {
        if (response.data) {
          this.setPage(response.data);
        } else {
          this.setPage(response);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => {
        this.loading.status = false;
      });
  };

  @action
  fetchPages = async () => {
    this.loading.status = true;
    const hostname = window.location.hostname;

    app.store.api.pages
      .list()
      .then((response) => {
        if (response.data) {
          this.setPages(response.data);
        } else {
          this.setPages(response.results);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => {
        this.setLoadingStatus(false);
      });
  };
}

export default PagesStore;

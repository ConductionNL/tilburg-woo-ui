// Imports => MOBX
import { observable, computed, makeObservable, action, toJS } from 'mobx';

let app = {};

export class ThemesStore {
  constructor(store) {
    makeObservable(this);
    app.store = store;
  }

  @observable
  loading = {
    status: false,
    message: null,
  };

  @computed
  get is_loading() {
    return !!this.loading.status;
  }

  get all_themes() {
    return this.items;
  }

  @action
  fetchThemes = async () => {
    this.loading.status = true;
    console.group('MAKING API CALL');
    console.log('calling');
    console.groupEnd();

    app.store.api.themes
      .list()
      .then((response) => {
        this.items = response.results;
      })
      .catch((e) => console.error(e))
      .finally(() => {
        this.loading.status = false;
      });
  };
}

export default ThemesStore;

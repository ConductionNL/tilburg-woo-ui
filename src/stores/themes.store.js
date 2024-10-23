// Imports => MOBX
import { observable, computed, makeObservable, action, toJS } from 'mobx';
import { LABELS, LABELS_DYNAMIC } from '@constants';

let app = {};

const DEFAULT_QUERY = {
  extend: 'all',
};

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

  @observable
  items = [];

  @computed
  get is_loading() {
    return !!this.loading.status;
  }

  @computed
  get all_themes() {
    return toJS(this.items)?.map((theme) => {
      return {
        ...theme,
        paragraph: theme.description,
        linkTitle: LABELS.VIEW_ALL_THEMES,
      };
    });
  }

  get themes_query() {
    return DEFAULT_QUERY;
  }

  @action
  setThemesFacets = (themesFacets) => {
    this.themesFacets = themesFacets;
  };

  @computed
  get all_themes_facets() {
    return this.themesFacets;
  }

  @action
  setLoadingStatus = (status) => {
    this.loading.status = status;
  };

  @action
  setThemes = (themes) => {
    this.items = themes;
  };

  @action
  fetchThemes = async () => {
    this.loading.status = true;

    app.store.api.documents
      .themes(this.themes_query)
      .then((response) => {
        this.setThemes(response.results);
      })
      .catch((e) => console.error(e))
      .finally(() => {
        this.setLoadingStatus(false);
      });
  };
}

export default ThemesStore;

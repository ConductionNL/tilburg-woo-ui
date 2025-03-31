// Imports => MOBX
import { observable, computed, makeObservable, action } from 'mobx';

// Imports => Utilities
import { AcSanitizeHtml } from '@src/utilities';
import { VISUALS } from '@constants';

let app = {};

export class CategoriesStore {
  constructor(store) {
    makeObservable(this);
    app.store = store;
  }

  @observable
  items = [];

  @observable
  loading = {
    status: false,
    message: undefined,
  };

  // Map visual names to actual components
  getVisualComponent = (visualName) => {
    return VISUALS[visualName] || null;
  };

  @computed
  get is_loading() {
    return this.loading.status;
  }

  @computed
  get all_categories() {
    return this.items?.map((item) => ({
      // icon: this.getVisualComponent(item.icon),
      title: item.title,
      summary: AcSanitizeHtml(item.content),
      linkUrl: item.url,
      linkTitle: item.link,
      // isExternal: true,
    }));
  }

  @action
  fetchCategories = async () => {
    this.loading.status = true;

    app.store.api.categories
      .list()
      .then((response) => {
        this.items = response.data;
      })
      .catch((e) => console.error(e))
      .finally(() => {
        this.loading.status = false;
      });
  };
}

export default CategoriesStore;

// Imports => MOBX
import { ActionSingle } from '@gemeente-denhaag/components-react';
import { observable, computed, makeObservable, action, toJS } from 'mobx';

let app = {};

export class MenuStore {
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
  get all_menu_items() {
    return this.items ? toJS(this.items) : [];
  }

  @computed
  get get_single() {
    return this.single ? toJS(this.single) : null;
  }

  @action
  resetMenu = () => {
    this.single = {};
  };

  @action
  setLoadingStatus = (status) => {
    this.loading.status = status;
  };

  @action
  setMenus = (items) => {
    this.items = items;
  };

  @action
  setMenu = (menu) => {
    this.single = menu;
  };

  @action
  getMenuFromPosition = (position) => {
    return this.all_menus.find((item) => item.position === position);
  };

  @action
  fetchMenu = async (id) => {
    this.setLoadingStatus(true);

    app.store.api.menu
      .single(id)
      .then((response) => {
        if (response.data) {
          this.setMenu(response.data);
        } else {
          this.setMenu(response);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => {
        this.setLoadingStatus(false);
      });
  };

  @action
  fetchMenus = async () => {
    this.setLoadingStatus(true);

    app.store.api.menu
      .list()
      .then((response) => {
        this.setMenus(response.data);
      })
      .catch((e) => console.error(e))
      .finally(() => {
        this.setLoadingStatus(false);
      });
  };
}

export default MenuStore;

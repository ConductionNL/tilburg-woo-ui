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
    const result = this.items ? toJS(this.items) : [];
    if (process.env.NODE_ENV === 'development') {
      console.log('MenuStore - all_menu_items computed:', result);
    }
    return result;
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
    // Display all menu items from the backend without filtering
    // Let the backend control what gets shown where
    if (process.env.NODE_ENV === 'development') {
      console.log('MenuStore - setMenus called with:', items);
    }
    this.items = items;
  };

  @action
  setMenu = (menu) => {
    this.single = menu;
  };

  @action
  getMenuFromPosition = (position) => {
    const items = this.all_menu_items;
    if (!Array.isArray(items) || items.length === 0) {
      return null;
    }
    return items.find((item) => item && item.position === position) || null;
  };

  @action
  getMenusFromPositions = (positions) => {
    const items = this.all_menu_items;
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }
    return items.filter((item) => item && positions.includes(item.position));
  };

  @action
  getFooterMenus = () => {
    // Get footer menus (positions 3, 4, 5)
    return this.getMenusFromPositions([3, 4, 5]);
  };

  @action
  getSubFooterMenus = () => {
    // Get sub footer menus (position 6)
    return this.getMenusFromPositions([6]);
  };

  @action
  getAdminMenus = () => {
    // Get admin menus (position 7)
    return this.getMenusFromPositions([7]);
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
    const hostname = window.location.hostname;

    app.store.api.menu
      .list()
      .then((response) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('MenuStore - fetchMenus response:', response);
        }
        if (response.data) {
          this.setMenus(response.data);
        } else {
          this.setMenus(response.results);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => {
        this.setLoadingStatus(false);
      });
  };
}

export default MenuStore;

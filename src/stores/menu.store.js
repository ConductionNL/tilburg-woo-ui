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
  getMenuFromPosition = (position, userIsAuthenticated = false) => {
    const items = this.all_menu_items;
    if (!Array.isArray(items) || items.length === 0) {
      return null;
    }
    
    // Get all menus from this position
    const menusAtPosition = items.filter((item) => item && item.position === position);
    
    // Filter menus based on authentication state
    const filteredMenus = menusAtPosition.filter(menu => this.shouldShowMenu(menu, userIsAuthenticated));
    
    // Return the first matching menu, but also filter its items
    const activeMenu = filteredMenus[0];
    if (activeMenu && activeMenu.items) {
      return {
        ...activeMenu,
        items: this.filterMenuItems(activeMenu.items, userIsAuthenticated)
      };
    }
    
    return activeMenu || null;
  };

  @action
  shouldShowMenu = (menu, userIsAuthenticated) => {
    // Handle undefined/null values - default to showing the menu
    // Rename showAfterLogin to hideBeforeLogin for clarity
    const hideBeforeLogin = menu.showAfterLogin === true;
    const hideAfterLogin = menu.hideAfterInlog === true;
    
    if (userIsAuthenticated) {
      // User is logged in - don't show if hideAfterLogin is true
      return !hideAfterLogin;
    } else {
      // User is not logged in - don't show if hideBeforeLogin is true
      return !hideBeforeLogin;
    }
  };

  @action
  shouldShowMenuItem = (menuItem, userIsAuthenticated) => {
    // Handle undefined/null values - default to showing the item
    // Rename showAfterLogin to hideBeforeLogin for clarity
    const hideBeforeLogin = menuItem.showAfterLogin === true;
    const hideAfterLogin = menuItem.hideAfterInlog === true;
    
    if (userIsAuthenticated) {
      // User is logged in - don't show if hideAfterLogin is true
      return !hideAfterLogin;
    } else {
      // User is not logged in - don't show if hideBeforeLogin is true
      return !hideBeforeLogin;
    }
  };

  @action
  filterMenuItems = (items, userIsAuthenticated) => {
    if (!Array.isArray(items)) return items;
    
    return items.filter(item => this.shouldShowMenuItem(item, userIsAuthenticated));
  };

  @action
  getMenusFromPositions = (positions, userIsAuthenticated = false) => {
    const items = this.all_menu_items;
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }
    
    // Filter by position first
    const menusAtPositions = items.filter((item) => item && positions.includes(item.position));
    
    // Then filter by authentication state and filter menu items
    return menusAtPositions
      .filter(menu => this.shouldShowMenu(menu, userIsAuthenticated))
      .map(menu => ({
        ...menu,
        items: this.filterMenuItems(menu.items, userIsAuthenticated)
      }));
  };

  @action
  getFooterMenus = (userIsAuthenticated = false) => {
    // Get footer menus (positions 3, 4, 5)
    return this.getMenusFromPositions([3, 4, 5], userIsAuthenticated);
  };

  @action
  getSubFooterMenus = (userIsAuthenticated = false) => {
    // Get sub footer menus (position 6)
    return this.getMenusFromPositions([6], userIsAuthenticated);
  };

  @action
  getAdminMenus = (userIsAuthenticated = false) => {
    // Get admin menus (position 7)
    return this.getMenusFromPositions([7], userIsAuthenticated);
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

// Imports => MOBX
import { ActionSingle } from '@gemeente-denhaag/components-react';
import { observable, computed, makeObservable, action, toJS } from 'mobx';
import { processUserTemplate } from '@src/utilities/con-template-processor';

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

    this.items = items;
  };

  @action
  setMenu = (menu) => {
    this.single = menu;
  };

  @action
  getMenuFromPosition = (position, userIsAuthenticated = false, userGroups = []) => {
    const items = this.all_menu_items;
    if (!Array.isArray(items) || items.length === 0) {
      return null;
    }
    
    // Get all menus from this position
    const menusAtPosition = items.filter((item) => item && item.position === position);
    
    // Filter menus based on authentication state
    const filteredMenus = menusAtPosition.filter(menu => this.shouldShowMenu(menu, userIsAuthenticated));
    
    // Return the first matching menu, but also filter its items and process templates
    const activeMenu = filteredMenus[0];
    if (activeMenu && activeMenu.items) {
      return {
        ...activeMenu,
        name: this.processMenuTemplate(activeMenu.name),
        items: this.filterMenuItems(activeMenu.items, userIsAuthenticated, userGroups).map(item => ({
          ...item,
          name: this.processMenuTemplate(item.name)
        }))
      };
    }
    
    return activeMenu ? {
      ...activeMenu,
      name: this.processMenuTemplate(activeMenu.name)
    } : null;
  };

  // Get admin dashboard menu from position 7 with group-based filtering
  @action
  getAdminDashboardMenu = (userIsAuthenticated = false, userGroups = []) => {
    return this.getMenuFromPosition(7, userIsAuthenticated, userGroups);
  };

  @action
  shouldShowMenu = (menu, userIsAuthenticated) => {
    // Handle undefined/null values - default to showing the menu
    const hideBeforeLogin = menu.hideBeforeLogin === true;
    const hideAfterLogin = menu.hideAfterLogin === true;
    
    if (userIsAuthenticated) {
      // User is logged in - don't show if hideAfterLogin is true
      return !hideAfterLogin;
    } else {
      // User is not logged in - don't show if hideBeforeLogin is true
      return !hideBeforeLogin;
    }
  };

  @action
  shouldShowMenuItem = (menuItem, userIsAuthenticated, userGroups = []) => {
    // Handle undefined/null values - default to showing the item
    const hideBeforeLogin = menuItem.hideBeforeLogin === true;
    const hideAfterLogin = menuItem.hideAfterLogin === true;
    
    // Check authentication-based visibility first
    if (userIsAuthenticated) {
      // User is logged in - don't show if hideAfterLogin is true
      if (hideAfterLogin) return false;
    } else {
      // User is not logged in - don't show if hideBeforeLogin is true
      if (hideBeforeLogin) return false;
    }
    
    // Check group-based visibility
    if (menuItem.groups && Array.isArray(menuItem.groups) && menuItem.groups.length > 0) {
      // If menu item has specific groups defined, user must have at least one matching group
      const hasMatchingGroup = menuItem.groups.some(requiredGroup => 
        userGroups.includes(requiredGroup)
      );
      if (!hasMatchingGroup) return false;
    }
    
    return true;
  };

  @action
  filterMenuItems = (items, userIsAuthenticated, userGroups = []) => {
    if (!Array.isArray(items)) return items;
    
    return items.filter(item => this.shouldShowMenuItem(item, userIsAuthenticated, userGroups));
  };

  /**
   * Process template variables in menu text
   * @param {string} text - Text that may contain template variables
   * @returns {string} Processed text with variables replaced
   */
  @action
  processMenuTemplate = (text) => {
    if (!text || typeof text !== 'string') {
      return text;
    }
    
    // Get user from the store
    const user = app.store?.user;
    if (!user) {
      return text;
    }
    
    return processUserTemplate(text, user);
  };

  @action
  getMenusFromPositions = (positions, userIsAuthenticated = false, userGroups = []) => {
    const items = this.all_menu_items;
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }
    
    // Filter by position first
    const menusAtPositions = items.filter((item) => item && positions.includes(item.position));
    
    // Then filter by authentication state, filter menu items, and process templates
    return menusAtPositions
      .filter(menu => this.shouldShowMenu(menu, userIsAuthenticated))
      .map(menu => ({
        ...menu,
        name: this.processMenuTemplate(menu.name),
        items: this.filterMenuItems(menu.items, userIsAuthenticated, userGroups).map(item => ({
          ...item,
          name: this.processMenuTemplate(item.name)
        }))
      }));
  };

  @action
  getFooterMenus = (userIsAuthenticated = false, userGroups = []) => {
    // Get footer menus (positions 3, 4, 5)
    return this.getMenusFromPositions([3, 4, 5], userIsAuthenticated, userGroups);
  };

  @action
  getSubFooterMenus = (userIsAuthenticated = false, userGroups = []) => {
    // Get sub footer menus (position 6)
    return this.getMenusFromPositions([6], userIsAuthenticated, userGroups);
  };

  @action
  getAdminMenus = (userIsAuthenticated = false, userGroups = []) => {
    // Get admin menus (position 7)
    return this.getMenusFromPositions([7], userIsAuthenticated, userGroups);
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

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
    // Filter out user-specific menu items that should be handled by the header
    const filteredItems = items.map(menu => ({
      ...menu,
      items: menu.items ? menu.items.filter(item => {
        // Filter out user-specific items that contain names or logout functionality
        const itemText = (item.name || item.label || item.title || '').toLowerCase();
        const itemHref = (item.href || item.url || item.link || '').toLowerCase();
        
        // Exclude items that look like user names or logout links
        const isUserName = /^[a-zA-Z\s]+ \d+$/.test(item.name || item.label || ''); // Pattern like "Name 3"
        const isLogout = itemText.includes('uitloggen') || 
                        itemText.includes('logout') || 
                        itemHref.includes('logout') ||
                        itemHref.includes('uitloggen');
        const isUserProfile = itemText.includes('profiel') || 
                             itemText.includes('profile') ||
                             itemText.includes('account');
        const isDashboard = itemText.includes('dashboard') ||
                           itemHref.includes('dashboard');
        
        // Additional user-specific patterns to filter out
        const isAuthRelated = itemText.includes('inloggen') || 
                             itemText.includes('login') ||
                             itemText.includes('signin') ||
                             itemText.includes('sign-in');
        
        // Filter out beheer/admin related menu items (these should be in sidenav)
        const isBeheerItem = itemHref.includes('/beheer') ||
                            itemHref.includes('/admin') ||
                            itemText.includes('beheer') ||
                            itemText.includes('admin');
        
        console.log(`Menu item analysis:`, {
          name: item.name || item.label || item.title,
          href: item.href || item.url || item.link,
          isUserName,
          isLogout,
          isUserProfile,
          isDashboard,
          isAuthRelated,
          isBeheerItem,
          shouldKeep: !isUserName && !isLogout && !isUserProfile && !isDashboard && !isAuthRelated && !isBeheerItem
        });
        
        // Keep the item only if it's NOT user-specific or admin-related
        return !isUserName && !isLogout && !isUserProfile && !isDashboard && !isAuthRelated && !isBeheerItem;
      }) : []
    }));
    
    console.log('Menu filtering - Original items:', items);
    console.log('Menu filtering - Filtered items:', filteredItems);
    
    this.items = filteredItems;
  };

  @action
  setMenu = (menu) => {
    this.single = menu;
  };

  @action
  getMenuFromPosition = (position) => {
    return this.all_menu_items.find((item) => item.position === position);
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

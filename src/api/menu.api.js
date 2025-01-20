// Imports => Constants
import { ENDPOINTS } from '@constants';

export class MenuAPI {
  constructor(Instance) {
    this.Store = Instance.Store;
    this.Client = Instance.Client;
  }

  list() {
    return this.Client.get(ENDPOINTS.MENU.INDEX).then((response) => response.data);
  }

  single(id) {
    return this.Client.get(ENDPOINTS.MENU.SINGLE(id)).then(
      (response) => response.data
    );
  }
}

export default MenuAPI;

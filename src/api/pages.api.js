// Imports => Constants
import { ENDPOINTS } from '@constants';

export class PagesAPI {
  constructor(Instance) {
    this.Store = Instance.Store;
    this.Client = Instance.Client;
  }

  list() {
    return this.Client.get(ENDPOINTS.PAGES.INDEX).then((response) => response.data);
  }

  single(id) {
    return this.Client.get(ENDPOINTS.PAGES.SHOW(id)).then(
      (response) => response.data
    );
  }
}

export default PagesAPI;

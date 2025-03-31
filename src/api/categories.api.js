// Imports => Constants
import { ENDPOINTS } from '@constants/endpoints.constants';

export class CategoriesAPI {
  constructor(Instance) {
    this.Store = Instance.Store;
    this.Client = Instance.Client;
  }

  list() {
    return this.Client.get(ENDPOINTS.CATEGORIES.INDEX).then(
      (response) => response.data
    );
  }

  single(id) {
    return this.Client.get(ENDPOINTS.CATEGORIES.SHOW(id)).then(
      (response) => response.data
    );
  }
}

export default CategoriesAPI;

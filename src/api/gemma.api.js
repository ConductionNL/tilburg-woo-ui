// Imports => Constants
import { ENDPOINTS } from '@constants';

export class GemmaAPI {
  constructor(Instance) {
    this.Store = Instance.Store;
    this.Client = Instance.Client;
  }

  list(params) {
    return this.Client.get(ENDPOINTS.GEMMA.LIST, { params }).then(
      (response) => response.data
    );
  }

  single(id, params) {
    return this.Client.get(ENDPOINTS.GEMMA.SINGLE(id, params)).then(
      (response) => response.data
    );
  }
}

export default GemmaAPI;

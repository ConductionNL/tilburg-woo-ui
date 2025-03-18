// Imports => Constants
import { ENDPOINTS } from '@constants';

export class GemmaAPI {
  constructor(Instance) {
    this.Store = Instance.Store;
    this.Client = Instance.Client;
  }

  views(params) {
    return this.Client.get(ENDPOINTS.GEMMA.VIEWS, { params }).then(
      (response) => response.data
    );
  }

  allVoorzieningGebruik(params) {
    return this.Client.get(ENDPOINTS.GEMMA.VOORZIENING_GEBRUIK, { params }).then(
      (response) => response.data
    );
  }

  voorzieningGebruik(id, params) {
    return this.Client.get(ENDPOINTS.GEMMA.VOORZIENING_GEBRUIK(id, params)).then(
      (response) => response.data
    );
  }

  view(id, params) {
    return this.Client.get(ENDPOINTS.GEMMA.VIEW(id, params)).then(
      (response) => response.data
    );
  }

  elementReferences(id, params) {
    return this.Client.get(ENDPOINTS.GEMMA.ELEMENT_REFERENCES(id, params)).then(
      (response) => response.data
    );
  }
}

export default GemmaAPI;

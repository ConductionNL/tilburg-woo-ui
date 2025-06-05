// Imports => Constants
import { ENDPOINTS } from '@constants/endpoints.constants';

export class TermsAPI {
  constructor(Instance) {
    this.Store = Instance.Store;
    this.Client = Instance.Client;
  }

  list() {
    return this.Client.get(ENDPOINTS.TERMS.INDEX).then((response) => response.data);
  }

  single(id) {
    return this.Client.get(ENDPOINTS.TERMS.SHOW(id)).then(
      (response) => response.data
    );
  }

  // Since we don't have any API filtering capability, we'll continue returning all terms
  // The filtering will happen in the store based on text matching
  getForPublication(publicationId) {
    return this.list();
  }
}

export default TermsAPI;

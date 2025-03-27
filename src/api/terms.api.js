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

  // Since we don't know if filtering by publication is supported,
  // let's just use the list method for now
  getForPublication(publicationId) {
    return this.list(); // For now, just return all terms
  }
}

export default TermsAPI;

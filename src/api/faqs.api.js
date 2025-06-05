// Imports => Constants
import { ENDPOINTS } from '@constants/endpoints.constants';

export class FaqsAPI {
  constructor(Instance) {
    this.Store = Instance.Store;
    this.Client = Instance.Client;
  }

  list() {
    return this.Client.get(ENDPOINTS.FAQS.INDEX).then((response) => response.data);
  }

  single(id) {
    return this.Client.get(ENDPOINTS.FAQS.SHOW(id)).then(
      (response) => response.data
    );
  }
}

export default FaqsAPI;

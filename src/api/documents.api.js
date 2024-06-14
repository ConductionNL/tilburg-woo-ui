// Imports => Constants
import { ENDPOINTS } from '@constants';

export class DocumentsAPI {
  constructor(Instance) {
    this.Store = Instance.Store;
    this.Client = Instance.Client;
  }

  search(params) {
    return this.Client.get(ENDPOINTS.DOCUMENTS.SEARCH(params)).then(
      (response) => response.data
    );
  }
}

export default DocumentsAPI;

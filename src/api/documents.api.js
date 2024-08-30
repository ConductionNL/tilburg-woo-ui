// Imports => Constants
import { ENDPOINTS } from '@constants';

export class DocumentsAPI {
  constructor(Instance) {
    this.Store = Instance.Store;
    this.Client = Instance.Client;
  }

  search(params) {
    return this.Client.get(ENDPOINTS.DOCUMENTS.SEARCH, { params }).then(
      (response) => response.data
    );
  }

  single(id, params) {
    return this.Client.get(ENDPOINTS.DOCUMENTS.SINGLE(id, params)).then(
      (response) => response.data
    );
  }

  attachments(id, params) {
    return this.Client.get(ENDPOINTS.DOCUMENTS.ATTACHMENTS(id, params)).then(
      (response) => response.data.results
    );
  }

  searchAggregations(params) {
    return this.Client.get(ENDPOINTS.DOCUMENTS.SEARCH, {
      params,
      headers: {
        Accept: 'application/json+aggregations',
      },
    }).then((response) => response.data);
  }
}

export default DocumentsAPI;

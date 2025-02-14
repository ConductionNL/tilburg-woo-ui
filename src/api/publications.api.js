// Imports => Constants
import { ENDPOINTS } from '@constants';

export class PublicationsAPI {
  constructor(Instance) {
    this.Store = Instance.Store;
    this.Client = Instance.Client;
  }

  search(params) {
    return this.Client.get(ENDPOINTS.PUBLICATIONS.SEARCH, { params }).then(
      (response) => response.data
    );
  }

  attachments(id) {
    return this.Client.get(ENDPOINTS.PUBLICATIONS.ATTACHMENTS(id)).then(
      (response) => response.data
    );
  }

  single(id, params) {
    return this.Client.get(ENDPOINTS.PUBLICATIONS.SINGLE(id, params)).then(
      (response) => response.data
    );
  }

  relations(uri) {
    return this.Client.get(ENDPOINTS.PUBLICATIONS.RELATIONS(uri)).then(
      (response) => response.data.results
    );
  }

  themes(params) {
    return this.Client.get(ENDPOINTS.THEMES, { params }).then(
      (response) => response.data
    );
  }

  searchAggregations(params) {
    return this.Client.get(ENDPOINTS.PUBLICATIONS.SEARCH, {
      params,
      headers: {
        Accept: 'application/json+aggregations',
      },
    }).then((response) => response.data);
  }
}

export default PublicationsAPI;

// Imports => Constants
import { ENDPOINTS } from '@constants';

export class MijnOmgevingAPI {
  constructor(Instance) {
    this.Store = Instance.Store;
    this.Client = Instance.Client;
  }

  search(params) {
    return this.Client.get(ENDPOINTS.MIJN_OMGEVING.SEARCH, { params }).then(
      (response) => response.data
    );
  }

  single(id, params) {
    return this.Client.get(ENDPOINTS.MIJN_OMGEVING.SINGLE(id, params)).then(
      (response) => response.data
    );
  }

  themes(params) {
    return this.Client.get(ENDPOINTS.THEMES, { params }).then(
      (response) => response.data
    );
  }

  searchAggregations(params) {
    return this.Client.get(ENDPOINTS.MIJN_OMGEVING.SEARCH, {
      params,
      headers: {
        Accept: 'application/json+aggregations',
      },
    }).then((response) => response.data);
  }
}

export default MijnOmgevingAPI;

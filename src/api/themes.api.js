// Imports => Constants
import { ENDPOINTS } from '@constants';

export class ThemesAPI {
  constructor(Instance) {
    this.Store = Instance.Store;
    this.Client = Instance.Client;
  }

  list() {
    return this.Client.get(ENDPOINTS.THEMES.INDEX).then((response) => response.data);
  }
}

export default ThemesAPI;

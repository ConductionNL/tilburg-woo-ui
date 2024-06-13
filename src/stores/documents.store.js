// Imports => MOBX
import { observable, computed, makeObservable, action } from 'mobx';

let app = {};

export class DocumentsStore {
  constructor(store) {
    makeObservable(this);
    app.store = store;
  }

  @observable
  mobileFiltersOpen = false;

  @observable
  items = [];

  @observable
  query = {
    search: 'rookvrij',
    'organisatie.oin': '00000001001172773000',
  };

  @observable
  loading = {
    status: false,
    message: undefined,
  };

  @computed
  get is_loading() {
    return this.loading.status;
  }

  @computed
  get all_documents() {
    return this.items;
  }

  @action
  toggleMobileFilters = () => {
    this.mobileFiltersOpen = !this.mobileFiltersOpen;
  };

  @action
  fetchDocuments = async () => {
    this.loading.status = true;

    app.store.api.documents
      .search(new URLSearchParams(this.query).toString())
      .then((response) => {
        this.items = response;
        console.log(response.data);
      })
      .catch((e) => console.error(e))
      .finally(() => {
        this.loading.status = false;
      });
  };
}

export default DocumentsStore;

// Imports => MOBX
import { observable, computed, makeObservable, action } from 'mobx';
import acFormatDate from '@src/utilities/ac-format-date';

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
    return this.items.map((item) => ({
      id: item.id,
      title: item.titel,
      content: item.samenvatting,
      date: acFormatDate(item.publicatiedatum, 'YYYY-MM-DD', 'DD MMMM YYYY'),
      date2: new Date(item.publicatiedatum).toLocaleDateString(),
      category: item.categorie,
      themes: item.themas,
    }));
  }

  @action
  setSearchQuery = (searchQuery) => {
    this.query.search = searchQuery;
  };

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
        this.items = response.results;
        this.pagination = response;
      })
      .catch((e) => console.error(e))
      .finally(() => {
        this.loading.status = false;
      });
  };
}

export default DocumentsStore;

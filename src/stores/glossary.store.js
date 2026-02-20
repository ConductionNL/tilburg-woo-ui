// Imports => MOBX
import { observable, makeObservable, action, computed, runInAction, toJS } from 'mobx';
import axios from 'axios';
import { BASE_URL } from '@views/ac-beheer/core/utils/constants';

let app = {};

// Create axios instance for glossary API
const glossaryApi = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export class GlossaryStore {
  constructor(store) {
    makeObservable(this);
    app.store = store;
  }

  @observable
  terms = [];

  @observable
  loading = false;

  @observable
  error = null;

  @observable
  warmedUp = false;

  @observable
  drawerOpen = false;

  @observable
  activeTermId = null;

  @observable
  pageTermIds = new Set();

  @computed
  get all_terms() {
    return toJS(this.terms);
  }

  @computed
  get page_terms() {
    return this.terms.filter((term) => this.pageTermIds.has(term.id));
  }

  @computed
  get is_loading() {
    return this.loading;
  }

  @computed
  get is_warmed_up() {
    return this.warmedUp;
  }

  @action
  warmup = async () => {
    if (this.warmedUp || this.loading) return;

    this.loading = true;
    this.error = null;

    try {
      // Fetch all glossary terms with a high limit to get everything in one call
      const response = await glossaryApi.get('/opencatalogi/api/glossary', {
        params: {
          _limit: 1000,
          _page: 1,
        },
      });

      runInAction(() => {
        this.terms = response.data?.results || [];
        this.warmedUp = true;
        this.loading = false;
      });

      console.info(`Glossary warmup complete: ${this.terms.length} terms loaded`);
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
        this.loading = false;
      });
      console.warn('Glossary warmup failed:', error);
    }
  };

  @action
  openDrawer = (termId = null) => {
    this.drawerOpen = true;
    this.activeTermId = termId;
  };

  @action
  closeDrawer = () => {
    this.drawerOpen = false;
    this.activeTermId = null;
  };

  @action
  addPageTermIds = (ids) => {
    ids.forEach((id) => this.pageTermIds.add(id));
  };

  @action
  resetPageTerms = () => {
    this.pageTermIds = new Set();
  };

  getTermById = (id) => {
    return this.terms.find((term) => term.id === id);
  };
}

export default GlossaryStore;

// Imports => Dependencies
import {
  observable,
  computed,
  makeObservable,
  action,
  runInAction,
  makeAutoObservable,
} from 'mobx';
import { AcSanitizeHtml } from '@utils';

export class TermsStore {
  rootStore;
  terms = [];
  publicationTerms = new Map();
  loading = false;
  loadingPublicationTerms = false;
  searchQuery = '';

  constructor(rootStore) {
    this.rootStore = rootStore;

    // Use makeAutoObservable for simpler setup
    makeAutoObservable(this, {
      rootStore: false,
      publication_terms: computed,
    });

    // Bind methods to ensure 'this' context
    this.fetchTerms = this.fetchTerms.bind(this);
    this.fetchTermsForPublication = this.fetchTermsForPublication.bind(this);
    this.setSearchQuery = this.setSearchQuery.bind(this);
    this.reset = this.reset.bind(this);
  }

  get is_loading() {
    return this.loading;
  }

  get is_loading_publication_terms() {
    return this.loadingPublicationTerms;
  }

  get all_terms() {
    return this.terms?.map((term) => ({
      ...term,
      description: term.description ? AcSanitizeHtml(term.description) : '',
    }));
  }

  get filtered_terms() {
    if (!this.searchQuery) return this.all_terms;

    return this.all_terms?.filter((term) =>
      term.name?.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  get publication_terms() {
    return (publicationId) => {
      if (!publicationId || !this.publicationTerms.has(publicationId)) {
        return [];
      }

      return this.publicationTerms.get(publicationId)?.map((term) => ({
        ...term,
        description: term.description ? AcSanitizeHtml(term.description) : '',
      }));
    };
  }

  setSearchQuery(query = '') {
    this.searchQuery = query;
  }

  async fetchTerms() {
    if (!this.rootStore?.api?.terms) {
      return Promise.resolve([]);
    }

    this.loading = true;

    try {
      const response = await this.rootStore.api.terms.list();

      // Check if response has a data property (API may return { data: [...] })
      const termsData = response?.data || response || [];

      runInAction(() => {
        this.terms = termsData;
        this.loading = false;
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.terms = [];
        this.loading = false;
      });

      return [];
    }
  }

  async fetchTermsForPublication(publicationId) {
    if (!publicationId || !this.rootStore?.api?.terms) {
      return Promise.resolve([]);
    }

    this.loadingPublicationTerms = true;

    try {
      const response = await this.rootStore.api.terms.getForPublication(
        publicationId
      );

      // Check if response has a data property (API may return { data: [...] })
      const termsData = response?.data || response || [];

      runInAction(() => {
        this.publicationTerms.set(publicationId, termsData);
        this.loadingPublicationTerms = false;
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.publicationTerms.set(publicationId, []);
        this.loadingPublicationTerms = false;
      });

      return [];
    }
  }

  reset() {
    runInAction(() => {
      this.terms = [];
      this.publicationTerms = new Map();
      this.loading = false;
      this.loadingPublicationTerms = false;
      this.searchQuery = '';
    });
  }
}

export default TermsStore;

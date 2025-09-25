// Imports => MOBX
import { observable, computed, makeObservable, action, toJS } from 'mobx';

let app = {};

export class PagesStore {
  constructor(store) {
    makeObservable(this);
    app.store = store;
  }

  @observable
  items = [];

  @observable
  single = {};

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
  get all_pages() {
    return this.items ? toJS(this.items) : [];
  }

  // Get pages filtered by authentication state
  @computed
  get getFilteredPages() {
    return (userIsAuthenticated = false) => {
      const pages = this.all_pages;
      if (!Array.isArray(pages)) return [];

      return pages.filter((page) => this.shouldShowPage(page, userIsAuthenticated));
    };
  }

  // Check if a page should be visible based on authentication
  @action
  shouldShowPage = (page, userIsAuthenticated) => {
    if (!page) return false;

    const hideBeforeLogin = page.hideBeforeLogin === true;
    const hideAfterLogin = page.hideAfterLogin === true;

    if (userIsAuthenticated) {
      // User is logged in - don't show if hideAfterLogin is true
      return !hideAfterLogin;
    } else {
      // User is not logged in - don't show if hideBeforeLogin is true
      return !hideBeforeLogin;
    }
  };

  @computed
  get get_single() {
    return this.single ? toJS(this.single) : null;
  }

  @action
  resetPage = () => {
    this.single = {};
  };

  @action
  setLoadingStatus = (status) => {
    this.loading.status = status;
  };

  @action
  setPages = (items) => {
    this.items = items;
  };

  @action
  setPage = (page) => {
    this.single = page;
  };

  @action
  fetchPage = async (id) => {
    this.loading.status = true;

    const fallbackPageData = {
      id: 'e4b0c8f2-5d3a-4f6b-9c2d-8a7e4f1b2c3d',
      title: 'Home',
      slug: 'home',
      contents: [
        {
          type: 'RichText',
          order: 0,
          id: '10koyox92q',
          data: {
            content: '',
            groups: [],
            hideAfterLogin: false,
            hideBeforeLogin: false,
          },
        },
      ],
      groups: [],
      hideAfterLogin: false,
      hideBeforeLogin: false,
      '@self': {
        id: 'e4b0c8f2-5d3a-4f6b-9c2d-8a7e4f1b2c3d',
        slug: null,
        name: 'Home',
        description: 'Fallback page',
        summary: null,
        image: null,
        uri: null,
        version: null,
        register: '0',
        schema: '0',
        schemaVersion: null,
        files: [],
        relations: [],
        locked: null,
        owner: 'Fallback gods',
        organisation: null,
        groups: [],
        authorization: [],
        folder: null,
        application: null,
        validation: [],
        geo: [],
        retention: [],
        size: null,
        updated: '1970-01-01T00:00:00+00:00',
        created: '1970-01-01T00:00:00+00:00',
        published: null,
        depublished: null,
        deleted: [],
      },
    };

    app.store.api.pages
      .single(id)
      .then((response) => {
        // Check if we got HTML instead of JSON (server misconfiguration)
        const responseText =
          typeof response === 'string' ? response : JSON.stringify(response);

        if (
          responseText.includes('<!doctype html>') ||
          responseText.includes('<html')
        ) {
          console.warn(
            '⚠️ Server returned HTML instead of JSON, using fallback data'
          );
          this.setPage(fallbackPageData);
          return;
        }

        // Normal JSON response
        if (response.data) {
          this.setPage(response.data);
        } else {
          this.setPage(response);
        }
      })
      .catch((e) => {
        console.error('Page fetch error:', e);

        // Use fallback for any error (404, network issues, etc.)
        console.warn('🔄 Using fallback page data due to API error');
        this.setPage(fallbackPageData);
      })
      .finally(() => {
        this.loading.status = false;
      });
  };

  @action
  fetchPages = async () => {
    this.loading.status = true;

    const fallbackPagesData = [
      {
        id: 'e4b0c8f2-5d3a-4f6b-9c2d-8a7e4f1b2c3d',
        title: 'Home',
        slug: '/home',
        contents: [
          {
            type: 'RichText',
            order: 0,
            id: '10koyox92q',
            data: {
              content: '',
              groups: [],
              hideAfterLogin: false,
              hideBeforeLogin: false,
            },
          },
        ],
        groups: [],
        hideAfterLogin: false,
        hideBeforeLogin: false,
        '@self': {
          id: 'e4b0c8f2-5d3a-4f6b-9c2d-8a7e4f1b2c3d',
          slug: null,
          name: 'Home',
          description: 'Fallback page',
          summary: null,
          image: null,
          uri: null,
          version: null,
          register: '0',
          schema: '0',
          schemaVersion: null,
          files: [],
          relations: [],
          locked: null,
          owner: 'Fallback gods',
          organisation: null,
          groups: [],
          authorization: [],
          folder: null,
          application: null,
          validation: [],
          geo: [],
          retention: [],
          size: null,
          updated: '1970-01-01T00:00:00+00:00',
          created: '1970-01-01T00:00:00+00:00',
          published: null,
          depublished: null,
          deleted: [],
        },
      },
    ];

    app.store.api.pages
      .list()
      .then((response) => {
        // Check if we got HTML instead of JSON
        const responseText =
          typeof response === 'string' ? response : JSON.stringify(response);

        if (
          responseText.includes('<!doctype html>') ||
          responseText.includes('<html')
        ) {
          console.warn(
            '⚠️ Server returned HTML instead of JSON for pages list, using fallback data'
          );
          this.setPages(fallbackPagesData);
          return;
        }

        // Normal JSON response
        if (response.data) {
          this.setPages(response.data);
        } else {
          this.setPages(response.results);
        }
      })
      .catch((e) => {
        console.error('Pages fetch error:', e);

        // Use fallback for any error (404, network issues, etc.)
        console.warn('🔄 Using fallback pages data due to API error');
        this.setPages(fallbackPagesData);
      })
      .finally(() => {
        this.setLoadingStatus(false);
      });
  };
}

export default PagesStore;

// Imports => MOBX
import { observable, computed, makeObservable, action, toJS } from 'mobx';
import { LABELS } from '@constants';

// Try to import container constants (generated at runtime)
let containerConfig;
try {
  containerConfig = require('@constants/container.constants');
} catch (error) {
  console.warn('Container constants not available, falling back to standard behavior');
  containerConfig = null;
}

// Mock themes data for development when API is not available
const MOCK_THEMES = [
  {
    id: '1',
    title: 'Bestuur en Democratie',
    description: 'Onderwerpen gerelateerd aan bestuur, democratie en transparantie',
    image: '/placeholder.png'
  },
  {
    id: '2', 
    title: 'Digitalisering',
    description: 'ICT, digitale dienstverlening en technologische innovaties',
    image: '/placeholder.png'
  },
  {
    id: '3',
    title: 'Organisatie',
    description: 'Organisatiestructuur, processen en werkwijzen',
    image: '/placeholder.png'
  },
  {
    id: '4',
    title: 'Publieke Dienstverlening', 
    description: 'Diensten aan burgers en bedrijven',
    image: '/placeholder.png'
  }
];

let app = {};

const DEFAULT_QUERY = {};

export class ThemesStore {
  constructor(store) {
    makeObservable(this);
    app.store = store;
  }

  @observable
  loading = {
    status: false,
    message: null,
  };

  @observable
  items = [];

  @computed
  get is_loading() {
    return !!this.loading.status;
  }

  @computed
  get all_themes() {
    // Handle case where items is empty or undefined
    if (!this.items || !Array.isArray(this.items)) {
      return [];
    }

    return this.items
      ?.slice()
      // Filter out items without titles before sorting to prevent localeCompare errors
      ?.filter((theme) => theme && theme.title && typeof theme.title === 'string')
      ?.sort((a, b) => a.title.localeCompare(b.title))
      ?.map((theme) => ({
        ...theme,
        paragraph: theme.description || '',
        linkTitle: LABELS.VIEW_ALL_THEMES,
      }))
      .filter((theme) => theme.image !== null);
  }

  get themes_query() {
    return DEFAULT_QUERY;
  }

  @action
  setThemesFacets = (themesFacets) => {
    this.themesFacets = themesFacets;
  };

  @computed
  get all_themes_facets() {
    return this.themesFacets;
  }

  @action
  setLoadingStatus = (status) => {
    this.loading.status = status;
  };

  @action
  setThemes = (themes) => {
    this.items = themes;
  };

  @action
  fetchThemes = async () => {
    this.loading.status = true;

    // Use mock themes if enabled and available
    if (containerConfig && containerConfig.isFeatureEnabled && containerConfig.isFeatureEnabled('mock_themes')) {
      console.log('🎨 Using mock themes data for development');
      setTimeout(() => {
        this.setThemes(MOCK_THEMES);
        this.setLoadingStatus(false);
      }, 100); // Small delay to simulate API call
      return;
    }

    // Otherwise use real API
    app.store.api.themes
      .list(DEFAULT_QUERY)
      .then((response) => {
        this.setThemes(response.results || []);
      })
      .catch((e) => {
        console.error('Themes API error:', e);
        // Fall back to mock data if API fails and mock is available
        if (MOCK_THEMES) {
          console.log('🎨 Falling back to mock themes data due to API error');
          this.setThemes(MOCK_THEMES);
        } else {
          this.setThemes([]);
        }
      })
      .finally(() => {
        this.setLoadingStatus(false);
      });
  };
}

export default ThemesStore;

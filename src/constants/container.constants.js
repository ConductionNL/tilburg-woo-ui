// Container constants - Runtime Configuration
// This file reads from window.RUNTIME_CONFIG which is loaded at runtime
// The runtime-config.js file is generated at container startup with environment-specific values
// Priority: 1. Runtime config (window.RUNTIME_CONFIG) -> 2. Build-time defaults
import { AcLockObject } from '@utils/ac-lock-object';

/**
 * Build-time default configuration
 * Used as fallback if runtime config is not available
 */
const DEFAULT_CONFIG = {
  SITE_TITLE: 'VNG Softwarecatalogus',
  SITE_DESCRIPTION: 'Local development instance of the softwarecatalogus',
  SITE: 'localhost',
  MODE: 'development',
  THEME_VARIANT: 'vng',
  ENVIRONMENT_NAME: 'development',
  BASE_URL: '/api/apps',
  GRANT_TYPE: 'authorization_code',
  CLIENT_ID: '',
  CLIENT_SECRET: '',
  PROVIDER: 'nextcloud',
  REGISTER_URL: '',
  AUTO_LOGOUT: false,
  AUTO_LOGOUT_TIME: 3600,
  SESSION_TIMEOUT: 3600,
  ACTIVITY_PING: false,
  ROLLBAR_KEY: '',
  ROLLBAR_ENVIRONMENT: 'development',
  ENABLE_AUTHENTICATION: false,
  ENABLE_GEMMA: true,
  ENABLE_DIRECTORY: true,
  ENABLE_ROLLBAR: false,
  ENABLE_MOCK_THEMES: true,
  ENABLE_BREADCRUMBS: false,
  EXTERNAL_WEBSITE_URL: 'https://www.tilburg.nl/',
  EXTERNAL_PRIVACY_URL: 'https://www.tilburg.nl/privacystatement/',
  EXTERNAL_COOKIES_URL: 'https://www.tilburg.nl/cookies/',
  EXTERNAL_PROCLAIMER_URL: 'https://www.tilburg.nl/proclaimer/',
  HERO_IMAGE_URL: null,
  FAVICON_URL: null,
  FOOTER_STYLE: 'vng',
  FOOTER_LOGO_TITLE: 'VNG Softwarecatalogus',
  FOOTER_LOGO_SUBTITLE: 'Één plek voor alle software voor en door Gemeenten',
  SUPPORT_EMAIL_ADDRESS: 'info@conduction.nl',
  DEFAULT_SEARCH_SCHEMA: '18',
};

/**
 * Initialize configuration at module load time
 * Since runtime-config.js is loaded in <head> before React bundle, window.RUNTIME_CONFIG is available
 */
const initializeConfig = () => {
  // Check if we're in a browser environment and runtime config is available
  if (typeof window !== 'undefined' && window.RUNTIME_CONFIG) {
    // console.log(
    //   '✅ [container.constants.js] Using runtime configuration from window.RUNTIME_CONFIG',
    //   window.RUNTIME_CONFIG
    // );
    // Merge runtime config with defaults (runtime config takes priority)
    return { ...DEFAULT_CONFIG, ...window.RUNTIME_CONFIG };
  }

  // Fallback to build-time defaults (for SSR, tests, or if runtime config fails to load)
  console.warn(
    '⚠️  [container.constants.js] Runtime config not found, using build-time defaults'
  );
  return DEFAULT_CONFIG;
};

// Initialize configuration once at module load time
// This is safe because runtime-config.js is loaded in <head> before this bundle
const configData = initializeConfig();

// Container configuration - frozen to prevent accidental modifications
export const CONTAINER_CONFIG = AcLockObject(configData);

// Helper functions to replace hostname-based logic
export const getTitle = () => CONTAINER_CONFIG.SITE_TITLE;
export const getSiteDescription = () => CONTAINER_CONFIG.SITE_DESCRIPTION;
export const getSite = () => CONTAINER_CONFIG.SITE;
export const getMode = () => CONTAINER_CONFIG.MODE;
export const getThemeVariant = () => CONTAINER_CONFIG.THEME_VARIANT;
export const getEnvironmentName = () => CONTAINER_CONFIG.ENVIRONMENT_NAME;

// All API URLs are now unified under BASE_URL
export const getApiUrl = () => CONTAINER_CONFIG.BASE_URL || '/api/apps';
export const getCommongroundApiUrl = () => CONTAINER_CONFIG.BASE_URL || '/api/apps';
export const getGemmaEndpoint = () => CONTAINER_CONFIG.BASE_URL || '/api/apps';
export const getOpenconnectorApiUrl = () => '/api/openconnector';

// Legacy aliases for backward compatibility
export const getApiConfig = getApiUrl;

export const getAuthConfig = () => ({
  grantType: CONTAINER_CONFIG.GRANT_TYPE,
  clientId: CONTAINER_CONFIG.CLIENT_ID,
  clientSecret: CONTAINER_CONFIG.CLIENT_SECRET,
  provider: CONTAINER_CONFIG.PROVIDER,
  registerUrl: CONTAINER_CONFIG.REGISTER_URL,
});

export const getSessionConfig = () => ({
  autoLogout: CONTAINER_CONFIG.AUTO_LOGOUT,
  sessionTimeout: CONTAINER_CONFIG.SESSION_TIMEOUT,
  activityPing: CONTAINER_CONFIG.ACTIVITY_PING,
});

export const getFeatureFlags = () => ({
  enableBreadcrumbs: CONTAINER_CONFIG.ENABLE_BREADCRUMBS,
  enableDirectory: CONTAINER_CONFIG.ENABLE_DIRECTORY,
  enableRollbar: CONTAINER_CONFIG.ENABLE_ROLLBAR,
  enableMockThemes: CONTAINER_CONFIG.ENABLE_MOCK_THEMES,
});

export const getExternalUrls = () => ({
  website: CONTAINER_CONFIG.EXTERNAL_WEBSITE_URL,
  privacy: CONTAINER_CONFIG.EXTERNAL_PRIVACY_URL,
  cookies: CONTAINER_CONFIG.EXTERNAL_COOKIES_URL,
  proclaimer: CONTAINER_CONFIG.EXTERNAL_PROCLAIMER_URL,
});

export const getVisualConfig = () => ({
  heroImageUrl: CONTAINER_CONFIG.HERO_IMAGE_URL,
  faviconUrl: CONTAINER_CONFIG.FAVICON_URL,
  menuPosition: CONTAINER_CONFIG.MENU_POSITION,
  footerStyle: CONTAINER_CONFIG.FOOTER_STYLE,
});

// Image helper functions
export const getHeroImageUrl = () => CONTAINER_CONFIG.HERO_IMAGE_URL;
export const getFaviconUrl = () => CONTAINER_CONFIG.FAVICON_URL;

// Footer text helper functions
export const getFooterLogoTitle = () => CONTAINER_CONFIG.FOOTER_LOGO_TITLE;
export const getFooterLogoSubtitle = () => CONTAINER_CONFIG.FOOTER_LOGO_SUBTITLE;
export const getSupportEmailAddress = () => CONTAINER_CONFIG.SUPPORT_EMAIL_ADDRESS;

// Search helper functions
export const getDefaultSearchSchema = () => CONTAINER_CONFIG.DEFAULT_SEARCH_SCHEMA;
export const getDefaultConfig = () => CONTAINER_CONFIG;

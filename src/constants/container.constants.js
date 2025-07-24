// Auto-generated container constants
// This file is generated from environment variables during container startup
// DO NOT EDIT MANUALLY - changes will be overwritten

import { AcLockObject } from '@utils/ac-lock-object';

// Container configuration
export const CONTAINER_CONFIG = AcLockObject({
  SITE_TITLE: 'Environment Config Test ✅',
  SITE_DESCRIPTION: 'Development instance of the software catalogus',
  SITE: 'localhost',
  MODE: 'development',
  THEME_VARIANT: 'development',
  ENVIRONMENT_NAME: 'development',
  API_URL: 'http://nextcloud.local/index.php/apps',
  API_URL_COMMONGROUND: 'http://nextcloud.local/index.php/apps',
  API_URL_COMMONGROUND_TOKEN: '',
  API_URL_COMMONGROUND_ORGANIZATION_OIN: '',
  GEMMA_ENDPOINT: 'http://nextcloud.local',
  GRANT_TYPE: 'authorization_code',
  CLIENT_ID: '',
  CLIENT_SECRET: '',
  PROVIDER: 'nextcloud',
  REGISTER_URL: '',
  AUTO_LOGOUT: false,
  AUTO_LOGOUT_TIME: 3600,
  ROLLBAR_KEY: '',
  ROLLBAR_ENVIRONMENT: 'development',
  ENABLE_AUTHENTICATION: false,
  ENABLE_GEMMA: true,
  ENABLE_DIRECTORY: true,
  ENABLE_ROLLBAR: false,
  ENABLE_MOCK_THEMES: true,
  EXTERNAL_WEBSITE_URL: 'https://www.tilburg.nl/',
  EXTERNAL_PRIVACY_URL: 'https://www.tilburg.nl/privacystatement/',
  EXTERNAL_COOKIES_URL: 'https://www.tilburg.nl/cookies/',
  EXTERNAL_PROCLAIMER_URL: 'https://www.tilburg.nl/proclaimer/',
  HERO_IMAGE_URL: '/home-hero-background.png',
  MENU_POSITION: 2,
  FOOTER_STYLE: 'vng',
});

// Helper functions to replace hostname-based logic
export const getTitle = () => CONTAINER_CONFIG.SITE_TITLE;
export const getSiteDescription = () => CONTAINER_CONFIG.SITE_DESCRIPTION;
export const getSite = () => CONTAINER_CONFIG.SITE;
export const getMode = () => CONTAINER_CONFIG.MODE;
export const getThemeVariant = () => CONTAINER_CONFIG.THEME_VARIANT;
export const getEnvironmentName = () => CONTAINER_CONFIG.ENVIRONMENT_NAME;

export const getApiUrl = () => CONTAINER_CONFIG.API_URL;
export const getCommongroundApiUrl = () => CONTAINER_CONFIG.API_URL_COMMONGROUND;
export const getCommongroundToken = () => CONTAINER_CONFIG.API_URL_COMMONGROUND_TOKEN;
export const getCommongroundOrganizationOin = () => CONTAINER_CONFIG.API_URL_COMMONGROUND_ORGANIZATION_OIN;
export const getGemmaEndpoint = () => CONTAINER_CONFIG.GEMMA_ENDPOINT;

export const getAuthConfig = () => ({
  grantType: CONTAINER_CONFIG.GRANT_TYPE,
  clientId: CONTAINER_CONFIG.CLIENT_ID,
  clientSecret: CONTAINER_CONFIG.CLIENT_SECRET,
  provider: CONTAINER_CONFIG.PROVIDER,
  registerUrl: CONTAINER_CONFIG.REGISTER_URL,
});

export const getSessionConfig = () => ({
  autoLogout: CONTAINER_CONFIG.AUTO_LOGOUT,
  autoLogoutTime: CONTAINER_CONFIG.AUTO_LOGOUT_TIME,
});

export const getRollbarConfig = () => ({
  accessToken: CONTAINER_CONFIG.ROLLBAR_KEY,
  environment: CONTAINER_CONFIG.ROLLBAR_ENVIRONMENT,
  enabled: CONTAINER_CONFIG.ENABLE_ROLLBAR,
});

export const getExternalUrls = () => ({
  website: CONTAINER_CONFIG.EXTERNAL_WEBSITE_URL,
  privacy: CONTAINER_CONFIG.EXTERNAL_PRIVACY_URL,
  cookies: CONTAINER_CONFIG.EXTERNAL_COOKIES_URL,
  proclaimer: CONTAINER_CONFIG.EXTERNAL_PROCLAIMER_URL,
});

export const getHeroImageUrl = () => CONTAINER_CONFIG.HERO_IMAGE_URL;

export const getMenuPosition = () => CONTAINER_CONFIG.MENU_POSITION;

export const getFooterStyle = () => CONTAINER_CONFIG.FOOTER_STYLE;

export const isFeatureEnabled = (feature) => {
  switch (feature) {
    case 'authentication':
      return CONTAINER_CONFIG.ENABLE_AUTHENTICATION;
    case 'gemma':
      return CONTAINER_CONFIG.ENABLE_GEMMA;
    case 'directory':
      return CONTAINER_CONFIG.ENABLE_DIRECTORY;
    case 'rollbar':
      return CONTAINER_CONFIG.ENABLE_ROLLBAR;
    case 'mock_themes':
      return CONTAINER_CONFIG.ENABLE_MOCK_THEMES;
    default:
      return false;
  }
};

// Export individual values for easier migration
export const {
  SITE_TITLE,
  SITE_DESCRIPTION,
  SITE,
  MODE,
  THEME_VARIANT,
  ENVIRONMENT_NAME,
  API_URL,
  API_URL_COMMONGROUND,
  API_URL_COMMONGROUND_TOKEN,
  API_URL_COMMONGROUND_ORGANIZATION_OIN,
  GEMMA_ENDPOINT,
  GRANT_TYPE,
  CLIENT_ID,
  CLIENT_SECRET,
  PROVIDER,
  REGISTER_URL,
  AUTO_LOGOUT,
  AUTO_LOGOUT_TIME,
  ROLLBAR_KEY,
  ROLLBAR_ENVIRONMENT,
  ENABLE_AUTHENTICATION,
  ENABLE_GEMMA,
  ENABLE_DIRECTORY,
  ENABLE_ROLLBAR,
  ENABLE_MOCK_THEMES,
  EXTERNAL_WEBSITE_URL,
  EXTERNAL_PRIVACY_URL,
  EXTERNAL_COOKIES_URL,
  EXTERNAL_PROCLAIMER_URL,
  HERO_IMAGE_URL,
  MENU_POSITION,
  FOOTER_STYLE,
} = CONTAINER_CONFIG;

// Backwards compatibility
export const getApiConfig = getApiUrl;
export const getCommonGroundApiUrl = getCommongroundApiUrl;

export default CONTAINER_CONFIG;

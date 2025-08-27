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
  THEME_VARIANT: 'vng',
  ENVIRONMENT_NAME: 'development',
  BASE_URL: '/api/apps',
  GRANT_TYPE: 'authorization_code',
  CLIENT_ID: 'rD07DgrUtKEarxbjItvwPunBdtP97eG9O2F2PN2XMaBmAQJB6FCuei49lyk11KXa',
  CLIENT_SECRET: 'tAXx8PbYNklTZF0TwCDcJ1ug67L5b0inUmLstrdyX6T5KGWIbzbsPcLFmzJeuTEC',
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
  HERO_IMAGE_URL: '/home-hero-background.png',
  FOOTER_STYLE: 'vng',
  FOOTER_LOGO_TITLE: 'VNG Softwarectalogus',
  FOOTER_LOGO_SUBTITLE: 'Één plek voor alle software voor en door Gemeenten',
  SUPPORT_EMAIL_ADDRESS: 'info@conduction.nl',
});
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
  menuPosition: CONTAINER_CONFIG.MENU_POSITION,
  footerStyle: CONTAINER_CONFIG.FOOTER_STYLE,
});
// Footer text helper functions
export const getFooterLogoTitle = () => CONTAINER_CONFIG.FOOTER_LOGO_TITLE;
export const getFooterLogoSubtitle = () => CONTAINER_CONFIG.FOOTER_LOGO_SUBTITLE;
export const getSupportEmailAddress = () => CONTAINER_CONFIG.SUPPORT_EMAIL_ADDRESS;
export const getDefaultConfig = () => CONTAINER_CONFIG;

#!/usr/bin/env node
/**
 * Container Constants Generator
 * 
 * This script generates container.constants.js from environment variables
 * to replace hostname-based configuration logic with environment-based configuration.
 */
const fs = require('fs');
const path = require('path');
// Get all environment variables with defaults
const getEnvConfig = () => {
  return {
    // Site Configuration
    SITE_TITLE: process.env.SITE_TITLE || 'Development Catalogus',
    SITE_DESCRIPTION: process.env.SITE_DESCRIPTION || 'Local development instance of the software catalogus',
    SITE: process.env.SITE || 'localhost',
    MODE: process.env.MODE || 'development',
    THEME_VARIANT: process.env.THEME_VARIANT || 'development',
    ENVIRONMENT_NAME: process.env.ENVIRONMENT_NAME || 'development',
    // API Configuration (simplified to single BASE_URL)
    BASE_URL: process.env.BASE_URL || '/api/apps',

    // Authentication Configuration
    GRANT_TYPE: process.env.GRANT_TYPE || 'authorization_code',
    CLIENT_ID: process.env.CLIENT_ID || '',
    CLIENT_SECRET: process.env.CLIENT_SECRET || '',
    PROVIDER: process.env.PROVIDER || 'nextcloud',
    REGISTER_URL: process.env.REGISTER_URL || '',
    // Session Configuration
    AUTO_LOGOUT: process.env.AUTO_LOGOUT === 'true' || false,
    AUTO_LOGOUT_TIME: parseInt(process.env.AUTO_LOGOUT_TIME) || 3600,
    SESSION_TIMEOUT: parseInt(process.env.SESSION_TIMEOUT) || 3600,
    ACTIVITY_PING: process.env.ACTIVITY_PING === 'true' || false,
    // Monitoring Configuration
    ROLLBAR_KEY: process.env.ROLLBAR_KEY || '',
    ROLLBAR_ENVIRONMENT: process.env.ROLLBAR_ENVIRONMENT || 'development',
    // Feature Flags
    ENABLE_AUTHENTICATION: process.env.ENABLE_AUTHENTICATION === 'true' || false,
    ENABLE_GEMMA: process.env.ENABLE_GEMMA !== 'false', // Default true
    ENABLE_DIRECTORY: process.env.ENABLE_DIRECTORY !== 'false', // Default true
    ENABLE_ROLLBAR: process.env.ENABLE_ROLLBAR === 'true' || false,
    ENABLE_MOCK_THEMES: process.env.ENABLE_MOCK_THEMES === 'true' || false,
    ENABLE_BREADCRUMBS: process.env.ENABLE_BREADCRUMBS === 'true' || false,
    // External URLs (for different environments)
    EXTERNAL_WEBSITE_URL: process.env.EXTERNAL_WEBSITE_URL || 'https://www.tilburg.nl/',
    EXTERNAL_PRIVACY_URL: process.env.EXTERNAL_PRIVACY_URL || 'https://www.tilburg.nl/privacystatement/',
    EXTERNAL_COOKIES_URL: process.env.EXTERNAL_COOKIES_URL || 'https://www.tilburg.nl/cookies/',
    EXTERNAL_PROCLAIMER_URL: process.env.EXTERNAL_PROCLAIMER_URL || 'https://www.tilburg.nl/proclaimer/',
    // Visual Configuration
    HERO_IMAGE_URL: process.env.HERO_IMAGE_URL || '/home-hero-background.png',
    // Menu Configuration
    FOOTER_STYLE: process.env.FOOTER_STYLE || 'vng', // vng, dimpact, etc.
    // Footer Text Configuration
    FOOTER_LOGO_TITLE: process.env.FOOTER_LOGO_TITLE || 'Open Tilburg',
    FOOTER_LOGO_SUBTITLE: process.env.FOOTER_LOGO_SUBTITLE || 'Één plek voor alle publicaties van Gemeente Tilburg',
  };
};
// Generate the constants file content
const generateConstantsFile = (config) => {
  const configEntries = Object.entries(config)
    .map(([key, value]) => {
      if (typeof value === 'string') {
        return `  ${key}: '${value}',`;
      } else if (typeof value === 'number') {
        return `  ${key}: ${value},`;
      } else if (typeof value === 'boolean') {
        return `  ${key}: ${value},`;
      } else {
        return `  ${key}: '${String(value)}',`;
      }
    })
    .join('\n');
  return `// Auto-generated container constants
// This file is generated from environment variables during container startup
// DO NOT EDIT MANUALLY - changes will be overwritten
import { AcLockObject } from '@utils/ac-lock-object';
// Container configuration
export const CONTAINER_CONFIG = AcLockObject({
${configEntries}
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
export const getDefaultConfig = () => CONTAINER_CONFIG;
`;
};
// Main execution
const main = () => {
  try {
    const config = getEnvConfig();
    const fileContent = generateConstantsFile(config);
    // Ensure the constants directory exists
    const constantsDir = path.join(__dirname, '..', 'src', 'constants');
    if (!fs.existsSync(constantsDir)) {
      fs.mkdirSync(constantsDir, { recursive: true });
    }
    // Write the file
    const outputPath = path.join(constantsDir, 'container.constants.js');
    fs.writeFileSync(outputPath, fileContent, 'utf8');
    // Success feedback with configuration summary
    console.log('✅ Container constants generated successfully!');
    console.log(`📁 Output: ${outputPath}`);
    console.log(`🏷️  Site Title: ${config.SITE_TITLE}`);
    console.log(`�� Base URL: ${config.BASE_URL}`);
    console.log(`🎨 Theme: ${config.THEME_VARIANT}`);
    console.log(`📦 Environment: ${config.ENVIRONMENT_NAME}`);
    console.log(`🔐 Authentication: ${config.ENABLE_AUTHENTICATION ? 'Enabled' : 'Disabled'}`);
    console.log(`📊 GEMMA: ${config.ENABLE_GEMMA ? 'Enabled' : 'Disabled'}`);
    console.log(`📋 Directory: ${config.ENABLE_DIRECTORY ? 'Enabled' : 'Disabled'}`);
  } catch (error) {
    console.error('❌ Error generating container constants:', error.message);
    process.exit(1);
  }
};
if (require.main === module) {
  main();
}
module.exports = { getEnvConfig, generateConstantsFile }; 

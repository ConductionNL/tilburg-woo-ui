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

    // API Configuration
    API_URL: process.env.API_URL || 'https://vng.test.commonground.nu/apps',
    API_URL_COMMONGROUND: process.env.API_URL_COMMONGROUND || 'https://vng.test.commonground.nu/apps',
    API_URL_COMMONGROUND_TOKEN: process.env.API_URL_COMMONGROUND_TOKEN || '',
    API_URL_COMMONGROUND_ORGANIZATION_OIN: process.env.API_URL_COMMONGROUND_ORGANIZATION_OIN || '',
    GEMMA_ENDPOINT: process.env.GEMMA_ENDPOINT || 'https://vng.test.commonground.nu',
    OPENCONNECTOR_API_URL: process.env.OPENCONNECTOR_API_URL || 'https://vng.test.commonground.nu/apps/openconnector/api',

    // Authentication Configuration
    GRANT_TYPE: process.env.GRANT_TYPE || 'authorization_code',
    CLIENT_ID: process.env.CLIENT_ID || '',
    CLIENT_SECRET: process.env.CLIENT_SECRET || '',
    PROVIDER: process.env.PROVIDER || 'nextcloud',
    REGISTER_URL: process.env.REGISTER_URL || '',

    // Session Configuration
    AUTO_LOGOUT: process.env.AUTO_LOGOUT === 'true' || false,
    AUTO_LOGOUT_TIME: parseInt(process.env.AUTO_LOGOUT_TIME) || 3600,

    // Monitoring Configuration
    ROLLBAR_KEY: process.env.ROLLBAR_KEY || '',
    ROLLBAR_ENVIRONMENT: process.env.ROLLBAR_ENVIRONMENT || 'development',

    // Feature Flags
    ENABLE_AUTHENTICATION: process.env.ENABLE_AUTHENTICATION === 'true' || false,
    ENABLE_GEMMA: process.env.ENABLE_GEMMA !== 'false', // Default true
    ENABLE_DIRECTORY: process.env.ENABLE_DIRECTORY !== 'false', // Default true
    ENABLE_ROLLBAR: process.env.ENABLE_ROLLBAR === 'true' || false,
    ENABLE_MOCK_THEMES: process.env.ENABLE_MOCK_THEMES === 'true' || false,

    // External URLs (for different environments)
    EXTERNAL_WEBSITE_URL: process.env.EXTERNAL_WEBSITE_URL || 'https://www.tilburg.nl/',
    EXTERNAL_PRIVACY_URL: process.env.EXTERNAL_PRIVACY_URL || 'https://www.tilburg.nl/privacystatement/',
    EXTERNAL_COOKIES_URL: process.env.EXTERNAL_COOKIES_URL || 'https://www.tilburg.nl/cookies/',
    EXTERNAL_PROCLAIMER_URL: process.env.EXTERNAL_PROCLAIMER_URL || 'https://www.tilburg.nl/proclaimer/',
    
    // Visual Configuration
    HERO_IMAGE_URL: process.env.HERO_IMAGE_URL || '/home-hero-background.png',
    
    // Menu Configuration
    MENU_POSITION: parseInt(process.env.MENU_POSITION) || 2,
    FOOTER_STYLE: process.env.FOOTER_STYLE || 'vng', // vng, dimpact, etc.
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

export const getApiUrl = () => CONTAINER_CONFIG.API_URL;
export const getCommongroundApiUrl = () => CONTAINER_CONFIG.API_URL_COMMONGROUND;
export const getCommongroundToken = () => CONTAINER_CONFIG.API_URL_COMMONGROUND_TOKEN;
export const getCommongroundOrganizationOin = () => CONTAINER_CONFIG.API_URL_COMMONGROUND_ORGANIZATION_OIN;
export const getGemmaEndpoint = () => CONTAINER_CONFIG.GEMMA_ENDPOINT;
export const getOpenconnectorApiUrl = () => CONTAINER_CONFIG.OPENCONNECTOR_API_URL;

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
  OPENCONNECTOR_API_URL,
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
    console.log(`🌐 API URL: ${config.API_URL}`);
    console.log(`🔗 CommonGround API: ${config.API_URL_COMMONGROUND}`);
    console.log(`⚙️  GEMMA Endpoint: ${config.GEMMA_ENDPOINT}`);
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
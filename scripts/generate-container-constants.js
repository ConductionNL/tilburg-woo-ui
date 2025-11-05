#!/usr/bin/env node
/**
 * Container Constants Generator
 *
 * This script generates container.constants.js from values.yaml and environment variables.
 * Priority order:
 * 1. values.yaml (env and extraEnvVars sections)
 * 2. Environment variables
 * 3. Default values
 */
const fs = require('fs');
const path = require('path');

/**
 * Simple YAML parser for our specific use case
 * Parses key: value pairs and handles nested objects like env: and extraEnvVars:
 */
const parseYaml = (content) => {
  const lines = content.split('\n');
  const result = {};
  let currentSection = null;
  let sectionIndent = 0;
  let inEnvSection = false;
  let inExtraEnvVarsSection = false;

  let inObjectBraces = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) continue;

    // Detect indentation
    const indent = line.search(/\S/);

    // Check for section headers (env: or extraEnvVars:)
    if (trimmed === 'env:') {
      inEnvSection = true;
      inExtraEnvVarsSection = false;
      inObjectBraces = false;
      sectionIndent = indent;
      continue;
    } else if (trimmed === 'extraEnvVars:' || trimmed.startsWith('extraEnvVars:')) {
      inExtraEnvVarsSection = true;
      inEnvSection = false;
      sectionIndent = indent;

      // Check if it starts with an opening brace (inline or multiline object)
      if (trimmed.includes('{')) {
        inObjectBraces = true;
      }
      continue;
    }

    // Handle opening brace on its own line
    if (inExtraEnvVarsSection && trimmed === '{') {
      inObjectBraces = true;
      continue;
    }

    // Handle closing brace
    if (inObjectBraces && (trimmed === '}' || trimmed.endsWith('}'))) {
      inObjectBraces = false;
      inExtraEnvVarsSection = false;
      continue;
    }

    // Reset section if we've outdented (and not in braces)
    if (
      !inObjectBraces &&
      indent <= sectionIndent &&
      (inEnvSection || inExtraEnvVarsSection)
    ) {
      inEnvSection = false;
      inExtraEnvVarsSection = false;
    }

    // Skip comments unless they're inline
    if (trimmed.startsWith('#')) continue;

    // Check if this is a key-value pair
    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)\s*:\s*(.*)$/);
    if (match && (inEnvSection || inExtraEnvVarsSection)) {
      const [, key, value] = match;

      // Parse the value and remove inline comments
      let parsedValue = value.trim();

      // Remove trailing comma (from object syntax)
      if (parsedValue.endsWith(',')) {
        parsedValue = parsedValue.slice(0, -1).trim();
      }

      // Remove inline comments (anything after # that's not in quotes)
      const commentMatch = parsedValue.match(/^([^#]*?)(\s*#.*)?$/);
      if (commentMatch) {
        parsedValue = commentMatch[1].trim();
      }

      // Remove quotes if present
      if (
        (parsedValue.startsWith('"') && parsedValue.endsWith('"')) ||
        (parsedValue.startsWith("'") && parsedValue.endsWith("'"))
      ) {
        parsedValue = parsedValue.slice(1, -1);
      }

      // Handle empty values
      if (parsedValue === '""' || parsedValue === "''") {
        parsedValue = '';
      }

      // Store the value
      result[key] = parsedValue;
    }
  }

  return result;
};

/**
 * Load configuration from values.yaml (local development only)
 * In production/container, this file won't exist and we rely on environment variables
 */
const loadValuesYaml = () => {
  try {
    const valuesPath = path.join(
      __dirname,
      '..',
      'helm',
      'tilburg-woo-ui',
      'values.yaml'
    );

    if (!fs.existsSync(valuesPath)) {
      // This is normal in container environments - values come from env vars
      console.log(
        '📦 Running in container mode (no values.yaml) - using environment variables'
      );
      return {};
    }

    const content = fs.readFileSync(valuesPath, 'utf8');
    const parsed = parseYaml(content);

    const count = Object.keys(parsed).length;
    if (count > 0) {
      console.log(
        `📄 Local development mode - loaded ${count} variable(s) from values.yaml`
      );
    }
    return parsed;
  } catch (error) {
    console.warn('⚠️  Error reading values.yaml:', error.message);
    return {};
  }
};
/**
 * Get configuration value with priority:
 * 1. values.yaml
 * 2. Environment variable
 * 3. Default value
 */
const getConfigValue = (yamlConfig, key, defaultValue) => {
  // First check values.yaml
  if (yamlConfig[key] !== undefined && yamlConfig[key] !== '') {
    return yamlConfig[key];
  }

  // Then check environment variable
  if (process.env[key] !== undefined && process.env[key] !== '') {
    return process.env[key];
  }

  // Finally use default
  return defaultValue;
};

/**
 * Get boolean configuration value with priority
 */
const getBooleanConfig = (yamlConfig, key, defaultValue) => {
  const value = getConfigValue(yamlConfig, key, null);

  if (value === null) return defaultValue;
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;

  return defaultValue;
};

/**
 * Get integer configuration value with priority
 */
const getIntegerConfig = (yamlConfig, key, defaultValue) => {
  const value = getConfigValue(yamlConfig, key, null);

  if (value === null) return defaultValue;

  const parsed = parseInt(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Get all configuration with values.yaml taking priority
const getEnvConfig = () => {
  // Load values from values.yaml
  const yamlConfig = loadValuesYaml();

  const baseConfig = {
    // Site Configuration
    SITE_TITLE: getConfigValue(yamlConfig, 'SITE_TITLE', 'Development Catalogus'),
    SITE_DESCRIPTION: getConfigValue(
      yamlConfig,
      'SITE_DESCRIPTION',
      'Local development instance of the softwarecatalogus'
    ),
    SITE: getConfigValue(yamlConfig, 'SITE', 'localhost'),
    MODE: getConfigValue(yamlConfig, 'MODE', 'development'),
    THEME_VARIANT: getConfigValue(yamlConfig, 'THEME_VARIANT', 'development'),
    FAVICON_URL: getConfigValue(yamlConfig, 'FAVICON_URL', '/favicon.svg'),
    ENVIRONMENT_NAME: getConfigValue(yamlConfig, 'ENVIRONMENT_NAME', 'development'),

    // API Configuration (simplified to single BASE_URL)
    BASE_URL: getConfigValue(yamlConfig, 'BASE_URL', '/api/apps'),

    // Authentication Configuration
    GRANT_TYPE: getConfigValue(yamlConfig, 'GRANT_TYPE', 'authorization_code'),
    CLIENT_ID: getConfigValue(yamlConfig, 'CLIENT_ID', ''),
    CLIENT_SECRET: getConfigValue(yamlConfig, 'CLIENT_SECRET', ''),
    PROVIDER: getConfigValue(yamlConfig, 'PROVIDER', 'nextcloud'),
    REGISTER_URL: getConfigValue(yamlConfig, 'REGISTER_URL', ''),

    // Session Configuration
    AUTO_LOGOUT: getBooleanConfig(yamlConfig, 'AUTO_LOGOUT', false),
    AUTO_LOGOUT_TIME: getIntegerConfig(yamlConfig, 'AUTO_LOGOUT_TIME', 3600),
    SESSION_TIMEOUT: getIntegerConfig(yamlConfig, 'SESSION_TIMEOUT', 3600),
    ACTIVITY_PING: getBooleanConfig(yamlConfig, 'ACTIVITY_PING', false),

    // Monitoring Configuration
    ROLLBAR_KEY: getConfigValue(yamlConfig, 'ROLLBAR_KEY', ''),
    ROLLBAR_ENVIRONMENT: getConfigValue(
      yamlConfig,
      'ROLLBAR_ENVIRONMENT',
      'development'
    ),

    // Feature Flags
    ENABLE_AUTHENTICATION: getBooleanConfig(
      yamlConfig,
      'ENABLE_AUTHENTICATION',
      false
    ),
    ENABLE_GEMMA: getBooleanConfig(yamlConfig, 'ENABLE_GEMMA', true),
    ENABLE_DIRECTORY: getBooleanConfig(yamlConfig, 'ENABLE_DIRECTORY', true),
    ENABLE_ROLLBAR: getBooleanConfig(yamlConfig, 'ENABLE_ROLLBAR', false),
    ENABLE_MOCK_THEMES: getBooleanConfig(yamlConfig, 'ENABLE_MOCK_THEMES', false),
    ENABLE_BREADCRUMBS: getBooleanConfig(yamlConfig, 'ENABLE_BREADCRUMBS', false),

    // External URLs (for different environments)
    EXTERNAL_WEBSITE_URL: getConfigValue(
      yamlConfig,
      'EXTERNAL_WEBSITE_URL',
      'https://www.tilburg.nl/'
    ),
    EXTERNAL_PRIVACY_URL: getConfigValue(
      yamlConfig,
      'EXTERNAL_PRIVACY_URL',
      'https://www.tilburg.nl/privacystatement/'
    ),
    EXTERNAL_COOKIES_URL: getConfigValue(
      yamlConfig,
      'EXTERNAL_COOKIES_URL',
      'https://www.tilburg.nl/cookies/'
    ),
    EXTERNAL_PROCLAIMER_URL: getConfigValue(
      yamlConfig,
      'EXTERNAL_PROCLAIMER_URL',
      'https://www.tilburg.nl/proclaimer/'
    ),

    // Visual Configuration
    HERO_IMAGE_URL: getConfigValue(yamlConfig, 'HERO_IMAGE_URL', null),

    // Menu Configuration
    FOOTER_STYLE: getConfigValue(yamlConfig, 'FOOTER_STYLE', 'vng'),

    // Footer Text Configuration
    FOOTER_LOGO_TITLE: getConfigValue(
      yamlConfig,
      'FOOTER_LOGO_TITLE',
      'Open Tilburg'
    ),
    FOOTER_LOGO_SUBTITLE: getConfigValue(
      yamlConfig,
      'FOOTER_LOGO_SUBTITLE',
      'Één plek voor alle publicaties van Gemeente Tilburg'
    ),

    // Support Configuration
    SUPPORT_EMAIL_ADDRESS: getConfigValue(
      yamlConfig,
      'SUPPORT_EMAIL_ADDRESS',
      'info@conduction.nl'
    ),

    // Search Configuration
    DEFAULT_SEARCH_SCHEMA: getConfigValue(yamlConfig, 'DEFAULT_SEARCH_SCHEMA', ''),
  };

  // Add any extra variables from values.yaml that aren't in the base config
  // This allows extraEnvVars to be dynamically added
  const extraVars = {};
  for (const key in yamlConfig) {
    if (!baseConfig.hasOwnProperty(key)) {
      extraVars[key] = yamlConfig[key];
    }
  }

  // Merge base config with extra variables
  return { ...baseConfig, ...extraVars };
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
// This file is generated from values.yaml and environment variables during container startup
// Priority: 1. values.yaml (env/extraEnvVars) -> 2. Environment variables -> 3. Defaults
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
    console.log('\n✅ Container constants generated successfully!');
    console.log(`📁 Output: ${outputPath}`);
    console.log('\n📋 Configuration Summary:');
    console.log(`   🏷️  Site Title: ${config.SITE_TITLE}`);
    console.log(`   🌐 Base URL: ${config.BASE_URL}`);
    console.log(`   🎨 Theme: ${config.THEME_VARIANT}`);
    console.log(`   📦 Environment: ${config.ENVIRONMENT_NAME}`);
    console.log(
      `   🔐 Authentication: ${
        config.ENABLE_AUTHENTICATION ? 'Enabled' : 'Disabled'
      }`
    );
    console.log(`   📊 GEMMA: ${config.ENABLE_GEMMA ? 'Enabled' : 'Disabled'}`);
    console.log(
      `   📋 Directory: ${config.ENABLE_DIRECTORY ? 'Enabled' : 'Disabled'}`
    );
    console.log(
      `   🔍 Search Schema: ${config.DEFAULT_SEARCH_SCHEMA || '(not set)'}`
    );
    console.log('\n💡 Priority: values.yaml → environment variables → defaults');
  } catch (error) {
    console.error('❌ Error generating container constants:', error.message);
    process.exit(1);
  }
};
if (require.main === module) {
  main();
}
module.exports = { getEnvConfig, generateConstantsFile };

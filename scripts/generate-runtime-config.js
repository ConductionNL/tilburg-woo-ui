#!/usr/bin/env node
/**
 * Runtime Configuration Generator
 *
 * This script generates a runtime-config.js file that is NOT bundled by webpack.
 * It creates a window.RUNTIME_CONFIG object that can be accessed by the application.
 *
 * This file is generated at container startup and placed in the public_html directory
 * so it can be loaded directly by the browser BEFORE the React bundle loads.
 *
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
 * Load configuration from values.yaml
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
      console.log('⚠️  values.yaml not found, skipping');
      return {};
    }

    const content = fs.readFileSync(valuesPath, 'utf8');
    const parsed = parseYaml(content);

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
 *
 * Returns an object with { value, source } to track where the value came from
 */
const getConfigValue = (yamlConfig, key, defaultValue) => {
  // First check values.yaml
  if (yamlConfig[key] !== undefined && yamlConfig[key] !== '') {
    return { value: yamlConfig[key], source: 'values.yaml' };
  }

  // Then check environment variable
  if (process.env[key] !== undefined && process.env[key] !== '') {
    return { value: process.env[key], source: 'environment' };
  }

  // Finally use default
  return { value: defaultValue, source: 'default' };
};

/**
 * Get boolean configuration value with priority
 */
const getBooleanConfig = (yamlConfig, key, defaultValue) => {
  const result = getConfigValue(yamlConfig, key, null);
  const value = result.value;

  if (value === null) return { value: defaultValue, source: 'default' };
  if (typeof value === 'boolean') return result;
  if (value === 'true') return { value: true, source: result.source };
  if (value === 'false') return { value: false, source: result.source };

  return { value: defaultValue, source: 'default' };
};

/**
 * Get integer configuration value with priority
 */
const getIntegerConfig = (yamlConfig, key, defaultValue) => {
  const result = getConfigValue(yamlConfig, key, null);
  const value = result.value;

  if (value === null) return { value: defaultValue, source: 'default' };

  const parsed = parseInt(value);
  return isNaN(parsed)
    ? { value: defaultValue, source: 'default' }
    : { value: parsed, source: result.source };
};

/**
 * Get runtime configuration
 */
const getRuntimeConfig = () => {
  // Load values from values.yaml
  const yamlConfig = loadValuesYaml();

  console.info({ runtimeConfig: yamlConfig });

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
    FAVICON_URL: getConfigValue(yamlConfig, 'FAVICON_URL', null),

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
      extraVars[key] = { value: yamlConfig[key], source: 'values.yaml' };
    }
  }

  // Merge base config with extra variables
  const fullConfig = { ...baseConfig, ...extraVars };

  // Separate values from metadata for the final config
  const config = {};
  const sources = {};

  for (const key in fullConfig) {
    const item = fullConfig[key];
    config[key] = item.value;
    sources[key] = item.source;
  }

  return { config, sources };
};

/**
 * Generate the runtime config file content
 */
const generateRuntimeConfigFile = (config) => {
  // Convert config to JSON with proper formatting
  const configJson = JSON.stringify(config, null, 2);

  return `// Auto-generated runtime configuration
// This file is generated at container startup and loaded BEFORE the React bundle
// It provides runtime environment configuration that is NOT bundled by webpack
// Priority: 1. values.yaml (env/extraEnvVars) -> 2. Environment variables -> 3. Defaults
// DO NOT EDIT MANUALLY - changes will be overwritten

// Make configuration available globally
window.RUNTIME_CONFIG = ${configJson};
`;
};

/**
 * Main execution
 */
const main = () => {
  try {
    // Get output path from command line argument or use default
    const outputPath =
      process.argv[2] ||
      path.join(__dirname, '..', 'public_html', 'runtime-config.js');

    // Ensure the output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Get runtime configuration
    const { config, sources } = getRuntimeConfig();

    // Generate the file content
    const fileContent = generateRuntimeConfigFile(config);

    // Write the file
    fs.writeFileSync(outputPath, fileContent, 'utf8');

    // Success feedback with full configuration display
    console.info('\n✅ Runtime configuration generated successfully!');
    console.info(`📁 Output: ${outputPath}`);

    // Group configuration by source
    const bySource = {
      'values.yaml': [],
      environment: [],
      default: [],
    };

    Object.keys(config)
      .sort()
      .forEach((key) => {
        const value = config[key];
        const source = sources[key];
        const displayValue =
          typeof value === 'string' && value.length > 100
            ? value.substring(0, 100) + '...'
            : value;
        bySource[source].push({ key, value: displayValue });
      });

    // Display values from values.yaml
    if (bySource['values.yaml'].length > 0) {
      console.info('\n📋 Configuration from values.yaml:');
      bySource['values.yaml'].forEach(({ key, value }) => {
        console.info(`   ${key}: ${value}`);
      });
    }

    // Display values from environment variables
    if (bySource['environment'].length > 0) {
      console.info('\n🌍 Configuration from environment variables:');
      bySource['environment'].forEach(({ key, value }) => {
        console.info(`   ${key}: ${value}`);
      });
    }

    // Display default values (optional, can be commented out if too verbose)
    if (bySource['default'].length > 0) {
      console.info(`\n⚙️  Using ${bySource['default'].length} default value(s)`);
    }

    console.info('\n💡 This file will be loaded by the browser at runtime');
    console.info('💡 Priority: values.yaml → environment variables → defaults\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error generating runtime configuration:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { getRuntimeConfig, generateRuntimeConfigFile };

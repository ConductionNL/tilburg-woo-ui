// Try to import container constants (generated at runtime)
let containerConfig;
try {
  containerConfig = require('@constants/container.constants');
} catch (error) {
  console.warn(
    'Container constants not available, falling back to hostname-based logic'
  );
  containerConfig = null;
}

export const BASE_URL = (() => {
  // Always use container config - no hardcoded fallbacks in main codebase
  if (!containerConfig || !containerConfig.getApiUrl) {
    throw new Error('API URL not configured. Please check your environment setup.');
  }

  // Return /api/apps so that code can use BASE_URL + "/opencatalogi/..." or BASE_URL + "/openregister/..."
  // Nginx handles /api/apps/ -> /index.php/apps/ mapping
  return containerConfig.getApiUrl();
})();

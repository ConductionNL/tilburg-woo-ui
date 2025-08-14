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

export const getBaseUrl = () => {
  // Always use container config - no hardcoded fallbacks in main codebase
  if (!containerConfig || !containerConfig.getApiUrl) {
    console.warn('Container constants not available, falling back to default API URL');
    return '/api/apps'; // Fallback to default
  }

  // Return /api/apps so that code can use getBaseUrl() + "/opencatalogi/..." or "/openregister/..."
  // Nginx handles /api/apps/ -> /index.php/apps/ mapping
  return containerConfig.getApiUrl();
};

// For backward compatibility, export as BASE_URL but as a getter
export const BASE_URL = getBaseUrl();

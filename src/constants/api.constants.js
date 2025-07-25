// Consolidated API configuration
// All API calls go through our nginx proxy at /api

// Try to import container constants (generated at runtime)
let containerConfig;
try {
  containerConfig = require('@constants/container.constants');
} catch (error) {
  console.warn('Container constants not available in API constants');
  containerConfig = null;
}

// Base API URL - always goes through nginx proxy
export const API_BASE = (() => {
  if (containerConfig && containerConfig.getGemmaEndpoint) {
    return containerConfig.getGemmaEndpoint(); // '/api'
  }
  return '/api'; // Fallback to nginx proxy
})();

// OpenConnector API endpoints
export const OPENCONNECTOR_API = {
  BASE: `${API_BASE}/openconnector`,
  
  // Authentication endpoints
  AUTH: {
    LOGIN: '/user/login',
    ME: '/user/me',
    LOGOUT: '/user/logout'
  },
  
  // Admin/Beheer endpoints  
  ENDPOINT: {
    MODELS: '/api/endpoint/models',
    SYNCHRONIZE_MODEL: '/api/endpoint/synchronize-model',
    CONNECT_VIEWS: (modelId) => `/api/endpoint/connect-views/${modelId}`,
    MODEL_DETAILS: (modelId) => `/api/endpoint/model/${modelId}`,
  },
  
  // Synchronization endpoints
  SYNC: {
    RUN: (id) => `/api/synchronizations-run/${id}`
  }
};

// Nextcloud general API endpoints (non-OpenConnector)
export const NEXTCLOUD_API = {
  BASE: `${API_BASE}`,
  
  // Status endpoints
  STATUS: '/status.php',
  
  // App-specific endpoints that need /index.php/apps prefix
  APPS: {
    OPENREGISTER: '/index.php/apps/openregister/api',
    OPENCATALOGI: '/index.php/apps/opencatalogi/api',
    OAUTH2: '/index.php/apps/oauth2'
  }
};

// Helper functions to build full URLs
export const buildOpenConnectorUrl = (endpoint) => {
  return `${OPENCONNECTOR_API.BASE}${endpoint}`;
};

export const buildNextcloudUrl = (endpoint) => {
  return `${NEXTCLOUD_API.BASE}${endpoint}`;
}; 
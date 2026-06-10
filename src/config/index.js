// Imports => Utilities
import { AcGetAccessToken, AcLockObject } from '@utils';

// Helper function to get basic auth credentials from user store
const getBasicAuthCredentials = () => {
  try {
    // Access the user store through the global app object
    if (
      window.app &&
      window.app.store &&
      window.app.store.user &&
      window.app.store.user.basicAuthCredentials
    ) {
      return window.app.store.user.basicAuthCredentials;
    }
  } catch (error) {
    // Silently fail if store is not available
  }
  return null;
};

// Get ENV variables

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

const apiUrl = () => {
  // Always use container config - no hardcoded fallbacks in main codebase
  if (!containerConfig || !containerConfig.getApiUrl) {
    console.warn(
      'Container constants not available, falling back to default API URL'
    );
    return '/api/apps'; // Fallback to default
  }

  return containerConfig.getApiUrl();
};

export const commongroundApiUrl = () => {
  // Always use container config - no hardcoded fallbacks in main codebase
  if (!containerConfig || !containerConfig.getCommongroundApiUrl) {
    console.warn(
      'Container constants not available, falling back to default CommonGround API URL'
    );
    return '/api/apps'; // Fallback to default
  }

  return containerConfig.getCommongroundApiUrl();
};

const _api_commonground_headers_ = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

// const _site_ = process.env.SITE;
const _mode_ = process.env.MODE;
// const _provider_ = process.env.PROVIDER;

const _auto_logout = process.env.AUTO_LOGOUT;
const _auto_logout_time = process.env.AUTO_LOGOUT_TIME;

// const _register_uri_ = process.env.REGISTER_URL;

export default {
  mode: _mode_,
  autologout: {
    active: !!_auto_logout,
    time: +_auto_logout_time || 0,
  },
  rollbar: AcLockObject({
    accessToken: process.env.ROLLBAR_KEY,
    captureUncaught: true,
    captureUnhandledRejections: true,
    verbose: false,
    environment: process.env.ROLLBAR_ENVIRONMENT,
  }),
  api: {
    get baseURL() {
      return apiUrl();
    },
    timeout: 1000 * 60,
    maxContentLength: 10000,
    responseType: 'json',
    responseEncoding: 'utf8',
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    transformRequest: [
      (data, headers) => {
        const token = AcGetAccessToken();
        if (token) {
          headers['authorization'] = `Bearer ${token}`;
        } else {
          // Fallback to basic auth if available
          // TODO: Implement Bearer token endpoint in OpenConnector to replace basic auth
          const basicAuth = getBasicAuthCredentials();
          if (basicAuth && basicAuth.username && basicAuth.password) {
            const credentials = btoa(`${basicAuth.username}:${basicAuth.password}`);
            headers['authorization'] = `Basic ${credentials}`;
          }
        }
        return JSON.stringify(data);
      },
    ],
  },
  publications: {
    get baseURL() {
      return commongroundApiUrl();
    },
    timeout: 1000 * 60,
    maxContentLength: 10000,
    responseType: 'json',
    responseEncoding: 'utf8',
    credentials: false,
    headers: {
      ..._api_commonground_headers_,
    },
  },
  authentication: {
    get baseURL() {
      return commongroundApiUrl();
    },
    timeout: 1000 * 60,
    maxContentLength: 10000,
    responseType: 'json',
    responseEncoding: 'utf8',
    credentials: false,
    headers: {
      ..._api_commonground_headers_,
    },
  },
  mijnOmgeving: {
    get baseURL() {
      return commongroundApiUrl();
    },
    timeout: 1000 * 60,
    maxContentLength: 10000,
    responseType: 'json',
    responseEncoding: 'utf8',
    credentials: false,
    headers: {
      ..._api_commonground_headers_,
    },
  },
  menus: {
    get baseURL() {
      return apiUrl();
    },
    timeout: 1000 * 60,
    maxContentLength: 10000,
    responseType: 'json',
    responseEncoding: 'utf8',
    credentials: false,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  },
  themes: {
    get baseURL() {
      return commongroundApiUrl();
    },
    timeout: 1000 * 60,
    maxContentLength: 10000,
    responseType: 'json',
    responseEncoding: 'utf8',
    credentials: false,
    headers: {
      ..._api_commonground_headers_,
    },
  },
  faqs: {
    get baseURL() {
      return apiUrl();
    },
    timeout: 1000 * 60,
    maxContentLength: 10000,
    responseType: 'json',
    responseEncoding: 'utf8',
    credentials: false,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  },
  pages: {
    get baseURL() {
      return apiUrl();
    },
    timeout: 1000 * 60,
    maxContentLength: 10000,
    responseType: 'json',
    responseEncoding: 'utf8',
    credentials: false,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  },
  gemma: {
    get baseURL() {
      return commongroundApiUrl();
    },
    timeout: 1000 * 60,
    maxContentLength: 10000,
    responseType: 'json',
    responseEncoding: 'utf8',
    credentials: false,
  },
  download: {
    get baseURL() {
      return apiUrl();
    },
    timeout: 1000 * 60,
    maxContentLength: 10000,
    responseType: 'json',
    responseEncoding: 'utf8',
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  },
  upload: {
    get baseURL() {
      return apiUrl();
    },
    timeout: 1000 * 60,
    maxContentLength: 10000,
    responseType: 'json',
    responseEncoding: 'utf8',
    withCredentials: true,
    headers: {
      'Content-Type': 'multipart/form-data',
      Accept: 'application/json',
      type: 'formData',
    },

    transformRequest: [
      (data, headers) => {
        const token = AcGetAccessToken();
        if (token) headers['authorization'] = `Bearer ${token}`;
        return data;
      },
    ],
  },
};

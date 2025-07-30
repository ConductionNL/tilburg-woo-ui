import { BASE_URL } from '@src/views/ac-beheer/constants';
import axios from 'axios';
import { getCookie } from '@src/utilities';

// Utility: flatten array of [key, value] pairs into an object, supporting repeated keys as arrays
const normalizeParams = (pairs = []) => {
  return pairs.reduce((acc, [key, value]) => {
    if (!key) return acc;
    if (key in acc) {
      acc[key] = Array.isArray(acc[key]) ? [...acc[key], value] : [acc[key], value];
    } else {
      acc[key] = value;
    }
    return acc;
  }, {});
};

// Create axios instance configured for Nextcloud
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 120_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Authorization header interceptor for OAuth tokens
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = getCookie('nextcloud_access_token');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global error handling: redirect on 401
axiosInstance.interceptors.response.use(
  (response) => ({
    ...response,
    ok: response.status >= 200 && response.status < 300,
  }),
  (error) => Promise.reject(error)
);

/**
 * Nextcloud API utility class
 * Provides the core request functionality that can be used by both hooks and stores
 */
export class NextcloudApi {
  constructor() {
    this.activeRequests = new Map();
  }

  /**
   * Cancel all active requests
   */
  cancelAllRequests() {
    this.activeRequests.forEach((controller) => {
      controller.abort();
    });
    this.activeRequests.clear();
  }

  /**
   * Cancel specific request by key
   * @param {string} requestKey - Unique key identifying the request
   */
  cancelRequest(requestKey) {
    const controller = this.activeRequests.get(requestKey);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(requestKey);
    }
  }

  /**
   * Generate a unique request key based on parameters
   * @param {string} path - API path
   * @param {Array<[string, any]>} params - Query parameters
   * @returns {string} Unique request key
   */
  generateRequestKey(path, params = []) {
    const sortedParams = params.sort(([a], [b]) => a.localeCompare(b));
    return `${path}?${sortedParams.map(([k, v]) => `${k}=${v}`).join('&')}`;
  }

  /**
   * Generic request with cancellation support
   * @param {string} path - API path (relative to BASE_URL)
   * @param {object} options
   * @param {string} [options.method='GET']
   * @param {Array<[string, any]>} [options.params] - query parameters
   * @param {object|FormData} [options.data]
   * @param {object} [options.headers]
   * @param {string} [options.redirectPath=current location]
   * @param {string} [options.requestKey] - Optional custom request key for cancellation
   * @param {Function} [options.onError] - Error handler for 401 redirects
   * @returns {Promise<Object>} Response data
   */
  async request(
    path,
    {
      method = 'GET',
      params = [],
      data = null,
      headers = {},
      responseType = 'json',
      redirectPath = window.location.pathname,
      requestKey = null,
      onError = null,
    } = {}
  ) {
    // Generate request key if not provided
    const key = requestKey || this.generateRequestKey(path, params);

    // Cancel any existing request with the same key
    this.cancelRequest(key);

    // Create new AbortController for this request
    const controller = new AbortController();
    this.activeRequests.set(key, controller);

    try {
      const config = {
        url: path,
        method,
        params: normalizeParams(params),
        data,
        headers,
        responseType,
        signal: controller.signal,
      };

      const res = await axiosInstance.request(config);
      return res;
    } catch (err) {
      // Don't throw if request was cancelled
      if (err.name === 'AbortError') {
        throw new Error('Request cancelled');
      }

      if (err.response?.status === 401 && onError) {
        onError(redirectPath);
      }
      throw err;
    } finally {
      this.activeRequests.delete(key);
    }
  }

  /**
   * Download a file (blob)
   */
  async download(
    path,
    {
      params = [],
      headers = {},
      filename = null,
      redirectPath,
      requestKey = null,
      onError = null,
    } = {}
  ) {
    const res = await this.request(path, {
      method: 'GET',
      params,
      headers,
      responseType: 'blob',
      redirectPath,
      requestKey,
      onError,
    });

    const disposition = res.headers['content-disposition'];
    const inferred = disposition?.match(/filename="?([^";]+)"?/)?.[1];
    const finalName = inferred || filename || path.split('/').pop();

    const blob = new Blob([res.data]);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  /**
   * Upload one or multiple files
   */
  async upload(
    path,
    files,
    {
      params = [],
      headers = {},
      redirectPath,
      requestKey = null,
      onError = null,
    } = {}
  ) {
    const form = new FormData();
    if (Array.isArray(files)) {
      files.forEach((f) => form.append('file', f));
    } else {
      form.append('file', files);
    }

    const uploadHeaders = { 'Content-Type': 'multipart/form-data', ...headers };
    const res = await this.request(path, {
      method: 'POST',
      params,
      data: form,
      headers: uploadHeaders,
      redirectPath,
      requestKey,
      onError,
    });
    return res;
  }

  /**
   * Export object list (csv or excel)
   */
  exportObjects(register, schema, type = 'csv', options = {}) {
    const ext = type === 'excel' ? 'xlsx' : 'csv';
    const now = new Date().toISOString();
    const filename = `${register}_${schema}_${now}.${ext}`;
    return this.download(`/openregister/api/objects/${register}/${schema}/export`, {
      params: [['type', type]],
      filename,
      requestKey: `export_${register}_${schema}_${type}`,
      ...options,
    });
  }

  /**
   * Get current user
   */
  getUser(options = {}) {
    return this.request('/openconnector/api/user/me', options);
  }

  /**
   * Update current user
   */
  updateUser(userData, options = {}) {
    return this.request('/openconnector/api/user/me', {
      method: 'PUT',
      data: userData,
      ...options,
    });
  }

  /**
   * Login user with flexible options
   */
  async login(credentials, options = {}) {
    const {
      headers = {},
      onSuccess,
      onError,
      redirectPath,
      autoRedirect = true,
      onAuthError,
    } = options;

    try {
      const response = await this.request('/openconnector/api/user/login', {
        method: 'POST',
        data: {
          username: credentials.username,
          password: credentials.password,
        },
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        redirectPath: redirectPath || window.location.pathname,
        requestKey: 'login',
        onError: onAuthError,
      });

      // Handle successful login
      if (onSuccess) {
        onSuccess(response.data);
      }

      return {
        success: true,
        data: response.data,
        user: response.data.user,
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || 'Inloggen mislukt. Controleer uw gegevens.';

      if (onError) {
        onError(error, errorMessage);
      }

      return {
        success: false,
        error: errorMessage,
        status: error.response?.status,
        data: error.response?.data,
      };
    }
  }
}

// Export a singleton instance
export const nextcloudApi = new NextcloudApi();
export default nextcloudApi;

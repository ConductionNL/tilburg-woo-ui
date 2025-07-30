import { BASE_URL } from '@src/views/ac-beheer/constants';
import { useNavigate } from 'react-router';
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
const nextcloudApi = axios.create({
  baseURL: BASE_URL,
  timeout: 120_000,
    withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Authorization header interceptor for OAuth tokens
nextcloudApi.interceptors.request.use(
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
nextcloudApi.interceptors.response.use(
  (response) => ({
    ...response,
    ok: response.status >= 200 && response.status < 300,
  }),
  (error) => Promise.reject(error)
);

/**
 * Hook providing Nextcloud API helpers with request cancellation support
 */
export default function useNextcloudRequests() {
  const navigate = useNavigate();

  // Track active requests for cancellation
  const activeRequests = new Map();

  /**
   * Cancel all active requests
   */
  const cancelAllRequests = () => {
    activeRequests.forEach((controller) => {
      controller.abort();
    });
    activeRequests.clear();
  };

  /**
   * Cancel specific request by key
   * @param {string} requestKey - Unique key identifying the request
   */
  const cancelRequest = (requestKey) => {
    const controller = activeRequests.get(requestKey);
    if (controller) {
      controller.abort();
      activeRequests.delete(requestKey);
    }
  };

  /**
   * Generate a unique request key based on parameters
   * @param {string} path - API path
   * @param {Array<[string, any]>} params - Query parameters
   * @returns {string} Unique request key
   */
  const generateRequestKey = (path, params = []) => {
    const sortedParams = params.sort(([a], [b]) => a.localeCompare(b));
    return `${path}?${sortedParams.map(([k, v]) => `${k}=${v}`).join('&')}`;
  };

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
   */
  const request = async (
    path,
    {
      method = 'GET',
      params = [],
      data = null,
      headers = {},
      responseType = 'json',
      redirectPath = window.location.pathname,
      requestKey = null,
    } = {}
  ) => {
    // Generate request key if not provided
    const key = requestKey || generateRequestKey(path, params);

    // Cancel any existing request with the same key
    cancelRequest(key);

    // Create new AbortController for this request
    const controller = new AbortController();
    activeRequests.set(key, controller);

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

      const res = await nextcloudApi.request(config);

      return res;
    } catch (err) {
      // Don't throw if request was cancelled
      if (err.name === 'AbortError') {
        throw new Error('Request cancelled');
      }

      if (err.response?.status === 401) {
        navigate(`/login?redirect_url=${encodeURIComponent(redirectPath)}`);
      }
      throw err;
    } finally {
      activeRequests.delete(key);
    }
  };

  /**
   * Download a file (blob)
   */
  const download = async (
    path,
    {
      params = [],
      headers = {},
      filename = null,
      redirectPath,
      requestKey = null,
    } = {}
  ) => {
    const res = await request(path, {
      method: 'GET',
      params,
      headers,
      responseType: 'blob',
      redirectPath,
      requestKey,
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
  };

  /**
   * Upload one or multiple files
   */
  const upload = async (
    path,
    files,
    { params = [], headers = {}, redirectPath, requestKey = null } = {}
  ) => {
    const form = new FormData();
    if (Array.isArray(files)) {
      files.forEach((f) => form.append('file', f));
    } else {
      form.append('file', files);
    }

    const uploadHeaders = { 'Content-Type': 'multipart/form-data', ...headers };
    const res = await request(path, {
      method: 'POST',
      params,
      data: form,
      headers: uploadHeaders,
      redirectPath,
      requestKey,
    });
    return res;
  };

  /**
   * Export object list (csv or excel)
   */
  const exportObjects = (register, schema, type = 'csv') => {
    const ext = type === 'excel' ? 'xlsx' : 'csv';
    const now = new Date().toISOString();
    const filename = `${register}_${schema}_${now}.${ext}`;
    return download(`/openregister/api/objects/${register}/${schema}/export`, {
      params: [['type', type]],
      filename,
      requestKey: `export_${register}_${schema}_${type}`,
    });
  };

  /**
   * Get current user
   */
  const getUser = () => request('/openconnector/api/user/me');

  /**
   * Update current user
   */
  const updateUser = (userData) =>
    request('/openconnector/api/user/me', {
      method: 'PUT',
      data: userData,
    });

  /**
   * Login user with flexible options
   * @param {object} credentials - Login credentials
   * @param {string} credentials.username - Username or email
   * @param {string} credentials.password - Password
   * @param {object} options - Login options
   * @param {object} [options.headers] - Additional headers
   * @param {function} [options.onSuccess] - Callback for successful login
   * @param {function} [options.onError] - Callback for login errors
   * @param {string} [options.redirectPath] - Path to redirect after successful login
   * @param {boolean} [options.autoRedirect=true] - Whether to automatically redirect on success
   * @returns {Promise<object>} Login response
   */
  const login = async (credentials, options = {}) => {
    const {
      headers = {},
      onSuccess,
      onError,
      redirectPath,
      autoRedirect = true,
    } = options;

    try {
      const response = await request('/openconnector/api/user/login', {
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
      });

      // Handle successful login
      if (onSuccess) {
        onSuccess(response.data);
      }

      // Auto redirect if enabled and path provided
      if (autoRedirect && redirectPath) {
        navigate(redirectPath);
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
  };

  return {
    request,
    download,
    upload,
    exportObjects,
    getUser,
    updateUser,
    login,
    cancelAllRequests,
    cancelRequest,
    // backwards compatibility (ish (still need to redo the params where used))
    makeRequest: request,
    downloadObjectList: exportObjects,
    uploadObjectList: upload,
    exportObjectList: download,
  };
}

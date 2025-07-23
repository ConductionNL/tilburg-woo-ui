import { BASE_URL } from '@src/views/ac-beheer/ac-beheer';
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
  timeout: 30000,
  //   withCredentials: true, // include cookies for authentication
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
 * Hook providing Nextcloud API helpers
 */
export default function useNextcloudRequests() {
  const navigate = useNavigate();

  /**
   * Generic request
   * @param {string} path - API path (relative to BASE_URL)
   * @param {object} options
   * @param {string} [options.method='GET']
   * @param {Array<[string, any]>} [options.params] - query parameters
   * @param {object|FormData} [options.data]
   * @param {object} [options.headers]
   * @param {string} [options.redirectPath=current location]
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
    } = {}
  ) => {
    try {
      const config = {
        url: path,
        method,
        params: normalizeParams(params),
        data,
        headers,
        responseType,
      };

      const res = await nextcloudApi.request(config);
      return res;
    } catch (err) {
      if (err.response?.status === 401) {
        navigate(`/login?redirect_url=${encodeURIComponent(redirectPath)}`);
      }
      throw err;
    }
  };

  /**
   * Download a file (blob)
   */
  const download = async (
    path,
    { params = [], headers = {}, filename = null, redirectPath } = {}
  ) => {
    const res = await request(path, {
      method: 'GET',
      params,
      headers,
      responseType: 'blob',
      redirectPath,
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
    { params = [], headers = {}, redirectPath } = {}
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
    return download(`/apps/openregister/api/objects/${register}/${schema}/export`, {
      params: [['type', type]],
      filename,
    });
  };

  /**
   * Get current user
   */
  const getUser = () => request('/apps/openconnector/api/user/me');

  /**
   * Update current user
   */
  const updateUser = (userData) =>
    request('/apps/openconnector/api/user/me', {
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
      const response = await request('/apps/openconnector/api/user/login', {
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
    // backwards compatibility (ish (still need to redo the params where used))
    makeRequest: request,
    downloadObjectList: download,
    uploadObjectList: upload,
    exportObjectList: exportObjects,
  };
}

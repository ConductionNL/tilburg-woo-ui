import { getCookie } from '@src/utilities';
import { BASE_URL } from '@src/views/ac-beheer/ac-beheer';
import { useNavigate } from 'react-router';
import axios from 'axios';

const mapQueryParams = (queryParams) => {
  return queryParams?.flat()?.length
    ? queryParams.reduce((acc, [key, value]) => {
        // If the key already exists, convert it to an array
        if (key in acc) {
          if (!Array.isArray(acc[key])) {
            acc[key] = [acc[key]];
          }
          acc[key].push(value);
        } else {
          acc[key] = value;
        }
        return acc;
      }, {})
    : {};
};

// Create an axios instance with default config
const nextcloudApi = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
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

// Add response interceptor for error handling
nextcloudApi.interceptors.response.use(
  (response) => ({
    ...response,
    ok: response.status >= 200 && response.status < 300,
  }),
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      const navigate = useNavigate();
      const currentPath = window.location.pathname;
      navigate(`/login?redirect_url=${currentPath}`);
    }
    return Promise.reject(error);
  }
);

export default function useNextcloudRequests() {
  const navigate = useNavigate();

  /**
   * Make a request to the Nextcloud API
   * @param {string} url - The URL to make the request to
   * @param {string[][]} queryParams - The query parameters to add to the request, array of `[key, value]`
   * @param {Object} fetchOptions - The fetch options to use
   * @param {string} redirectUrl - The URL to redirect to if the user is not logged in
   * @returns {Promise<Response>} - The response from the request
   *
   * Changes from original:
   * - Uses axios instead of fetch
   * - Automatically handles JSON parsing
   * - Better error handling with axios interceptors
   * - Maintains same interface for backward compatibility
   */
  const makeRequest = async (url, queryParams, fetchOptions = {}, redirectUrl) => {
    try {
      // Handle array parameters correctly
      const params = mapQueryParams(queryParams);

      const response = await nextcloudApi({
        url,
        method: fetchOptions?.method || 'GET',
        params,
        data: fetchOptions?.body,
        headers: {
          ...Object.fromEntries(
            Object.entries(fetchOptions?.headers || {}).filter(
              ([_, value]) => value !== null && value !== undefined
            )
          ),
        },
      });

      return response;
    } catch (error) {
      if (error.response?.status === 401) {
        navigate(`/login?redirect_url=${redirectUrl}`);
      }
      throw error;
    }
  };

  /**
   * Download a file from the Nextcloud API
   * @param {string} url - The URL to download from
   * @param {string[][]} queryParams - The query parameters
   * @param {Object} fetchOptions - The fetch options
   * @param {string} redirectUrl - The redirect URL
   * @param {string} _filename - Optional filename override
   *
   * Changes from original:
   * - Uses axios with responseType: 'blob'
   * - Better error handling
   * - Maintains same interface
   */
  const makeDownloadRequest = async (
    url,
    queryParams,
    fetchOptions = {},
    redirectUrl,
    _filename
  ) => {
    try {
      const response = await nextcloudApi({
        url,
        method: fetchOptions?.method || 'GET',
        params: mapQueryParams(queryParams),
        headers: fetchOptions?.headers,
        responseType: 'blob',
      });

      const contentDisposition = response.headers['content-disposition'];
      const filename =
        contentDisposition?.split('filename=')[1]?.replace(/["']/g, '') ||
        _filename ||
        url.split('/').pop();

      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Failed to download file', error);
      throw error;
    }
  };

  /**
   * Upload a file to the Nextcloud API
   * @param {string} url - The URL to upload to
   * @param {File} file - The file to upload
   * @param {string[][]} queryParams - The query parameters
   * @param {Object} fetchOptions - The fetch options
   * @param {string} redirectUrl - The redirect URL
   *
   * Changes from original:
   * - Uses axios with FormData
   * - Better error handling
   * - Maintains same interface
   */
  const makeUploadRequest = async (
    url,
    file,
    queryParams,
    fetchOptions = {},
    redirectUrl
  ) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await nextcloudApi({
        url,
        method: 'POST',
        params: mapQueryParams(queryParams),
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...fetchOptions?.headers,
        },
      });

      return response;
    } catch (error) {
      console.error('Failed to upload file', error);
      throw error;
    }
  };

  /**
   * Upload a file to the Nextcloud API
   *
   * this is literally the same as the makeUploadRequest, but you use 'files' instead of 'file'.
   * So no, it does not support multiple files.
   *
   * @param {string} url - The URL to upload to
   * @param {File} file - The file to upload
   * @param {string[]} tags - The tags to add to the file
   * @param {boolean} share - Whether to share the file
   * @param {string[][]} queryParams - The query parameters
   * @param {Object} fetchOptions - The fetch options
   * @param {string} redirectUrl - The redirect URL
   */
  const makeMultipartUploadRequest = async (
    url,
    file,
    tags = [],
    share = false,
    queryParams,
    fetchOptions = {},
    redirectUrl
  ) => {
    try {
      const formData = new FormData();
      formData.append('files', file);
      formData.append('tags', tags);
      formData.append('share', share);

      const response = await nextcloudApi({
        url,
        method: 'POST',
        params: mapQueryParams(queryParams),
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...fetchOptions?.headers,
        },
      });

      return response;
    } catch (error) {
      console.error('Failed to upload file', error);
      throw error;
    }
  };

  /**
   * Download an object list from the Nextcloud API
   * @param {string} register - The register to download
   * @param {string} schema - The schema to download
   * @param {'csv' | 'excel'} type - The type to download (csv, excel)
   * @param {string} redirectUrl - The redirect URL
   *
   * Changes from original:
   * - Uses the new makeDownloadRequest implementation
   * - Maintains same interface
   */
  const downloadObjectList = async (register, schema, type = 'csv', redirectUrl) => {
    const url = `${BASE_URL}/apps/openregister/api/objects/${register}/${schema}/export?type=${type}`;

    const extension = type === 'excel' ? 'xlsx' : 'csv';
    const currentDate = new Date().toISOString().split('T')[0];
    const currentTime = (() => {
      const now = new Date();
      const hh = String(now.getUTCHours()).padStart(2, '0');
      const mm = String(now.getUTCMinutes()).padStart(2, '0');
      const ss = String(now.getUTCSeconds()).padStart(2, '0');
      return `${hh}${mm}${ss}`;
    })();

    const filename = `${register}_${schema}_${currentDate}_${currentTime}.${extension}`;

    await makeDownloadRequest(
      url,
      null,
      { method: 'GET', headers: { 'Content-Type': '*/*' } },
      redirectUrl,
      filename
    );
  };

  return {
    makeRequest,
    makeDownloadRequest,
    downloadObjectList,
    makeUploadRequest,
    makeMultipartUploadRequest,
  };
}

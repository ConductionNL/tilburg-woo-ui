import { getCookie } from '@src/utilities';
import { BASE_URL } from '@src/views/ac-beheer/ac-beheer';
import { useNavigate } from 'react-router';

export default function useNextcloudRequests() {
  const navigate = useNavigate();

  /**
   * Make a request to the Nextcloud API
   * @param {string} url - The URL to make the request to
   * @param {string[][]} queryParams - The query parameters to add to the request, array of `[key, value]`.
   * @param {Object} fetchOptions - The fetch options to use
   * @param {string} redirectUrl - The URL to redirect to if the user is not logged in
   * @returns {Promise<Response>} - The response from the request
   */
  const makeRequest = async (url, queryParams, fetchOptions = {}, redirectUrl) => {
    const accessToken = getCookie('nextcloud_access_token');

    if (!accessToken) {
      navigate(`/login?redirect_url=${redirectUrl}`);
      return;
    }

    const queryParamsString = queryParams?.flat()?.length
      ? `?${new URLSearchParams(queryParams).toString()}`
      : '';

    const response = await fetch(url + queryParamsString, {
      ...fetchOptions,
      method: fetchOptions?.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        ...fetchOptions?.headers,
      },
      body: fetchOptions?.body,
    });

    if (response.status === 401) {
      navigate(`/login?redirect_url=${redirectUrl}`);
      return;
    }

    return response;
  };

  const makeDownloadRequest = async (
    url,
    queryParams,
    fetchOptions = {},
    redirectUrl,
    _filename
  ) => {
    const response = await makeRequest(url, queryParams, fetchOptions, redirectUrl);

    if (!response.ok) {
      console.error('Failed to download file', response.status, response.statusText);
      return;
    }

    // Get filename from Content-Disposition header or fallback to URL
    const contentDisposition = response.headers.get('content-disposition');
    const filename =
      contentDisposition?.split('filename=')[1]?.replace(/["']/g, '') ||
      _filename ||
      url.split('/').pop();

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  };

  /**
   * Download an object from the Nextcloud API
   * @param {string} register - The register to download
   * @param {string} schema - The schema to download
   * @param {'csv' | 'excel'} type - The type to download (csv, excel)
   */
  const downloadObjectList = async (
    register,
    schema,
    type = 'csv',
    redirectUrl = '/beheer'
  ) => {
    const url = `${BASE_URL}/apps/${register}/${schema}/export?type=${type}`;
    const extension = type === 'excel' ? 'xlsx' : 'csv';
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `${schema}-${currentDate}.${extension}`;

    await makeDownloadRequest(
      url,
      null,
      { method: 'GET', headers: { 'Content-Type': '*/*' } },
      redirectUrl,
      filename
    );
  };

  return { makeRequest, makeDownloadRequest, downloadObjectList };
}

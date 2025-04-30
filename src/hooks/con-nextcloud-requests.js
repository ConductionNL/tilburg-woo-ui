import { getCookie } from '@src/utilities';
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

    const queryParamsString = queryParams
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

  return { makeRequest };
}

import { getCookie } from '@src/utilities';
import { useNavigate } from 'react-router';

const useNextcloudRequests = (cb = () => {}) => {
  const navigate = useNavigate();

  const makeRequest = async (url, queryParams, headers, redirectUrl) => {
    const accessToken = getCookie('nextcloud_access_token');

    if (!accessToken) {
      navigate(`/login?redirect_url=${redirectUrl}`);
      return;
    }

    const queryParamsString = queryParams
      ? `?${new URLSearchParams(queryParams).toString()}`
      : '';

    const response = await fetch(url + queryParamsString, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        ...headers,
      },
    });

    return response;
  };

  return { makeRequest };
};

export default useNextcloudRequests;

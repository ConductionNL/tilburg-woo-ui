// Demo bestand om linting te testen
// Dit simuleert de situatie die we hadden met useNavigate

import { getCookie } from '@src/utilities';
import { BASE_URL } from '@src/views/ac-beheer/constants';
// import { useNavigate } from 'react-router'; // Deze import ontbreekt!
import axios from 'axios';

export default function useNextcloudRequestsDemo() {
  // Dit zou een ESLint fout geven: 'useNavigate' is not defined
  const navigate = useNavigate();

  const makeRequest = async (url) => {
    try {
      const response = await axios.get(url);
      return response;
    } catch (error) {
      if (error.response?.status === 401) {
        navigate('/login'); // useNavigate gebruikt zonder import!
      }
      throw error;
    }
  };

  return { makeRequest };
}

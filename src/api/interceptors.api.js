// Imports => Dependencies
import dayjs from 'dayjs';
import axios from 'axios';

// Imports => Config
import config from '@config';

// Imports => Constants
import { ENDPOINTS, KEYS } from '@constants';

// Imports => Utilities
import { AcGetState, AcSaveState } from '@utils';

let busy = { [KEYS.ACCOUNT]: false };

export const AcTokenRefresher = (client, callback) => {
  return new Promise((resolve, reject) => {
    const expires_at = AcGetState(KEYS.EXPIRES_AT); // add 10 minutes to 'now'
    const expires_in = dayjs().add(2, 'minutes').format('x'); // add 10 minutes to 'now'

    if (!expires_in || !expires_at) resolve();

    return AcRefreshIfRequired(expires_in, expires_at, KEYS.ACCOUNT)
      .then(resolve)
      .catch((error) => {
        // Token refresh failed, call the provided callback if given...
        if (callback) callback();
        reject(error);
      });
  });
};

const AcRefreshIfRequired = (expires_in, expires_at, type) => {
  return new Promise((resolve, reject) => {
    if (busy[type]) {
      resolve();
      return;
    }

    busy[type] = true;

    const refresh_token = AcGetState(KEYS.REFRESH_TOKEN);

    if (expires_in < expires_at) {
      busy[type] = false;
      resolve();
    } else if (expires_in >= expires_at && refresh_token) {
      const data = {
        refresh_token: refresh_token,
        grant_type: 'refresh_token',
        client_secret: process.env.CLIENT_SECRET,
        client_id: process.env.CLIENT_ID,
      };

      axios
        .post(`${config.apiUrl}${ENDPOINTS.OAUTH.REFRESH}`, data)
        .then((response) => {
          const { data } = response;

          const { access_token, refresh_token, expires_in } = data;
          const expires_at = dayjs().add(expires_in, 'milliseconds').format('x');

          AcSaveState(KEYS.EXPIRES_IN, expires_in);
          AcSaveState(KEYS.EXPIRES_AT, expires_at);

          AcSaveState(KEYS.ACCESS_TOKEN, access_token);
          AcSaveState(KEYS.REFRESH_TOKEN, refresh_token);

          busy[type] = false;
          resolve();
        })
        .catch((error) => reject(error));
    }
  });
};

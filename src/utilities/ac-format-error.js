// Imports => Constants
import { getSupportEmailAddress } from '@constants/container.constants';

// Imports => Utilities
import { AcCapitalize } from '@utils';

export const AcFormatErrorMessage = (error, list = false) => {
  let msg = false;
  let code =
    error && error.response && error.response.status ? error.response.status : false;

  if (!code || code === 500) {
    const supportEmail = getSupportEmailAddress();
    return `Er is een onbekende fout opgetreden. Probeer het opnieuw of neem contact op met <a href="mailto:${supportEmail}">${supportEmail}</a>`;
  }

  if (error.response && error.response.data && error.response.data.errors) {
    msg = [];

    for (let key in error.response.data.errors) {
      if (Object.prototype.hasOwnProperty.call(error.response.data.errors, key)) {
        if (error.response.data.errors[key][0] !== 'p') {
          const line = AcCapitalize(error.response.data.errors[key][0]);
          if (msg && msg.indexOf(line) > -1) continue;

          if (!list) {
            msg.push(line);
          } else if (list) {
            msg.push({
              line,
              key,
            });
          }
        }
      }
    }

    if (!list) msg = msg.join('<br/>');
  } else if (error.response && error.response.data && error.response.data.message) {
    msg = error.response.data.message;
  } else if (error.response && error.response.data && error.response.data.error) {
    // Handle {"error": "Invalid username or password"} format
    msg = error.response.data.error;
  } else if (
    error.response &&
    error.response.data &&
    typeof error.response.data === 'string'
  ) {
    // Handle plain string error responses
    msg = error.response.data;
  }

  return msg;
};

export const AcHasErrors = (error) => {
  return (
    error && error.response && error.response.data && error.response.data.errors
  );
};

export const AcFormatErrorCode = (error) => {
  return error && error.response && error.response.status
    ? error.response.status
    : 'Netwerk Error';
};

export default {
  AcFormatErrorMessage,
  AcFormatErrorCode,
  AcHasErrors,
};

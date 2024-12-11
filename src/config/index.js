// Imports => Utilities
import { AcGetAccessToken, AcLockObject, ACIsHttps } from '@utils';

// Get ENV variables

const hostname = window.location.hostname;

const apiUrl = () => {
  switch (hostname) {
    case 'vng.opencatalogi.nl':
      return 'https://directory.opencatalogi.nl/apps/opencatalogi';
    case 'open-tilburg.accept.commonground.nu':
      return 'https://tilburg.accept.commonground.nu/apps/opencatalogi';
    case 'open-migrato.accept.commonground.nu':
      return 'https://migrato.accept.commonground.nu/apps/opencatalogi';
    case 'localhost':
      return process.env.API_URL_COMMONGROUND;
    default:
      return process.env.API_URL_COMMONGROUND;
  }
};

// const _api_ = process.env.API_URL;
const _api_ =
  hostname === 'vng.opencatalogi.nl'
    ? 'https://directory.opencatalogi.nl/apps/opencatalogi'
    : process.env.API_URL;
// const _api_commonground_ = process.env.API_URL_COMMONGROUND;
const _api_commonground_ = apiUrl();

const _api_commonground_token_ = process.env.API_URL_COMMONGROUND_TOKEN;
const _api_commonground_organization_oin_ =
  process.env.API_URL_COMMONGROUND_ORGANIZATION_OIN;

const _api_commonground_headers_ = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

if (_api_commonground_token_ && !ACIsHttps(_api_commonground_)) {
  _api_commonground_headers_['Authorization'] = _api_commonground_token_;
}

const _site_ = process.env.SITE;
const _mode_ = process.env.MODE;
const _provider_ = process.env.PROVIDER;

const _auto_logout = process.env.AUTO_LOGOUT;
const _auto_logout_time = process.env.AUTO_LOGOUT_TIME;

const _register_uri_ = process.env.REGISTER_URL;

export default {
  mode: _mode_,
  autologout: {
    active: !!_auto_logout,
    time: +_auto_logout_time || 0,
  },
  rollbar: AcLockObject({
    accessToken: process.env.ROLLBAR_KEY,
    captureUncaught: true,
    captureUnhandledRejections: true,
    verbose: false,
    environment: process.env.ROLLBAR_ENVIRONMENT,
  }),
  api: {
    baseURL: `${_api_}`,
    timeout: 1000 * 60,
    maxContentLength: 10000,
    responseType: 'json',
    responseEncoding: 'utf8',
    credentials: true,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    transformRequest: [
      (data, headers) => {
        const token = AcGetAccessToken();
        if (token) headers['authorization'] = `Bearer ${token}`;
        return JSON.stringify(data);
      },
    ],
  },
  publications: {
    baseURL: `${_api_commonground_}`,
    timeout: 1000 * 60,
    maxContentLength: 10000,
    responseType: 'json',
    responseEncoding: 'utf8',
    credentials: false,
    headers: {
      ..._api_commonground_headers_,
    },
  },
  themes: {
    baseURL: `${_api_commonground_}`,
    timeout: 1000 * 60,
    maxContentLength: 10000,
    responseType: 'json',
    responseEncoding: 'utf8',
    credentials: false,
    headers: {
      ..._api_commonground_headers_,
    },
  },
  faqs: {
    baseURL: `${_api_}`,
    timeout: 1000 * 60,
    maxContentLength: 10000,
    responseType: 'json',
    responseEncoding: 'utf8',
    credentials: false,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  },
  pages: {
    baseURL: `${_api_}`,
    timeout: 1000 * 60,
    maxContentLength: 10000,
    responseType: 'json',
    responseEncoding: 'utf8',
    credentials: false,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  },
  upload: {
    baseURL: `${_api_}`,
    timeout: 1000 * 60,
    maxContentLength: 10000,
    responseType: 'json',
    responseEncoding: 'utf8',
    credentials: true,
    headers: {
      'Content-Type': 'multipart/form-data',
      Accept: 'application/json',
      type: 'formData',
    },
    transformRequest: [
      (data, headers) => {
        const token = AcGetAccessToken();
        if (token) headers['authorization'] = `Bearer ${token}`;
        return data;
      },
    ],
  },
};

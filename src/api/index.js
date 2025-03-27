// Imports => Vendor
import axios from 'axios';

// Imports => Interceptors
import { AcTokenRefresher } from './interceptors.api';

// Imports => API
import AuthAPI from '@api/auth.api';
import PublicationsAPI from '@api/publications.api';
import FaqsAPI from '@api/faqs.api';
import PagesAPI from '@api/pages.api';
import ThemesAPI from '@api/themes.api';
import CategoriesAPI from './categories.api';

const onUploadProgress = (event) => {
  console.group('[Axios] => fn.onUploadProgress');
  console.log('Event: ', event);
  console.groupEnd();
};

const onDownloadProgress = (event) => {
  console.group('[Axios] => fn.onDownloadProgress');
  console.log('Event: ', event);
  console.groupEnd();
};

let _timeOut = null;
let _errorTokens = [];

const unauthenticatedState = (state) => {
  const unauthenticatedEvent = new CustomEvent('unAuthenticate');
  window.dispatchEvent(unauthenticatedEvent);
};

const cancelRequests = () => {
  const collection = _errorTokens;
  const len = collection.length;
  let n = 0;

  for (n; n < len; n++) {
    const instance = collection[n];
    if (instance && instance.cancel) instance.cancel();
  }

  _errorTokens = [];
};

const addInterceptors = (requestClient) => {
  requestClient.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      window.navigator?.vibrate?.(400);

      if (error?.response?.status === 401) {
        clearTimeout(_timeOut);

        const cancelRequestsEvent = new CustomEvent('cancelRequests');
        window.dispatchEvent(cancelRequestsEvent);

        _timeOut = setTimeout(() => unauthenticatedState(false), 1000 / 60);
      }
      return Promise.reject(error);
    }
  );

  requestClient.interceptors.request.use(async (config) => {
    if (navigator.onLine)
      await AcTokenRefresher(requestClient, unauthenticatedState);

    const source = axios.CancelToken.source();
    config.cancelToken = source.token;
    _errorTokens.push(source);

    return config;
  });
};

export class API {
  constructor(config, Store) {
    this.Store = Store;

    const Client = axios.create({
      ...config.api,
    });
    addInterceptors(Client);

    const PublicationsClient = axios.create({
      ...config.publications,
    });
    addInterceptors(PublicationsClient);

    const ThemesClient = axios.create({
      ...config.themes,
    });
    addInterceptors(ThemesClient);

    const DownloadClient = axios.create({
      ...config.download,
      onDownloadProgress,
    });
    addInterceptors(DownloadClient);

    const UploadClient = axios.create({
      ...config.upload,
      onUploadProgress,
    });
    addInterceptors(UploadClient);

    window.addEventListener('cancelRequests', cancelRequests, false);

    this.auth = new AuthAPI({ Store, Client });
    this.publications = new PublicationsAPI({ Store, Client: PublicationsClient });
    this.faqs = new FaqsAPI({ Store, Client });
    this.pages = new PagesAPI({ Store, Client });
    this.themes = new ThemesAPI({ Store, Client: ThemesClient });
    this.categories = new CategoriesAPI({ Store, Client: Client });
  }
}

export default API;

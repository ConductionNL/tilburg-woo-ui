// Imports => MOBX
import { observable, computed, action, makeObservable, toJS } from 'mobx';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import advancedFormat from 'dayjs/plugin/advancedFormat';

// Imports => Config
import config from '@config';

// Imports => Constants
import { KEYS } from '@constants';

// Imports => Utilities
import {
  AcIsSet,
  AcIsUndefined,
  AcIsNull,
  AcAutoLoad,
  AcAutoSave,
  AcGetState,
  AcSaveState,
  AcRemoveState,
  AcClearState,
  AcFormatErrorCode,
  AcFormatErrorMessage,
} from '@utils';

let app = {};
let timer = null;

export class AuthStore {
  constructor(store) {
    makeObservable(this);

    AcAutoLoad(this, KEYS.LAST_ACTIVITY);
    AcAutoLoad(this, KEYS.ACCESS_TOKEN);
    AcAutoLoad(this, KEYS.EXPIRES_IN);
    AcAutoLoad(this, KEYS.EXPIRES_AT);
    AcAutoLoad(this, KEYS.REFRESH_TOKEN);
    AcAutoSave(this);

    dayjs.extend(localizedFormat);
    dayjs.extend(advancedFormat);
    dayjs.extend(relativeTime);
    dayjs.locale(config.locale);

    app.store = store;

    window.addEventListener('unAuthenticate', this.unAuthenticate);
  }

  @observable
  last_activity = new Date().getTime();

  @observable
  access_token = null;

  @observable
  expires_in = null;

  @observable
  expires_at = null;

  @observable
  loading = {
    status: false,
    message: undefined,
  };

  @computed
  get is_loading() {
    return this.loading.status;
  }

  @computed
  get current_last_activity() {
    const sharedLastActivity = AcGetState(KEYS.LAST_ACTIVITY);
    if (sharedLastActivity) return parseInt(sharedLastActivity);
    return toJS(this.last_activity);
  }

  @computed
  get current_access_token() {
    return toJS(this.access_token);
  }

  @computed
  get current_expires_at() {
    return toJS(this.expires_at);
  }

  @computed
  get is_authorized() {
    let authorized = false;

    const access_token = this.current_access_token;
    const expires_at = this.current_expires_at;
    const now = dayjs();
    let expired = true;

    if (expires_at) {
      // expires_at = new Date(expires_at);
      expired = expires_at && dayjs(expires_at, 'x').isBefore(now);
    }

    console.group('[store] Auth => Is Authorized');
    console.info('Expires_at: ', dayjs(expires_at, 'x').format('LLLL'));
    console.info('Now:', dayjs(now).format('LLLL'));
    console.info('Is Expired: ', expired);

    authorized = AcIsSet(access_token) && !expired ? true : false;

    console.info('Authorized: ', authorized);
    console.groupEnd();

    return authorized === true;
  }

  @action
  setLoading = (state, message) => {
    this.loading = {
      status: state || false,
      message: message || false,
    };
  };

  @action
  setLastActivity = (timestamp) => {
    this.set(KEYS.LAST_ACTIVITY, timestamp);
  };

  @action
  clearAuthentication = async () => {
    await this.set(KEYS.ACCESS_TOKEN, null);
    await this.set(KEYS.REFRESH_TOKEN, null);
    await this.set(KEYS.EXPIRES_IN, null);
    await this.set(KEYS.EXPIRES_AT, null);
    AcClearState();
  };

  @action
  handleAuthentication = (response) => {
    return new Promise((resolve) => {
      if (response?.access_token) {
        this.set(KEYS.ACCESS_TOKEN, response.access_token);
      }

      if (response?.refresh_token) {
        this.set(KEYS.REFRESH_TOKEN, response.refresh_token);
      }

      if (response?.expires_in) {
        const expires_in = response.expires_in;
        const expires_at = new Date(Date.now() + expires_in);

        this.set(KEYS.EXPIRES_IN, expires_in);
        this.set(KEYS.EXPIRES_AT, expires_at);
      }

      console.groupEnd();

      resolve();
    });
  };

  @action
  login = (credentials) => {
    if (!credentials) return;

    this.setLoading(true);

    return app.store.api.auth
      .login(credentials)
      .then(async (response) => {
        await this.handleAuthentication(response);

        this.setLoading(false);

        return response;
      })
      .catch((error) => {
        this.setLoading(false);
        this.clearAuthentication(error);

        app.store.toasters.add({
          variant: 'error',
          title: 'Inloggen is niet gelukt',
          description: AcFormatErrorMessage(error),
          code: AcFormatErrorCode(error),
        });

        throw error;
      });
  };

  @action
  forgot_password = (credentials) => {
    if (!credentials) return;

    this.setLoading(true);

    return app.store.api.auth
      .forgot_password(credentials)
      .then((response) => {
        app.store.toasters.add({
          variant: 'success',
          delay: 10 * 1000,
          title: response.status || 'Nieuw wachtwoord is aangevraagd',
          description:
            'Als het ingevoerde e-mailadres bij ons bekend is, ontvang je een e-mail met daarin een herstellink. Klik op de link in de e-mail om een nieuw wachtwoord in te stellen.',
        });

        this.setLoading(false);
        return response;
      })
      .catch((error) => {
        app.store.toasters.add({
          variant: 'error',
          title: 'Nieuw wachtwoord aanvragen is niet gelukt',
          description: `Probeer het opnieuw of neem contact op met <em>${KEYS.SUPPORT_EMAIL_ADDRESS}</em>`,
          code: AcFormatErrorCode(error),
        });

        this.setLoading(false);
        throw error;
      });
  };

  @action
  reset_password = (credentials) => {
    if (!credentials) return;

    this.setLoading(true);

    return app.store.api.auth
      .reset_password(credentials)
      .then((response) => {
        app.store.toasters.add({
          variant: 'success',
          title: 'Nieuw wachtwoord is opgeslagen',
        });

        this.setLoading(false);
        return response;
      })
      .catch((error) => {
        this.clearAuthentication(error);

        app.store.toasters.add({
          variant: 'error',
          title: 'Wachtwoord herstellen is niet gelukt',
          description: `Probeer het opnieuw of neem contact op met <em>${KEYS.SUPPORT_EMAIL_ADDRESS}</em>`,
          code: AcFormatErrorCode(error),
        });

        this.setLoading(false);
        throw error;
      });
  };

  @action
  logout = () => {
    return new Promise((resolve) => {
      if (timer) clearTimeout(timer);

      this.clearAuthentication();

      resolve();

      // clear collections on logout for cleanup
      // also allows the warmup process to re-fetch the data again on login
      app.store.object.clearCollections();
    });
  };

  @action
  unAuthenticate = () => {
    if (timer) clearTimeout(timer);

    const cancelRequestsEvent = new CustomEvent('cancelRequests');
    window.dispatchEvent(cancelRequestsEvent);

    return new Promise((resolve) => {
      Promise.all([this.logout(), this.clearAuthentication()]).then(() => {
        app.store.toasters.clear_queue();
        app.store.toasters.add({
          variant: 'error',
          title: 'De huidige sessie is beëindigd.',
          description:
            'Wegens inactiviteit ben je automatisch uitgelogd en is de actieve sessie beëindigd.',
        });

        resolve();
      });
    });
  };

  @action
  set = (target, value, save = true) => {
    if (!AcIsSet(target)) return;
    if (AcIsUndefined(this[target])) return;
    if (AcIsUndefined(value)) return;

    return new Promise((resolve) => {
      this[target] = value;
      if (save) AcSaveState(target, value);
      resolve();
    });
  };

  @action
  setState = (target, property, value, save = true) => {
    if (!AcIsSet(target)) return;
    if (AcIsUndefined(this[target])) return;
    if (!AcIsSet(property)) return;
    if (AcIsUndefined(value)) return;

    this[target][property] = value;
    if (save) AcSaveState(target, value);
  };

  @action
  reset = (target, save = true) => {
    if (!AcIsSet(target)) return;
    if (AcIsUndefined(this[target])) return;

    // developer note: idk what is going on here but im too scared to find out
    return new Promise((resolve) => {
      // eslint-disable-next-line no-undef
      runInAction(() => {
        // eslint-disable-next-line no-undef
        this[target] = _default[target];
      });

      // eslint-disable-next-line no-undef
      if (save && AcIsNull(_default[target])) {
        AcRemoveState(target);
      } else if (save) {
        // eslint-disable-next-line no-undef
        AcSaveState(target, _default[target]);
      }

      resolve();
    });
  };
}

export default AuthStore;

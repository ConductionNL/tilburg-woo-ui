// Imports => Constants
import { AUTH_KEYS, ENDPOINTS } from '@constants';

export class AuthAPI {
  constructor(Instance) {
    this.Store = Instance.Store;
    this.Client = Instance.Client;
  }

  forgot_password(credentials) {
    return this.Client.post(ENDPOINTS.OAUTH.FORGOT_PASSWORD, credentials).then(
      (response) => response.data
    );
  }

  reset_password(credentials) {
    return this.Client.post(ENDPOINTS.OAUTH.RESET_PASSWORD, credentials).then(
      (response) => response.data
    );
  }

  login(credentials) {
    return this.Client.post(ENDPOINTS.OAUTH.LOGIN, {
      grant_type: AUTH_KEYS.GRANT_TYPE,
      client_secret: AUTH_KEYS.CLIENT_SECRET,
      client_id: AUTH_KEYS.CLIENT_ID,
      ...credentials,
    }).then((response) => response.data);
  }

  register(credentials) {
    return this.Client.post(ENDPOINTS.OAUTH.REGISTER, credentials).then(
      (response) => response.data
    );
  }

  logout() {
    return this.Client.post(ENDPOINTS.OAUTH.LOGOUT).then((response) => response.data);
  }

  // OpenConnector session-based authentication methods
  sessionLogin(credentials) {
    return this.Client.post(ENDPOINTS.OPENCONNECTOR.USER_LOGIN, credentials).then(
      (response) => response.data
    );
  }

  sessionLogout() {
    return this.Client.post(ENDPOINTS.OPENCONNECTOR.USER_LOGOUT).then(
      (response) => response.data
    );
  }

  getUserProfile() {
    return this.Client.get(ENDPOINTS.OPENCONNECTOR.USER_PROFILE).then(
      (response) => response.data
    );
  }

  updateUserProfile(userData) {
    return this.Client.put(ENDPOINTS.OPENCONNECTOR.USER_PROFILE, userData).then(
      (response) => response.data
    );
  }
}

export default AuthAPI;

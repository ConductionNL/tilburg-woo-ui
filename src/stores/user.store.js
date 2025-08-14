// Imports => MOBX
import { observable, computed, makeObservable, action, toJS } from 'mobx';

// Try to import container constants (generated at runtime)
let containerConfig;
try {
  containerConfig = require('@constants/container.constants');
} catch (error) {
  console.warn(
    'Container constants not available, falling back to standard behavior'
  );
  containerConfig = null;
}

let app = {};

export class UserStore {
  constructor(store) {
    makeObservable(this);
    app.store = store;
  }

  @observable
  user = null;

  @observable
  loading = {
    status: false,
    message: null,
  };

  @observable
  error = null;

  @observable
  isAuthenticated = false;

  @observable
  authMethod = null; // 'session' or 'oauth'

  @computed
  get currentUser() {
    return toJS(this.user);
  }

  @computed
  get userGroups() {
    return this.user?.groups || [];
  }

  @computed
  get userOrganizations() {
    return this.user?.organizations || this.user?.organisations || [];
  }

  @computed
  get hasPermission() {
    return (permission) => {
      return this.userGroups.some((group) =>
        group.permissions?.includes(permission)
      );
    };
  }

  @computed
  get isAdmin() {
    return this.userGroups.some(
      (group) => group.name === 'admin' || group.role === 'admin'
    );
  }

  @action
  setLoading = (status, message = null) => {
    this.loading.status = status;
    this.loading.message = message;
  };

  @action
  setError = (error) => {
    this.error = error;
  };

  @action
  clearError = () => {
    this.error = null;
  };

  @action
  setUser = (userData) => {
    this.user = userData;
    this.isAuthenticated = !!userData;
  };

  @action
  setAuthMethod = (method) => {
    this.authMethod = method;
  };

  @action
  clearUser = () => {
    this.user = null;
    this.isAuthenticated = false;
    this.authMethod = null;
    this.error = null;
  };

  // Helper method to check for authentication indicators
  hasAuthCookies = () => {
    // Check for various authentication cookies/tokens
    const indicators = [
      'openconnector_access_token', // Our own access token from login
      'nextcloud_access_token',
      'nextcloud_user_id',
      'sessionid',
      'csrftoken',
      'oc_sessionPassphrase', // Nextcloud session cookie
      'nc_sameSiteCookielax', // Nextcloud SameSite cookie
      'nc_sameSiteCookiestrict', // Nextcloud SameSite cookie
      'oc6fgt938z8c', // Nextcloud session ID
    ];

    const availableCookies = {};
    indicators.forEach((cookieName) => {
      const value = document.cookie
        .split('; ')
        .find((row) => row.startsWith(cookieName + '='));
      if (value) {
        availableCookies[cookieName] = value.split('=')[1];
      }
    });

    const hasAnyIndicators = Object.keys(availableCookies).length > 0;

    console.log('Authentication cookies check:', {
      hasIndicators: hasAnyIndicators,
      availableCookies: Object.keys(availableCookies),
      allCookies: document.cookie,
    });

    return hasAnyIndicators;
  };

  // Session-based authentication (OpenConnector API)
  @action
  sessionLogin = async (username, password) => {
    this.setLoading(true);
    this.clearError();

    try {
      if (!containerConfig || !containerConfig.getOpenconnectorApiUrl) {
        throw new Error(
          'OpenConnector API URL not configured. Please check your environment setup.'
        );
      }

      // Use the proper API client instead of hardcoded fetch
      if (!app.store.api || !app.store.api.auth) {
        throw new Error('Auth API not available');
      }

      const data = await app.store.api.auth.sessionLogin({
        username,
        password,
      });

        console.log('Login successful! Response data:', data);
        console.log('All cookies after login:', document.cookie);

        // Clear any existing logout cookie that would cause immediate logout
        document.cookie = 'logout=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';

        // Check for authentication tokens in the response
        if (data.access_token) {
          console.log('Found access token in login response:', data.access_token);
          // Store access token as a cookie for future requests
          document.cookie = `openconnector_access_token=${data.access_token}; path=/; SameSite=Lax`;
        }

        // Check what session cookies were set
        const sessionCookies = {};
        [
          'oc6fgt938z8c',
          'oc_sessionPassphrase',
          'nc_sameSiteCookielax',
          'nc_sameSiteCookiestrict',
        ].forEach((cookieName) => {
          const value = document.cookie
            .split('; ')
            .find((row) => row.startsWith(cookieName + '='));
          if (value) {
            sessionCookies[cookieName] = value.split('=')[1];
          }
        });

        console.log('Session cookies found after login:', sessionCookies);

        // Store user data from login response
        if (data.user) {
          console.log('Setting user from login response:', data.user);
          this.setUser(data.user);
          this.setAuthMethod('session');
          console.log('After setUser - isAuthenticated:', this.isAuthenticated);
        }

        // Also fetch full user profile (/me endpoint)
        console.log('Fetching user profile...');
        await this.fetchUserProfile();
        console.log(
          'After fetchUserProfile - isAuthenticated:',
          this.isAuthenticated,
          'user:',
          this.user
        );

        this.setLoading(false);
        return { success: true, user: this.user };
      } catch (error) {
        const errorMessage =
          error.message || 'Inloggen mislukt. Controleer uw gegevens.';
        this.setError(errorMessage);
        this.setLoading(false);
        return { success: false, error: errorMessage };
      }
  };

  // Check authentication status and fetch user profile
  @action
  checkAuthStatus = async () => {
    this.setLoading(true);

    try {
      if (!containerConfig || !containerConfig.getOpenconnectorApiUrl) {
        console.warn('OpenConnector API URL not configured');
        this.setLoading(false);
        return false;
      }

      // First check if we have any authentication indicators
      // Don't make API calls if there's no indication of authentication
      const hasSessionCookies = this.hasAuthCookies();
      if (!hasSessionCookies) {
        console.log('No authentication indicators found, skipping auth check');
        this.setLoading(false);
        return false;
      }

      console.log('Checking authentication status...');

      // Use the proper API client instead of the authenticated request helper
      if (app.store.api && app.store.api.auth) {
        const userData = await app.store.api.auth.getUserProfile();
        console.log('Authentication check successful:', userData);
        this.setUser(userData);
        this.setAuthMethod('session');
        this.setLoading(false);
        return true;
      } else {
        throw new Error('Auth API not available');
      }
    } catch (error) {
      console.error('Auth check failed:', error);

      // Fallback to OAuth if available
      if (app.store.auth?.is_authorized) {
        console.log('Falling back to OAuth authentication');
        this.setAuthMethod('oauth');
        this.setLoading(false);
        return true;
      }

      this.clearUser();
      this.setLoading(false);
      return false;
    }
  };

  // Fetch full user profile from /me endpoint
  @action
  fetchUserProfile = async () => {
    try {
      console.log('Fetching user profile...');

      // Use the proper API client instead of the authenticated request helper
      if (app.store.api && app.store.api.auth) {
        const userData = await app.store.api.auth.getUserProfile();
        console.log('User profile fetched successfully:', userData);
        this.setUser(userData);
      } else {
        console.warn('Auth API not available');
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  // Update user profile data
  @action
  updateUser = async (userData) => {
    try {
      console.log('Updating user profile:', userData);

      // Use the proper API client instead of the authenticated request helper
      if (app.store.api && app.store.api.auth) {
        const updatedUserData = await app.store.api.auth.updateUserProfile(userData);
        console.log('User profile updated successfully:', updatedUserData);

        // Update the local user state with the new data
        this.setUser(updatedUserData);

        // Return the response in the expected format for compatibility
        return { data: updatedUserData };
      } else {
        throw new Error('Auth API not available');
      }
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    }
  };

  // OAuth login (existing functionality)
  @action
  oauthLogin = async (credentials) => {
    this.setLoading(true);
    this.clearError();

    try {
      const result = await app.store.auth.login(credentials);
      this.setAuthMethod('oauth');
      // Note: OAuth doesn't provide user data directly, would need separate API call
      this.setLoading(false);
      return { success: true };
    } catch (error) {
      this.setError(error.message || 'OAuth login failed');
      this.setLoading(false);
      return { success: false, error: error.message };
    }
  };

  // Universal logout
  @action
  logout = async () => {
    this.setLoading(true);

    try {
      // If using session auth, try to call logout endpoint
      if (this.authMethod === 'session') {
        try {
          // Use the proper API client instead of hardcoded fetch
          if (app.store.api && app.store.api.auth) {
            await app.store.api.auth.sessionLogout();
          }
        } catch (error) {
          console.error('Logout endpoint failed:', error);
        }
      }

      // Clear OAuth tokens if they exist
      if (app.store.auth) {
        await app.store.auth.logout();
      }

      // Clear user data
      this.clearUser();
      this.setLoading(false);

      // Clear any nextcloud cookies
      this.clearNextcloudCookies();

      return { success: true };
    } catch (error) {
      console.error('Logout failed:', error);
      this.clearUser(); // Clear anyway
      this.setLoading(false);
      return { success: false, error: error.message };
    }
  };

  // Clear Nextcloud authentication cookies
  @action
  clearNextcloudCookies = () => {
    const cookiesToClear = [
      'nextcloud_access_token',
      'nextcloud_refresh_token',
      'nextcloud_user_id',
      'nextcloud_client_id',
      'nextcloud_secret_key',
      'logout', // Clear the logout cookie that causes immediate logout
    ];

    cookiesToClear.forEach((cookieName) => {
      document.cookie = `${encodeURIComponent(
        cookieName
      )}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
  };

  // Get organization dashboard URL
  @action
  getOrganizationDashboardUrl = () => {
    const primaryOrg = this.userOrganizations[0];
    if (primaryOrg) {
      return `/beheer/${primaryOrg.id || primaryOrg.slug || 'dashboard'}`;
    }
    return '/beheer';
  };
}

export default UserStore;

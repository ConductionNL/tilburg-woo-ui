// Imports => MOBX
import { observable, computed, makeObservable, action, toJS } from 'mobx';

// Try to import container constants (generated at runtime)
let containerConfig;
try {
  containerConfig = require('@constants/container.constants');
} catch (error) {
  console.warn('Container constants not available, falling back to standard behavior');
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
      return this.userGroups.some(group => 
        group.permissions?.includes(permission)
      );
    };
  }

  @computed
  get isAdmin() {
    return this.userGroups.some(group => 
      group.name === 'admin' || group.role === 'admin'
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
      'nc_sameSiteCookielax',  // Nextcloud SameSite cookie
      'nc_sameSiteCookiestrict', // Nextcloud SameSite cookie
      'oc6fgt938z8c', // Nextcloud session ID
    ];

    const availableCookies = {};
    indicators.forEach(cookieName => {
      const value = document.cookie
        .split('; ')
        .find(row => row.startsWith(cookieName + '='));
      if (value) {
        availableCookies[cookieName] = value.split('=')[1];
      }
    });

    const hasAnyIndicators = Object.keys(availableCookies).length > 0;
    
    console.log('Authentication cookies check:', {
      hasIndicators: hasAnyIndicators,
      availableCookies: Object.keys(availableCookies),
      allCookies: document.cookie
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
        throw new Error('OpenConnector API URL not configured. Please check your environment setup.');
      }

      const loginUrl = `${containerConfig.getOpenconnectorApiUrl()}/user/login`;

      const response = await fetch(loginUrl, {
        method: 'POST',
        credentials: 'include', // Include cookies for session-based auth
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
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
        ['oc6fgt938z8c', 'oc_sessionPassphrase', 'nc_sameSiteCookielax', 'nc_sameSiteCookiestrict'].forEach(cookieName => {
          const value = document.cookie
            .split('; ')
            .find(row => row.startsWith(cookieName + '='));
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
        console.log('After fetchUserProfile - isAuthenticated:', this.isAuthenticated, 'user:', this.user);
        
        this.setLoading(false);
        return { success: true, user: this.user };
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Inloggen mislukt. Controleer uw gegevens.';
        this.setError(errorMessage);
        this.setLoading(false);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error.message || 'Inloggen mislukt. Controleer uw gegevens.';
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

      // Use the authenticated request helper instead of direct fetch
      const userData = await this.makeAuthenticatedRequest('/user/me', {
        method: 'GET',
      });

      console.log('Authentication check successful:', userData);
      this.setUser(userData);
      this.setAuthMethod('session');
      this.setLoading(false);
      return true;
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
      if (!containerConfig || !containerConfig.getOpenconnectorApiUrl) {
        console.warn('OpenConnector API URL not configured');
        return;
      }

      console.log('Fetching user profile...');
      
      // Use the authenticated request helper instead of direct fetch
      const userData = await this.makeAuthenticatedRequest('/user/me', {
        method: 'GET',
      });

      console.log('User profile fetched successfully:', userData);
      this.setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  // Update user profile data
  @action
  updateUser = async (userData) => {
    try {
      if (!containerConfig || !containerConfig.getOpenconnectorApiUrl) {
        console.warn('OpenConnector API URL not configured');
        throw new Error('API URL not configured');
      }

      console.log('Updating user profile:', userData);
      
      // Use the authenticated request helper to update user data
      const updatedUserData = await this.makeAuthenticatedRequest('/user/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      console.log('User profile updated successfully:', updatedUserData);
      
      // Update the local user state with the new data
      this.setUser(updatedUserData);
      
      // Return the response in the expected format for compatibility
      return { data: updatedUserData };
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
          if (containerConfig && containerConfig.getOpenconnectorApiUrl) {
            const logoutUrl = `${containerConfig.getOpenconnectorApiUrl()}/user/logout`;
            await fetch(logoutUrl, {
              method: 'POST',
              credentials: 'include',
            });
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
      'logout'  // Clear the logout cookie that causes immediate logout
    ];

    cookiesToClear.forEach(cookieName => {
      document.cookie = `${encodeURIComponent(cookieName)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
  };

  // Make authenticated API requests
  @action
  makeAuthenticatedRequest = async (endpoint, options = {}) => {
    const defaultOptions = {
      credentials: 'include', // Always include cookies for session auth
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    // Check what cookies are actually available
    console.log('Making authenticated request - available cookies:', document.cookie);
    
    // Priority order for authentication:
    // 1. OpenConnector access token (from login response)
    // 2. Nextcloud access token (from OAuth flow)
    // 3. Session cookies (automatic via credentials: 'include')
    
    const openconnectorToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('openconnector_access_token='));
    
    const nextcloudToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('nextcloud_access_token='));

    if (openconnectorToken) {
      const token = openconnectorToken.split('=')[1];
      defaultOptions.headers.Authorization = `Bearer ${token}`;
      console.log('Using OpenConnector access token for authentication');
    } else if (this.authMethod === 'oauth' && app.store.auth?.current_access_token) {
      defaultOptions.headers.Authorization = `Bearer ${app.store.auth.current_access_token}`;
      console.log('Using OAuth authentication with token');
    } else if (nextcloudToken) {
      const token = nextcloudToken.split('=')[1];
      defaultOptions.headers.Authorization = `Bearer ${token}`;
      console.log('Using Nextcloud access token for authentication');
    } else {
      console.log('Using session-based authentication with cookies only');
    }

    const baseUrl = containerConfig?.getOpenconnectorApiUrl() || '';
    const fullUrl = `${baseUrl}${endpoint}`;
    
    console.log('Making authenticated request:', {
      url: fullUrl,
      method: options.method || 'GET',
      headers: defaultOptions.headers,
      authMethod: this.authMethod,
      credentials: defaultOptions.credentials
    });

    const response = await fetch(fullUrl, {
      ...defaultOptions,
      ...options,
    });

    console.log('API Response:', {
      status: response.status,
      statusText: response.statusText,
      url: fullUrl,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      // If unauthorized, clear authentication
      if (response.status === 401) {
        console.log('Received 401 Unauthorized, clearing user authentication');
        this.clearUser();
      }
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
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

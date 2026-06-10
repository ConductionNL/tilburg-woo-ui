// Imports => MOBX
import { observable, computed, makeObservable, action, toJS } from 'mobx';

// Imports => Utilities
import { AcFormatErrorMessage } from '@utils/ac-format-error';

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

    // Initialize from localStorage on startup
    this.initializeFromStorage();
  }

  @observable
  user = null;

  @observable
  basicAuthCredentials = null; // Store username/password for basic auth fallback

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
    // Handle the groups array from the login response (simple string array)
    const groups = this.user?.groups || [];

    // Ensure authenticated users always have the 'user' group
    if (this.isAuthenticated && !groups.includes('user')) {
      return [...groups, 'user'];
    }

    return groups;
  }

  @computed
  get userOrganizations() {
    // Handle the organisations object structure from login response
    if (this.user?.organisations) {
      // Return the results array if it exists, otherwise return empty array
      return this.user.organisations.results || [];
    }
    // Fallback for legacy organizations field
    return this.user?.organizations || [];
  }

  @computed
  get activeOrganization() {
    // Get the active organization from the login response
    return this.user?.organisations?.active || null;
  }

  @computed
  get totalOrganizations() {
    // Get total count of organizations
    return this.user?.organisations?.total || 0;
  }

  @computed
  get hasPermission() {
    // eslint-disable-next-line no-unused-vars
    return (permission) => {
      // Since groups is now a simple string array, check if user has admin role
      // This would need to be expanded based on actual permission system
      return this.isAdmin;
    };
  }

  @computed
  get isAdmin() {
    // Check if user has 'admin' in their groups array (simple string check)
    return this.userGroups.includes('admin');
  }

  @computed
  get userDisplayName() {
    return this.user?.displayName || this.user?.name || '';
  }

  @computed
  get userEmail() {
    return this.user?.email || '';
  }

  @computed
  get userPhone() {
    return this.user?.phone || '';
  }

  @computed
  get userFullName() {
    const { firstName, middleName, lastName } = this.user || {};
    return (
      [firstName, middleName, lastName].filter(Boolean).join(' ') ||
      this.userDisplayName
    );
  }

  @computed
  get isEnabled() {
    return this.user?.enabled !== false; // Default to true if not specified
  }

  // Authentication utilities

  // Group and role checking methods
  @computed
  get hasGroup() {
    return (groupName) => {
      return this.userGroups.includes(groupName);
    };
  }

  @computed
  get hasRole() {
    // Alias for hasGroup since groups function as roles in this system
    return this.hasGroup;
  }

  @computed
  get hasAnyGroup() {
    return (groupNames) => {
      if (!Array.isArray(groupNames)) return false;
      return groupNames.some((group) => this.userGroups.includes(group));
    };
  }

  @computed
  get hasAllGroups() {
    return (groupNames) => {
      if (!Array.isArray(groupNames)) return false;
      return groupNames.every((group) => this.userGroups.includes(group));
    };
  }

  // Organization checking methods
  @computed
  get hasOrganization() {
    return (orgId) => {
      return this.userOrganizations.some(
        (org) => org.id === orgId || org.uuid === orgId || org.slug === orgId
      );
    };
  }

  @computed
  get isOwnerOfOrganization() {
    return (orgId) => {
      return this.userOrganizations.some(
        (org) =>
          (org.id === orgId || org.uuid === orgId || org.slug === orgId) &&
          org.owner === this.user?.uid
      );
    };
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

    // Save to localStorage whenever user data changes
    if (userData) {
      this.saveToStorage();
    }
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
      // Clear any existing logout cookie that would cause immediate logout
      document.cookie = 'logout=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';

      // Check for authentication tokens in the response
      if (data.access_token) {
        // Store access token as a cookie for future requests
        document.cookie = `openconnector_access_token=${data.access_token}; path=/; SameSite=Lax`;
        // TODO: Store token in localStorage for Bearer auth: AcSetAccessToken(data.access_token)
      }

      // Store basic auth credentials for fallback
      this.basicAuthCredentials = {
        username,
        password,
      };

      this.setAuthMethod('session');

      // If login response includes user data, use it directly
      // The login endpoint returns complete user data, so we don't need to call /me
      if (data.user) {
        this.setUser(data.user);
      } else {
        // Fallback: If login didn't include user data, fetch it from /me
        // This should rarely happen, but we keep it as a safety net
        try {
          await this.fetchUserProfile();
        } catch (profileError) {
          console.error('Failed to fetch user profile after login:', profileError);
          this.setError(
            'Login successful but failed to load user profile. Please refresh the page.'
          );
        }
      }

      // Save user state to localStorage for persistence across tabs
      this.saveToStorage();

      // Pre-warm backend cache in background (non-blocking) - only once per session
      if (!app.store.object.initialCacheWarmingCompleted) {
        // Fire and forget - don't await, don't block login success
        app.store.object
          .cacheLoad()
          .then(() => {
            console.info('✅ Background cache warming completed successfully');
          })
          .catch((cacheError) => {
            console.warn('⚠️ Background cache warming failed:', cacheError);
          });
      }

      // Warmup register cache (populates register ID -> slug mappings)
      app.store.object.warmupRegisterCache().catch((error) => {
        console.warn('⚠️ Register cache warmup failed during login:', error);
      });

      this.setLoading(false);
      return { success: true, user: this.user };
    } catch (error) {
      console.error('Login failed:', error);

      // Use the error formatting utility to extract the proper error message
      let errorMessage = 'Inloggen mislukt. Controleer uw gegevens.';

      // Try to extract a more specific error message
      if (error.response && error.response.data) {
        if (error.response.data.error) {
          // Handle {"error": "Invalid username or password"} format
          errorMessage = error.response.data.error;
        } else if (error.response.data.message) {
          // Handle {"message": "..."} format
          errorMessage = error.response.data.message;
        } else if (typeof error.response.data === 'string') {
          // Handle plain string responses
          errorMessage = error.response.data;
        } else {
          // Try using the formatting utility as a fallback
          const formattedError = AcFormatErrorMessage(error);
          if (formattedError && formattedError !== false) {
            errorMessage = formattedError;
          }
        }
      } else if (error.message) {
        // Fallback to error.message
        errorMessage = error.message;
      }

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
      // If we already have a user and are marked as authenticated, still refresh
      // the profile to ensure organisation data is current (prevents stale org UUID).
      if (this.isAuthenticated && this.user) {
        try {
          if (app.store.api && app.store.api.auth) {
            const userData = await app.store.api.auth.getUserProfile();
            this.setUser(userData);
          }
        } catch (e) {
          // Profile refresh failed — keep cached data rather than logging out
          console.warn('Profile refresh failed, using cached data:', e.message);
        }
        this.setLoading(false);
        return true;
      }

      if (!containerConfig || !containerConfig.getOpenconnectorApiUrl) {
        console.warn('OpenConnector API URL not configured');
        this.setLoading(false);
        return false;
      }

      // First check if we have any authentication indicators
      // Don't make API calls if there's no indication of authentication
      const hasSessionCookies = this.hasAuthCookies();
      if (!hasSessionCookies) {
        this.setLoading(false);
        return false;
      }

      // Use the proper API client instead of the authenticated request helper
      if (app.store.api && app.store.api.auth) {
        const userData = await app.store.api.auth.getUserProfile();
        this.setUser(userData);
        this.setAuthMethod('session');

        // Pre-warm backend cache in background (non-blocking) - only once per session
        if (!app.store.object.initialCacheWarmingCompleted) {
          // Fire and forget - don't await, don't block auth check
          app.store.object
            .cacheLoad()
            .then(() => {
              console.info('✅ Background cache warming completed successfully');
            })
            .catch((cacheError) => {
              console.warn('⚠️ Background cache warming failed:', cacheError);
            });
        }

        this.setLoading(false);

        // Warmup register cache when new session is detected (user was not authenticated before)
        if (app.store.object) {
          app.store.object.warmupRegisterCache().catch((error) => {
            console.warn(
              '⚠️ Register cache warmup failed during session check:',
              error
            );
          });
        }

        return true;
      } else {
        throw new Error('Auth API not available');
      }
    } catch (error) {
      console.error('Auth check failed:', error);

      // Fallback to OAuth if available
      if (app.store.auth?.is_authorized) {
        this.setAuthMethod('oauth');
        this.setLoading(false);

        // Warmup register cache when new session is detected (OAuth case)
        if (app.store.object) {
          app.store.object.warmupRegisterCache().catch((error) => {
            console.warn(
              '⚠️ Register cache warmup failed during OAuth session check:',
              error
            );
          });
        }

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
      // Use the proper API client instead of the authenticated request helper
      if (app.store.api && app.store.api.auth) {
        const userData = await app.store.api.auth.getUserProfile();
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
      // Use the proper API client instead of the authenticated request helper
      if (app.store.api && app.store.api.auth) {
        const updatedUserData = await app.store.api.auth.updateUserProfile(userData);

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
  oauthLogin = async () =>
    // credentials
    {
      this.setLoading(true);
      this.clearError();

      try {
        // const result = await app.store.auth.login(credentials);
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
    this.setLoading(true, 'Uitloggen...');

    try {
      // Clear cookies early so session is gone regardless of backend response
      this.clearNextcloudCookies();

      // If using session auth, try to call logout endpoint
      if (this.authMethod === 'session') {
        try {
          if (app.store.api && app.store.api.auth) {
            await app.store.api.auth.sessionLogout();
          }
        } catch (error) {
          console.error('Logout endpoint failed:', error);
        }
      }

      // Clear basic auth credentials
      this.basicAuthCredentials = null;

      // Clear OAuth tokens if they exist
      if (app.store.auth) {
        await app.store.auth.logout();
      }

      // Clear user data
      this.clearUser();

      // Clear localStorage
      this.clearStorage();

      // Reset cache warming flag to allow cache warming on next login
      if (app.store.object) {
        app.store.object.resetCacheWarmingFlag();
      }

      this.setLoading(false);

      // Clear cookies again after backend call to catch any that were re-set
      this.clearNextcloudCookies();

      return { success: true };
    } catch (error) {
      console.error('Logout failed:', error);
      this.clearUser();
      this.clearStorage();
      this.clearNextcloudCookies();
      this.setLoading(false);
      return { success: false, error: error.message };
    }
  };

  // Convenience login method that determines which auth method to use
  @action
  login = async (credentials) => {
    // Default to session login for now, could be expanded to auto-detect
    return await this.sessionLogin(credentials.username, credentials.password);
  };

  // Check if user can access a specific route
  @computed
  get canAccessRoute() {
    return (routePath) => {
      // Import AUTHENTICATION_REQUIRED_ROUTES to check if route requires auth
      try {
        const {
          AUTHENTICATION_REQUIRED_ROUTES,
        } = require('@constants/routes.constants');
        const requiresAuth = AUTHENTICATION_REQUIRED_ROUTES.some((route) => {
          // Handle parameterized routes by converting :param to regex
          const routePattern = route.replace(/:[^/]+/g, '[^/]+');
          const regex = new RegExp(`^${routePattern}$`);
          return regex.test(routePath);
        });

        // If route doesn't require auth, allow access
        if (!requiresAuth) return true;

        // If route requires auth, check if user is authenticated
        return this.isAuthenticated;
      } catch (error) {
        console.warn('Could not load route constants for access check:', error);
        // Default to allowing access if we can't check
        return true;
      }
    };
  }

  // Get user initials for avatars
  @computed
  get userInitials() {
    const fullName = this.userFullName;
    if (!fullName) return this.userDisplayName.substring(0, 2).toUpperCase();

    const nameParts = fullName.split(' ').filter(Boolean);
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    }
    return nameParts[0] ? nameParts[0].substring(0, 2).toUpperCase() : 'U';
  }

  // Clear Nextcloud authentication cookies
  @action
  clearNextcloudCookies = () => {
    // Known cookie names to clear explicitly
    const cookiesToClear = [
      'nextcloud_access_token',
      'nextcloud_refresh_token',
      'nextcloud_user_id',
      'nextcloud_client_id',
      'nextcloud_secret_key',
      'openconnector_access_token',
      'logout',
      'oc_sessionPassphrase',
      'nc_sameSiteCookielax',
      'nc_sameSiteCookiestrict',
      'nc_username',
      'nc_token',
      'nc_session_id',
      'sessionid',
      'csrftoken',
    ];

    const paths = ['/', '/index.php', '/apps'];
    const expiry = 'expires=Thu, 01 Jan 1970 00:00:00 GMT';

    cookiesToClear.forEach((cookieName) => {
      paths.forEach((path) => {
        document.cookie = `${cookieName}=; ${expiry}; path=${path}`;
      });
    });

    // Clear any remaining Nextcloud session cookies with dynamic names
    // (e.g. session ID cookies like "oc6fgt938z8c")
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0].trim();
      if (name.startsWith('oc') || name.startsWith('nc_')) {
        paths.forEach((path) => {
          document.cookie = `${name}=; ${expiry}; path=${path}`;
        });
      }
    });
  };

  // Get organization dashboard URL
  @action
  getOrganizationDashboardUrl = () => {
    // Always redirect to /beheer regardless of organizations
    // The admin dashboard will handle organization-specific content internally
    return '/beheer';
  };

  // LocalStorage persistence methods
  @action
  saveToStorage = () => {
    try {
      const userState = {
        user: toJS(this.user),
        isAuthenticated: this.isAuthenticated,
        authMethod: this.authMethod,
        basicAuthCredentials: this.basicAuthCredentials,
      };
      localStorage.setItem('woo-user-state', JSON.stringify(userState));
    } catch (error) {
      console.warn('Failed to save user state to localStorage:', error);
    }
  };

  @action
  initializeFromStorage = () => {
    try {
      const savedState = localStorage.getItem('woo-user-state');
      if (savedState) {
        const userState = JSON.parse(savedState);

        // Restore user state
        this.user = userState.user;
        this.isAuthenticated = userState.isAuthenticated || false;
        this.authMethod = userState.authMethod;
        this.basicAuthCredentials = userState.basicAuthCredentials;
      }
    } catch (error) {
      console.warn('Failed to restore user state from localStorage:', error);
    }
  };

  @action
  clearStorage = () => {
    try {
      localStorage.removeItem('woo-user-state');
    } catch (error) {
      console.warn('Failed to clear user state from localStorage:', error);
    }
  };
}

export default UserStore;

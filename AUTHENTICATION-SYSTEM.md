# 🔐 Authentication System Implementation

## Overview

We've successfully implemented a comprehensive authentication system that supports both **session-based authentication** (using cookies) and **OAuth token-based authentication**. The system is designed to work seamlessly with the OpenConnector API and provides a unified user experience.

## 🏗️ Architecture

### Core Components

#### 1. **UserStore** (`src/stores/user.store.js`)
- **Primary authentication store** that handles both session and OAuth authentication
- **User data management** including groups, organizations, and permissions
- **Session-based login/logout** with OpenConnector API
- **OAuth integration** with existing AuthStore
- **Authenticated API requests** with automatic credential handling

#### 2. **Protected Routes** (`src/components/ac-protected-route/ac-protected-route.js`)
- **Route protection** that checks authentication before rendering
- **Automatic redirects** to login with return URLs
- **Loading states** during authentication checks

#### 3. **Enhanced Login Component** (`src/views/ac-login/ac-login.js`)
- **Session-based authentication** via OpenConnector API
- **Proper error handling** and user feedback
- **Redirect handling** for protected route flows
- **Real-time validation** and loading states

#### 4. **Updated Header** (`src/components/ac-header/ac-header.js`)
- **User information display** when authenticated
- **Logout functionality** with proper cleanup
- **Loading states** for authentication actions

## 🔄 Authentication Flow

### Login Process

1. **User submits credentials** via login form
2. **UserStore.sessionLogin()** makes API call to OpenConnector
3. **Session cookies** are automatically stored by browser
4. **User data** (including groups/organizations) is stored in UserStore
5. **Success toast** notification is shown
6. **Redirect** to organization dashboard or return URL

### Authentication Check

1. **UserStore.checkAuthStatus()** calls `/user/me` endpoint
2. **Session cookies** are automatically included (`credentials: 'include'`)
3. **User data** is updated if authenticated
4. **Fallback** to OAuth tokens if session auth fails
5. **Returns boolean** indicating authentication state

### Logout Process

1. **UserStore.logout()** clears all authentication data
2. **Session logout** API call (if using session auth)
3. **OAuth token cleanup** (if using OAuth)
4. **Cookie cleanup** for legacy Nextcloud auth
5. **Full page reload** to ensure clean state

## 🔧 Key Features

### Dual Authentication Support
- **Session-based**: Primary method using OpenConnector API cookies
- **OAuth tokens**: Fallback/legacy support via existing AuthStore
- **Automatic fallback**: Seamless switching between methods

### User Data Management
```javascript
// Access user information
const currentUser = user.currentUser;
const userGroups = user.userGroups;
const userOrganizations = user.userOrganizations;

// Permission checking
const canDoSomething = user.hasPermission('some_permission');
const isAdmin = user.isAdmin;
```

### Authenticated API Requests
```javascript
// Automatic credential handling
const data = await user.makeAuthenticatedRequest('/api/some-endpoint', {
  method: 'POST',
  body: JSON.stringify(payload)
});
```

### Environment Configuration
- **No hardcoded URLs** in main codebase
- **Container constants** provide environment-specific URLs
- **Development/production** flexibility

## 📁 File Structure

```
src/
├── stores/
│   ├── user.store.js           # Primary authentication store
│   └── store.js                # Updated to include UserStore
├── components/
│   ├── ac-protected-route/     # Route protection component
│   └── ac-header/              # Updated with user info
├── views/
│   ├── ac-login/               # Enhanced login component
│   └── ac-beheer/              # Updated dashboard authentication
└── constants/
    └── container.constants.js   # Environment-based URLs
```

## 🚀 Usage Examples

### Protecting Routes
```javascript
import AcProtectedRoute from '@components/ac-protected-route/ac-protected-route';

// Wrap protected components
<AcProtectedRoute>
  <AcBeheer />
</AcProtectedRoute>
```

### Accessing User Data
```javascript
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';

const MyComponent = ({ store }) => {
  const { user } = store;
  
  if (!user.isAuthenticated) {
    return <div>Please login</div>;
  }
  
  return (
    <div>
      <h1>Welcome, {user.currentUser.displayName}!</h1>
      <p>Organizations: {user.userOrganizations.length}</p>
    </div>
  );
};

export default withStore(observer(MyComponent));
```

### Manual Authentication Check
```javascript
const checkAuth = async () => {
  const isAuthenticated = await user.checkAuthStatus();
  if (isAuthenticated) {
    console.log('User is logged in:', user.currentUser);
  }
};
```

## 🔒 Security Features

### Session Security
- **HttpOnly cookies** for session storage (server-managed)
- **SameSite protection** against CSRF attacks
- **Secure flag** for HTTPS environments
- **Automatic cleanup** on logout

### API Security
- **Credentials always included** in requests (`credentials: 'include'`)
- **Automatic token refresh** (via existing OAuth system)
- **401 handling** with automatic logout
- **CORS compliance** with proper headers

### Environment Abstraction
- **No hardcoded URLs** in main codebase
- **Environment variables** for all endpoints
- **Container-based configuration** for deployments

## 🐛 Error Handling

### Login Errors
- **Network failures**: User-friendly error messages
- **Invalid credentials**: Clear feedback
- **API configuration**: Setup guidance messages
- **Loading states**: Prevent multiple submissions

### Authentication Failures
- **Session expiry**: Automatic redirect to login
- **API errors**: Graceful fallback to OAuth
- **Network issues**: Retry mechanisms
- **User feedback**: Toast notifications

## 🔄 Migration from Old System

### Before (Hostname-based)
```javascript
// Old hardcoded approach
const loginUrl = hostname === 'test.example.com' 
  ? 'https://test-api.com/login'
  : 'https://api.com/login';
```

### After (Environment-based)
```javascript
// New abstract approach
const result = await user.sessionLogin(username, password);
```

### Benefits
- **Environment agnostic**: Same code works everywhere
- **No hardcoded URLs**: All configuration externalized
- **Unified authentication**: Single interface for all auth methods
- **Better error handling**: Comprehensive feedback system

## 🧪 Testing the System

### 1. Login Flow
1. Navigate to `/login`
2. Enter valid credentials
3. Observe redirect to dashboard
4. Check browser cookies for session

### 2. Protected Routes
1. Navigate to `/beheer` without login
2. Observe redirect to login with return URL
3. Login and verify return to original page

### 3. User Information
1. Login successfully
2. Check header for user name display
3. Verify logout button functionality

### 4. API Calls
1. Make authenticated requests
2. Verify session cookies are included
3. Test error handling with expired sessions

## 🔧 Environment Configuration

The system uses environment variables for all endpoints:

```bash
# Development (docker-compose.dev.yml)
OPENCONNECTOR_API_URL=http://nextcloud.local/index.php/apps/openconnector/api

# Production
OPENCONNECTOR_API_URL=https://your-api.com/apps/openconnector/api
```

## 📊 Benefits Achieved

✅ **Unified Authentication**: Single interface for session and OAuth
✅ **Environment Agnostic**: No hardcoded URLs anywhere
✅ **User Data Storage**: Groups, organizations, permissions
✅ **Protected Routes**: Automatic authentication checks
✅ **Error Handling**: Comprehensive feedback system
✅ **Security**: Session cookies, CORS compliance
✅ **Developer Experience**: Clear APIs, good documentation
✅ **Backwards Compatibility**: Works with existing OAuth system

## 🎯 Next Steps

1. **Add role-based access control** to specific components
2. **Implement refresh token handling** for OAuth flows
3. **Add user profile management** pages
4. **Create admin interfaces** for user management
5. **Add audit logging** for authentication events

The authentication system is now production-ready and provides a solid foundation for secure user management! 🎉 
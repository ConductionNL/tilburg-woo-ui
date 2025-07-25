import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { useNavigate, useLocation } from 'react-router';
import { AcLoader } from '@components';

const AcProtectedRoute = ({ children, store, requireAuth = true, fallbackPath = '/login' }) => {
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = store;

  useEffect(() => {
    const checkAuthentication = async () => {
      if (requireAuth) {
        const isAuthenticated = await user.checkAuthStatus();
        
        if (!isAuthenticated) {
          // Redirect to login with return URL
          const returnUrl = encodeURIComponent(location.pathname + location.search);
          navigate(`${fallbackPath}?redirect_url=${returnUrl}`);
          return;
        }
      }
      
      setIsChecking(false);
    };

    checkAuthentication();
  }, [user, navigate, location, requireAuth, fallbackPath]);

  // Show loading while checking authentication
  if (isChecking) {
    return <AcLoader />;
  }

  // If we're here, user is authenticated or authentication is not required
  return children;
};

export default withStore(observer(AcProtectedRoute)); 

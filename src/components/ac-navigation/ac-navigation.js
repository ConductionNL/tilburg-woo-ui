import React, { useEffect } from 'react';
import { LABELS, VISUALS } from '@constants';
import { Link, useLocation } from 'react-router-dom';
import { AcCheckIfSpecificHostname } from '@src/services/ac-check-if-specific-hostname';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router';

const AcNavigation = ({ store: { menu, user } }) => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const navigate = useNavigate();

  const pathname = window.location.pathname;

  const { fetchMenus, getMenuFromPosition, is_loading: menu_loading } = menu;
  
  // Get main navigation from position 1 with authentication filtering
  const activeMenu = getMenuFromPosition(1, user.isAuthenticated);
  


  // Icon component for finding icons based on a variable
  const Icon = ({ icon }) => {
    const Icon = VISUALS[icon];
    if (!Icon) return <></>;
    return <Icon />;
  };

  useEffect(() => {
    setIsMenuOpen(false);
    fetchMenus();
  }, [location]);

  const handleLogout = async () => {
    try {
      await user.logout();
      // Navigate to home page after logout
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      // Fallback: navigate to home anyway
      navigate('/');
    }
  };

  return (
    <div className='ac-navigation'>
      <button
        onClick={() => setIsMenuOpen((prevState) => !prevState)}
        aria-expanded={isMenuOpen}
        aria-haspopup='true'
      >
        {isMenuOpen ? <VISUALS.CLOSE /> : <VISUALS.MENU />}
        {isMenuOpen ? LABELS.CLOSE_SINGULAR : LABELS.MENU}
      </button>
      <nav aria-label='Hoofd'>
        {activeMenu && activeMenu.items && Array.isArray(activeMenu.items) && activeMenu.items.length > 0 && (
          <ul>
            {activeMenu.items.map((menuItem) => (
              <li key={menuItem.name || menuItem.link}>
                <Link to={menuItem.link}>
                  <Icon icon={menuItem.icon} />
                  {menuItem.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </div>
  );
};

export default withStore(observer(AcNavigation));

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
  // Get main navigation from position 1
  const menus = getMenuFromPosition(1);
  
  // Debug logging to help understand menu structure
  if (process.env.NODE_ENV === 'development') {
    console.log('AcNavigation - menus (position 1):', menus);
    console.log('AcNavigation - menus.items:', menus?.items);
  }

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
        {(menus && menus.items && Array.isArray(menus.items) && !user.isAuthenticated && (
          <ul>
            {menus.items.map((menuItem) => (
              <li key={menuItem.name || menuItem.link}>
                <Link to={menuItem.link}>
                  <Icon icon={menuItem.icon} />
                  {menuItem.name}
                </Link>
              </li>
            ))}
          </ul>
        )) ||
          (AcCheckIfSpecificHostname() && (
            <>
              {!pathname.includes('beheer') && !user.isAuthenticated ? (
                <ul>
                  <li>
                    <Link to='/register'>
                      <VISUALS.PERSON_ADD />
                      Aanmelden
                    </Link>
                  </li>
                  <li>
                    <Link to='/login'>
                      <VISUALS.KEY />
                      Inloggen
                    </Link>
                  </li>
                </ul>
              ) : (
                <ul>
                  <li>
                    <Link to='/beheer'>
                      <VISUALS.CHART_LINE />
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link to='/account'>
                      <VISUALS.USER />
                      Account
                    </Link>
                  </li>
                  <li>
                    <Link to='#' onClick={handleLogout}>
                      <VISUALS.RIGHT_FROM_BRACKET />
                      Logout
                    </Link>
                  </li>
                </ul>
              )}
            </>
          )) || (
            <ul>
              <li>
                <Link to='/over-ons'>
                  <VISUALS.INFO />
                  Over Open Tilburg
                </Link>
              </li>
              <li>
                <Link to='/onderwerpen'>
                  <VISUALS.LIST />
                  Onderwerpen
                </Link>
              </li>
              <li>
                <Link to='/contact'>
                  <VISUALS.CONTACT />
                  Contact
                </Link>
              </li>
            </ul>
          )}
      </nav>
    </div>
  );
};

export default withStore(observer(AcNavigation));

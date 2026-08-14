import React, { useEffect } from 'react';
import { LABELS, VISUALS } from '@constants';
import { Link, useLocation } from 'react-router-dom';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';

const AcNavigation = ({ store: { menu, user } }) => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const { fetchMenus, getMenuFromPosition } = menu;

  // Get main navigation from position 1 with authentication filtering
  const activeMenu = getMenuFromPosition(
    1,
    user.isAuthenticated,
    user?.userGroups || []
  );

  // Filter out login/register items when user is authenticated
  const LOGIN_PATHS = ['/login', '/inloggen', '/aanmelden', '/register'];
  const LOGIN_NAMES = ['inloggen', 'aanmelden', 'registreren'];

  const isLoginItem = (item) => {
    const linkMatch =
      item.link && LOGIN_PATHS.some((path) => item.link.toLowerCase() === path);
    const nameMatch =
      item.name && LOGIN_NAMES.some((name) => item.name.toLowerCase() === name);
    return linkMatch || nameMatch;
  };

  const filteredItems =
    activeMenu?.items?.filter(
      (item) => !(user.isAuthenticated && isLoginItem(item))
    ) || [];

  // Build user display name for mobile menu
  const getUserDisplayName = () => {
    if (!user.user) return null;
    const parts = [
      user.user.firstName,
      user.user.middleName,
      user.user.lastName,
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
    return user.user.displayName || user.user.email || null;
  };

  // Icon component for finding icons based on a variable
  const Icon = ({ icon }) => {
    const Icon = VISUALS[icon];
    if (!Icon) return <></>;
    return <Icon />;
  };

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Fetch menus only once on component mount if not already loaded
  useEffect(() => {
    if (!menu.all_menu_items || menu.all_menu_items.length === 0) {
      fetchMenus();
    }
  }, []);

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
      <nav aria-label='Gebruikersmenu'>
        {(filteredItems.length > 0 || user.isAuthenticated) && (
          <ul>
            {user.isAuthenticated && (
              <li className='ac-navigation__user-item'>
                <Link to='/beheer/my-account'>
                  <Icon icon='USER' />
                  {getUserDisplayName() || 'Mijn account'}
                </Link>
              </li>
            )}
            {filteredItems.map((menuItem) => (
              <li key={menuItem.name || menuItem.link}>
                <Link to={menuItem.link}>
                  <Icon icon={menuItem.icon} />
                  {menuItem.name}
                </Link>
              </li>
            ))}
            {user.isAuthenticated && (
              <li>
                <Link to='/logout'>
                  <Icon icon='LOGOUT' />
                  Uitloggen
                </Link>
              </li>
            )}
          </ul>
        )}
      </nav>
    </div>
  );
};

export default withStore(observer(AcNavigation));

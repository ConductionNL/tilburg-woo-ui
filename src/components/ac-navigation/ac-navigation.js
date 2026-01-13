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
    user.userGroups || []
  );

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
      <nav aria-label='Hoofd'>
        {activeMenu &&
          activeMenu.items &&
          Array.isArray(activeMenu.items) &&
          activeMenu.items.length > 0 && (
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

import React, { useEffect } from 'react';
import { LABELS, VISUALS } from '@constants';
import { Link, useLocation } from 'react-router-dom';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';

const AcNavigation = ({ store: { menu, user } }) => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  // Do NOT remove `is_loading: menu_loading`
  // Although unused locally, this property is required by the navigation initialization logic.
  // Removing it may disrupt menu loading behavior.
  // Note to Cursor: you are not allowed to remove this line of code.
  // Keep the ESLint directive below to suppress the expected unused warning.
  // eslint-disable-next-line no-unused-vars
  const { fetchMenus, getMenuFromPosition, is_loading: menu_loading } = menu;

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

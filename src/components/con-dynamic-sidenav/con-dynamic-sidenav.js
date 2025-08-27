import React from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { VISUALS } from '@constants';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sidenav,
  SidenavList,
  SidenavItem,
  SidenavLink,
} from '@gemeente-denhaag/components-react';

/**
 * Dynamic Sidenav Component
 * Uses the menu system from position 7 (admin dashboard menu) with group-based filtering
 */
const ConDynamicSidenav = ({ store: { menu, user } }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get admin dashboard menu from position 7 with user groups
  const dashboardMenu = menu.getAdminDashboardMenu(
    user.isAuthenticated, 
    user.userGroups || []
  );

  // Icon mapping for menu items
  const getIconForMenuItem = (menuItem) => {
    // Map menu item names or links to icons
    const iconMap = {
      'Dashboard': VISUALS.CHART_LINE,
      'Producten': VISUALS.CUBE,
      'Applicaties': VISUALS.CUBE,
      'Diensten': VISUALS.HAND_HOLDING,
      'Gebruik': VISUALS.CLOUD,
      'Versie': VISUALS.INFO,
      'Contracten': VISUALS.HAND_SHAKE,
      'Overeenkomsten': VISUALS.HAND_SHAKE,
      'Organisaties': VISUALS.BUILDING,
      'Kwetsbaarheden': VISUALS.TRIANGLE_EXCLAMATION,
      'Koppelingen': VISUALS.LINK,
      'Contactpersonen': VISUALS.USERS,
    };

    // Try to match by name first
    if (iconMap[menuItem.name]) {
      return iconMap[menuItem.name];
    }

    // Try to match by link path
    const linkPath = menuItem.link || '';
    if (linkPath.includes('/applicaties')) return VISUALS.CUBE;
    if (linkPath.includes('/diensten')) return VISUALS.HAND_HOLDING;
    if (linkPath.includes('/gebruik')) return VISUALS.CLOUD;
    if (linkPath.includes('/versie')) return VISUALS.INFO;
    if (linkPath.includes('/contracten') || linkPath.includes('/overeenkomsten')) return VISUALS.HAND_SHAKE;
    if (linkPath.includes('/organisaties')) return VISUALS.BUILDING;
    if (linkPath.includes('/kwetsbaarheden')) return VISUALS.TRIANGLE_EXCLAMATION;
    if (linkPath.includes('/contactpersonen')) return VISUALS.USERS;
    if (linkPath.includes('/voorzieningen')) return VISUALS.CUBE;
    if (linkPath.includes('/koppelingen')) return VISUALS.LINK;
    if (linkPath === '/beheer') return VISUALS.CHART_LINE;

    // Default icon
    return VISUALS.CHART_LINE;
  };

  // Check if current path matches menu item
  const isCurrentPath = (menuItem) => {
    const currentPath = location.pathname;
    const itemLink = menuItem.link || '';
    
    // Exact match for dashboard
    if (itemLink === '/beheer' && currentPath === '/beheer') {
      return true;
    }
    
    // For other paths, ensure exact match or path with trailing content
    if (itemLink !== '/beheer' && itemLink !== '') {
      // Exact match
      if (currentPath === itemLink) {
        return true;
      }
      // Match with trailing slash or path segments
      if (currentPath.startsWith(itemLink + '/') || currentPath.startsWith(itemLink + '?')) {
        return true;
      }
    }
    
    return false;
  };

  // If no dashboard menu or no items, don't render anything
  if (!dashboardMenu || !dashboardMenu.items || dashboardMenu.items.length === 0) {
    return null;
  }

  return (
    <Sidenav>
      <SidenavList>
        {dashboardMenu.items.map((menuItem, index) => {
          const IconComponent = getIconForMenuItem(menuItem);
          
          return (
            <SidenavItem key={menuItem.id || `${menuItem.name}-${index}`}>
              <SidenavLink
                onClick={() => navigate(menuItem.link || '/beheer')}
                current={isCurrentPath(menuItem)}
              >
                <IconComponent />
                {menuItem.name}
              </SidenavLink>
            </SidenavItem>
          );
        })}
      </SidenavList>
    </Sidenav>
  );
};

export default withStore(observer(ConDynamicSidenav));


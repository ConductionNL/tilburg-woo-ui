# Menu System Documentation

## Overview

The Tilburg Woo UI application uses a dynamic menu system that pulls all menu items from the backend API. The system no longer filters by position - instead, it displays all available menu items and lets the backend control the structure and organization.

## API Endpoint

All menu data is fetched from:
```
GET /api/apps/opencatalogi/api/menus
```

## Menu Structure

The menu system consists of multiple positions, each containing menu items. Each position represents a different section of the application's navigation.

### Position 1: Header Navigation
- **Location**: Main header navigation bar
- **Purpose**: Primary navigation items, typically including authentication and main site navigation
- **Common Items**:
  - Login/Aanmelden links
  - Main site navigation
  - User account related items

### Position 2: Secondary Navigation
- **Location**: Secondary header navigation area
- **Purpose**: Additional navigation options and secondary menu items
- **Common Items**:
  - Secondary site navigation
  - Additional user options
  - Site-specific navigation items

### Position 3: Footer Navigation (Left)
- **Location**: Left side of the footer
- **Purpose**: Footer navigation links and site information
- **Common Items**:
  - Site map links
  - Legal information
  - Contact details

### Position 4: Footer Navigation (Center)
- **Location**: Center of the footer
- **Purpose**: Additional footer navigation and resources
- **Common Items**:
  - Quick links
  - Resource links
  - Additional navigation options

### Position 5: Footer Navigation (Right)
- **Location**: Right side of the footer
- **Purpose**: Final footer navigation and branding
- **Common Items**:
  - Brand information
  - Social media links
  - Final navigation items

### Position 6+: Additional Positions
- **Location**: Various locations throughout the application
- **Purpose**: Additional menu sections as needed
- **Common Items**:
  - Context-specific navigation
  - Additional user options
  - Extended navigation features

## Menu Item Properties

Each menu item contains the following properties:

```json
{
  "order": 1,
  "name": "Item Name",
  "slug": "/item-slug",
  "link": "/item-link",
  "description": "Item description",
  "icon": "ICON_NAME",
  "groups": ["all"],
  "items": []
}
```

### Property Descriptions

- **`order`**: Display order within the position
- **`name`**: Human-readable name for the menu item
- **`slug`**: URL-friendly identifier
- **`link`**: Actual navigation link
- **`description`**: Descriptive text for the item
- **`icon`**: Icon identifier for visual representation
- **`groups`**: Access control groups
- **`items`**: Nested sub-menu items

## Display Logic

### Before (Position-Based Filtering)
The application previously used `MENU_POSITION` environment variable to filter which menu items were displayed:
- Only items from the specified position were shown
- Authentication items were filtered out
- Complex filtering logic was applied

### After (No Filtering)
The application now displays ALL menu items without filtering:
- **Header**: Shows all menu items from all positions
- **Footer**: Shows all menu items from all positions
- **No filtering**: Backend has full control over what gets displayed

## Configuration

### Environment Variables (Removed)
The following environment variable has been removed:
```bash
# OLD - No longer used
MENU_POSITION=1

# NEW - No position filtering
# All menu items are displayed
```

### Backend Control
The backend now controls:
- Which menu items are available
- How items are organized by position
- What gets displayed in each section
- Access control and permissions

## Benefits of the New System

1. **Simplified Logic**: No complex filtering in the frontend
2. **Backend Control**: Full control over menu structure
3. **Flexibility**: Easy to add/remove menu items without code changes
4. **Maintainability**: Cleaner, more maintainable code
5. **Consistency**: All menu items follow the same display pattern

## Migration Notes

### For Developers
- Remove any `MENU_POSITION` references from environment files
- Update any hardcoded menu position logic
- Ensure menu components can handle all menu items

### For Backend Administrators
- Use the menu API to control what gets displayed
- Organize menu items by position as needed
- Ensure proper access control through groups

## Example API Response

```json
{
  "results": [
    {
      "id": "58cfebfd-23ee-427b-9bdc-a4dd5c6be0cb",
      "title": "Positie 1",
      "position": 1,
      "items": [
        {
          "order": 1,
          "name": "Login",
          "slug": "/login",
          "link": "/login",
          "description": "User login",
          "icon": "CHEVRON_RIGHT",
          "groups": ["all"]
        }
      ]
    },
    {
      "id": "f545b967-921d-43ba-86df-37aeead93be4",
      "title": "Positie 2",
      "position": 2,
      "items": [
        {
          "order": 1,
          "name": "Navigation",
          "slug": "navigation",
          "link": "",
          "description": "Main navigation",
          "icon": "",
          "groups": ["all"]
        }
      ]
    }
  ]
}
```

## Troubleshooting

### Menu Items Not Showing
1. Check if the menu API is returning data
2. Verify that menu items have proper `groups` permissions
3. Ensure the frontend is not filtering items
4. Check browser console for any JavaScript errors

### Menu Items in Wrong Location
1. Verify the `position` value in the backend
2. Check if the frontend is respecting position values
3. Ensure proper menu component rendering

### Performance Issues
1. Monitor the size of menu data returned by the API
2. Consider pagination for large menu structures
3. Implement caching if needed

## Future Enhancements

Potential improvements to consider:
1. **Menu Caching**: Cache menu data for better performance
2. **Dynamic Loading**: Load menu items on-demand
3. **Menu Templates**: Predefined menu layouts for common use cases
4. **Menu Builder**: Admin interface for managing menu structures
5. **Access Control**: More granular permission system for menu items

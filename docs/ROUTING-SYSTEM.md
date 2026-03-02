# Routing System Documentation

## Overview

The Tilburg Woo UI application uses React Router for client-side routing. The routing system is configured to handle both static routes and CMS-driven dynamic pages.

## Routing Architecture

### Core Components

- **App.web.js**: Main routing container with Routes configuration
- **src/constants/routes.constants.js**: Route definitions and configuration
- **React Router**: Uses 'react-router-dom' for navigation and routing

### Route Types

1. **Static Routes**: Predefined application routes
2. **CMS-driven Routes**: Dynamic pages fetched from the backend
3. **Protected Routes**: Authentication-required routes

## Route Configuration

Routes are defined in 'src/constants/routes.constants.js' with the following structure:

```javascript
export const PATHS = {
  HOME: '/',
  REGISTER: '/register',
  FORMS_REGISTER: '/forms/register',
  FORMS_GEBRUIK: '/forms/gebruik',
  FORMS_PRODUCT: '/forms/product',
  FORMS_KOPPELING: '/forms/koppeling',
  // ... other routes
};

export const ROUTES = {
  HOME: {
    id: 'unique-id',
    name: 'Home',
    path: PATHS.HOME,
    component: AcHome,
    title: 'Page Title'
  },
  // ... other route definitions
};
```

## Form Routes System

### New Forms Architecture

As of the latest update, the application now supports multiple form types under the '/forms' namespace:

#### Available Form Routes

1. **'/forms/register'** - Organization registration form
   - Component: 'AcRegister'
   - API Endpoint: '/openregister/api/objects/vng-gemma/register'
   - Purpose: Register new organizations in the system

2. **'/forms/gebruik'** - Usage registration form  
   - Component: 'AcFormsGebruik'
   - API Endpoint: '/openregister/api/objects/vng-gemma/gebruik'
   - Purpose: Register usage of products/services

3. **'/forms/product'** - Product registration form
   - Component: 'AcFormsProduct' 
   - API Endpoint: '/openregister/api/objects/vng-gemma/product'
   - Purpose: Register new products in the catalog

4. **'/forms/koppeling'** - Integration registration form
   - Component: 'AcFormsKoppeling'
   - API Endpoint: '/openregister/api/objects/vng-gemma/koppeling' 
   - Purpose: Register system integrations/connections

### Form Component Structure

All form components follow the same architectural pattern:

```javascript
// Base structure for all forms
const AcFormsExample = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({ message: null, errors: null });
  const [currentStep, setCurrentStep] = useState(0);
  const [organization, setOrganization] = useState({
    // form data structure
  });

  const handleRegister = async () => {
    // POST to specific endpoint based on form type
    const response = await fetch(
      '${BASE_URL}/openregister/api/objects/vng-gemma/{type}',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(organizationData),
      }
    );
  };

  // Form rendering with ProcessSteps, validation, etc.
};
```

### API Endpoints

Each form type posts to its dedicated API endpoint:

| Form Type | Endpoint | Purpose |
|-----------|----------|---------|
| Register | '/openregister/api/objects/vng-gemma/register' | Organization registration |
| Gebruik | '/openregister/api/objects/vng-gemma/gebruik' | Usage registration |  
| Product | '/openregister/api/objects/vng-gemma/product' | Product registration |
| Koppeling | '/openregister/api/objects/vng-gemma/koppeling' | Integration registration |

## Protected Routes

Authentication-required routes are defined in:

```javascript
export const AUTHENTICATION_REQUIRED_ROUTES = [
  PATHS.BEHEER,
  PATHS.BEHEER_TYPE,
  PATHS.BEHEER_TYPE_DETAILS,
  PATHS.MY_ACCOUNT,
];
```

These routes use the 'AcProtectedRoute' component to enforce authentication.

## Route Components

### Loadable Components

All route components use '@loadable/component' for code splitting:

```javascript
const AcFormsGebruik = loadable(() => 
  import('@views/ac-forms/ac-forms-gebruik/ac-forms-gebruik')
);
```

### Component Organization

```
src/views/
├── ac-forms/                    # New forms directory
│   ├── ac-forms-gebruik/
│   │   └── ac-forms-gebruik.js
│   ├── ac-forms-product/
│   │   └── ac-forms-product.js
│   ├── ac-forms-koppeling/
│   │   └── ac-forms-koppeling.js
│   └── index.js
├── ac-register/                 # Original register form
│   └── ac-register.js
└── index.js                     # Main exports
```

## Navigation Integration

### Legacy Route Support

The original '/register' route is maintained for backward compatibility:

- **'/register'** → Uses 'AcRegister' component
- **'/forms/register'** → Also uses 'AcRegister' component  

### Route Transitions

The application supports smooth transitions between routes using React Router's navigation system.

## Configuration

### Environment Variables

No specific environment variables are required for the routing system. Routes are statically defined in the constants file.

### Dynamic Route Generation

Routes are automatically registered in 'App.web.js':

```javascript
// Static routes from ROUTES configuration
{Object.values(ROUTES)
  .filter((route) => route.component)
  .map((route) => (
    <Route
      key={route.id}
      path={route.path}
      element={
        requiresAuth ? (
          <AcProtectedRoute requireAuth={true} fallbackPath="/login">
            <route.component store={store} />
          </AcProtectedRoute>
        ) : (
          <route.component store={store} />
        )
      }
    />
  ))}
```

## Benefits of Current System

1. **Centralized Configuration**: All routes defined in one location
2. **Type Safety**: Consistent path definitions via PATHS constants
3. **Code Splitting**: Loadable components for better performance  
4. **Protected Routes**: Integrated authentication system
5. **Form Modularity**: Separate endpoints for different form types

## Usage Examples

### Adding New Routes

1. Add path to 'PATHS' object:
```javascript
export const PATHS = {
  // existing paths...
  NEW_FORM: '/forms/new-form',
};
```

2. Add route to 'ROUTES' object:
```javascript
export const ROUTES = {
  // existing routes...
  NEW_FORM: {
    id: AcUUID(),
    name: 'New Form',
    label: 'New Form',
    path: PATHS.NEW_FORM,
    component: AcFormsNew,
    title: 'New Form Title',
  },
};
```

3. Create and export component in 'src/views/index.js'

### Navigation

```javascript
// Using React Router hooks
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/forms/gebruik'); // Navigate to usage form
```

### URL Parameters

Routes support dynamic parameters:

```javascript
BEHEER_TYPE_DETAILS: '/beheer/:type/:id',
```

Access via:
```javascript
import { useParams } from 'react-router-dom';
const { type, id } = useParams();
```

## Migration Notes

### From Legacy System

The new forms system maintains backward compatibility:

- Old '/register' route continues to work
- New '/forms/*' namespace provides organized form structure
- All existing functionality preserved

### For Developers

- Use 'PATHS' constants instead of hardcoded paths
- Import components from 'src/views/index.js'
- Follow loadable component pattern for new routes
- Use 'AcProtectedRoute' for authenticated routes

## Troubleshooting

### Route Not Found

1. Check if route is defined in 'PATHS' and 'ROUTES'
2. Verify component is properly exported
3. Ensure component import path is correct
4. Check for typos in route configuration

### Component Not Loading

1. Verify loadable import path
2. Check if component export is correct
3. Look for JavaScript errors in browser console
4. Ensure all dependencies are available

### Authentication Issues

1. Check if route is in 'AUTHENTICATION_REQUIRED_ROUTES'
2. Verify user authentication status
3. Check 'AcProtectedRoute' configuration
4. Ensure proper fallback paths are set

## Future Enhancements

Potential improvements:
1. **Route Lazy Loading**: Further optimize code splitting
2. **Route Guards**: More granular permission system
3. **Route Analytics**: Track navigation patterns
4. **Dynamic Routes**: Runtime route registration
5. **Route Caching**: Cache route components for performance

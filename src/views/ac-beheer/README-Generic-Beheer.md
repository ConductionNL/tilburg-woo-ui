# Generic Beheer System

This document explains how the generic beheer system works and how to work with it.

## System Overview

The generic beheer system replaces individual beheer pages with a single configurable component. It consists of:

- **ConGenericBeheerPage** - Main component that handles all beheer functionality
- **BeheerPageConfigFactory** - Creates configuration objects for different beheer types
- **BeheerModalFactory** - Manages modal components and their props
- **FilterDrawerFactory** - Manages filter drawer components
- **ConBeheerPageWrapper** - Simple wrapper for easy usage

## How It Works

### Factory Pattern

The system uses factories to manage different configurations:

```javascript
// Configuration factory creates config objects
const config = BeheerPageConfigFactory.createConfig('applicaties');

// Modal factory loads modal components
const ModalComponent = BeheerModalFactory.getModalComponent('applicaties', 'add');

// Filter factory manages filter drawers
const FilterComponent = FilterDrawerFactory.getFilterDrawerComponent('organisaties');
```

### Error Handling

The generic page handles unknown types gracefully:

```javascript
// In ConGenericBeheerPage
const config = useMemo(() => {
  try {
    const baseConfig = BeheerPageConfigFactory.createConfig(type);
    return { ...baseConfig, ...configOverrides };
  } catch (err) {
    // If configuration doesn't exist for this type, return null
    return null;
  }
}, [type, configOverrides]);

// If no configuration exists for this type, show wrong page
if (!config) {
  return (
    <AcSection spacing>
      <AcContainer>
        <AcColumn gap='tiger'>
          <AcColumn>
            <Heading>{LABELS.WRONG_PAGE}</Heading>
          </AcColumn>
        </AcColumn>
      </AcContainer>
    </AcSection>
  );
}
```

### Request Management

The system cancels outdated requests to prevent race conditions:

```javascript
// When switching object types
useEffect(() => {
  object.cancelAllRequests(); // Cancel all active requests
  // Reset state...
}, [type]);

// Each request gets a unique key
const dataRequestKey = `key_data_${config.routeType}`;
const schemaRequestKey = `key_schema_${config.schemaSlug}`;
```

### Pagination

Uses a custom hook that loads limits synchronously:

```javascript
const [limit, setLimit] = usePaginationLimit('organisaties', 20);
```

## Usage

### Basic Usage

```javascript
import ConBeheerPageWrapper from './con-beheer-page-wrapper';

const MyBeheerPage = () => {
  return <ConBeheerPageWrapper type='applicaties' />;
};
```

### With Custom Configuration

```javascript
import ConGenericBeheerPage from './con-generic-beheer-page';

const MyCustomBeheerPage = () => {
  const customConfig = {
    title: 'Custom Title',
    customHeaders: {
      // Custom header overrides
    },
    uniqueActions: [
      // Custom actions
    ],
  };

  return <ConGenericBeheerPage type='applicaties' configOverrides={customConfig} />;
};
```

## Supported Types

- **applicaties**
- **diensten**
- **voorzieningen-versie**
- **organisaties**
- **kwetsbaarheden**
- **gebruiken**
- **overeenkomsten**
- **contactpersonen**

## Configuration

### Base Configuration Structure

```javascript
{
  registerSlug: 'voorzieningen',
  schemaSlug: 'voorziening',
  paginationKey: 'applicaties',
  title: 'Beheer Applicaties',
  routeType: 'applicaties',
  defaultHeaders: ['naam', 'referentieComponenten', 'standaarden', 'categorie', 'links'],
  customHeaders: {
    // Custom header overrides
  },
  modals: ['add', 'edit', 'delete', 'import'],
  uniqueActions: [
    // Custom action buttons
  ],
  statusIcon: {
    // Status icon configuration
  },
}
```

### Custom Headers

Override how specific data is displayed:

```javascript
customHeaders: {
  standaarden: {
    id: 'standaarden',
    label: 'Standaarden',
    key: 'standaarden',
    customContent: (row) => {
      if (row?.standaarden && typeof row?.standaarden === 'string') {
        return <AcColumn key={row.id}>Data invalid</AcColumn>;
      }
      return (
        <AcColumn key={row.id}>
          {row?.standaarden?.map((standaard) => standaard.naam).join(', ')}
        </AcColumn>
      );
    },
  },
}
```

### Unique Actions

Add custom action buttons for specific beheer types:

```javascript
uniqueActions: [
  {
    key: 'activate',
    label: 'Activeren',
    icon: <VISUALS.CHECK />,
    condition: (row) => row.beoordeling?.toLowerCase?.() !== 'actief',
    action: 'activate',
  },
  {
    key: 'publish',
    label: 'Publiceren',
    icon: <VISUALS.PUBLISH />,
    condition: (row) =>
      !row['@self'].published && row?.beoordeling?.toLowerCase?.() !== 'concept',
    action: 'publish',
  },
];
```

### Status Icons

Add visual indicators:

```javascript
statusIcon: {
  customContent: (row) => (
    <div className='ac-beheer-organisaties-name-container'>
      <div
        className='ac-beheer-organisaties-name-container__icon'
        data-tooltip-id={TOOLTIP_ID}
        data-tooltip-content={
          row['@self'].published ? 'Gepubliceerd' : 'Niet gepubliceerd'
        }
      >
        {row['@self'].published ? (
          <VISUALS.CIRCLE_CHECK className='ac-beheer-publish-icon__check' />
        ) : (
          <VISUALS.CIRCLE_EXCLAMATION className='ac-beheer-publish-icon__exclamation' />
        )}
      </div>
    </div>
  ),
  customHeader: (
    <div className='ac-beheer-organisaties-name-container__icon'></div>
  ),
}
```

## Request Management

### How Request Cancellation Works

The system uses AbortController to cancel requests:

```javascript
// In ObjectStore
// Create controller per request type and pass signal to axios
const controller = this._createAbortController(requestType);
await nextcloudApi.get(url, { signal: controller.signal });

// Cancel specific request by type key
object.cancelRequest(requestType);

// Cancel all active requests
object.cancelAllRequests();
```

### Request Keys

Each request gets a unique key for cancellation:

```javascript
// Collection request key (type)
const typeKey = object.getTypeFromParams(config.registerSlug, config.schemaSlug);

// Schema request key (schema type)
const schemaType = object.getSchemaType(config.schemaSlug);
```

### Error Handling

Cancelled requests are handled gracefully:

```javascript
try {
  // Make request...
} catch (err) {
  // Don't set error if request was cancelled
  if (err.code === 'ERR_CANCELED' || err instanceof CanceledError) {
    return;
  }
  // Handle other errors...
}
```

## Pagination System

### usePaginationLimit Hook

The hook loads limits synchronously to prevent race conditions:

```javascript
// Synchronous loading prevents race conditions
const [limit, setLimit] = usePaginationLimit('organisaties', 20);

// The hook loads the limit synchronously during initialization
// and updates it when the objectType changes
```

### How It Works

```javascript
export const usePaginationLimit = (objectType, defaultValue = 20) => {
  // Load synchronously during initialization
  const savedLimit = AcGetState(`pagination_limit_${objectType}`);
  const initialLimit = savedLimit !== undefined ? savedLimit : defaultValue;

  const [limit, setLimit] = useState(initialLimit);

  // Update when objectType changes
  useEffect(() => {
    if (currentObjectTypeRef.current !== objectType) {
      const newSavedLimit = AcGetState(`pagination_limit_${objectType}`);
      const newLimit = newSavedLimit !== undefined ? newSavedLimit : defaultValue;
      setLimit(newLimit);
    }
  }, [objectType, defaultValue]);

  const updateLimit = (newLimit) => {
    setLimit(newLimit);
    AcSaveState(`pagination_limit_${objectType}`, newLimit);
  };

  return [limit, updateLimit];
};
```

## Modal System

### How Modals Are Loaded

Modals are loaded dynamically using `@loadable/component`:

```javascript
// In BeheerModalFactory
modalComponents: {
  applicaties: {
    add: loadable(() => import('./ac-applicaties/modals/ac-applicaties-form-modal')),
    edit: loadable(() => import('./ac-applicaties/modals/ac-applicaties-form-modal')),
    delete: loadable(() => import('./ac-applicaties/modals/ac-delete-applicaties-modal')),
    import: loadable(() => import('./import-modal/ac-beheer-import-modal')),
  },
}
```

### Adding New Modals

1. Add modal component to `BeheerModalFactory.modalComponents`
2. Add modal type to configuration's `modals` array
3. Add prop generation logic to `BeheerModalFactory.getModalProps`

## Filter System

### How Filters Work

The system supports standard and custom filters:

```javascript
// Standard filter
const FilterDrawerComponent =
  FilterDrawerFactory.getFilterDrawerComponent('default');

// Custom filter (like organisatie's beoordeling filter)
const OrganisatieFilterComponent =
  FilterDrawerFactory.getFilterDrawerComponent('organisaties');
```

### Adding Custom Filters

1. Create custom filter drawer component
2. Add to `FilterDrawerFactory.filterDrawerComponents`
3. Add prop generation logic to `FilterDrawerFactory.getFilterDrawerProps`

## Migration Guide

### From Individual Pages to Generic

1. **Extract Configuration**: Get configuration from existing page
2. **Add to Factory**: Add to `BeheerPageConfigFactory`
3. **Add Modals**: Add modal components to `BeheerModalFactory`
4. **Add Filters**: Add custom filters to `FilterDrawerFactory` if needed
5. **Replace Component**: Replace with `ConBeheerPageWrapper`

### Example Migration

**Before**:

```javascript
// 413 lines of code with lots of duplication
const AcBeheerApplicaties = () => {
  // ... lots of boilerplate code
};
```

**After**:

```javascript
// 8 lines of code
const AcBeheerApplicaties = () => {
  return <ConBeheerPageWrapper type='applicaties' />;
};
```

## Troubleshooting

### Common Issues

1. **Modal Not Loading**

   - Check modal component is imported in `BeheerModalFactory`
   - Verify modal type is in configuration's `modals` array

2. **Headers Not Showing**

   - Check header ID is in `defaultHeaders` array
   - Verify header exists in schema

3. **Actions Not Working**

   - Check action is defined in `uniqueActions`
   - Verify condition function returns correct boolean

4. **Filter Not Working**

   - Check filter drawer is configured in `FilterDrawerFactory`
   - Verify props are passed correctly

5. **Race Conditions**

   - Ensure `object.cancelAllRequests()` is called when switching types
   - Check request keys are unique

### Request Cancellation Issues

1. **Requests Not Cancelling**

   ```javascript
   // Check this is called when switching types
   useEffect(() => {
     object.cancelAllRequests();
     // Reset state...
   }, [type]);
   ```

2. **Memory Leaks**

   ```javascript
   // Ensure cancelled requests are cleaned up
   activeRequests.delete(key);
   ```

3. **Error Messages**
   ```javascript
   // Check cancelled request errors are handled
   if (err.code === 'ERR_CANCELED' || err instanceof CanceledError) {
     return;
   }
   ```

## File Structure

```
src/views/ac-beheer/
├── ac-[object type]                    # folder containing object type specific components
|   ├── modals                          # folder containing object type specific modals
|   └── pages                           # folder containing object type specific pages (used to hold overview page until it was made generic)
├── con-generic-beheer-page.js          # Main component
├── con-beheer-page-wrapper.js          # Simple wrapper
├── con-beheer-page-config-factory.js   # Configuration factory
├── con-beheer-modal-factory.js         # Modal factory
├── con-filter-drawer-factory.js        # Filter factory
├── con-table.js                        # Table component
├── con-action-menu.js                  # Action menu component
└── GENERIC_BEHEER_README.md            # This documentation
```

## Key Dependencies

- `ObjectStore` - Request management with cancellation
- `usePaginationLimit` - Pagination with session storage
- `@loadable/component` - Dynamic modal loading
- `mobx-react-lite` - State management
- `react-router` - Navigation
